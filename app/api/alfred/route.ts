import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';
import { sanitizeString, validateRequired } from '@/lib/sanitize';
import { getClientIp, rateLimit } from '@/lib/ratelimit';
import { logValidationError, logRateLimitExceeded } from '@/lib/logger';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const notion = new Client({ auth: process.env.NOTION_API_KEY! });

function isDarkHours(
  hoursStart: string = '7:00',
  hoursEnd: string = '20:00'
): boolean {
  const now = new Date()
  const sydneyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }))
  const hours = sydneyTime.getHours()
  const minutes = sydneyTime.getMinutes()
  const currentMins = hours * 60 + minutes

  const [startH, startM] = hoursStart.split(':').map(Number)
  const [endH, endM] = hoursEnd.split(':').map(Number)
  const startMins = startH * 60 + (startM || 0)
  const endMins = endH * 60 + (endM || 0)

  return currentMins < startMins || currentMins >= endMins
}

function getSydneyTime(): string {
  const now = new Date()
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now)
}

function buildAlfredSystemPrompt(tradieName: string): string {
  return `You are ALFRED, the operations foreman for ${tradieName}'s trade business in Sydney.

CORE RULE: Never repeat what's already on their cards. Analyze, assess, and recommend.

YOUR TONE:
- Sharp, experienced foreman. No sales pitch.
- Direct: "Here's the issue, here's what you do."
- Australian: Casual, sharp, honest.
- Max 4 sentences unless detail is requested.

WHEN ${tradieName.toUpperCase()} SENDS A JOB UPDATE:
("running late", "on the way", "job done", etc.)
1. Identify the job (fuzzy match: number, client, suburb, service)
2. Map to status: STARTING_TODAY, ON_THE_WAY, RUNNING_LATE, PHASE_DONE, NEED_DECISION, DAY_DONE, JOB_COMPLETE, VARIATION_REQUEST, READY_FOR_INSPECTION, AWAITING_MATERIALS, ISSUE_ON_SITE
3. Reply: "Got it — [job name]. [If late: when ETA? What's the blocker?]"
4. Return action + context

WHEN ${tradieName.toUpperCase()} ASKS ABOUT A JOB:
DON'T list facts. DO answer: What's the biggest risk? What action today? What does the client need to hear?
Example: Instead of "Status: In Progress, started 3 days ago"
Say: "You're 2 days in, on track. One thing: client's been quiet on the color decision — chase them today or you'll lose time next week."

WHEN ${tradieName.toUpperCase()} ASKS ABOUT LEADS:
Assess quality + urgency. Don't say "You have 5 leads." Say: "3 are solid this month. The Davis one needs a call today — they're comparison shopping. The other two are 2-3 weeks out."

WHEN ${tradieName.toUpperCase()} ASKS "WHAT'S ON TODAY?":
Show active jobs + what's at risk. "Sarah's reno + the Bondi kitchen. Sarah's ahead. Bondi might slip — waiting on materials. Chase them before 11am."

WHEN ${tradieName.toUpperCase()} ASKS ABOUT PIPELINE:
Snapshot: qualified leads, won leads, revenue trend, what's next. "Monthly pipeline is up. You've got 2 jobs closing next week. One lead at risk — cold for 5 days."

WHEN ${tradieName.toUpperCase()} SENDS A PHOTO:
Analyze it. Describe: what work, what stage, quality, concerns. "That framing's solid — you're ahead on timeline. One thing: the back corner has a small gap. Caught it now, which is good."

WHEN CREATING A JOB:
Ask: client name, phone, type of work, suburb, value (opt), completion date (opt).
One question per turn. Confirm before creating.

WHEN ABOUT JOB HISTORY:
Use the milestone log. Summarize: what's been done, current status, risks, next move.
Sound like you know the job.

WHEN AMBIGUOUS ABOUT A JOB:
Ask: "Which one — Sarah's kitchen or the Bondi reno?"

SMS RULES:
- Find client phone in context
- Write it like ${tradieName} would: short, friendly, no jargon
- Format: [SMS_READY] TO: +61X... NAME: [name] MESSAGE: [text] [/SMS_READY]
- Ask for confirmation before sending
- NEVER send 7pm–7am Sydney time. Warn if they ask outside hours.

DARK HOURS: If someone texts after 8pm, reply: "Thanks! We'll get back to you first thing. — TradiePilot"

RESPONSE FORMAT — return valid JSON:
{
  "reply": "your message (direct, 1-4 sentences)",
  "action": "none" | "update_job_status" | "update_job_details" | "create_job",
  "jobId": "notion ID if relevant",
  "jobName": "human-readable name",
  "newStatus": "tap status if updating",
  "clientName": "if creating/updating",
  "clientPhone": "if creating",
  "service": "type of work if creating",
  "suburb": "location if creating",
  "jobValue": "if creating",
  "estimatedCompletion": "YYYY-MM-DD if creating",
  "updates": { "Service": "value", "Notes": "value", "Status": "value", "Scope": "value" },
  "orbitContext": "extra detail for context (e.g., 'traffic, 30 mins away')"
}`;
}

async function getJobsContext(tradieSlug: string) {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_JOBS_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: tradieSlug },
      },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: 30,
    });

    return response.results.map((job: any) => ({
      id: job.id,
      jobNumber: job.properties?.['Job Number']?.number || null,
      name: job.properties?.['Job Name']?.title?.[0]?.plain_text
         || job.properties?.['Name']?.title?.[0]?.plain_text
         || 'Unnamed Job',
      status: job.properties?.['Status']?.select?.name || 'Unknown',
      clientName: job.properties?.['Client Name']?.rich_text?.[0]?.plain_text
               || job.properties?.['Client']?.rich_text?.[0]?.plain_text || '',
      clientPhone: job.properties?.['Client Phone']?.phone_number
                || job.properties?.['Phone']?.phone_number || '',
      service: job.properties?.['Service']?.rich_text?.[0]?.plain_text
            || job.properties?.['Type']?.select?.name || '',
      suburb: job.properties?.['Suburb']?.rich_text?.[0]?.plain_text || '',
      address: job.properties?.['Address']?.rich_text?.[0]?.plain_text || '',
      scope: job.properties?.['Scope']?.rich_text?.[0]?.plain_text || '',
      jobType: job.properties?.['Job Type']?.select?.name || 'Residential Direct',
      durationCategory: job.properties?.['Duration']?.select?.name || 'Single Day',
      scheduledDate: job.properties?.['Scheduled Date']?.date?.start || null,
      foreman: job.properties?.['Foreman']?.rich_text?.[0]?.plain_text || '',
      foremanPhone: job.properties?.['Foreman Phone']?.phone_number || '',
    }));
  } catch (err) {
    console.error('Error fetching jobs:', err);
    return [];
  }
}

async function getLeadsContext(tradieSlug: string) {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_LEADS_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: tradieSlug },
      },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: 20,
    });

    const leads = response.results.map((lead: any) => ({
      id: lead.id,
      name: lead.properties?.['Name']?.title?.[0]?.plain_text || 'Unknown',
      status: lead.properties?.['Status']?.select?.name || 'Unknown',
      service: lead.properties?.['Service']?.rich_text?.[0]?.plain_text || '',
      suburb: lead.properties?.['Suburb']?.rich_text?.[0]?.plain_text || '',
      phone: lead.properties?.['Phone']?.phone_number || '',
      createdDate: lead.created_time,
      lunaStatus: lead.properties?.['LUNA Status']?.select?.name || '',
      chaseStatus: lead.properties?.['CHASE Status']?.select?.name || '',
    }));

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthLeads = leads.filter(l => new Date(l.createdDate) >= thisMonth);

    const stats = {
      totalThisMonth: monthLeads.length,
      qualified: monthLeads.filter(l => l.lunaStatus === 'Qualified').length,
      disqualified: monthLeads.filter(l => l.lunaStatus === 'Disqualified').length,
      won: monthLeads.filter(l => l.chaseStatus === 'Won').length,
      cold: monthLeads.filter(l => l.chaseStatus === 'Cold').length,
      pending: monthLeads.filter(l => !l.chaseStatus || l.chaseStatus === 'Pending').length,
    };

    return { leads, stats };
  } catch (err) {
    console.error('Error fetching leads:', err);
    return { leads: [], stats: { totalThisMonth: 0, qualified: 0, disqualified: 0, won: 0, cold: 0, pending: 0 } };
  }
}

function findJob(jobs: any[], query: string): any | null {
  const q = query.toLowerCase();

  const byNumber = jobs.find(j => j.jobNumber && q.includes(String(j.jobNumber)));
  if (byNumber) return byNumber;

  const byClient = jobs.find(j => j.clientName && q.includes(j.clientName.toLowerCase().split(' ')[0]));
  if (byClient) return byClient;

  const bySuburb = jobs.find(j => j.suburb && q.includes(j.suburb.toLowerCase()));
  if (bySuburb) return bySuburb;

  const byName = jobs.find(j => j.name && q.includes(j.name.toLowerCase().split(' ')[0]));
  if (byName) return byName;

  const byService = jobs.find(j => j.service && q.includes(j.service.toLowerCase().split(' ')[0]));
  if (byService) return byService;

  return null;
}

function getTodaysJobs(jobs: any[]): any[] {
  const today = new Date().toISOString().split('T')[0];
  const activeStatuses = ['Scheduled', 'In Progress', 'Running Late', 'Day Done'];

  return jobs.filter(j => {
    const isActive = activeStatuses.includes(j.status);
    const isToday = j.scheduledDate === today;
    return isActive || isToday;
  });
}

function isConfigCommand(message: string): boolean {
  const configKeywords = [
    'make my messages', 'change my', 'update my', 'set my',
    'more casual', 'more formal', 'more professional',
    'add suburb', 'add to my service area', 'remove from service area',
    'min job', 'minimum job', 'minimum value',
    'business name', 'my name is',
    'stop sending', 'suppress', 'dont send', "don't send",
    'change follow up', 'change review', 'update review',
    'my services', 'i also do', 'i no longer do',
  ];
  const lower = message.toLowerCase();
  return configKeywords.some(kw => lower.includes(kw));
}

async function logToCommLog(message: string, reply: string, action: string, jobId?: string) {
  try {
    if (!process.env.NOTION_COMMUNICATION_LOG_DB_ID) return;
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_COMMUNICATION_LOG_DB_ID },
      properties: {
        'Message': { title: [{ text: { content: message.slice(0, 100) } }] },
        'Direction': { select: { name: 'Inbound' } },
        'Channel': { select: { name: 'Cockpit Chat' } },
        'Agent': { select: { name: 'ALFRED' } },
        'Action Taken': { rich_text: [{ text: { content: action } }] },
        'Response Sent': { rich_text: [{ text: { content: reply.slice(0, 500) } }] },
      },
    });
  } catch (err) {
    console.error('Comm log error:', err);
  }
}

async function getMilestonesForJob(jobId: string): Promise<string> {
  if (!jobId || !process.env.NOTION_MILESTONE_LOG_DB_ID) return '';

  try {
    const res = await notion.databases.query({
      database_id: process.env.NOTION_MILESTONE_LOG_DB_ID,
      page_size: 10,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    });

    const milestones = (res.results as any[])
      .filter(m => {
        const mJobId = m.properties['Job ID']?.rich_text?.[0]?.plain_text ?? '';
        return mJobId === jobId ||
               mJobId.replace(/-/g, '') === jobId.replace(/-/g, '');
      })
      .map(m => {
        const title = m.properties['Title']?.title?.[0]?.plain_text ?? '';
        const desc = m.properties['Description']?.rich_text?.[0]?.plain_text ?? '';
        const type = m.properties['Milestone Type']?.select?.name ?? '';
        const by = m.properties['Logged By']?.select?.name ?? '';
        const date = new Date(m.created_time).toLocaleDateString('en-AU', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        return `[${date}] ${type} — ${title}: ${desc} (by ${by})`;
      })
      .join('\n');

    return milestones
      ? `\nJOB HISTORY / MILESTONE LOG:\n${milestones}\n`
      : '';
  } catch {
    return '';
  }
}

async function getLeadLogsContext(): Promise<string> {
  if (!process.env.NOTION_LEAD_LOG_DB_ID) return '';

  try {
    const res = await notion.databases.query({
      database_id: process.env.NOTION_LEAD_LOG_DB_ID,
      page_size: 20,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    });

    const logs = (res.results as any[])
      .map(m => {
        const title = m.properties['Title']?.title?.[0]?.plain_text ?? '';
        const leadName = m.properties['Lead Name']?.rich_text?.[0]?.plain_text ?? '';
        const desc = m.properties['Description']?.rich_text?.[0]?.plain_text ?? '';
        const eventType = m.properties['Event Type']?.select?.name ?? '';
        const by = m.properties['By']?.select?.name ?? '';
        return `${leadName} [${eventType}]: ${desc} (by ${by})`;
      })
      .join('\n');

    return logs
      ? `\nLEAD HISTORY:\n${logs}\n`
      : '';
  } catch {
    return '';
  }
}

async function getMilestoneHistoryContext(): Promise<string> {
  let milestoneContext = '';
  try {
    if (process.env.NOTION_MILESTONE_LOG_DB_ID) {
      const mRes = await notion.databases.query({
        database_id: process.env.NOTION_MILESTONE_LOG_DB_ID,
        sorts: [{ timestamp: 'created_time', direction: 'descending' }],
        page_size: 50,
      });
      const lines = (mRes.results as any[]).map((m: any) => {
        const jid = m.properties?.['Job ID']?.rich_text?.[0]?.plain_text ?? 'unknown';
        const title = m.properties?.['Title']?.title?.[0]?.plain_text ?? '';
        const desc = m.properties?.['Description']?.rich_text?.[0]?.plain_text ?? '';
        const type = m.properties?.['Milestone Type']?.select?.name ?? '';
        const by = m.properties?.['Logged By']?.select?.name ?? '';
        const date = new Date((m as any).created_time).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
        return `[${jid.slice(0, 8)}] ${date} ${type}: ${title} — ${desc} (by ${by})`;
      });
      if (lines.length > 0) {
        milestoneContext = `\n\nJOB MILESTONE HISTORY:\n${lines.join('\n')}\n\nIMPORTANT: When asked about a specific job, search these milestones for matching job IDs and include them in your response. The first 8 chars of a milestone's Job ID match the job.`;
      }
    }
  } catch {}
  return milestoneContext;
}

async function buildConversationContext(
  allMessages: { role: string; content: string }[]
): Promise<{ summary: string | null; recent: { role: string; content: string }[] }> {
  const RECENT_LIMIT = 30;
  if (allMessages.length <= RECENT_LIMIT) {
    return { summary: null, recent: allMessages };
  }

  const older = allMessages.slice(0, allMessages.length - RECENT_LIMIT);
  const recent = allMessages.slice(-RECENT_LIMIT);

  try {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: `Summarize in 2-3 sentences. Focus on: which jobs were discussed, what updates were made, what issues came up, what decisions were taken. Be concise.\n\n${older
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n')}`,
        },
      ],
    });
    const summary =
      res.content[0].type === 'text' ? res.content[0].text : null;
    return { summary, recent };
  } catch {
    return { summary: null, recent: allMessages.slice(-RECENT_LIMIT) };
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  const { success } = rateLimit(ip, 50, 60000);
  if (!success) {
    logRateLimitExceeded('/api/alfred', ip);
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { message, mediaUrl, mediaType, tradieSlug, conversationHistory = [], jobContext } = body;

    if (!message && !mediaUrl) {
      logValidationError('/api/alfred', ip, 'message', 'Message or media required');
      return NextResponse.json({ error: 'Message or media required' }, { status: 400 });
    }

    if (typeof tradieSlug !== 'string' || !tradieSlug.trim()) {
      logValidationError('/api/alfred', ip, 'tradieSlug', 'Invalid tradie slug');
      return NextResponse.json({ error: 'Invalid tradie slug' }, { status: 400 });
    }

    // Route config commands to FIXER
    if (message && isConfigCommand(message)) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
      const fixerRes = await fetch(`${baseUrl}/api/fixer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, tradieSlug }),
      });
      const fixerData = await fixerRes.json();
      await logToCommLog(message, fixerData.reply || 'Config updated', 'fixer_config');
      return NextResponse.json({
        success: true,
        reply: fixerData.reply || 'Config updated',
        action: 'fixer_config',
      });
    }

    const jobs = await getJobsContext(tradieSlug);
    const { leads, stats: leadsStats } = await getLeadsContext(tradieSlug);
    const todaysJobs = getTodaysJobs(jobs);

    let tradieName = 'your tradie';
    try {
      const configRes = await notion.databases.query({
        database_id: process.env.NOTION_TRADIE_CONFIG_DB_ID!,
        filter: {
          property: 'Tradie Config ID',
          rich_text: { equals: tradieSlug },
        },
        page_size: 1,
      });
      if (configRes.results.length > 0) {
        const config = configRes.results[0] as any;
        tradieName = config.properties?.['Owner Name']?.rich_text?.[0]?.plain_text
          || config.properties?.['Business Name']?.title?.[0]?.plain_text
          || tradieName;
      }
    } catch (err) {
      console.error('Error fetching tradie name:', err);
    }

    let mentionedJob = message ? findJob(jobs, message) : null;

    // If jobContext is provided in request, prioritize it over message-based detection
    if (jobContext && jobContext.id) {
      mentionedJob = jobs.find(j => j.id === jobContext.id) || mentionedJob;
    }

    // Read brain summary and milestones for identified job
    let brainContext = '';
    let milestoneContext = '';
    if (mentionedJob) {
      try {
        if (process.env.NOTION_JOB_BRAIN_DB_ID) {
          const brainQuery = await notion.databases.query({
            database_id: process.env.NOTION_JOB_BRAIN_DB_ID,
            filter: {
              property: 'Job ID',
              rich_text: { equals: mentionedJob.id },
            },
            page_size: 1,
          });
          if (brainQuery.results.length > 0) {
            const brain = brainQuery.results[0] as any;
            brainContext = brain.properties['Brain Summary']?.rich_text?.[0]?.plain_text || '';
          }
        }
      } catch (err) {
        console.error('Brain read error:', err);
      }

      // Fetch milestone log for this job
      milestoneContext = await getMilestonesForJob(mentionedJob.id);
    }

    // Fetch lead logs for context
    const leadLogsContext = await getLeadLogsContext();

    // Fetch global milestone history for system context
    const globalMilestoneContext = await getMilestoneHistoryContext();

    const contextData = {
      todaysJobs: todaysJobs.map(j => `${j.name} — ${j.clientName} — ${j.status} — ${j.suburb}`),
      allActiveJobs: jobs
        .filter(j => !['Complete', 'Invoiced', 'Paid'].includes(j.status))
        .map(j => ({ id: j.id, name: j.name, client: j.clientName, status: j.status, suburb: j.suburb, phone: j.clientPhone })),
      identifiedJob: mentionedJob ? {
        id: mentionedJob.id,
        name: mentionedJob.name,
        client: mentionedJob.clientName,
        phone: mentionedJob.clientPhone,
        status: mentionedJob.status,
        suburb: mentionedJob.suburb,
        service: mentionedJob.service,
      } : null,
      leadsStats,
    };

    const textContent = `${tradieName} says: "${message || 'Uploaded media'}"
${brainContext ? `\nJOB BRAIN for ${mentionedJob?.name}:\n${brainContext}` : ''}
${milestoneContext}
${leadLogsContext}
CONTEXT:
${JSON.stringify(contextData, null, 2)}`;

    type MessageContent = { type: 'image'; source: { type: 'url'; url: string } } | { type: 'text'; text: string };

    let historyMessages = conversationHistory.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Build context with rolling summary for long conversations
    const { summary, recent } = await buildConversationContext(historyMessages);

    if (summary) {
      console.log('[ALFRED] Summarized', historyMessages.length - recent.length, 'messages:', summary.slice(0, 100) + '...');
      historyMessages = [
        { role: 'user' as const, content: `[EARLIER IN THIS SESSION]: ${summary}` },
        { role: 'assistant' as const, content: 'Got it.' },
        ...recent,
      ];
    } else {
      historyMessages = recent;
    }

    const inDarkHours = isDarkHours('7:00', '20:00')
    const sydneyTime = getSydneyTime()

    let systemPrompt = buildAlfredSystemPrompt(tradieName)

    if (jobContext) {
      systemPrompt += `\n\n🎯 FOCUSED JOB CONTEXT:\nYou are currently helping with a specific job:\n- Client: ${jobContext.clientName}\n- Service: ${jobContext.service}\n- Suburb: ${jobContext.suburb}\n- Status: ${jobContext.status}\n${jobContext.jobValue ? `- Job Value: $${jobContext.jobValue.toLocaleString()}` : ''}\n\nAnswer questions specifically about this job. Reference this job in your replies.`
    }

    if (inDarkHours) {
      systemPrompt += `\n\n⚠️ DARK HOURS ACTIVE: Current Sydney time is ${sydneyTime} (outside 7am-8pm). Do not send SMS or initiate calls. Warn ${tradieName} if they try to send an SMS.`
    }
    systemPrompt += globalMilestoneContext

    const claudeMessages: any[] = mediaUrl ? [
      ...historyMessages,
      {
        role: 'user' as const,
        content: [
          {
            type: 'image' as const,
            source: {
              type: 'url' as const,
              url: mediaUrl,
            },
          },
          {
            type: 'text' as const,
            text: textContent,
          },
        ],
      },
    ] : [
      ...historyMessages,
      {
        role: 'user' as const,
        content: textContent,
      },
    ];

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const rawText = claudeResponse.content?.[0]?.type === 'text' ? claudeResponse.content[0].text?.trim() || '' : '';

    let alfredResult: any;
    try {
      const jsonMatch = rawText?.match(/\{[\s\S]*\}/);
      alfredResult = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      alfredResult = { reply: rawText || "I got that, let me help", action: 'none' };
    }

    // STEP 1: Check if ALFRED prepared an SMS
    const smsMatch = rawText?.match(/\[SMS_READY\]([\s\S]*?)\[\/SMS_READY\]/);
    if (smsMatch?.[1]) {
      const smsBlock = smsMatch[1];
      const toMatch = smsBlock?.match(/TO:\s*(\+\d+)/);
      const nameMatch = smsBlock?.match(/NAME:\s*(.+?)(?:\n|$)/);
      const msgMatch = smsBlock?.match(/MESSAGE:\s*(.+?)(?:\n|$)/);

      if (toMatch && msgMatch) {
        const cleanReply = rawText.replace(/\[SMS_READY\][\s\S]*?\[\/SMS_READY\]/, '').trim();
        return NextResponse.json({
          success: true,
          reply: cleanReply,
          action: 'sms_pending',
          pendingSMS: {
            to: toMatch[1].trim(),
            name: nameMatch?.[1]?.trim() ?? 'Client',
            message: msgMatch[1].trim(),
          }
        });
      }
    }

    // STEP 2: Check if tradie confirmed SMS send
    const confirmationWords = ['yes', 'send', 'go ahead', 'yep', 'do it', 'send it'];
    const isConfirming = message && confirmationWords.some(word => message.toLowerCase().match(new RegExp(`^(${word}|${word}s?|${word}\\s+it)$`)));

    if ((rawText.includes('[SEND_SMS]') || isConfirming) && body.pendingSMS?.to && body.pendingSMS?.message) {
      const sydneyHour = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' })
      ).getHours()

      if (sydneyHour < 7 || sydneyHour >= 20) {
        // Log to Milestone Log but DON'T send SMS
        try {
          await notion.pages.create({
            parent: { database_id: process.env.NOTION_COMMUNICATION_LOG_DB_ID! },
            properties: {
              'Message': { title: [{ text: { content: body.pendingSMS.message } }] },
              'Recipient': { rich_text: [{ text: { content: body.pendingSMS.name } }] },
              'Channel': { select: { name: 'SMS' } },
              'Agent': { select: { name: 'ALFRED' } },
              'Direction': { select: { name: 'Outbound (Scheduled)' } },
            },
          });
        } catch (logErr) {
          console.error('Comm log error:', logErr);
        }

        return NextResponse.json({
          success: true,
          reply: `🌙 Dark hours active (${sydneyHour}:00 Sydney time). Message logged but not sent — it's after business hours. I'll remind you to send at 7am.`,
          action: 'sms_blocked_dark_hours',
          darkHours: true,
          smsSent: false,
        });
      }

      try {
        const twilio = require('twilio')(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );

        await twilio.messages.create({
          body: body.pendingSMS.message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: body.pendingSMS.to,
        });

        // Log to Communication Log
        try {
          await notion.pages.create({
            parent: { database_id: process.env.NOTION_COMMUNICATION_LOG_DB_ID! },
            properties: {
              'Message': { title: [{ text: { content: body.pendingSMS.message } }] },
              'Recipient': { rich_text: [{ text: { content: body.pendingSMS.name } }] },
              'Channel': { select: { name: 'SMS' } },
              'Agent': { select: { name: 'ALFRED' } },
            },
          });
        } catch (logErr) {
          console.error('Comm log error:', logErr);
        }

        return NextResponse.json({
          success: true,
          reply: `✓ SMS sent to ${body.pendingSMS.name}: "${body.pendingSMS.message}"`,
          action: 'sms_sent',
          smsSent: true,
        });
      } catch (smsErr: any) {
        return NextResponse.json({
          success: false,
          reply: `Failed to send SMS: ${smsErr.message}`,
          action: 'none',
          smsSent: false,
        }, { status: 500 });
      }
    }

    if (alfredResult.action === 'update_job_status' && alfredResult.jobId) {
      const statusMap: Record<string, string> = {
        STARTING_TODAY: 'Scheduled',
        ON_THE_WAY: 'In Progress',
        RUNNING_LATE: 'Running Late',
        PHASE_DONE: 'In Progress',
        NEED_DECISION: 'In Progress',
        DAY_DONE: 'In Progress',
        JOB_COMPLETE: 'Complete',
        VARIATION_REQUEST: 'In Progress',
        READY_FOR_INSPECTION: 'In Progress',
        AWAITING_MATERIALS: 'In Progress',
        ISSUE_ON_SITE: 'In Progress',
      };

      const notionStatus = statusMap[alfredResult.newStatus] || 'In Progress';

      try {
        await notion.pages.update({
          page_id: alfredResult.jobId,
          properties: {
            'Status': { select: { name: notionStatus } },
          },
        });
        console.log(`ALFRED: Updated ${alfredResult.jobName} → ${notionStatus}`);

        // Auto-trigger brain update (fire and forget)
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
        fetch(`${baseUrl}/api/brain/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: alfredResult.jobId, tradieSlug }),
        }).catch(err => console.error('Brain update error:', err));
      } catch (err) {
        console.error('Notion update error:', err);
      }

      if (alfredResult.newStatus === 'JOB_COMPLETE') {
        try {
          await notion.pages.update({
            page_id: alfredResult.jobId,
            properties: {
              'Completion Date': {
                date: { start: new Date().toISOString().split('T')[0] }
              },
            },
          });
        } catch (err) {
          console.error('Completion date error:', err);
        }

        fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/alfred/milestone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: alfredResult.jobId,
            jobName: alfredResult.jobName || 'Job',
            milestoneType: 'JOB_COMPLETE',
            description: `Job marked complete via ALFRED. ${alfredResult.orbitContext || ''}`.trim(),
            loggedBy: 'ALFRED',
          }),
        }).catch(err => console.error('Milestone log error:', err));
      }
    }

    if (alfredResult.action === 'update_job_details' && alfredResult.jobId) {
      try {
        const updates: any = {};
        const raw = alfredResult.updates || {};

        if (raw.Status) {
          updates['Status'] = { select: { name: raw.Status } };
        }
        if (raw.Service) {
          updates['Service'] = { rich_text: [{ text: { content: raw.Service } }] };
        }
        if (raw.Notes) {
          updates['Notes'] = { rich_text: [{ text: { content: raw.Notes } }] };
        }
        if (raw.Scope) {
          updates['Scope'] = { rich_text: [{ text: { content: raw.Scope } }] };
        }

        if (Object.keys(updates).length > 0) {
          await notion.pages.update({
            page_id: alfredResult.jobId,
            properties: updates,
          });
          console.log(`ALFRED: Updated job ${alfredResult.jobId}`, updates);
        }
      } catch (err) {
        console.error('Job update error:', err);
      }
    }

    if (alfredResult.action === 'create_job' && alfredResult.clientName && alfredResult.service && alfredResult.suburb) {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
        const createRes = await fetch(`${baseUrl}/api/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: alfredResult.clientName,
            clientPhone: alfredResult.clientPhone || '',
            service: alfredResult.service,
            suburb: alfredResult.suburb,
            jobValue: alfredResult.jobValue ? Number(alfredResult.jobValue) : null,
            estimatedCompletion: alfredResult.estimatedCompletion || null,
            tradieSlug,
          }),
        });
        const createData = await createRes.json();
        if (createData.success) {
          console.log(`ALFRED: Created job for ${alfredResult.clientName}`);
        }
      } catch (err) {
        console.error('Job creation error:', err);
      }
    }

    await logToCommLog(
      message || 'Media upload',
      alfredResult.reply,
      alfredResult.action,
      alfredResult.jobId
    );

    return NextResponse.json({
      success: true,
      reply: alfredResult.reply,
      action: alfredResult.action,
      jobUpdated: alfredResult.jobId ? { id: alfredResult.jobId, name: alfredResult.jobName, newStatus: alfredResult.newStatus } : null,
    });

  } catch (error: any) {
    console.error('ALFRED error:', {
      message: error.message,
      status: error.status,
      type: error.type,
      stack: error.stack?.split('\n').slice(0, 3),
    });
    return NextResponse.json(
      { error: `ALFRED error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

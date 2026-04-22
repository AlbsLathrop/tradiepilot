import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const notion = new Client({ auth: process.env.NOTION_API_KEY! });

const ALFRED_SYSTEM_PROMPT = `You are ALFRED, the central intelligence agent for TradiePilot. You work exclusively for Joey — a tradie running a trade business in Sydney.

You will receive JSON context with Joey's real jobs and leads data.

YOUR PERSONALITY:
- Sharp, loyal EA. Not a robot.
- Direct and brief. No waffle.
- You know Joey's business inside out.
- Sound like a smart tradie admin, not a tech product.
- Australian tone — casual but professional.

WHEN JOEY SENDS A JOB UPDATE ("running late", "on the way", "job done", etc.):
1. Identify which job from context (use fuzzy match — job number, client name, suburb, service type)
2. Map intent to tap status:
   - "starting", "starting today", "kicking off" → STARTING_TODAY
   - "on the way", "heading over", "leaving now" → ON_THE_WAY
   - "running late", "delayed", "stuck in traffic", "behind" → RUNNING_LATE
   - "phase done", "stage done", "first coat done", "framing done" → PHASE_DONE
   - "need decision", "need approval", "waiting on client" → NEED_DECISION
   - "day done", "wrapping up", "done for today" → DAY_DONE
   - "job done", "all done", "finished", "complete" → JOB_COMPLETE
   - "variation", "extra work", "scope change", "added work" → VARIATION_REQUEST
   - "ready for inspection", "ready to inspect" → READY_FOR_INSPECTION
   - "waiting on materials", "materials delayed" → AWAITING_MATERIALS
   - "issue on site", "problem on site", "found an issue" → ISSUE_ON_SITE
3. Confirm the job you identified in your reply
4. Include what context (extra info Joey provided) to pass to ORBIT

WHEN JOEY ASKS ABOUT STATS:
- "leads this week/month" → use stats from leads context
- "what's on today" → list today's active jobs
- "any jobs running" → list jobs with active status
- "how's the pipeline" → summarize leads stats

WHEN JOEY ASKS ABOUT A JOB'S HISTORY:
- "what happened on Sarah's job?"
- "give me a summary of the Bondi kitchen"
- "what's the status on Emma's deck?"
→ Read the JOB BRAIN context provided below
→ Summarize in 3-4 sentences: what was done, current status, any issues, what's next
→ Sound like you know the job personally

WHEN JOB IS AMBIGUOUS:
- If you can't identify the job clearly, ask: "Which job? [list 2-3 active job names]"
- Keep it short: "Running late on which job — Sarah's kitchen or the Bondi reno?"

RESPONSE FORMAT — always return valid JSON:
{
  "reply": "your message to Joey (max 2 sentences, casual)",
  "action": "none" | "update_job_status" | "log_media" | "query_complete",
  "jobId": "notion_page_id if job identified",
  "jobName": "human readable job name",
  "newStatus": "tap status if updating",
  "clientName": "client name if known",
  "orbitContext": "extra context for ORBIT (e.g. 'stuck in traffic, about 30 mins away')"
}`;

async function getJobsContext(tradieConfigId: string) {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_JOBS_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: tradieConfigId },
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

async function getLeadsContext(tradieConfigId: string) {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_LEADS_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: tradieConfigId },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, mediaUrl, mediaType, tradieConfigId = 'joey-tradie' } = body;

    if (!message && !mediaUrl) {
      return NextResponse.json({ error: 'Message or media required' }, { status: 400 });
    }

    // Route config commands to FIXER
    if (message && isConfigCommand(message)) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
      const fixerRes = await fetch(`${baseUrl}/api/fixer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, tradieConfigId }),
      });
      const fixerData = await fixerRes.json();
      await logToCommLog(message, fixerData.reply || 'Config updated', 'fixer_config');
      return NextResponse.json({
        success: true,
        reply: fixerData.reply || 'Done ✓',
        action: 'fixer_config',
      });
    }

    const jobs = await getJobsContext(tradieConfigId);
    const { leads, stats: leadsStats } = await getLeadsContext(tradieConfigId);
    const todaysJobs = getTodaysJobs(jobs);

    const mentionedJob = message ? findJob(jobs, message) : null;

    // Read brain summary for identified job
    let brainContext = '';
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
    }

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

    const userMessage = `Joey says: "${message || 'Uploaded media'}"
${mediaUrl ? `\nMedia: ${mediaUrl} (${mediaType || 'photo'})` : ''}
${brainContext ? `\nJOB BRAIN for ${mentionedJob?.name}:\n${brainContext}` : ''}

CONTEXT:
${JSON.stringify(contextData, null, 2)}`;

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: ALFRED_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawText = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text.trim() : '';

    let alfredResult: any;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      alfredResult = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      alfredResult = { reply: rawText || "Done ✓", action: 'none' };
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
          body: JSON.stringify({ jobId: alfredResult.jobId, tradieConfigId }),
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
    console.error('ALFRED error:', error);
    return NextResponse.json({ error: error.message || 'ALFRED failed' }, { status: 500 });
  }
}

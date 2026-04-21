import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const notion = new Client({ auth: process.env.NOTION_API_KEY! });

const ALFRED_SYSTEM_PROMPT = `You are ALFRED, the central intelligence agent for TradiePilot. You work exclusively for Joey — a tradie running a trade business in Sydney.

You have access to job and lead data that will be provided in the user message as JSON context.

YOUR PERSONALITY:
- Sharp, loyal EA. Not a robot.
- Direct and brief. No waffle.
- You know Joey's business inside out.
- You anticipate what he needs before he finishes asking.
- Sound like a smart tradie admin, not a tech product.

WHEN JOEY SENDS A JOB UPDATE:
1. Identify the job from context provided
2. Map to correct tap status: STARTING_TODAY / ON_THE_WAY / RUNNING_LATE / PHASE_DONE / NEED_DECISION / DAY_DONE / JOB_COMPLETE / VARIATION_REQUEST / READY_FOR_INSPECTION / AWAITING_MATERIALS / ISSUE_ON_SITE
3. Return action to take (update job status, send SMS to client)
4. Confirm to Joey what happened: "Done ✓ [who was notified + message preview]"

WHEN JOEY ASKS A QUESTION ABOUT STATS:
- Answer from the context data provided
- One sentence: "This month: 8 jobs, 23 leads, 6 won."

WHEN JOEY UPLOADS MEDIA:
- Confirm storage: "Saved ✓ Tagged to [Job Name] — [stage]"

WHEN JOEY ASKS SOMETHING GENERAL:
- Answer directly from context
- If you don't have the info, say so in one sentence

RESPONSE RULES:
- Max 3 sentences unless Joey asks for detail
- Never use corporate language
- Always confirm what action was taken
- Use "Done ✓", "Saved ✓", "Sent ✓" to confirm actions
- Be casual and direct: "job 3 is running late" not "I have updated the status of Job #3"

RESPONSE FORMAT:
Always return JSON:
{
  "reply": "your message to Joey",
  "action": "none" | "update_job_status" | "log_media" | "query_leads" | "query_jobs",
  "jobId": "notion_job_id if action involves a job",
  "newStatus": "status if updating job",
  "mediaUrl": "url if logging media",
  "mediaStage": "Before | During | After | Issue | Sign-off"
}`;

async function getJobsContext() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_JOBS_DB_ID!,
      filter: {
        or: [
          { property: 'Status', select: { equals: 'Scheduled' } },
          { property: 'Status', select: { equals: 'In Progress' } },
          { property: 'Status', select: { equals: 'Running Late' } },
        ]
      },
      page_size: 20,
    });

    return response.results.map((job: any) => ({
      id: job.id,
      name: job.properties?.['Job Name']?.title?.[0]?.plain_text || 'Unknown Job',
      status: job.properties?.['Status']?.select?.name || 'Unknown',
      clientName: job.properties?.['Client Name']?.rich_text?.[0]?.plain_text || '',
      clientPhone: job.properties?.['Client Phone']?.phone_number || '',
      service: job.properties?.['Service']?.rich_text?.[0]?.plain_text || '',
      suburb: job.properties?.['Suburb']?.rich_text?.[0]?.plain_text || '',
    }));
  } catch (err) {
    return [];
  }
}

async function getLeadsContext() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_LEADS_DB_ID!,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: 10,
    });

    return response.results.map((lead: any) => ({
      id: lead.id,
      name: lead.properties?.['Name']?.title?.[0]?.plain_text || 'Unknown',
      status: lead.properties?.['Status']?.select?.name || 'Unknown',
      service: lead.properties?.['Service']?.rich_text?.[0]?.plain_text || '',
      suburb: lead.properties?.['Suburb']?.rich_text?.[0]?.plain_text || '',
    }));
  } catch (err) {
    return [];
  }
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
    const { message, mediaUrl, mediaType, tradieId } = body;

    if (!message && !mediaUrl) {
      return NextResponse.json({ error: 'Message or media required' }, { status: 400 });
    }

    // Get context from Notion
    const [jobs, leads] = await Promise.all([getJobsContext(), getLeadsContext()]);

    // Build user message with context
    const userMessage = `Joey's message: "${message || 'Uploaded media'}"
${mediaUrl ? `Media URL: ${mediaUrl}\nMedia Type: ${mediaType || 'photo'}` : ''}

CURRENT CONTEXT:
Active Jobs: ${JSON.stringify(jobs, null, 2)}
Recent Leads: ${JSON.stringify(leads, null, 2)}`;

    // Call Claude
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: ALFRED_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawText = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text.trim() : '';

    // Parse JSON response
    let alfredResult: { reply: string; action: string; jobId?: string; newStatus?: string; };
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      alfredResult = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      alfredResult = { reply: rawText || "Done ✓", action: 'none' };
    }

    // Execute action if needed
    if (alfredResult.action === 'update_job_status' && alfredResult.jobId && alfredResult.newStatus) {
      try {
        await notion.pages.update({
          page_id: alfredResult.jobId,
          properties: {
            'Status': { select: { name: alfredResult.newStatus } },
          },
        });
      } catch (err) {
        console.error('Job update error:', err);
      }
    }

    // Log to Communication Log
    await logToCommLog(message || 'Media upload', alfredResult.reply, alfredResult.action);

    return NextResponse.json({
      success: true,
      reply: alfredResult.reply,
      action: alfredResult.action,
    });

  } catch (error: any) {
    console.error('ALFRED error:', error);
    return NextResponse.json({ error: error.message || 'ALFRED failed' }, { status: 500 });
  }
}

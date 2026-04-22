import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const notion = new Client({ auth: process.env.NOTION_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { jobId, tradieConfigId } = await request.json();

    // Get full job details
    const job = await notion.pages.retrieve({ page_id: jobId }) as any;
    const props = job.properties;

    const jobData = {
      name: props['Job Name']?.title?.[0]?.plain_text
         || props['Client Name']?.rich_text?.[0]?.plain_text || 'Unknown',
      clientName: props['Client Name']?.rich_text?.[0]?.plain_text || '',
      status: props['Status']?.select?.name || '',
      service: props['Service']?.rich_text?.[0]?.plain_text || '',
      suburb: props['Suburb']?.rich_text?.[0]?.plain_text || '',
      scope: props['Scope']?.rich_text?.[0]?.plain_text || '',
      notes: props['Notes']?.rich_text?.[0]?.plain_text || '',
      products: props['Products Used']?.rich_text?.[0]?.plain_text || '',
      siteAccess: props['Site Access Notes']?.rich_text?.[0]?.plain_text || '',
    };

    // Get communication history for this job
    let commHistory: any[] = [];
    if (process.env.NOTION_COMMUNICATION_LOG_DB_ID) {
      const comms = await notion.databases.query({
        database_id: process.env.NOTION_COMMUNICATION_LOG_DB_ID,
        filter: {
          property: 'Job ID',
          rich_text: { contains: jobId.replace(/-/g, '') },
        },
        sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
        page_size: 20,
      });
      commHistory = comms.results.map((c: any) => ({
        direction: c.properties['Direction']?.select?.name,
        message: c.properties['Message Body']?.title?.[0]?.plain_text
               || c.properties['Message']?.title?.[0]?.plain_text || '',
        action: c.properties['Action Taken']?.rich_text?.[0]?.plain_text || '',
        date: c.created_time,
      }));
    }

    // Get milestones for this job
    let milestones: any[] = [];
    if (process.env.NOTION_MILESTONE_LOG_DB_ID) {
      const ms = await notion.databases.query({
        database_id: process.env.NOTION_MILESTONE_LOG_DB_ID,
        filter: {
          property: 'Job ID',
          rich_text: { contains: jobId.replace(/-/g, '') },
        },
        sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
        page_size: 20,
      });
      milestones = ms.results.map((m: any) => ({
        type: m.properties['Milestone Type']?.select?.name || '',
        description: m.properties['Description']?.rich_text?.[0]?.plain_text || '',
        loggedBy: m.properties['Logged By']?.select?.name || '',
        date: m.created_time,
      }));
    }

    // Generate Brain Summary with Claude
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Generate a concise Job Brain Summary for this job.
This is internal context for an AI agent — factual, structured, no fluff.
Cover: current status, key facts about the scope, any issues or decisions,
communication history summary, what's next.
Max 200 words.

JOB: ${JSON.stringify(jobData, null, 2)}
MILESTONES: ${JSON.stringify(milestones, null, 2)}
RECENT COMMS: ${JSON.stringify(commHistory.slice(-5), null, 2)}`
      }],
    });

    const brainSummary = claudeResponse.content[0].type === 'text'
      ? claudeResponse.content[0].text.trim() : '';

    // Save Brain Summary to Job Brain DB
    if (process.env.NOTION_JOB_BRAIN_DB_ID) {
      const existing = await notion.databases.query({
        database_id: process.env.NOTION_JOB_BRAIN_DB_ID,
        filter: {
          property: 'Job ID',
          rich_text: { equals: jobId },
        },
        page_size: 1,
      });

      if (existing.results.length > 0) {
        // Update existing
        await notion.pages.update({
          page_id: existing.results[0].id,
          properties: {
            'Brain Summary': { rich_text: [{ text: { content: brainSummary } }] },
            'Brain Last Updated': { date: { start: new Date().toISOString() } },
          },
        });
      } else {
        // Create new
        await notion.pages.create({
          parent: { database_id: process.env.NOTION_JOB_BRAIN_DB_ID },
          properties: {
            'Job Name': { title: [{ text: { content: jobData.name } }] },
            'Job ID': { rich_text: [{ text: { content: jobId } }] },
            'Brain Summary': { rich_text: [{ text: { content: brainSummary } }] },
            'Active Scope Summary': { rich_text: [{ text: { content: jobData.scope } }] },
            'Products Used': { rich_text: [{ text: { content: jobData.products } }] },
            'Client Preferences': { rich_text: [{ text: { content: jobData.notes } }] },
            'Site Access Notes': { rich_text: [{ text: { content: jobData.siteAccess } }] },
            'Brain Last Updated': { date: { start: new Date().toISOString() } },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      brainSummary,
      jobId,
    });

  } catch (error: any) {
    console.error('Brain update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

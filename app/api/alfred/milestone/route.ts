import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, jobName, milestoneType, description, loggedBy = 'ALFRED' } = body;

    if (!process.env.NOTION_MILESTONE_LOG_DB_ID) {
      console.log('[ALFRED LOG] Milestone Log DB not configured yet');
      return NextResponse.json({ success: true, skipped: true });
    }

    console.log('[ALFRED LOG] Attempting to create milestone:', { jobId, jobName, milestoneType });

    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_MILESTONE_LOG_DB_ID },
      properties: {
        'Title': { title: [{ text: { content: `${milestoneType} — ${jobName}` } }] },
        'Job ID': { rich_text: [{ text: { content: jobId } }] },
        'Milestone Type': { select: { name: milestoneType } },
        'Description': { rich_text: [{ text: { content: description } }] },
        'Logged By': { select: { name: loggedBy } },
        'Client Notified': { checkbox: milestoneType === 'JOB_COMPLETE' },
      },
    });

    console.log('[ALFRED LOG] Success:', page.id);

    return NextResponse.json({ success: true, milestoneId: page.id });

  } catch (error: any) {
    console.error('[ALFRED LOG] Failed:', error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

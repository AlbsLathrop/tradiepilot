import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY! });

interface ChatMessage {
  id: string;
  role: 'joey' | 'alfred';
  content: string;
  timestamp: Date;
  action?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tradieSlug = searchParams.get('tradieSlug');

    if (!tradieSlug) {
      return NextResponse.json({ error: 'tradieSlug required' }, { status: 400 });
    }

    if (!process.env.NOTION_COMMUNICATION_LOG_DB_ID) {
      return NextResponse.json({ messages: [] });
    }

    // Query Communication Log for this tradie's chat messages
    const response = await notion.databases.query({
      database_id: process.env.NOTION_COMMUNICATION_LOG_DB_ID,
      filter: {
        and: [
          {
            property: 'Tradie Config ID',
            rich_text: { equals: tradieSlug },
          },
          {
            property: 'Channel',
            select: { equals: 'Cockpit Chat' },
          },
        ],
      },
      sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
      page_size: 50,
    });

    const messages: ChatMessage[] = response.results.map((page: any) => {
      const isInbound = page.properties['Direction']?.select?.name === 'Inbound';
      const messageText = page.properties['Message']?.title?.[0]?.plain_text || '';
      const responseText = page.properties['Response Sent']?.rich_text?.[0]?.plain_text || '';
      const timestamp = new Date(page.created_time);

      const messages: ChatMessage[] = [];

      // Add inbound message (joey/user)
      if (isInbound && messageText) {
        messages.push({
          id: `${page.id}-inbound`,
          role: 'joey',
          content: messageText,
          timestamp,
        });
      }

      // Add response (alfred/assistant)
      if (responseText) {
        messages.push({
          id: `${page.id}-response`,
          role: 'alfred',
          content: responseText,
          timestamp: new Date(timestamp.getTime() + 100),
          action: page.properties['Action Taken']?.rich_text?.[0]?.plain_text,
        });
      }

      return messages;
    }).flat();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, reply, action, tradieSlug } = body;

    if (!tradieSlug || !message || !reply) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.NOTION_COMMUNICATION_LOG_DB_ID) {
      return NextResponse.json({ success: true });
    }

    // Save to Communication Log
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_COMMUNICATION_LOG_DB_ID },
      properties: {
        'Message': { title: [{ text: { content: message.slice(0, 100) } }] },
        'Direction': { select: { name: 'Inbound' } },
        'Channel': { select: { name: 'Cockpit Chat' } },
        'Agent': { select: { name: 'ALFRED' } },
        'Response Sent': { rich_text: [{ text: { content: reply.slice(0, 500) } }] },
        'Action Taken': action ? { rich_text: [{ text: { content: action } }] } : undefined,
        'Tradie Config ID': { rich_text: [{ text: { content: tradieSlug } }] },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chat history save error:', error);
    return NextResponse.json({ success: true });
  }
}

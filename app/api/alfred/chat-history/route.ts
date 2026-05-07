import { NextRequest, NextResponse } from 'next/server';
import { queryNotionDatabase } from '@/lib/notion';
import { NOTION_DB } from '@/lib/constants';
import { Client } from '@notionhq/client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function loadMessages(tradieSlug: string): Promise<ChatMessage[]> {
  try {
    const results = await queryNotionDatabase(NOTION_DB.COMMS, {
      filter: {
        and: [
          {
            property: 'Job',
            rich_text: {
              equals: tradieSlug,
            },
          },
          {
            property: 'Type',
            select: {
              equals: 'ALFRED Chat',
            },
          },
        ],
      },
      sorts: [
        {
          property: 'Timestamp',
          direction: 'ascending',
        },
      ],
      page_size: 50,
    });

    return results.map((page: any) => {
      const direction = page.properties?.Direction?.select?.name;
      const role = direction === 'Outbound' ? 'user' : 'assistant';
      const timestamp = page.properties?.Timestamp?.date?.start ?? new Date().toISOString();

      return {
        role,
        content: page.properties?.['Message Content']?.rich_text?.[0]?.plain_text ?? '',
        timestamp,
      };
    });
  } catch (err) {
    console.error('Failed to load messages from Notion:', err);
    return [];
  }
}

async function saveMessage(tradieSlug: string, role: 'user' | 'assistant', content: string): Promise<boolean> {
  try {
    const timestamp = new Date().toISOString();
    const direction = role === 'user' ? 'Outbound' : 'Inbound';

    await notion.pages.create({
      parent: { database_id: NOTION_DB.COMMS },
      properties: {
        'Log Entry': {
          title: [{ text: { content: `[ALFRED] ${role === 'user' ? 'User' : 'Assistant'}` } }],
        },
        'Message Content': {
          rich_text: [{ text: { content } }],
        },
        Job: {
          rich_text: [{ text: { content: tradieSlug } }],
        },
        Timestamp: {
          date: {
            start: timestamp,
          },
        },
        Type: {
          select: { name: 'ALFRED Chat' },
        },
        Direction: {
          select: { name: direction },
        },
        'Triggered By': {
          select: { name: 'Manual' },
        },
      },
    });

    return true;
  } catch (err) {
    console.error('Failed to save message to Notion:', err);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tradieSlug = searchParams.get('tradieSlug');

    if (!tradieSlug) {
      return NextResponse.json({ error: 'tradieSlug required' }, { status: 400 });
    }

    const messages = await loadMessages(tradieSlug);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Chat history GET error:', error);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tradieSlug, role, content } = body;

    if (!tradieSlug || !role || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: tradieSlug, role, content' },
        { status: 400 }
      );
    }

    if (!['user', 'assistant'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be "user" or "assistant"' },
        { status: 400 }
      );
    }

    const success = await saveMessage(tradieSlug, role, content);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to save message' }, { status: 500 });
    }
  } catch (error) {
    console.error('Chat history POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save message' }, { status: 500 });
  }
}

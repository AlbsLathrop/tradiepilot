import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const DATA_DIR = path.join(process.cwd(), 'data', 'chat-history');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

async function getChatFile(tradieSlug: string): Promise<string> {
  return path.join(DATA_DIR, `${tradieSlug}.json`);
}

async function loadMessages(tradieSlug: string): Promise<ChatMessage[]> {
  try {
    await ensureDataDir();
    const filePath = await getChatFile(tradieSlug);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    // File doesn't exist or is empty
    return [];
  }
}

async function saveMessages(tradieSlug: string, messages: ChatMessage[]): Promise<void> {
  try {
    await ensureDataDir();
    const filePath = await getChatFile(tradieSlug);
    // Keep only last 100 messages
    const trimmed = messages.slice(-100);
    await fs.writeFile(filePath, JSON.stringify(trimmed, null, 2));
  } catch (err) {
    console.error('Failed to save messages:', err);
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

    // Load existing messages
    const messages = await loadMessages(tradieSlug);

    // Add new message
    messages.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });

    // Save updated messages
    await saveMessages(tradieSlug, messages);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chat history POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save message' }, { status: 500 });
  }
}

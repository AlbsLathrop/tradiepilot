import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';

export const runtime = 'nodejs';
export const maxDuration = 30;

export const config = {
  api: {
    bodyParser: false,
  },
};

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const notion = new Client({ auth: process.env.NOTION_API_KEY! });

// Auto-describe image using Claude Vision
async function describeImage(imageUrl: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: imageUrl },
          },
          {
            type: 'text',
            text: 'Describe this construction/trades photo in 1-2 sentences. Focus on: what work is shown, what stage it appears to be, anything notable. Be specific and practical. No fluff.',
          }
        ],
      }],
    });
    return response.content[0].type === 'text' ? response.content[0].text : 'Photo uploaded';
  } catch {
    return 'Photo uploaded';
  }
}

// Determine stage from description + job status
function inferStage(description: string, jobStatus: string): string {
  const d = description.toLowerCase();
  if (d.includes('before') || d.includes('existing') || d.includes('demo') || d.includes('removal')) return 'Before';
  if (d.includes('complete') || d.includes('finished') || d.includes('final') || jobStatus === 'COMPLETE') return 'After';
  if (d.includes('issue') || d.includes('problem') || d.includes('damage') || d.includes('crack')) return 'Issue';
  if (d.includes('inspection') || d.includes('sign')) return 'Sign-off';
  return 'During';
}

// Save to Notion Media DB
async function saveToMediaDB(data: {
  title: string;
  mediaUrl: string;
  mediaType: string;
  jobId: string;
  jobName: string;
  stage: string;
  description: string;
}) {
  if (!process.env.NOTION_MEDIA_DB_ID) return null;

  try {
    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_MEDIA_DB_ID },
      properties: {
        'Title': { title: [{ text: { content: data.title } }] },
        'Media URL': { url: data.mediaUrl },
        'Media Type': { select: { name: data.mediaType } },
        'Job ID': { rich_text: [{ text: { content: data.jobId } }] },
        'Stage': { select: { name: data.stage } },
        'Auto Description': { rich_text: [{ text: { content: data.description } }] },
        'Tags': { multi_select: [{ name: data.stage === 'Issue' ? 'Issue' : 'Completed Work' }] },
        'Uploaded By': { rich_text: [{ text: { content: 'Joey' } }] },
        'Sent To Client': { checkbox: false },
      },
    });
    return page.id;
  } catch (err) {
    console.error('Media DB error:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('BLOB TOKEN present:', !!process.env.BLOB_READ_WRITE_TOKEN);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jobId = formData.get('jobId') as string || '';
    const jobName = formData.get('jobName') as string || 'Unknown Job';
    const jobStatus = formData.get('jobStatus') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    // Determine media type
    const isVideo = file.type.startsWith('video/');
    const mediaType = isVideo ? 'Video' : 'Photo';

    // Upload to Vercel Blob (public for Claude Vision + inline display)
    const filename = `tradiepilot/${jobId || 'general'}/${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOBTRADIEPILOT_READ_WRITE_TOKEN,
    });

    // Auto-describe (photos only — skip video for now)
    let description = `${mediaType} uploaded for ${jobName}`;
    if (!isVideo) {
      description = await describeImage(blob.url);
    }

    // Infer stage
    const stage = inferStage(description, jobStatus);

    // Save to Media DB
    const title = `${jobName} — ${stage} — ${new Date().toLocaleDateString('en-AU')}`;
    const mediaDbId = await saveToMediaDB({
      title,
      mediaUrl: blob.url,
      mediaType,
      jobId,
      jobName,
      stage,
      description,
    });

    return NextResponse.json({
      success: true,
      mediaUrl: blob.url,
      mediaType,
      description,
      stage,
      mediaDbId,
      message: `📎 Saved ✓ ${description} — tagged as ${stage}`,
    });

  } catch (error: any) {
    console.error('Media upload error:', error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

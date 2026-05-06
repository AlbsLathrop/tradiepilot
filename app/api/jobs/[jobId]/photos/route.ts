import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const MEDIA_DB_ID = process.env.NOTION_MEDIA_DB_ID!

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string
    const tradieSlug = formData.get('tradieSlug') as string

    if (!file || !category) {
      return NextResponse.json(
        { error: 'Missing file or category' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob
    const filename = `${jobId}-${category}-${Date.now()}-${file.name}`
    const blob = await put(filename, file, {
      access: 'public',
    })

    // Create record in Notion Media DB
    const notionPage = await notion.pages.create({
      parent: { database_id: MEDIA_DB_ID },
      properties: {
        'Title': { title: [{ text: { content: file.name } }] },
        'File URL': { url: blob.url },
        'Job ID': { rich_text: [{ text: { content: jobId.replace(/-/g, '') } }] },
        'Category': { select: { name: category } },
        'Uploaded At': { date: { start: new Date().toISOString().split('T')[0] } },
        ...(tradieSlug ? { 'Tradie Slug': { rich_text: [{ text: { content: tradieSlug } }] } } : {}),
      },
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      pageId: notionPage.id,
    })
  } catch (error: any) {
    console.error('[POST /api/jobs/[jobId]/photos] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Upload failed' },
      { status: 500 }
    )
  }
}

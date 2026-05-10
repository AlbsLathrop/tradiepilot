import { NextResponse } from 'next/server'
import { getJob, getTradieConfigById, getMilestones, getPhotos } from '@/lib/notion'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params

  console.log('[STATUS] jobId received:', jobId)

  const formattedId = jobId.replace(
    /^([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})$/,
    '$1-$2-$3-$4-$5'
  )

  console.log('[STATUS] formattedId:', formattedId)

  try {
    const { Client } = require('@notionhq/client')
    const notion = new Client({ auth: process.env.NOTION_API_KEY })
    const page = await notion.pages.retrieve({ page_id: formattedId })
    console.log('[STATUS] page found:', page.id)
    return Response.json({ success: true, pageId: page.id })
  } catch (err: any) {
    console.error('[STATUS] Error:', err?.code, err?.message)
    return Response.json({ error: err?.message, code: err?.code }, { status: 404 })
  }
}

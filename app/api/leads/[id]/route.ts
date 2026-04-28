import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  try {
    const updates: Record<string, any> = {}
    if (body.status) {
      updates['Status'] = { select: { name: body.status } }
    }
    if (body.notes !== undefined) {
      updates['Notes'] = {
        rich_text: [{ text: { content: body.notes } }]
      }
    }
    if (body.disqualifyReason !== undefined) {
      updates['Disqualify Reason'] = {
        rich_text: [{ text: { content: body.disqualifyReason } }]
      }
    }

    await notion.pages.update({ page_id: id, properties: updates })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

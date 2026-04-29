import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function POST(req: NextRequest) {
  const { leadId, leadName, title, description, eventType, by } = await req.json()
  try {
    await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_LEAD_LOG_DB_ID!
      },
      properties: {
        'Title': {
          title: [{ text: { content: title } }]
        },
        'Lead ID': {
          rich_text: [{ text: { content: leadId } }]
        },
        'Lead Name': {
          rich_text: [{ text: { content: leadName } }]
        },
        'Description': {
          rich_text: [{ text: { content: description } }]
        },
        'Event Type': {
          select: { name: eventType ?? 'NOTE' }
        },
        'By': {
          select: { name: by ?? 'Joey' }
        },
      }
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message
    }, { status: 500 })
  }
}

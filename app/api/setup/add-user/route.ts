import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const page = await notion.pages.create({
      parent: { database_id: 'ff9248a4dd244ad9a0761281967750ea' },
      properties: {
        'Name': { title: [{ text: { content: 'Test User' } }] },
        'Email': { email: 'user@example.com' },
        'Business Name': { rich_text: [{ text: { content: 'Test Business' } }] },
      },
    })

    const tradieConfigId = page.id.replace(/-/g, '')
    return NextResponse.json({
      success: true,
      message: 'User added to Notion',
      pageId: page.id,
      tradieConfigId,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Something went wrong. Please try again.",
    }, { status: 500 })
  }
}

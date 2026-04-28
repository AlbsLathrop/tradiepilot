import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function POST(req: NextRequest) {
  const {
    tradieConfigId, businessName, ownerName, tradeType,
    serviceArea, minJobValue, twilioNumber, tone,
    hoursStart, hoursEnd, email
  } = await req.json()

  try {
    // Create Tradie Config entry in Notion
    await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_TRADIE_CONFIG_DB_ID!
      },
      properties: {
        'Tradie Config ID': {
          title: [{ text: { content: tradieConfigId } }]
        },
        'Business Name': {
          rich_text: [{ text: { content: businessName ?? '' } }]
        },
        'Owner Name': {
          rich_text: [{ text: { content: ownerName ?? '' } }]
        },
        'Trade Type': {
          rich_text: [{ text: { content: tradeType ?? '' } }]
        },
        'Service Area': {
          rich_text: [{ text: { content: serviceArea ?? '' } }]
        },
        'Min Job Value': { number: minJobValue ?? 0 },
        'Twilio Number': { phone_number: twilioNumber ?? '' },
        'Tone': { select: { name: tone ?? 'Professional' } },
        'Hours Start': {
          rich_text: [{ text: { content: hoursStart ?? '7:00' } }]
        },
        'Hours End': {
          rich_text: [{ text: { content: hoursEnd ?? '17:00' } }]
        },
        'Email': { email: email ?? '' },
        'Status': { select: { name: 'ACTIVE' } },
      }
    })

    return NextResponse.json({
      success: true,
      tradieConfigId
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message },
      { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

interface NotionPage {
  id: string
  properties: Record<string, any>
}

interface TradiePilotConfig {
  businessName: string
  tradeType: string
  serviceArea: string
  minJobValue: number
  hoursStart: string
  hoursEnd: string
  tone: string
  twilioNumber: string
}

export async function GET() {
  try {
    const res = await notion.databases.query({
      database_id: process.env.NOTION_TRADIE_CONFIG_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: 'joey-tradie' }
      },
      page_size: 1,
    })
    if (!res.results.length) {
      return NextResponse.json({ config: {} })
    }
    const p = (res.results[0] as NotionPage).properties
    const config: TradiePilotConfig = {
      businessName: p['Business Name']?.rich_text?.[0]?.plain_text ?? '',
      tradeType: p['Trade Type']?.rich_text?.[0]?.plain_text ?? '',
      serviceArea: p['Service Area']?.rich_text?.[0]?.plain_text ?? '',
      minJobValue: p['Min Job Value']?.number ?? 0,
      hoursStart: p['Hours Start']?.rich_text?.[0]?.plain_text ?? '7:00',
      hoursEnd: p['Hours End']?.rich_text?.[0]?.plain_text ?? '17:00',
      tone: p['Tone']?.select?.name ?? 'Professional',
      twilioNumber: p['Twilio Number']?.phone_number ?? '+61468072974',
    }
    return NextResponse.json({ config })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message, config: {} })
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  try {
    const res = await notion.databases.query({
      database_id: process.env.NOTION_TRADIE_CONFIG_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: 'joey-tradie' }
      },
      page_size: 1,
    })
    if (!res.results.length) {
      return NextResponse.json({ error: 'Config not found' },
        { status: 404 })
    }
    const pageId = res.results[0].id
    const updates: Record<string, any> = {}
    if (body.businessName !== undefined) updates['Business Name'] = {
      rich_text: [{ text: { content: body.businessName } }]
    }
    if (body.serviceArea !== undefined) updates['Service Area'] = {
      rich_text: [{ text: { content: body.serviceArea } }]
    }
    if (body.minJobValue !== undefined) updates['Min Job Value'] = {
      number: body.minJobValue
    }
    if (body.tone !== undefined) updates['Tone'] = {
      select: { name: body.tone }
    }
    await notion.pages.update({ page_id: pageId, properties: updates })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
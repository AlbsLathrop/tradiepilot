import { NextResponse, NextRequest } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_LEADS_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: 'joey-tradie' }
      },
      sorts: [{ property: 'Received Date', direction: 'descending' }],
    })

    const leads = (response.results as any[]).map(page => {
      const p = page.properties
      return {
        id: page.id,
        clientName: p['Client Name']?.title?.[0]?.plain_text ?? 'Unknown',
        phone: p['Phone']?.phone_number ?? '',
        suburb: p['Suburb']?.rich_text?.[0]?.plain_text ?? '',
        service: p['Service']?.rich_text?.[0]?.plain_text ?? '',
        status: p['Status']?.select?.name ?? 'NEW',
        source: p['Source']?.select?.name ?? '',
        receivedDate: p['Received Date']?.date?.start ??
                      page.created_time ?? '',
        lastContact: p['Last Contact']?.date?.start ?? '',
        nextFollowUp: p['Next Follow Up']?.date?.start ?? '',
        disqualifyReason: p['Disqualify Reason']?.rich_text?.[0]?.plain_text ?? '',
        notes: p['Notes']?.rich_text?.[0]?.plain_text ?? '',
        leadScore: p['Lead Score']?.number ?? null,
        jobValue: p['Job Value']?.number ?? null,
        tradieConfigId: p['Tradie Config ID']?.rich_text?.[0]?.plain_text ?? '',
        quoteStatus: p['Quote Status']?.select?.name ?? 'NOT QUOTED',
        quoteAmount: p['Quote Amount']?.number ?? null,
        quoteDate: p['Quote Date']?.date?.start ?? null,
        quoteExpiry: p['Quote Expiry']?.date?.start ?? null,
        quoteDaysLeft: (() => {
          const expiry = p['Quote Expiry']?.date?.start
          if (!expiry) return null
          return Math.ceil(
            (new Date(expiry).getTime() - Date.now()) / (1000*60*60*24)
          )
        })(),
      }
    })

    return NextResponse.json({ leads })
  } catch (error: any) {
    console.error('Leads fetch error:', error?.message)
    return NextResponse.json({ error: error?.message, leads: [] },
      { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  try {
    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_LEADS_DB_ID! },
      properties: {
        'Client Name': {
          title: [{ text: { content: body.clientName } }]
        },
        'Phone': { phone_number: body.phone ?? '' },
        'Suburb': {
          rich_text: [{ text: { content: body.suburb ?? '' } }]
        },
        'Service': {
          rich_text: [{ text: { content: body.service ?? '' } }]
        },
        'Status': { select: { name: 'NEW' } },
        'Source': { select: { name: body.source ?? 'Direct' } },
        'Tradie Config ID': {
          rich_text: [{ text: { content: 'joey-tradie' } }]
        },
        ...(body.notes ? {
          'Notes': {
            rich_text: [{ text: { content: body.notes } }]
          }
        } : {}),
        ...(body.jobValue ? {
          'Job Value': { number: body.jobValue }
        } : {}),
      }
    })
    return NextResponse.json({ success: true, id: page.id })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tradieSlug = searchParams.get('tradieSlug')

    if (!tradieSlug) {
      return NextResponse.json(
        { error: 'Missing tradieSlug query parameter' },
        { status: 400 }
      )
    }

    const leadsRes = await notion.databases.query({
      database_id: process.env.NOTION_LEADS_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: tradieSlug },
      },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    })

    const leads = (leadsRes.results as any[]).map(page => {
      const p = page.properties
      return {
        id: page.id,
        clientName: p['Name']?.title?.[0]?.plain_text ?? 'Unknown',
        phone: p['Phone']?.phone_number ?? '',
        suburb: p['Suburb']?.rich_text?.[0]?.plain_text ?? '',
        service: p['Service']?.rich_text?.[0]?.plain_text ?? '',
        status: p['Status']?.select?.name ?? 'NEW',
        lunaStatus: p['LUNA Status']?.select?.name ?? '',
        chaseStatus: p['CHASE Status']?.select?.name ?? '',
        source: p['Source']?.rich_text?.[0]?.plain_text ?? '',
        receivedDate: p['Received Date']?.date?.start ?? (page as any).created_time ?? '',
        lastContact: '',
        nextFollowUp: '',
        quoteDate: p['Quote Date']?.date?.start ?? null,
        notes: p['LUNA Notes']?.rich_text?.[0]?.plain_text ?? '',
        lunaLastUpdate: p['LUNA Last Update']?.rich_text?.[0]?.plain_text ?? '',
        tradieConfigId: p['Tradie Config ID']?.rich_text?.[0]?.plain_text ?? '',
        jobValue: null as number | null,
        quoteAmount: null as number | null,
        quoteExpiry: null as string | null,
        quoteStatus: 'NOT QUOTED',
        disqualifyReason: '',
        quoteDaysLeft: null as number | null,
        leadLog: [] as any[],
      }
    })

    // Fetch Lead Log
    if (process.env.NOTION_LEAD_LOG_DB_ID) {
      try {
        const lRes = await notion.databases.query({
          database_id: process.env.NOTION_LEAD_LOG_DB_ID,
          sorts: [{ timestamp: 'created_time', direction: 'descending' }],
          page_size: 100,
        })
        const byLead: Record<string, any[]> = {}
        ;(lRes.results as any[]).forEach((m: any) => {
          const lid = m.properties?.['Lead ID']?.rich_text?.[0]?.plain_text ?? ''
          if (!lid) return
          if (!byLead[lid]) byLead[lid] = []
          byLead[lid].push({
            title: m.properties?.['Title']?.title?.[0]?.plain_text ?? '',
            description: m.properties?.['Description']?.rich_text?.[0]?.plain_text ?? '',
            eventType: m.properties?.['Event Type']?.select?.name ?? 'NOTE',
            by: m.properties?.['By']?.select?.name ?? '',
            date: (m as any).created_time ?? '',
          })
        })
        leads.forEach(l => {
          l.leadLog = byLead[l.id] ?? []
        })
      } catch (e: any) {
        console.warn('Lead log fetch skipped:', e?.message)
      }
    }

    return NextResponse.json({ leads })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message, leads: [] }, { status: 500 })
  }
}

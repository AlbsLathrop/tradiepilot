import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_LEADS_DB_ID!,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    })

    const leads = (response.results as any[]).map(page => {
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
        receivedDate: p['Received Date']?.date?.start ??
                      page.created_time ?? '',
        lastContact: p['Last Contact']?.date?.start ?? '',
        nextFollowUp: p['Next Follow Up']?.date?.start ?? '',
        quoteDate: p['Quote Date']?.date?.start ?? null,
        notes: p['LUNA Notes']?.rich_text?.[0]?.plain_text ?? '',
        lunaLastUpdate: p['LUNA Last Update']?.rich_text?.[0]?.plain_text ?? '',
        tradieConfigId: p['Tradie Config ID']?.rich_text?.[0]?.plain_text ?? '',
        jobValue: null,
        quoteAmount: null,
        quoteExpiry: null,
        quoteStatus: 'NOT QUOTED',
        disqualifyReason: '',
        quoteDaysLeft: (() => {
          const qd = p['Quote Date']?.date?.start
          if (!qd) return null
          return Math.ceil(
            (new Date(qd).getTime() - Date.now()) / (1000*60*60*24)
          )
        })(),
      }
    })

    let leadLogByLead: Record<string, any[]> = {}
    try {
      if (process.env.NOTION_LEAD_LOG_DB_ID) {
        const logRes = await notion.databases.query({
          database_id: process.env.NOTION_LEAD_LOG_DB_ID,
          sorts: [{ timestamp: 'created_time', direction: 'descending' }],
          page_size: 100,
        })
        ;(logRes.results as any[]).forEach((m: any) => {
          const mp = m.properties
          const leadId = mp['Lead ID']?.rich_text?.[0]?.plain_text ?? ''
          if (!leadId) return
          if (!leadLogByLead[leadId]) leadLogByLead[leadId] = []
          leadLogByLead[leadId].push({
            title: mp['Title']?.title?.[0]?.plain_text ?? '',
            description: mp['Description']?.rich_text?.[0]?.plain_text ?? '',
            eventType: mp['Event Type']?.select?.name ?? 'NOTE',
            by: mp['By']?.select?.name ?? '',
            date: (m as any).created_time ?? '',
          })
        })
      }
    } catch (e: any) {
      console.warn('Lead log fetch non-fatal:', e?.message)
    }

    const leadsWithLog = leads.map((lead: any) => ({
      ...lead,
      leadLog: leadLogByLead[lead.id] ?? [],
    }))

    return NextResponse.json({ leads: leadsWithLog })
  } catch (error: any) {
    console.error('Leads fetch error:', error?.message)
    return NextResponse.json({
      error: error?.message,
      leads: []
    }, { status: 500 })
  }
}

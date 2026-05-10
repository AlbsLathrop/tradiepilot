import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { tradieSlug, phone, name } = await req.json()

    if (!tradieSlug || !phone || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: tradieSlug, phone, name' },
        { status: 400 }
      )
    }

    // Query Jobs DB (no Tradie Config ID filter - filter in JS)
    const jobsAllRes = await notion.databases.query({
      database_id: 'e96a412b635a415cbdcd02343f55b7f3',
      filter: {
        or: [
          { property: 'Status', select: { equals: 'IN PROGRESS' } },
          { property: 'Status', select: { equals: 'SCHEDULED' } },
        ]
      },
      page_size: 100,
    })

    // Filter by Tradie Config ID in JavaScript
    const jobs = (jobsAllRes.results as any[])
      .filter(page => page.properties?.['Tradie Config ID']?.rich_text?.[0]?.plain_text === tradieSlug)
      .slice(0, 10)

    // Query Leads DB
    const leadsRes = await notion.databases.query({
      database_id: '3ca5ac231a1741478b9dad5344c738df',
      filter: {
        property: 'Status',
        select: { equals: 'New' }
      },
      page_size: 5,
    })

    const leads = leadsRes.results as any[]

    // Debug: log lead properties
    if (leads.length > 0) {
      const props = leads[0]?.properties || {}
      console.log('[MORNING DIGEST] Lead property keys:', Object.keys(props))
      Object.keys(props).forEach(key => {
        if (props[key]?.title) {
          console.log(`[MORNING DIGEST] "${key}" is a title property:`, props[key].title?.[0]?.plain_text)
        }
      })
    }

    // Build job lines
    const jobLines = jobs.map(job => {
      const clientName = job.properties['Client Name']?.title?.[0]?.plain_text || 'Unknown'
      const suburb = job.properties['Suburb']?.rich_text?.[0]?.plain_text || ''
      const typeOfWork = job.properties['Type of Work']?.select?.name || ''
      const status = job.properties['Status']?.select?.name || ''
      return `• ${clientName}, ${suburb}\n  ${typeOfWork} — ${status}`
    }).join('\n')

    // Build lead lines (max 2)
    const leadLines = leads.slice(0, 2).map(lead => {
      // Try multiple property names for client name
      const clientName =
        lead.properties['Name']?.title?.[0]?.plain_text ||
        lead.properties['name']?.title?.[0]?.plain_text ||
        lead.properties['Client Name']?.title?.[0]?.plain_text ||
        'Unknown'
      const suburb = lead.properties['Suburb']?.rich_text?.[0]?.plain_text || ''
      const phoneNum = lead.properties['Phone']?.phone_number || ''
      return `• ${clientName}, ${suburb} — ${phoneNum}`
    }).join('\n')

    // Build message
    const message = [
      `🔨 Good morning ${name}! Here's your day:`,
      ``,
      `📋 JOBS TODAY (${jobs.length}):`,
      jobs.length > 0 ? jobLines : 'No active jobs',
      ``,
      `🔔 NEW LEADS (${leads.length}):`,
      leads.length > 0 ? leadLines : 'No new leads',
      leads.length > 0 ? `📱 Open app: tradiepilot.vercel.app` : '',
      ``,
      `Have a ripper day! — TradieFlow`
    ].filter(l => l !== undefined && l !== '').join('\n')

    // Send SMS via Twilio
    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    })

    return NextResponse.json({
      success: true,
      jobCount: jobs.length,
      leadCount: leads.length,
    })
  } catch (error: any) {
    console.error('Morning digest error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Something went wrong' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import Anthropic from '@anthropic-ai/sdk'
import twilio from 'twilio'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(req: NextRequest) {
  const { tradieConfigId } = await req.json()
  const configId = tradieConfigId || 'joey-tradie'

  try {
    // Look up tradie config from Notion
    const configRes = await notion.databases.query({
      database_id: process.env.NOTION_TRADIE_CONFIG_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: configId }
      },
      page_size: 1,
    })

    const configPage = configRes.results[0] as any
    const tradiePhone = configPage?.properties['Phone']?.phone_number
      ?? configPage?.properties['Twilio Number']?.phone_number
      ?? null
    const tradieName = configPage?.properties['Owner Name']
      ?.rich_text?.[0]?.plain_text
      ?? configId

    // Fetch jobs
    const jobsRes = await notion.databases.query({
      database_id: process.env.NOTION_JOBS_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: configId }
      },
    })
    const jobs = jobsRes.results as any[]

    // Fetch leads
    const leadsRes = await notion.databases.query({
      database_id: process.env.NOTION_LEADS_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: configId }
      },
    })
    const leads = leadsRes.results as any[]

    // Build stats
    const activeJobs = jobs.filter(j =>
      ['IN PROGRESS', 'RUNNING LATE', 'SCHEDULED']
        .includes(j.properties['Status']?.select?.name ?? '')
    ).length

    const newLeads = leads.filter(l =>
      l.properties['Status']?.select?.name === 'NEW'
    ).length

    const weekRevenue = jobs
      .filter(j => ['INVOICED', 'COMPLETE']
        .includes(j.properties['Status']?.select?.name ?? ''))
      .reduce((sum, j) =>
        sum + (j.properties['Job Value']?.number ?? 0), 0)

    const overdueInvoices = jobs.filter(j => {
      const invStatus = j.properties['Invoice Status']?.select?.name
      const invDate = j.properties['Invoice Date']?.date?.start
      if (invStatus !== 'SENT' || !invDate) return false
      const days = Math.floor(
        (Date.now() - new Date(invDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      return days > 14
    }).length

    const runningLate = jobs.filter(j =>
      j.properties['Status']?.select?.name === 'RUNNING LATE'
    ).map(j =>
      j.properties['Client Name']?.rich_text?.[0]?.plain_text ?? ''
    ).filter(name => name)

    // Claude writes the summary
    const summaryRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Write a friendly Monday morning SMS summary for ${tradieName || 'Joey'}, an Australian tradie. Keep it under 160 chars.
Stats: ${activeJobs} active jobs, ${newLeads} new leads, $${weekRevenue.toLocaleString()} invoiced, ${overdueInvoices} overdue invoices, ${runningLate.length > 0 ? 'Running late: ' + runningLate.join(', ') : 'no late jobs'}.
Start with "Morning ${tradieName || 'Joey'}!" Be direct, no fluff. Australian tone.`
      }]
    })

    const summary = summaryRes.content[0].type === 'text'
      ? summaryRes.content[0].text.trim()
      : `Morning ${tradieName}! ${activeJobs} active jobs, ${newLeads} new leads. Have a good one! — TradiePilot`

    // Send SMS if phone provided
    if (tradiePhone) {
      await twilioClient.messages.create({
        body: summary,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: tradiePhone,
      })
    }

    return NextResponse.json({ success: true, summary })
  } catch (error: any) {
    console.error('Weekly summary error:', error)
    return NextResponse.json({
      error: error?.message
    }, { status: 500 })
  }
}

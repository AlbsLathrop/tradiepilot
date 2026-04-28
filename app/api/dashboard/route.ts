import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

interface JobRecord {
  id: string
  properties: Record<string, any>
}

interface LeadRecord {
  id: string
  properties: Record<string, any>
}

export async function GET() {
  try {
    const tradieId = 'joey-tradie'

    // Fetch all jobs
    const jobsRes = await notion.databases.query({
      database_id: process.env.NOTION_JOBS_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: tradieId },
      },
    })
    const jobs = jobsRes.results as JobRecord[]

    // Fetch leads
    const leadsRes = await notion.databases.query({
      database_id: process.env.NOTION_LEADS_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: tradieId },
      },
    })
    const leads = leadsRes.results as LeadRecord[]

    // Fetch last comm
    let lastComm = null
    try {
      const commsRes = await notion.databases.query({
        database_id: process.env.NOTION_COMMUNICATION_LOG_DB_ID!,
        sorts: [{ property: 'Timestamp', direction: 'descending' }],
        page_size: 1,
      })
      if (commsRes.results.length > 0) {
        const c = (commsRes.results[0] as JobRecord).properties
        lastComm = {
          message: c['Message']?.title?.[0]?.plain_text ?? '',
          recipient:
            c['Recipient']?.rich_text?.[0]?.plain_text ??
            c['Client Name']?.rich_text?.[0]?.plain_text ??
            '',
          time: c['Timestamp']?.date?.start
            ? new Date(c['Timestamp'].date.start).toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '',
        }
      }
    } catch {
      // Silently fail, lastComm stays null
    }

    // Calculate stats
    const activeStatuses = ['In Progress', 'Running Late', 'Scheduled']
    const activeJobs = jobs.filter((j) =>
      activeStatuses.includes(j.properties['Status']?.select?.name ?? '')
    ).length

    const inProgressJobs = jobs.filter(
      (j) => j.properties['Status']?.select?.name === 'In Progress'
    ).length

    const runningLate = jobs
      .filter((j) => j.properties['Status']?.select?.name === 'Running Late')
      .map((j) => ({
        id: j.id,
        clientName:
          j.properties['Client Name']?.title?.[0]?.plain_text ?? '',
        suburb: j.properties['Suburb']?.rich_text?.[0]?.plain_text ?? '',
        status: 'RUNNING LATE',
      }))

    const todayJobs = jobs
      .filter((j) =>
        ['In Progress', 'Running Late'].includes(
          j.properties['Status']?.select?.name ?? ''
        )
      )
      .map((j) => ({
        id: j.id,
        clientName:
          j.properties['Client Name']?.title?.[0]?.plain_text ?? '',
        suburb: j.properties['Suburb']?.rich_text?.[0]?.plain_text ?? '',
        status: j.properties['Status']?.select?.name ?? '',
      }))

    const monthRevenue = jobs
      .filter((j) =>
        ['Invoiced', 'Complete'].includes(j.properties['Status']?.select?.name ?? '')
      )
      .reduce((sum, j) => sum + (j.properties['Job Value']?.number ?? 0), 0)

    const newLeads = leads.filter(
      (l) => l.properties['Status']?.select?.name === 'New'
    ).length

    const qualifiedLeads = leads.filter(
      (l) => l.properties['Status']?.select?.name === 'Qualified'
    ).length

    return NextResponse.json({
      activeJobs,
      inProgressJobs,
      runningLate,
      todayJobs,
      monthRevenue,
      newLeads,
      qualifiedLeads,
      smsSentToday: 0,
      lastComm,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}

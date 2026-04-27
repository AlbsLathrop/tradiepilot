import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

const JOBS_DB_ID = process.env.NOTION_JOBS_DB_ID!

export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: JOBS_DB_ID,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: 'joey-tradie' }
      },
      sorts: [{ property: 'Last Updated', direction: 'descending' }],
    })

    const milestonesRes = await notion.databases.query({
      database_id: process.env.NOTION_MILESTONE_LOG_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: 'joey-tradie' }
      },
      sorts: [{ property: 'Date', direction: 'descending' }],
    })

    const milestones = (milestonesRes.results as any[]).map(m => ({
      jobId: m.properties['Job ID']?.rich_text?.[0]?.plain_text ?? '',
      event: m.properties['Event']?.title?.[0]?.plain_text ??
             m.properties['Milestone']?.title?.[0]?.plain_text ?? '',
      note: m.properties['Note']?.rich_text?.[0]?.plain_text ??
            m.properties['Notes']?.rich_text?.[0]?.plain_text ?? '',
      date: m.properties['Date']?.date?.start ??
            m.properties['Timestamp']?.date?.start ?? '',
      type: m.properties['Type']?.select?.name ?? 'UPDATE',
    }))

    const milestonesByJob: Record<string, any[]> = {}
    milestones.forEach(m => {
      if (!milestonesByJob[m.jobId]) milestonesByJob[m.jobId] = []
      milestonesByJob[m.jobId].push(m)
    })

    const jobs = (response.results as any[]).map(page => {
      const p = page.properties
      return {
        id: page.id,
        clientName: p['Client Name']?.title?.[0]?.plain_text ?? 'Unknown',
        status: p['Status']?.select?.name ?? '',
        suburb: p['Suburb']?.rich_text?.[0]?.plain_text ?? '',
        address: p['Address']?.rich_text?.[0]?.plain_text ?? '',
        clientPhone: p['Client Phone']?.phone_number ?? '',
        service: p['Service']?.rich_text?.[0]?.plain_text ?? '',
        scope: p['Scope']?.rich_text?.[0]?.plain_text ?? '',
        jobType: p['Job Type']?.select?.name ?? '',
        currentPhase: p['Current Phase']?.select?.name ?? '',
        materialsStatus: p['Materials Status']?.select?.name ?? '',
        foreman: p['Foreman Name']?.rich_text?.[0]?.plain_text ?? '',
        foremanPhone: p['Foreman Phone']?.phone_number ?? '',
        notes: p['Notes']?.rich_text?.[0]?.plain_text ?? '',
        siteAccessNotes: p['Site Access Notes']?.rich_text?.[0]?.plain_text ?? '',
        estimatedCompletion: p['Estimated Completion']?.date?.start ?? null,
        tradieConfigId: p['Tradie Config ID']?.rich_text?.[0]?.plain_text ?? '',
        lastMessageSent: p['Last Message Sent']?.date?.start ?? null,
        jobValue: p['Job Value']?.number ?? null,
        milestones: milestonesByJob[page.id] ?? []
      }
    })

    return NextResponse.json({ jobs })
  } catch (error: any) {
    console.error('Jobs fetch error:', error?.message)
    return NextResponse.json({ error: error?.message, jobs: [] }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function GET() {
  try {
    // STEP 1: Fetch jobs
    const response = await notion.databases.query({
      database_id: process.env.NOTION_JOBS_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: 'joey-tradie' }
      },
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
        foremanName: p['Foreman Name']?.rich_text?.[0]?.plain_text ?? '',
        foremanPhone: p['Foreman Phone']?.phone_number ?? '',
        notes: p['Notes']?.rich_text?.[0]?.plain_text ?? '',
        siteAccessNotes: p['Site Access Notes']?.rich_text?.[0]?.plain_text ?? '',
        estimatedCompletion: p['Estimated Completion']?.date?.start ?? null,
        lastMessageSent: p['Last Message Sent']?.date?.start ?? null,
        jobValue: p['Job Value']?.number ?? null,
        tradieConfigId: p['Tradie Config ID']?.rich_text?.[0]?.plain_text ?? '',
        milestones: [] as Array<{ jobId: string; event: string; note: string; date: string; type: string }>
      }
    })

    // STEP 2: Fetch milestones — wrapped in try/catch, never breaks jobs
    if (process.env.NOTION_MILESTONE_LOG_DB_ID) {
      try {
        const milestonesRes = await notion.databases.query({
          database_id: process.env.NOTION_MILESTONE_LOG_DB_ID,
          sorts: [{ property: 'Date', direction: 'descending' }],
          page_size: 100,
        })

        const milestones = (milestonesRes.results as any[]).map(m => {
          const mp = m.properties
          // Try multiple possible property names
          const event =
            mp['Event']?.title?.[0]?.plain_text ??
            mp['Milestone']?.title?.[0]?.plain_text ??
            mp['Name']?.title?.[0]?.plain_text ?? ''
          const note =
            mp['Note']?.rich_text?.[0]?.plain_text ??
            mp['Notes']?.rich_text?.[0]?.plain_text ??
            mp['Description']?.rich_text?.[0]?.plain_text ?? ''
          const date =
            mp['Date']?.date?.start ??
            mp['Timestamp']?.date?.start ??
            mp['Created']?.date?.start ?? ''
          const jobId =
            mp['Job ID']?.rich_text?.[0]?.plain_text ??
            mp['Job']?.relation?.[0]?.id ?? ''
          const type =
            mp['Type']?.select?.name ?? 'UPDATE'

          return { jobId, event, note, date, type }
        })

        // Group by jobId and attach to jobs
        milestones.forEach(m => {
          const job = jobs.find(j =>
            j.id === m.jobId ||
            j.id.replace(/-/g, '') === m.jobId.replace(/-/g, '')
          )
          if (job) job.milestones.push(m)
        })
      } catch (milestoneError: any) {
        console.warn('Milestone fetch failed (non-fatal):', milestoneError?.message)
        // Jobs still return fine — milestones just empty
      }
    }

    return NextResponse.json({ jobs })

  } catch (error: any) {
    console.error('Jobs fetch error:', error?.message)
    return NextResponse.json({
      error: error?.message,
      jobs: []
    }, { status: 500 })
  }
}

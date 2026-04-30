import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function GET() {
  const results: any = {}

  // Check 1: Can we read milestone DB?
  try {
    const mRes = await notion.databases.query({
      database_id: process.env.NOTION_MILESTONE_LOG_DB_ID!,
      page_size: 5,
    })
    results.milestones_raw = (mRes.results as any[]).map(m => ({
      id: m.id,
      created_time: (m as any).created_time,
      jobId: m.properties?.['Job ID']?.rich_text?.[0]?.plain_text,
      title: m.properties?.['Title']?.title?.[0]?.plain_text,
    }))
  } catch (e: any) {
    results.milestones_error = e.message
  }

  // Check 2: What does /api/jobs return for first job?
  try {
    const jobsRes = await notion.databases.query({
      database_id: process.env.NOTION_JOBS_DB_ID!,
      page_size: 1,
    })
    if (jobsRes.results.length > 0) {
      const firstJob = jobsRes.results[0] as any
      results.first_job_id = firstJob.id
      results.first_job_id_nodash = firstJob.id.replace(/-/g, '')
    }
  } catch (e: any) {
    results.jobs_error = e.message
  }

  results.env_vars = {
    MILESTONE_LOG_DB: !!process.env.NOTION_MILESTONE_LOG_DB_ID,
    JOBS_DB: !!process.env.NOTION_JOBS_DB_ID,
    NOTION_API_KEY: !!process.env.NOTION_API_KEY,
  }

  return NextResponse.json(results)
}

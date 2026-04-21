import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY! })

export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_JOBS_DB_ID!,
      filter: {
        or: [
          { property: 'Status', select: { equals: 'Scheduled' } },
          { property: 'Status', select: { equals: 'In Progress' } },
          { property: 'Status', select: { equals: 'Running Late' } },
        ],
      },
      page_size: 10,
    })

    const todaysJobs = response.results.map((job: any) => ({
      id: job.id,
      name:
        job.properties?.['Job Name']?.title?.[0]?.plain_text ||
        job.properties?.['Name']?.title?.[0]?.plain_text ||
        'Job',
      status: job.properties?.['Status']?.select?.name || '',
      clientName: job.properties?.['Client Name']?.rich_text?.[0]?.plain_text || '',
      suburb: job.properties?.['Suburb']?.rich_text?.[0]?.plain_text || '',
    }))

    return NextResponse.json({ todaysJobs })
  } catch (err: any) {
    return NextResponse.json({ todaysJobs: [], error: err.message })
  }
}

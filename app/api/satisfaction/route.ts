import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function POST(req: NextRequest) {
  const { jobId, clientName, score, comment, tradieConfigId } = await req.json()

  try {
    // Log satisfaction in Milestone Log
    await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_MILESTONE_LOG_DB_ID!
      },
      properties: {
        'Title': {
          title: [{
            text: {
              content: `Review received — ${clientName} (${score}/5)`
            }
          }]
        },
        'Job ID': {
          rich_text: [{ text: { content: jobId ?? '' } }]
        },
        'Description': {
          rich_text: [{
            text: {
              content: comment
                ? `Score: ${score}/5. Comment: "${comment}"`
                : `Score: ${score}/5. No comment.`
            }
          }]
        },
        'Milestone Type': {
          select: { name: 'JOB_COMPLETE' }
        },
        'Logged By': { select: { name: 'ALFRED' } },
        'Client Notified': { checkbox: false }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message },
      { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const tradieId = new URL(req.url)
    .searchParams.get('tradieId') || 'joey-tradie'

  try {
    const res = await notion.databases.query({
      database_id: process.env.NOTION_MILESTONE_LOG_DB_ID!,
      page_size: 50,
    })

    const reviews = (res.results as any[])
      .filter(m => {
        const title = m.properties['Title']
          ?.title?.[0]?.plain_text ?? ''
        return title.includes('Review received')
      })
      .map(m => {
        const title = m.properties['Title']
          ?.title?.[0]?.plain_text ?? ''
        const scoreMatch = title.match(/\((\d)\/5\)/)
        return {
          score: scoreMatch ? Number(scoreMatch[1]) : null,
          date: m.created_time,
          description: m.properties['Description']
            ?.rich_text?.[0]?.plain_text ?? ''
        }
      })
      .filter(r => r.score !== null)

    const avg = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.score!, 0) / reviews.length
      : null

    return NextResponse.json({
      reviews,
      average: avg ? Math.round(avg * 10) / 10 : null,
      count: reviews.length
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message,
      reviews: [],
      average: null,
      count: 0
    })
  }
}

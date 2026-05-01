import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { sanitizeString, validateRequired, validateNumber } from '@/lib/sanitize'
import { getClientIp, rateLimit } from '@/lib/ratelimit'
import { logAuthFailure, logRateLimitExceeded, logValidationError } from '@/lib/logger'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)

  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.WEBHOOK_SECRET
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    logAuthFailure('/api/satisfaction', ip, 'missing or invalid webhook secret')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { success } = rateLimit(ip, 10, 60000)
  if (!success) {
    logRateLimitExceeded('/api/satisfaction', ip)
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { jobId, clientName, score, comment, tradieConfigId } = body

    const validationError = validateRequired(body, ['jobId', 'clientName', 'score', 'tradieConfigId'])
    if (validationError) {
      logValidationError('/api/satisfaction', ip, 'required', validationError)
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    if (!validateNumber(score, 1, 5)) {
      logValidationError('/api/satisfaction', ip, 'score', 'Invalid score (must be 1-5)')
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 })
    }

    const cleanJobId = sanitizeString(jobId, 100)
    const cleanClientName = sanitizeString(clientName, 200)
    const cleanComment = sanitizeString(comment, 1000)
    const cleanTradieConfigId = sanitizeString(tradieConfigId, 100)

    await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_MILESTONE_LOG_DB_ID!,
      },
      properties: {
        'Title': {
          title: [
            {
              text: {
                content: `Review received — ${cleanClientName} (${score}/5)`,
              },
            },
          ],
        },
        'Job ID': {
          rich_text: [{ text: { content: cleanJobId } }],
        },
        'Tradie Config ID': {
          rich_text: [{ text: { content: cleanTradieConfigId } }],
        },
        'Description': {
          rich_text: [
            {
              text: {
                content: cleanComment
                  ? `Score: ${score}/5. Comment: "${cleanComment}"`
                  : `Score: ${score}/5. No comment.`,
              },
            },
          ],
        },
        'Milestone Type': {
          select: { name: 'JOB_COMPLETE' },
        },
        'Logged By': { select: { name: 'ALFRED' } },
        'Client Notified': { checkbox: false },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Satisfaction POST error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const tradieSlug = new URL(req.url).searchParams.get('tradieSlug')

  if (!tradieSlug) {
    return NextResponse.json(
      { error: 'Missing tradieSlug query parameter' },
      { status: 400 }
    )
  }

  try {
    const res = await notion.databases.query({
      database_id: process.env.NOTION_MILESTONE_LOG_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: tradieSlug },
      },
      page_size: 50,
    })

    const reviews = (res.results as any[])
      .filter((m) => {
        const title = m.properties['Title']?.title?.[0]?.plain_text ?? ''
        return title.includes('Review received')
      })
      .map((m) => {
        const title = m.properties['Title']?.title?.[0]?.plain_text ?? ''
        const scoreMatch = title.match(/\((\d)\/5\)/)
        return {
          score: scoreMatch ? Number(scoreMatch[1]) : null,
          date: m.created_time,
          description: m.properties['Description']?.rich_text?.[0]?.plain_text ?? '',
        }
      })
      .filter((r) => r.score !== null)

    const avg =
      reviews.length > 0
        ? reviews.reduce((s, r) => s + r.score!, 0) / reviews.length
        : null

    return NextResponse.json({
      reviews,
      average: avg ? Math.round(avg * 10) / 10 : null,
      count: reviews.length,
    })
  } catch (error: any) {
    console.error('Satisfaction GET error:', error)
    return NextResponse.json(
      {
        error: 'Something went wrong. Please try again.',
        reviews: [],
        average: null,
        count: 0,
      },
      { status: 500 }
    )
  }
}

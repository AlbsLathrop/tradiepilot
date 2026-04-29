import { NextResponse, NextRequest } from 'next/server'
import { Client } from '@notionhq/client'
import { sanitizeString, validateRequired, validatePhoneNumber, validateNumber } from '@/lib/sanitize'
import { getClientIp, rateLimit } from '@/lib/ratelimit'
import { logRateLimitExceeded, logValidationError } from '@/lib/logger'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers)

  const { success } = rateLimit(ip, 30, 60000)
  if (!success) {
    logRateLimitExceeded('/api/jobs', ip)
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const tradieConfigId = new URL(req.url).searchParams.get('tradieConfigId') || 'joey-tradie'

  if (!tradieConfigId || typeof tradieConfigId !== 'string' || !tradieConfigId.trim()) {
    logValidationError('/api/jobs', ip, 'tradieConfigId', 'Invalid tradie config ID')
    return NextResponse.json({ error: 'Invalid tradie config ID' }, { status: 400 })
  }

  try {
    const cleanTradieConfigId = sanitizeString(tradieConfigId, 100)

    const response = await notion.databases.query({
      database_id: process.env.NOTION_JOBS_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: cleanTradieConfigId },
      },
    })

    const jobs = (response.results as any[]).map((page) => {
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
        invoiceStatus: p['Invoice Status']?.select?.name ?? 'NOT SENT',
        invoiceDate: p['Invoice Date']?.date?.start ?? null,
        invoiceAmount: p['Invoice Amount']?.number ?? null,
        invoiceDueDays: (() => {
          const sent = p['Invoice Date']?.date?.start
          if (!sent) return null
          return Math.floor((Date.now() - new Date(sent).getTime()) / (1000 * 60 * 60 * 24))
        })(),
        milestones: [] as Array<{
          jobId: string
          event: string
          note: string
          date: string
          type: string
          loggedBy?: string
          clientNotified?: boolean
        }>,
      }
    })

    if (process.env.NOTION_MILESTONE_LOG_DB_ID) {
      try {
        const milestonesRes = await notion.databases.query({
          database_id: process.env.NOTION_MILESTONE_LOG_DB_ID,
          filter: {
            property: 'Tradie Config ID',
            rich_text: { equals: cleanTradieConfigId },
          },
          sorts: [{ property: 'Date', direction: 'descending' }],
          page_size: 100,
        })

        const milestones = (milestonesRes.results as any[]).map((m) => {
          const mp = m.properties
          const event = mp['Title']?.title?.[0]?.plain_text ?? ''
          const note = mp['Description']?.rich_text?.[0]?.plain_text ?? ''
          const date = (m as any).created_time ?? ''
          const jobId = mp['Job ID']?.rich_text?.[0]?.plain_text ?? ''
          const type = mp['Milestone Type']?.select?.name ?? 'UPDATE'
          const loggedBy = mp['Logged By']?.select?.name ?? ''
          const clientNotified = mp['Client Notified']?.checkbox ?? false

          return { jobId, event, note, date, type, loggedBy, clientNotified }
        })

        milestones.forEach((m) => {
          const job = jobs.find(
            (j) =>
              j.id === m.jobId ||
              j.id.replace(/-/g, '') === m.jobId.replace(/-/g, '')
          )
          if (job) job.milestones.push(m)
        })
      } catch (milestoneError: any) {
        console.warn('Milestone fetch failed (non-fatal):', milestoneError)
      }
    }

    let mediaByJob: Record<string, any[]> = {}
    try {
      const mediaRes = await notion.databases.query({
        database_id: process.env.NOTION_MEDIA_DB_ID!,
        filter: {
          property: 'Tradie Config ID',
          rich_text: { equals: cleanTradieConfigId },
        },
        sorts: [{ timestamp: 'created_time', direction: 'descending' }],
        page_size: 100,
      })

      ;(mediaRes.results as any[]).forEach((m) => {
        const mp = m.properties
        const jobId = mp['Job ID']?.rich_text?.[0]?.plain_text ?? ''
        const url =
          mp['File URL']?.url ?? mp['URL']?.url ?? mp['Blob URL']?.url ?? ''
        const description = mp['Description']?.rich_text?.[0]?.plain_text ?? ''
        const type = mp['Media Type']?.select?.name ?? 'photo'

        if (jobId && url) {
          if (!mediaByJob[jobId]) mediaByJob[jobId] = []
          mediaByJob[jobId].push({ url, description, type, createdAt: m.created_time })
        }
      })
    } catch (mediaError: any) {
      console.warn('Media fetch failed (non-fatal):', mediaError)
    }

    const jobsWithMedia = jobs.map((job) => ({
      ...job,
      photos:
        mediaByJob[job.id] ?? mediaByJob[job.id.replace(/-/g, '')] ?? [],
    }))

    return NextResponse.json({ jobs: jobsWithMedia })
  } catch (error: any) {
    console.error('Jobs fetch error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.', jobs: [] },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)

  const { success } = rateLimit(ip, 10, 60000)
  if (!success) {
    logRateLimitExceeded('/api/jobs', ip)
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const body = await req.json()

  const validationError = validateRequired(body, [
    'clientName',
    'tradieConfigId',
  ])
  if (validationError) {
    logValidationError('/api/jobs', ip, 'required', validationError)
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  if (
    body.clientPhone &&
    !validatePhoneNumber(body.clientPhone)
  ) {
    logValidationError('/api/jobs', ip, 'clientPhone', 'Invalid phone number')
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  if (body.jobValue && !validateNumber(body.jobValue, 0, 1000000)) {
    logValidationError('/api/jobs', ip, 'jobValue', 'Invalid job value')
    return NextResponse.json({ error: 'Invalid job value' }, { status: 400 })
  }

  try {
    const cleanClientName = sanitizeString(body.clientName, 200)
    const cleanAddress = sanitizeString(body.address, 500)
    const cleanSuburb = sanitizeString(body.suburb, 200)
    const cleanService = sanitizeString(body.service, 300)
    const cleanScope = sanitizeString(body.scope, 1000)
    const cleanJobType = sanitizeString(body.jobType || 'Residential Direct', 100)
    const cleanTradieConfigId = sanitizeString(body.tradieConfigId, 100)

    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_JOBS_DB_ID! },
      properties: {
        'Client Name': {
          title: [{ text: { content: cleanClientName } }],
        },
        'Client Phone': { phone_number: body.clientPhone ?? '' },
        'Address': {
          rich_text: [{ text: { content: cleanAddress } }],
        },
        'Suburb': {
          rich_text: [{ text: { content: cleanSuburb } }],
        },
        'Service': {
          rich_text: [{ text: { content: cleanService } }],
        },
        'Scope': {
          rich_text: [{ text: { content: cleanScope } }],
        },
        'Status': { select: { name: 'SCHEDULED' } },
        'Job Type': {
          select: { name: cleanJobType },
        },
        'Tradie Config ID': {
          rich_text: [{ text: { content: cleanTradieConfigId } }],
        },
        ...(body.estimatedCompletion
          ? {
              'Estimated Completion': {
                date: { start: body.estimatedCompletion },
              },
            }
          : {}),
        ...(body.jobValue
          ? {
              'Job Value': { number: body.jobValue },
            }
          : {}),
      },
    })
    return NextResponse.json({ success: true, id: page.id })
  } catch (error: any) {
    console.error('Jobs POST error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tradieSlug = searchParams.get('tradieSlug')

    if (!tradieSlug) {
      return NextResponse.json(
        { error: 'Missing tradieSlug query parameter' },
        { status: 400 }
      )
    }

    // 1. Fetch jobs
    const jobsRes = await notion.databases.query({
      database_id: process.env.NOTION_JOBS_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: tradieSlug }
      },
    })

    const jobs = (jobsRes.results as any[]).map(page => {
      const p = page.properties
      return {
        id: page.id,
        clientName: p['Client Name']?.title?.[0]?.plain_text ?? '',
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
        invoiceStatus: p['Invoice Status']?.select?.name ?? 'NOT SENT',
        invoiceAmount: p['Invoice Amount']?.number ?? null,
        invoiceDate: p['Invoice Date']?.date?.start ?? null,
        tradieConfigId: p['Tradie Config ID']?.rich_text?.[0]?.plain_text ?? '',
        milestones: [] as any[],
        photos: [] as any[],
      }
    })

    // 2. Fetch milestones
    if (process.env.NOTION_MILESTONE_LOG_DB_ID) {
      try {
        const mRes = await notion.databases.query({
          database_id: process.env.NOTION_MILESTONE_LOG_DB_ID,
          sorts: [{ timestamp: 'created_time', direction: 'descending' }],
          page_size: 100,
        })
        const byJob: Record<string, any[]> = {}
        ;(mRes.results as any[]).forEach((m: any) => {
          const jid = (m.properties?.['Job ID']?.rich_text?.[0]?.plain_text ?? '').replace(/-/g, '')
          if (!jid) return
          if (!byJob[jid]) byJob[jid] = []
          byJob[jid].push({
            event: m.properties?.['Title']?.title?.[0]?.plain_text ?? '',
            note: m.properties?.['Description']?.rich_text?.[0]?.plain_text ?? '',
            date: (m as any).created_time ?? '',
            type: m.properties?.['Milestone Type']?.select?.name ?? 'UPDATE',
            loggedBy: m.properties?.['Logged By']?.select?.name ?? '',
            clientNotified: m.properties?.['Client Notified']?.checkbox ?? false,
          })
        })
        jobs.forEach(j => {
          j.milestones = byJob[j.id.replace(/-/g, '')] ?? []
        })
      } catch (e: any) {
        console.warn('Milestone fetch skipped:', e?.message)
      }
    }

    // 3. Fetch media/photos
    if (process.env.NOTION_MEDIA_DB_ID) {
      try {
        const mediaRes = await notion.databases.query({
          database_id: process.env.NOTION_MEDIA_DB_ID,
          page_size: 100,
        })
        const byJob: Record<string, any[]> = {}
        ;(mediaRes.results as any[]).forEach((m: any) => {
          const jid = (m.properties?.['Job ID']?.rich_text?.[0]?.plain_text ?? '').replace(/-/g, '')
          const url = m.properties?.['File URL']?.url ?? m.properties?.['URL']?.url ?? ''
          if (!jid || !url) return
          if (!byJob[jid]) byJob[jid] = []
          byJob[jid].push({
            url,
            description: m.properties?.['Description']?.rich_text?.[0]?.plain_text ?? '',
            createdAt: (m as any).created_time ?? '',
          })
        })
        jobs.forEach(j => {
          j.photos = byJob[j.id.replace(/-/g, '')] ?? []
        })
      } catch {}
    }

    return NextResponse.json({ jobs })
  } catch (error: any) {
    console.error('Jobs error:', error?.message)
    return NextResponse.json({ error: error?.message, jobs: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const body = await req.json()
  const { tradieSlug } = body

  if (!tradieSlug) {
    return NextResponse.json(
      { error: 'Missing tradieSlug in request body' },
      { status: 400 }
    )
  }

  try {
    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_JOBS_DB_ID! },
      properties: {
        'Client Name': { title: [{ text: { content: body.clientName ?? '' } }] },
        'Client Phone': { phone_number: body.clientPhone ?? '' },
        'Address': { rich_text: [{ text: { content: body.address ?? '' } }] },
        'Suburb': { rich_text: [{ text: { content: body.suburb ?? '' } }] },
        'Service': { rich_text: [{ text: { content: body.service ?? '' } }] },
        'Scope': { rich_text: [{ text: { content: body.scope ?? '' } }] },
        'Status': { select: { name: 'SCHEDULED' } },
        'Tradie Config ID': { rich_text: [{ text: { content: tradieSlug } }] },
        ...(body.jobValue ? { 'Job Value': { number: Number(body.jobValue) } } : {}),
        ...(body.estimatedCompletion ? { 'Estimated Completion': { date: { start: body.estimatedCompletion } } } : {}),
      }
    })
    return NextResponse.json({ success: true, id: page.id })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

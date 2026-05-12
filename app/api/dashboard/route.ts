import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { NOTION_DB } from '@/lib/constants'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tradieSlug = searchParams.get('tradieSlug')
    console.log('[DASHBOARD DEBUG] received tradieSlug:', tradieSlug)

    if (!tradieSlug) {
      return NextResponse.json({ error: 'Missing tradieSlug' }, { status: 400 })
    }

    // Fetch all jobs (no Tradie Config ID filter - filter in JS)
    const jobsRes = await notion.databases.query({
      database_id: NOTION_DB.JOBS,
      page_size: 100,
    })

    const allJobs = (jobsRes.results as any[]).map(page => {
      const p = page.properties
      return {
        id: page.id,
        clientName: p['Client Name']?.title?.[0]?.plain_text ?? '',
        status: p['Status']?.select?.name ?? '',
        suburb: p['Suburb']?.rich_text?.[0]?.plain_text ?? '',
        service: p['Service']?.rich_text?.[0]?.plain_text ?? '',
        jobValue: p['Job Value']?.number ?? null,
        estimatedCompletion: p['Estimated Completion']?.date?.start ?? null,
        invoiceStatus: p['Invoice Status']?.select?.name ?? 'NOT SENT',
        invoiceAmount: p['Invoice Amount']?.number ?? null,
        invoiceDate: p['Invoice Date']?.date?.start ?? null,
      }
    })

    // Filter by Tradie Config ID in JavaScript
    const jobs = allJobs.filter(page =>
      (jobsRes.results as any[]).find(p => p.id === page.id)?.properties?.['Tradie Config ID']?.rich_text?.[0]?.plain_text === tradieSlug
    )

    // Calculate stats
    const activeJobs = jobs.filter(j =>
      ['SCHEDULED', 'IN PROGRESS', 'RUNNING LATE', 'DAY DONE'].includes(j.status)
    ).length
    const inProgressJobs = jobs.filter(j =>
      ['IN PROGRESS', 'DAY DONE'].includes(j.status)
    ).length
    const scheduledJobs = jobs.filter(j => j.status === 'SCHEDULED').length
    const behindScheduleJobs = jobs.filter(j => j.status === 'RUNNING LATE').length
    const completeJobs = jobs.filter(j => j.status === 'COMPLETE').length

    // Monthly revenue - sum Job Value for invoiced/paid jobs (by Invoice Status field)
    const now = new Date()

    const monthRevenue = jobs
      .filter(j => ['INVOICED', 'PAID'].includes(j.invoiceStatus))
      .reduce((sum, j) => sum + (j.jobValue ?? 0), 0)

    const monthInvoiced = jobs
      .filter(j => j.invoiceStatus === 'INVOICED')
      .reduce((sum, j) => sum + (j.jobValue ?? 0), 0)

    const monthPaid = jobs
      .filter(j => j.invoiceStatus === 'PAID')
      .reduce((sum, j) => sum + (j.jobValue ?? 0), 0)

    // Fetch leads (no Tradie Config ID filter - filter in JS)
    const leadsRes = await notion.databases.query({
      database_id: NOTION_DB.LEADS,
      page_size: 100,
    })

    // Filter by Tradie Config ID in JavaScript
    const filteredLeadsRes = (leadsRes.results as any[]).filter(page =>
      page.properties?.['Tradie Config ID']?.rich_text?.[0]?.plain_text === tradieSlug
    )

    const leads = filteredLeadsRes.map(page => ({
      createdTime: (page as any).created_time,
      status: page.properties['Status']?.select?.name ?? '',
      quoteStatus: page.properties['Quote Status']?.select?.name ?? '',
      quoteAmount: page.properties['Quote Amount']?.number ?? 0,
    }))

    const thisMonth = new Date(now.getFullYear(), now.getMonth())
    const newLeads = leads.filter(l => {
      const created = new Date(l.createdTime)
      return created >= thisMonth
    }).length

    const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length

    // Pipeline stats: leads with quote amounts
    const quotedLeads = leads.filter(l => (l.quoteAmount ?? 0) > 0)
    console.log('[PIPELINE] leads with quotes:', quotedLeads.map(l => ({
      quoteStatus: l.quoteStatus,
      quoteAmount: l.quoteAmount
    })))
    const pipelineValue = quotedLeads.reduce((sum, l) => sum + (l.quoteAmount ?? 0), 0)
    const quotedCount = quotedLeads.length
    console.log('[PIPELINE] calculated:', { pipelineValue, quotedCount })

    // Fetch communications (no Tradie Config ID filter - filter in JS)
    const commsRes = await notion.databases.query({
      database_id: NOTION_DB.COMMS,
      page_size: 100,
    })

    // Filter by Tradie Config ID in JavaScript
    const filteredCommsRes = (commsRes.results as any[]).filter(page =>
      page.properties?.['Tradie Config ID']?.rich_text?.[0]?.plain_text === tradieSlug
    )

    const comms = filteredCommsRes.map(page => ({
      timestamp: page.properties['Timestamp']?.date?.start ?? '',
      sender: page.properties['Sender']?.select?.name ?? '',
    }))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const smsSentToday = comms.filter(c => {
      const ts = new Date(c.timestamp)
      ts.setHours(0, 0, 0, 0)
      return ts.getTime() === today.getTime() && c.sender === 'ALFRED'
    }).length

    const smsThisWeek = comms.filter(c => {
      const ts = new Date(c.timestamp)
      return ts >= weekAgo && c.sender === 'ALFRED'
    }).length

    // Fetch reviews (satisfaction DB not yet configured)
    let reviewCount = 0
    let reviewRating: number | null = null

    // Active jobs value: sum of IN PROGRESS + SCHEDULED jobs
    const activeJobsValue = jobs
      .filter(j => ['IN PROGRESS', 'SCHEDULED'].includes(j.status))
      .reduce((sum, j) => sum + (j.jobValue ?? 0), 0)

    // Attention jobs
    const attentionJobs = jobs.filter(j => {
      if (j.status === 'RUNNING LATE') return true
      if (j.estimatedCompletion) {
        const estDate = new Date(j.estimatedCompletion)
        return estDate < new Date() && !['COMPLETE', 'INVOICED', 'PAID'].includes(j.status)
      }
      return false
    }).slice(0, 5)

    // Debug: Check actual Tradie Config ID values
    const testRes = await notion.databases.query({
      database_id: NOTION_DB.JOBS,
      filter: {
        or: [
          { property: 'Status', select: { equals: 'IN PROGRESS' } },
          { property: 'Status', select: { equals: 'SCHEDULED' } }
        ]
      },
      page_size: 3,
    })
    console.log('TEST todayJobs without slug filter:', testRes.results.length)
    if (testRes.results.length > 0) {
      console.log('First job Tradie Config ID:', (testRes.results[0] as any)?.properties?.['Tradie Config ID']?.rich_text?.[0]?.plain_text)
      console.log('Looking for tradieSlug:', tradieSlug)
    }

    // Today's jobs - fetch by status, filter by Tradie Config ID in JS
    const todayJobsAllRes = await notion.databases.query({
      database_id: NOTION_DB.JOBS,
      filter: {
        or: [
          { property: 'Status', select: { equals: 'IN PROGRESS' } },
          { property: 'Status', select: { equals: 'SCHEDULED' } }
        ]
      },
      page_size: 100,
    })

    // Filter by Tradie Config ID in JavaScript
    const todayJobsRes = (todayJobsAllRes.results as any[]).filter(page =>
      page.properties?.['Tradie Config ID']?.rich_text?.[0]?.plain_text === tradieSlug
    )

    const todayJobs = todayJobsRes.map(page => {
      const p = page.properties
      return {
        id: page.id,
        clientName: p['Client Name']?.title?.[0]?.plain_text ?? '',
        suburb: p['Suburb']?.rich_text?.[0]?.plain_text ?? '',
        service: p['Service']?.rich_text?.[0]?.plain_text ?? '',
        status: p['Status']?.select?.name ?? '',
      }
    }).slice(0, 5)

    return NextResponse.json({
      activeJobs,
      inProgressJobs,
      scheduledJobs,
      behindScheduleJobs,
      completeJobs,
      monthRevenue,
      monthInvoiced,
      monthPaid,
      newLeads,
      qualifiedLeads,
      smsSentToday,
      smsThisWeek,
      reviewCount,
      reviewRating,
      pipelineValue,
      quotedCount,
      activeJobsValue,
      attentionJobs: attentionJobs.map(j => ({
        id: j.id,
        clientName: j.clientName,
        suburb: j.suburb,
        status: j.status
      })),
      todayJobs: todayJobs.map(j => ({
        id: j.id,
        clientName: j.clientName,
        suburb: j.suburb,
        service: j.service,
        status: j.status
      }))
    })
  } catch (error: any) {
    console.error('[DASHBOARD]', error?.message)
    return NextResponse.json({
      activeJobs: 0,
      inProgressJobs: 0,
      scheduledJobs: 0,
      behindScheduleJobs: 0,
      completeJobs: 0,
      monthRevenue: 0,
      monthInvoiced: 0,
      monthPaid: 0,
      newLeads: 0,
      qualifiedLeads: 0,
      smsSentToday: 0,
      smsThisWeek: 0,
      reviewCount: 0,
      reviewRating: null,
      pipelineValue: 0,
      quotedCount: 0,
      activeJobsValue: 0,
      attentionJobs: [],
      todayJobs: []
    })
  }
}

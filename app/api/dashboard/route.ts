import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { NOTION_DB } from '@/lib/constants'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tradieSlug = searchParams.get('tradieSlug')

    if (!tradieSlug) {
      return NextResponse.json({ error: 'Missing tradieSlug' }, { status: 400 })
    }

    // Fetch all jobs
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
        jobValue: p['Job Value']?.number ?? null,
        estimatedCompletion: p['Estimated Completion']?.date?.start ?? null,
        invoiceStatus: p['Invoice Status']?.select?.name ?? 'NOT SENT',
        invoiceAmount: p['Invoice Amount']?.number ?? null,
        invoiceDate: p['Invoice Date']?.date?.start ?? null,
      }
    })

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

    // Monthly revenue
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthJobs = jobs.filter(j => {
      const invDate = j.invoiceDate ? new Date(j.invoiceDate) : null
      return invDate && invDate >= monthStart
    })

    const monthInvoiced = monthJobs
      .filter(j => ['INVOICED', 'PAID'].includes(j.invoiceStatus))
      .reduce((sum, j) => sum + (j.invoiceAmount ?? 0), 0)

    const monthPaid = monthJobs
      .filter(j => j.invoiceStatus === 'PAID')
      .reduce((sum, j) => sum + (j.invoiceAmount ?? 0), 0)

    // Fetch leads
    const leadsRes = await notion.databases.query({
      database_id: NOTION_DB.LEADS,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: tradieSlug }
      },
    })

    const leads = (leadsRes.results as any[]).map(page => ({
      createdTime: (page as any).created_time,
      status: page.properties['Status']?.select?.name ?? '',
    }))

    const thisMonth = new Date(now.getFullYear(), now.getMonth())
    const newLeads = leads.filter(l => {
      const created = new Date(l.createdTime)
      return created >= thisMonth
    }).length

    const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length

    // Fetch communications
    const commsRes = await notion.databases.query({
      database_id: NOTION_DB.COMMS,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: tradieSlug }
      },
    })

    const comms = (commsRes.results as any[]).map(page => ({
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

    // Attention jobs
    const attentionJobs = jobs.filter(j => {
      if (j.status === 'RUNNING LATE') return true
      if (j.estimatedCompletion) {
        const estDate = new Date(j.estimatedCompletion)
        return estDate < new Date() && !['COMPLETE', 'INVOICED', 'PAID'].includes(j.status)
      }
      return false
    }).slice(0, 5)

    // Today's jobs
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todayJobs = jobs.filter(j => {
      if (j.estimatedCompletion) {
        const estDate = new Date(j.estimatedCompletion)
        if (estDate >= todayStart && estDate <= todayEnd) {
          return ['IN PROGRESS', 'RUNNING LATE', 'DAY DONE', 'SCHEDULED'].includes(j.status)
        }
      }
      return ['IN PROGRESS', 'RUNNING LATE', 'DAY DONE'].includes(j.status)
    }).slice(0, 5)

    return NextResponse.json({
      activeJobs,
      inProgressJobs,
      scheduledJobs,
      behindScheduleJobs,
      completeJobs,
      monthRevenue: monthPaid,
      monthInvoiced,
      monthPaid,
      newLeads,
      qualifiedLeads,
      smsSentToday,
      smsThisWeek,
      reviewCount,
      reviewRating,
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
      attentionJobs: [],
      todayJobs: []
    })
  }
}

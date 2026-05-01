import { Client, isFullPage } from '@notionhq/client'
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { NOTION_DB, JobStatus } from './constants'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

type RichTextProperty = { rich_text: Array<{ plain_text: string }> }
type TitleProperty = { title: Array<{ plain_text: string }> }
type SelectProperty = { select: { name: string } | null }
type PhoneProperty = { phone_number: string | null }
type DateProperty = { date: { start: string } | null }
type NumberProperty = { number: number | null }
type CheckboxProperty = { checkbox: boolean }

function prop<T>(page: PageObjectResponse, key: string): T {
  return page.properties[key] as T
}

function richText(page: PageObjectResponse, key: string): string {
  return prop<RichTextProperty>(page, key).rich_text[0]?.plain_text ?? ''
}

function title(page: PageObjectResponse, key: string): string {
  return prop<TitleProperty>(page, key).title[0]?.plain_text ?? ''
}

function select(page: PageObjectResponse, key: string): string {
  return prop<SelectProperty>(page, key).select?.name ?? ''
}

function phone(page: PageObjectResponse, key: string): string {
  return prop<PhoneProperty>(page, key).phone_number ?? ''
}

function date(page: PageObjectResponse, key: string): string | null {
  return prop<DateProperty>(page, key).date?.start ?? null
}

function checkbox(page: PageObjectResponse, key: string): boolean {
  return prop<CheckboxProperty>(page, key).checkbox ?? false
}

function number(page: PageObjectResponse, key: string): number | null {
  return prop<NumberProperty>(page, key).number ?? null
}

export interface Job {
  id: string
  clientName: string
  status: JobStatus
  tradieConfigId: string
  service: string
  suburb: string
  jobType: string
  currentPhase: string
  foreman: string
  foremanPhone: string
  lastMessageSent: string | null
  statusSortOrder: number | null
  lastUpdated: string | null
  notes: string
  materialsStatus: string
  nextAutoAction: string | null
  clientPhone: string
  scope: string
  address: string
  siteAccessNotes: string
  estimatedCompletion: string | null
}

export interface Lead {
  id: string
  name: string
  phone: string
  service: string
  suburb: string
  status: string
  lunaStatus: string
  lunaNotes: string
  tradieConfigId: string
  receivedDate: string | null
  source: string
  lastContact: string | null
  nextFollowUp: string | null
  disqualifyReason: string
  notes: string
  leadScore: number | null
}

export interface TradieConfig {
  id: string
  name: string
  phone: string
  businessName: string
  suburb: string
}

function toJob(page: PageObjectResponse): Job {
  try {
    return {
      id: page.id,
      clientName: title(page, 'Client Name'),
      status: select(page, 'Status') as JobStatus,
      tradieConfigId: richText(page, 'Tradie Config ID'),
      service: richText(page, 'Service'),
      suburb: richText(page, 'Suburb'),
      jobType: select(page, 'Job Type'),
      currentPhase: select(page, 'Current Phase'),
      foreman: richText(page, 'Foreman Name'),
      foremanPhone: phone(page, 'Foreman Phone'),
      lastMessageSent: date(page, 'Last Message Sent'),
      statusSortOrder: number(page, 'Status Sort Order'),
      lastUpdated: date(page, 'Last Updated'),
      notes: richText(page, 'Notes'),
      materialsStatus: select(page, 'Materials Status'),
      nextAutoAction: richText(page, 'Next Auto Action'),
      clientPhone: phone(page, 'Client Phone'),
      scope: richText(page, 'Scope'),
      address: richText(page, 'Address'),
      siteAccessNotes: richText(page, 'Site Access Notes'),
      estimatedCompletion: date(page, 'Estimated Completion'),
    }
  } catch (error) {
    console.error('[toJob] Error parsing job page:', {
      pageId: page.id,
      error: error instanceof Error ? error.message : String(error),
      availableProperties: Object.keys(page.properties),
    })
    throw error
  }
}

function toLead(page: PageObjectResponse): Lead {
  return {
    id: page.id,
    name: title(page, 'Name'),
    phone: phone(page, 'Phone'),
    service: richText(page, 'Service'),
    suburb: richText(page, 'Suburb'),
    status: select(page, 'Status'),
    lunaStatus: select(page, 'LUNA Status'),
    lunaNotes: richText(page, 'LUNA Notes'),
    tradieConfigId: richText(page, 'Tradie Config ID'),
    receivedDate: date(page, 'Received Date'),
    source: select(page, 'Source'),
    lastContact: date(page, 'Last Contact'),
    nextFollowUp: date(page, 'Next Follow Up'),
    disqualifyReason: richText(page, 'Disqualify Reason'),
    notes: richText(page, 'Notes'),
    leadScore: number(page, 'Lead Score'),
  }
}

function toTradieConfig(page: PageObjectResponse): TradieConfig {
  return {
    id: page.id,
    name: title(page, 'Name'),
    phone: phone(page, 'Phone'),
    businessName: richText(page, 'Business Name'),
    suburb: richText(page, 'Suburb'),
  }
}

export async function getActiveJobs(): Promise<Job[]> {
  const res = await notion.databases.query({
    database_id: NOTION_DB.JOBS,
    filter: {
      and: [
        { property: 'Status', select: { does_not_equal: 'COMPLETE' } },
        { property: 'Status', select: { does_not_equal: 'PAID' } },
      ],
    },
    sorts: [
      { property: 'Status Sort Order', direction: 'ascending' },
      { property: 'Last Updated', direction: 'descending' },
    ],
  })

  return (res.results as PageObjectResponse[]).map(toJob)
}

export async function getJobs(tradieConfigId: string): Promise<Job[]> {
  const res = await notion.databases.query({
    database_id: NOTION_DB.JOBS,
    filter: {
      property: 'Tradie Config ID',
      rich_text: { equals: tradieConfigId || 'joey-tradie' },
    },
    sorts: [
      { timestamp: 'last_edited_time', direction: 'descending' },
    ],
    page_size: 30,
  })

  return (res.results as PageObjectResponse[]).map(toJob)
}

export async function getJob(jobId: string): Promise<Job | null> {
  try {
    console.log('[getJob] Fetching page:', { jobId })
    const res = await notion.pages.retrieve({ page_id: jobId })

    if (!isFullPage(res)) {
      console.error('[getJob] Page is not a full page:', { jobId, objectType: res.object })
      return null
    }

    const job = toJob(res as PageObjectResponse)
    console.log('[getJob] Successfully parsed job:', { jobId, clientName: job.clientName })
    return job
  } catch (error) {
    console.error('[getJob] Notion API error:', {
      jobId,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    })
    return null
  }
}

export async function getRecentLeads(limit: number): Promise<Lead[]> {
  const res = await notion.databases.query({
    database_id: NOTION_DB.LEADS,
    sorts: [{ property: 'Received Date', direction: 'descending' }],
    page_size: limit,
  })

  return (res.results as PageObjectResponse[]).map(toLead)
}

export async function getTradieConfig(id: string): Promise<TradieConfig | null> {
  const res = await notion.databases.query({
    database_id: NOTION_DB.CONFIG,
    filter: { property: 'Tradie Config ID', rich_text: { equals: id } },
    page_size: 1,
  })

  const page = res.results[0] as PageObjectResponse | undefined
  return page ? toTradieConfig(page) : null
}

export async function updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
  await notion.pages.update({
    page_id: jobId,
    properties: {
      Status: { select: { name: status } },
    },
  })
}

export async function updateJob(jobId: string, updates: Partial<{
  status: JobStatus
  currentPhase: string
  notes: string
  materialsStatus: string
}>): Promise<void> {
  const properties: Record<string, any> = {}

  if (updates.status) {
    properties['Status'] = { select: { name: updates.status } }
  }
  if (updates.currentPhase !== undefined) {
    properties['Current Phase'] = { select: { name: updates.currentPhase } }
  }
  if (updates.notes !== undefined) {
    properties['Notes'] = { rich_text: [{ text: { content: updates.notes } }] }
  }
  if (updates.materialsStatus !== undefined) {
    properties['Materials Status'] = { select: { name: updates.materialsStatus } }
  }

  await notion.pages.update({
    page_id: jobId,
    properties,
  })
}

export async function updateLeadLUNA({
  leadId,
  lunaStatus,
  lunaNotes,
}: {
  leadId: string
  lunaStatus: string
  lunaNotes: string
}): Promise<void> {
  await notion.pages.update({
    page_id: leadId,
    properties: {
      'LUNA Status': { select: { name: lunaStatus } },
      'LUNA Notes': { rich_text: [{ text: { content: lunaNotes } }] },
    },
  })
}

export async function createLead({
  name,
  phone: phoneNumber,
  service,
  suburb,
  tradieConfigId,
}: {
  name: string
  phone: string
  service: string
  suburb: string
  tradieConfigId: string
}): Promise<Lead> {
  const page = await notion.pages.create({
    parent: { database_id: NOTION_DB.LEADS },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Phone: { phone_number: phoneNumber },
      Service: { rich_text: [{ text: { content: service } }] },
      Suburb: { rich_text: [{ text: { content: suburb } }] },
      Status: { select: { name: 'NEW' } },
      'LUNA Status': { select: { name: 'Waiting' } },
      'Tradie Config ID': { rich_text: [{ text: { content: tradieConfigId } }] },
      'Received Date': { date: { start: new Date().toISOString().split('T')[0] } },
    },
  })

  return toLead(page as PageObjectResponse)
}

export async function queryNotionDatabase(
  databaseId: string,
  queryOptions?: any
): Promise<PageObjectResponse[]> {
  const response = await notion.databases.query({
    database_id: databaseId,
    ...queryOptions,
  })
  return response.results.filter(isFullPage) as PageObjectResponse[]
}

export async function getTradieByEmail(email: string): Promise<{ id: string; name: string } | null> {
  try {
    console.log('[getTradieByEmail] Querying Notion for email:', { email, dbId: NOTION_DB.CONFIG })

    const res = await notion.databases.query({
      database_id: NOTION_DB.CONFIG,
      filter: { property: 'Email', email: { equals: email } },
      page_size: 1,
    })

    console.log('[getTradieByEmail] Query response:', {
      resultCount: res.results.length,
      results: res.results.map(r => ({
        id: r.id,
        properties: Object.keys((r as any).properties || {}),
      })),
    })

    const page = res.results[0] as PageObjectResponse | undefined
    if (!page) {
      console.warn('[getTradieByEmail] No page found for email, trying fallback name match')
      // Fallback: query all pages and match by title/name
      const allPages = await notion.databases.query({
        database_id: NOTION_DB.CONFIG,
        page_size: 100,
      })

      for (const p of allPages.results as PageObjectResponse[]) {
        const pageName = title(p, 'Name')
        const pageEmail = try_email_field(p, 'Email')
        console.log('[getTradieByEmail] Checking page:', { pageId: p.id, name: pageName, email: pageEmail })

        if (pageEmail === email) {
          console.log('[getTradieByEmail] Found match via fallback:', { pageId: p.id, name: pageName })
          return { id: p.id, name: pageName }
        }
      }
      return null
    }

    const tradieId = page.id
    const tradieName = title(page, 'Name')
    console.log('[getTradieByEmail] Success:', { tradieId, tradieName, email })

    return {
      id: tradieId,
      name: tradieName,
    }
  } catch (error) {
    console.error('[getTradieByEmail] Error querying Notion:', {
      email,
      dbId: NOTION_DB.CONFIG,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return null
  }
}

function try_email_field(page: PageObjectResponse, key: string): string {
  try {
    const prop = page.properties[key] as any
    if (prop?.email) return prop.email
    if (prop?.rich_text?.[0]?.plain_text) return prop.rich_text[0].plain_text
    return ''
  } catch {
    return ''
  }
}

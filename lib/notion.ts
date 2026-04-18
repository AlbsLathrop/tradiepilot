import { Client } from '@notionhq/client'
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { NOTION_DB, JobStatus } from './constants'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

type RichTextProperty = { rich_text: Array<{ plain_text: string }> }
type TitleProperty = { title: Array<{ plain_text: string }> }
type SelectProperty = { select: { name: string } | null }
type PhoneProperty = { phone_number: string | null }
type DateProperty = { date: { start: string } | null }

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

export interface Job {
  id: string
  name: string
  status: JobStatus
  tradieConfigId: string
  scheduledDate: string | null
  suburb: string
  customerName: string
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
}

export interface TradieConfig {
  id: string
  name: string
  phone: string
  businessName: string
  suburb: string
}

function toJob(page: PageObjectResponse): Job {
  return {
    id: page.id,
    name: title(page, 'Name'),
    status: select(page, 'Status') as JobStatus,
    tradieConfigId: richText(page, 'Tradie Config ID'),
    scheduledDate: date(page, 'Scheduled Date'),
    suburb: richText(page, 'Suburb'),
    customerName: richText(page, 'Customer Name'),
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

const ACTIVE_STATUSES: JobStatus[] = ['SCHEDULED', 'QUOTED', 'IN PROGRESS', 'RUNNING LATE', 'DAY DONE']

export async function getActiveJobs(tradieConfigId?: string): Promise<Job[]> {
  const filter = tradieConfigId
    ? {
        and: [
          { or: ACTIVE_STATUSES.map((s) => ({ property: 'Status', select: { equals: s } })) },
          { property: 'Tradie Config ID', rich_text: { equals: tradieConfigId } },
        ],
      }
    : { or: ACTIVE_STATUSES.map((s) => ({ property: 'Status', select: { equals: s } })) }

  const res = await notion.databases.query({
    database_id: NOTION_DB.JOBS,
    filter,
    sorts: [{ property: 'Status Sort Order', direction: 'ascending' }],
  })

  return (res.results as PageObjectResponse[]).map(toJob)
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

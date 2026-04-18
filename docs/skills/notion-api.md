# Notion API Patterns — TradiePilot
DB IDs are in /lib/constants.ts — always import from there.

## FIELD ACCESS
Rich text/title: page.properties['Field'].title[0]?.plain_text ?? ''
Select: page.properties['Status'].select?.name ?? ''
Phone: page.properties['Phone'].phone_number ?? ''
Checkbox: page.properties['Review Requested'].checkbox
Date: page.properties['Quote Date'].date?.start ?? null

## QUERY
const res = await notion.databases.query({
  database_id: NOTION_DB.JOBS,
  filter: { property: 'Status', select: { equals: 'SCHEDULED' } },
  sorts: [{ property: 'created_time', direction: 'descending' }]
})

## UPDATE
await notion.pages.update({
  page_id: pageId,
  properties: {
    'Status': { select: { name: 'COMPLETE' } },
    'LUNA Status': { select: { name: 'Qualified' } },
    'LUNA Notes': { rich_text: [{ text: { content: notes } }] }
  }
})

## CREATE LEAD
await notion.pages.create({
  parent: { database_id: NOTION_DB.LEADS },
  properties: {
    Name: { title: [{ text: { content: name } }] },
    Phone: { phone_number: phone },
    Status: { select: { name: 'NEW' } },
    'LUNA Status': { select: { name: 'Waiting' } },
    'Tradie Config ID': { rich_text: [{ text: { content: tradieConfigId } }] },
    'Received Date': { date: { start: new Date().toISOString().split('T')[0] } }
  }
})

## RULES
- Tradie Config ID always WITHOUT dashes
- NEVER use Data Source IDs — those are Make.com only
- Rate limit: 3 req/sec

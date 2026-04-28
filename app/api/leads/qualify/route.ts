import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function POST(req: Request) {
  try {
    const { leadId } = await req.json()

    if (!leadId) {
      return Response.json({ error: 'leadId required' }, { status: 400 })
    }

    await notion.pages.update({
      page_id: leadId,
      properties: {
        Status: { select: { name: 'QUALIFIED' } },
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('[POST /api/leads/qualify]', error)
    return Response.json({ error: 'Failed to qualify lead' }, { status: 500 })
  }
}

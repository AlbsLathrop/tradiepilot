import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function POST(req: Request) {
  try {
    const { leadId, reason } = await req.json()

    if (!leadId) {
      return Response.json({ error: 'leadId required' }, { status: 400 })
    }

    await notion.pages.update({
      page_id: leadId,
      properties: {
        Status: { select: { name: 'DECLINED' } },
        'Disqualify Reason': {
          rich_text: [{ text: { content: reason || '' } }],
        },
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('[POST /api/leads/decline]', error)
    return Response.json({ error: 'Failed to decline lead' }, { status: 500 })
  }
}

import { getServerSession } from 'next-auth/next'
import { Client } from '@notionhq/client'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const tradieSlug = session?.user?.tradieSlug

    console.log('Settings API - tradieSlug:', tradieSlug)

    if (!tradieSlug) {
      return Response.json({ error: 'No tradieSlug in session' }, { status: 401 })
    }

    const pageIdMap: Record<string, string> = {
      'joey-tradie': '33d187ef12be81f39409c4ea79e3550f',
      'ben-stonemason': '33c187ef12be8188a893f373a404cbbb'
    }

    const pageId = pageIdMap[tradieSlug]

    if (!pageId) {
      return Response.json({ error: 'Unknown tradie slug' }, { status: 404 })
    }

    const page = await notion.pages.retrieve({ page_id: pageId }) as any
    const props = page.properties

    console.log('Props keys:', Object.keys(props))

    return Response.json({
      businessName: props['Business Name']?.title?.[0]?.plain_text || '',
      trade: props['Trade']?.select?.name || props['Trade Type']?.select?.name || '',
      serviceArea: props['Service Area']?.rich_text?.[0]?.plain_text || '',
      minJobValue: props['Min Job Value']?.number || 0,
      phone: props['Phone']?.phone_number || '',
      googleReviewUrl: props['Google Review URL']?.url || ''
    })

  } catch (error: any) {
    console.error('Settings API error:', error?.message, error?.code)
    return Response.json({ error: error?.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const tradieSlug = session?.user?.tradieSlug

    if (!tradieSlug) {
      return Response.json({ error: 'No tradieSlug in session' }, { status: 401 })
    }

    const pageIdMap: Record<string, string> = {
      'joey-tradie': '33d187ef12be81f39409c4ea79e3550f',
      'ben-stonemason': '33c187ef12be8188a893f373a404cbbb'
    }

    const pageId = pageIdMap[tradieSlug]

    if (!pageId) {
      return Response.json({ error: 'Unknown tradie slug' }, { status: 404 })
    }

    const body = await request.json()

    // Map field names to Notion properties
    const updates: Record<string, any> = {}

    if (body.businessName !== undefined) {
      updates['Business Name'] = { title: [{ text: { content: body.businessName } }] }
    }
    if (body.serviceArea !== undefined) {
      updates['Service Area'] = { rich_text: [{ text: { content: body.serviceArea } }] }
    }
    if (body.minJobValue !== undefined) {
      updates['Min Job Value'] = { number: Number(body.minJobValue) }
    }
    if (body.workingHours !== undefined) {
      updates['Working Hours'] = { rich_text: [{ text: { content: body.workingHours } }] }
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 })
    }

    await notion.pages.update({
      page_id: pageId,
      properties: updates,
    })

    return Response.json({ success: true })
  } catch (error: any) {
    console.error('Settings PATCH error:', error?.message, error?.code)
    return Response.json({ error: error?.message }, { status: 500 })
  }
}

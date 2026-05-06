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

    const response = await notion.databases.query({
      database_id: 'ff9248a4dd244ad9a0761281967750ea',
      filter: {
        property: 'Tradie Slug',
        rich_text: { equals: tradieSlug }
      }
    })

    console.log('Notion results:', response.results.length)

    if (!response.results.length) {
      return Response.json({ error: 'Tradie config not found' }, { status: 404 })
    }

    const page = response.results[0] as any
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

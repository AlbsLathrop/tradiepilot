import { getServerSession } from 'next-auth/next'
import { notion } from '@/lib/notion'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tradieConfigId) {
      return Response.json(
        { error: 'Missing tradieConfigId in session' },
        { status: 400 }
      )
    }

    console.log('[tradie-config] Fetching config for:', session.user.tradieConfigId)

    const page = await notion.pages.retrieve({ page_id: session.user.tradieConfigId })

    if (!('properties' in page)) {
      return Response.json(
        { error: 'Failed to retrieve tradie config' },
        { status: 500 }
      )
    }

    const props = page.properties as Record<string, any>

    const config = {
      businessName: props['Business Name']?.title?.[0]?.plain_text || '',
      trade: props['Trade']?.select?.name || props['Trade Type']?.select?.name || '',
      serviceArea: props['Service Area']?.rich_text?.[0]?.plain_text || '',
      minJobValue: props['Min Job Value']?.number || null,
      phone: props['Phone']?.phone_number || '',
      googleReviewUrl: props['Google Review URL']?.url || '',
    }

    console.log('[tradie-config] Config loaded:', config)

    return Response.json({ config })
  } catch (error) {
    console.error('[tradie-config] Error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

import { getServerSession } from 'next-auth/next'
import { Client, isFullPage } from '@notionhq/client'
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { NOTION_DB } from '@/lib/constants'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

function richText(page: PageObjectResponse, key: string): string {
  const prop = page.properties[key] as any
  return prop?.rich_text?.[0]?.plain_text ?? ''
}

function title(page: PageObjectResponse, key: string): string {
  const prop = page.properties[key] as any
  return prop?.title?.[0]?.plain_text ?? ''
}

function phone(page: PageObjectResponse, key: string): string {
  const prop = page.properties[key] as any
  return prop?.phone_number ?? ''
}

function number(page: PageObjectResponse, key: string): number | null {
  const prop = page.properties[key] as any
  return prop?.number ?? null
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    console.log('[tradie-config] Session user:', JSON.stringify(session?.user))
    console.log('[tradie-config] tradieSlug:', session?.user?.tradieSlug)
    console.log('[tradie-config] tradieConfigId:', session?.user?.tradieConfigId)

    if (!session?.user?.tradieSlug) {
      return Response.json(
        { error: 'Missing tradieSlug in session' },
        { status: 400 }
      )
    }

    console.log('[tradie-config] Querying Notion for slug:', session.user.tradieSlug)

    const res = await notion.databases.query({
      database_id: NOTION_DB.CONFIG,
      filter: {
        property: 'Tradie Slug',
        rich_text: { equals: session.user.tradieSlug },
      },
      page_size: 1,
    })

    console.log('[tradie-config] Query results:', {
      resultCount: res.results.length,
      hasError: false,
    })

    if (res.results.length === 0) {
      console.error('[tradie-config] No config found for slug:', session.user.tradieSlug)
      return Response.json(
        { error: 'No tradie config found' },
        { status: 500 }
      )
    }

    const page = res.results[0] as PageObjectResponse
    const config = {
      businessName: title(page, 'Business Name'),
      trade: richText(page, 'Trade') || richText(page, 'Trade Type'),
      serviceArea: richText(page, 'Service Area'),
      minJobValue: number(page, 'Min Job Value'),
      phone: phone(page, 'Phone'),
      googleReviewUrl: richText(page, 'Google Review URL'),
    }

    console.log('[tradie-config] Config loaded:', config)

    return Response.json({ config })
  } catch (error) {
    console.error('[tradie-config] Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

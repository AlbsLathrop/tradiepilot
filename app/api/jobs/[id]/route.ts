import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Client } from '@notionhq/client'
import { NOTION_DB } from '@/lib/constants'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession()
  const { id } = await params

  console.log('Job ID received:', id)
  console.log('NOTION_API_KEY exists:', !!process.env.NOTION_API_KEY)

  if (!session?.user?.tradieConfigId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch job page directly
    const page = await notion.pages.retrieve({ page_id: id }) as any
    const props = page.properties

    const tradieConfigId = props['Tradie Config ID']?.rich_text?.[0]?.plain_text ?? ''
    
    // Verify ownership
    if (tradieConfigId && tradieConfigId !== session.user.tradieConfigId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const job = {
      id: page.id,
      clientName: props['Client Name']?.title?.[0]?.plain_text ?? 'Unknown',
      status: props['Status']?.select?.name ?? '',
      address: props['Address']?.rich_text?.[0]?.plain_text ?? '',
      suburb: props['Suburb']?.rich_text?.[0]?.plain_text ?? '',
      clientPhone: props['Client Phone']?.phone_number ?? '',
      scope: props['Scope']?.rich_text?.[0]?.plain_text ?? '',
      service: props['Service']?.rich_text?.[0]?.plain_text ?? '',
      jobType: props['Job Type']?.select?.name ?? '',
      durationCategory: props['Duration Category']?.select?.name ?? '',
      currentPhase: props['Current Phase']?.select?.name ?? '',
      materialsStatus: props['Materials Status']?.select?.name ?? '',
      foremanName: props['Foreman Name']?.rich_text?.[0]?.plain_text ?? '',
      foremanPhone: props['Foreman Phone']?.phone_number ?? '',
      leadingHand: props['Leading Hand']?.rich_text?.[0]?.plain_text ?? '',
      leadingHandPhone: props['Leading Hand Phone']?.phone_number ?? '',
      notes: props['Notes']?.rich_text?.[0]?.plain_text ?? '',
      productsUsed: props['Products Used']?.rich_text?.[0]?.plain_text ?? '',
      siteAccessNotes: props['Site Access Notes']?.rich_text?.[0]?.plain_text ?? '',
      nextAutoAction: props['Next Auto Action']?.rich_text?.[0]?.plain_text ?? '',
      estimatedCompletion: props['Estimated Completion']?.date?.start ?? null,
      completionDate: props['Completion Date']?.date?.start ?? null,
      lastMessageSent: props['Last Message Sent']?.date?.start ?? null,
      tradieConfigId,
    }

    // Fetch last 3 communications
    const commsRes = await notion.databases.query({
      database_id: NOTION_DB.COMMS,
      filter: {
        property: 'Job ID',
        rich_text: { equals: id }
      },
      sorts: [{ property: 'Timestamp', direction: 'descending' }],
      page_size: 3,
    })

    const communications = (commsRes.results as any[]).map(comm => ({
      sender: comm.properties['Sender']?.select?.name ?? 'ALFRED',
      message: comm.properties['Message']?.rich_text?.[0]?.plain_text ?? '',
      timestamp: comm.properties['Timestamp']?.date?.start ?? '',
    }))

    return NextResponse.json({ job, communications })
  } catch (error: any) {
    console.error('NOTION ERROR:', JSON.stringify(error))
    return NextResponse.json({
      debug: {
        id,
        notionKeyExists: !!process.env.NOTION_API_KEY,
        error: error?.message,
        code: error?.code,
        status: error?.status
      }
    }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession()
  const { id } = await params

  if (!session?.user?.tradieConfigId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    const updates: Record<string, any> = {}

    if (body.currentPhase) {
      updates['Current Phase'] = { select: { name: body.currentPhase } }
    }
    if (body.notes !== undefined) {
      updates['Notes'] = { rich_text: [{ text: { content: body.notes } }] }
    }
    if (body.materialsStatus !== undefined) {
      updates['Materials Status'] = { select: { name: body.materialsStatus } }
    }

    await notion.pages.update({
      page_id: id,
      properties: updates,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update job:', error)
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession()
  const { id } = await params

  if (!session?.user?.tradieConfigId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Archive the page instead of hard delete
    await notion.pages.update({
      page_id: id,
      archived: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete job:', error)
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}

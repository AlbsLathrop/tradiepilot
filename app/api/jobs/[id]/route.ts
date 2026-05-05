import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Client } from '@notionhq/client'
import { NOTION_DB } from '@/lib/constants'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  console.log('NOTION_API_KEY set:', !!process.env.NOTION_API_KEY)
  console.log('Received ID:', id)

  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
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
      error: error?.message ?? 'unknown',
      code: error?.code,
      notionKeyExists: !!process.env.NOTION_API_KEY,
      receivedId: id,
      stack: error?.stack?.split('\n')[0]
    }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    const updates: Record<string, any> = {}

    if (body.jobType) {
      updates['Job Type'] = { select: { name: body.jobType } }
    }
    if (body.scope !== undefined) {
      updates['Scope'] = { rich_text: [{ text: { content: body.scope } }] }
    }
    if (body.estimatedCompletion) {
      updates['Estimated Completion'] = { date: { start: body.estimatedCompletion } }
    }
    if (body.notes !== undefined) {
      updates['Notes'] = { rich_text: [{ text: { content: body.notes } }] }
    }
    if (body.leadingHand !== undefined) {
      updates['Leading Hand'] = { rich_text: [{ text: { content: body.leadingHand } }] }
    }
    if (body.leadingHandPhone !== undefined) {
      updates['Leading Hand Phone'] = { phone_number: body.leadingHandPhone }
    }
    if (body.currentPhase) {
      updates['Current Phase'] = { select: { name: body.currentPhase } }
    }
    if (body.materialsStatus !== undefined) {
      updates['Materials Status'] = { select: { name: body.materialsStatus } }
    }
    if (body.invoiceStatus) {
      updates['Invoice Status'] = { select: { name: body.invoiceStatus } }
    }
    if (body.invoiceDate) {
      updates['Invoice Date'] = { date: { start: body.invoiceDate } }
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
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user?.email) {
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

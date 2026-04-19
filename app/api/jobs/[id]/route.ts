import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getJob, updateJob } from '@/lib/notion'
import { JobStatus } from '@/lib/constants'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession()
  const { id } = await params

  if (!session?.user?.tradieConfigId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const job = await getJob(id)

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify ownership
    if (job.tradieConfigId !== session.user.tradieConfigId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('Failed to fetch job:', error)
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
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
    // Verify ownership
    const job = await getJob(id)
    if (!job || job.tradieConfigId !== session.user.tradieConfigId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()

    const updates: Partial<{
      status: JobStatus
      currentPhase: string
      notes: string
      materialsStatus: string
    }> = {}

    if (body.status) updates.status = body.status
    if (body.currentPhase !== undefined) updates.currentPhase = body.currentPhase
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.materialsStatus !== undefined) updates.materialsStatus = body.materialsStatus

    await updateJob(id, updates)

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
    // Verify ownership
    const job = await getJob(id)
    if (!job || job.tradieConfigId !== session.user.tradieConfigId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // For now, just return success. Actual deletion requires Notion API.
    // In production, you'd archive or mark as deleted instead of hard delete.
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete job:', error)
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}

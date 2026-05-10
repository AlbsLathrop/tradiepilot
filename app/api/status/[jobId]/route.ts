import { NextResponse } from 'next/server'
import { getJob, getTradieConfigById, getMilestones, getPhotos } from '@/lib/notion'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    console.log('[STATUS] Request received for jobId:', jobId)

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId' },
        { status: 400 }
      )
    }

    const formattedId = jobId.replace(
      /^([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})$/,
      '$1-$2-$3-$4-$5'
    )
    console.log('[STATUS]', { jobId, formattedId })

    // Fetch job data
    const job = await getJob(formattedId)
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Fetch tradie config for business name
    const tradieConfig = await getTradieConfigById(job.tradieConfigId)

    // Fetch milestones and photos
    const [milestones, photos] = await Promise.all([
      getMilestones(formattedId),
      getPhotos(formattedId),
    ])

    return NextResponse.json({
      job,
      tradieConfig,
      milestones,
      photos,
    })
  } catch (error) {
    console.error('[GET /api/status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    )
  }
}

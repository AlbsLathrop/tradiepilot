import { NextResponse } from 'next/server'
import { getJob, getTradieConfigById, getMilestones, getPhotos } from '@/lib/notion'

export const revalidate = 60 // ISR: revalidate every 60 seconds

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId' },
        { status: 400 }
      )
    }

    // Fetch job data
    const job = await getJob(jobId)
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
      getMilestones(jobId),
      getPhotos(jobId),
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

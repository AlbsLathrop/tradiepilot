import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getJobs } from '@/lib/notion'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  const tradieConfigId = session?.user?.tradieConfigId || (req.nextUrl.searchParams.get('tradieConfigId') as string)

  if (!tradieConfigId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const jobs = await getJobs(tradieConfigId)
    return NextResponse.json({ jobs: jobs || [] })
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    return NextResponse.json({ jobs: [] }, { status: 200 })
  }
}

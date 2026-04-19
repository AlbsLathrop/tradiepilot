import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getJobs } from '@/lib/notion'

export async function GET(req: NextRequest) {
  const session = await getServerSession()

  if (!session?.user?.tradieConfigId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const jobs = await getJobs(session.user.tradieConfigId)
    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

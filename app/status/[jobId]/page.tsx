import { StatusPageContent } from './StatusPageContent'

interface StatusData {
  job: any
  tradieConfig: any
  milestones: any[]
  photos: any[]
}

async function getStatusDataServer(jobId: string): Promise<StatusData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const res = await fetch(`${baseUrl}/api/status/${jobId}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error('[getStatusData] Error:', error)
    return null
  }
}

export default async function StatusPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params
  const data = await getStatusDataServer(jobId)

  if (!data) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Job Not Found</h1>
          <p className="text-white/50">We couldn't find this job. Please check the link and try again.</p>
        </div>
      </div>
    )
  }

  return <StatusPageContent data={data} />
}

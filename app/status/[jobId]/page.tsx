import { StatusPageContent } from './StatusPageContent'

interface StatusData {
  job: any
  tradieConfig: any
  milestones: any[]
  photos: any[]
}

async function getStatusDataServer(jobId: string): Promise<StatusData | null> {
  try {
    const formattedId = jobId.replace(
      /^([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})$/,
      '$1-$2-$3-$4-$5'
    )

    const { Client } = require('@notionhq/client')
    const notion = new Client({ auth: process.env.NOTION_API_KEY })

    const page = await notion.pages.retrieve({ page_id: formattedId }) as any
    const p = page.properties

    const job = {
      id: page.id,
      clientName: (p['Client Name'] as any)?.title?.[0]?.plain_text || '',
      suburb: (p['Suburb'] as any)?.rich_text?.[0]?.plain_text || '',
      address: (p['Address'] as any)?.rich_text?.[0]?.plain_text || '',
      status: (p['Status'] as any)?.select?.name || '',
      jobType: (p['Service'] as any)?.rich_text?.[0]?.plain_text || '',
      estimatedCompletion: (p['Estimated Completion'] as any)?.date?.start || '',
      notes: (p['Notes'] as any)?.rich_text?.[0]?.plain_text || '',
      clientPhone: (p['Client Phone'] as any)?.phone_number || '',
      tradieConfigId: (p['Tradie Config ID'] as any)?.rich_text?.[0]?.plain_text || '',
    }

    const tradieConfig = { businessName: "Ben's Stonework" }

    return { job, tradieConfig, milestones: [], photos: [] }
  } catch (err: any) {
    console.error('[getStatusData] Error:', err?.message)
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

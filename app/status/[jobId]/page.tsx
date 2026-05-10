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

    const tradieConfigId = (p['Tradie Config ID'] as any)?.rich_text?.[0]?.plain_text || ''

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
      tradieConfigId,
      lastUpdated: (p['Last Updated'] as any)?.date?.start || null,
    }

    // Fetch tradieConfig by slug
    let tradieConfig: any = null
    if (tradieConfigId) {
      const tradieRes = await notion.databases.query({
        database_id: 'ff9248a4dd244ad9a0761281967750ea',
        page_size: 10,
      })
      const tradiePage = tradieRes.results.find((tp: any) =>
        (tp.properties?.['Tradie Slug'] as any)?.rich_text?.[0]?.plain_text === tradieConfigId ||
        (tp.properties?.['Email'] as any)?.email?.includes(tradieConfigId.split('-')[0])
      ) as any
      if (tradiePage) {
        tradieConfig = {
          businessName: tradiePage.properties?.['Business Name']?.title?.[0]?.plain_text || '',
          phone: tradiePage.properties?.['Phone']?.phone_number || '',
        }
      }
    }
    if (!tradieConfig) {
      tradieConfig = { businessName: "Ben's Stonework", phone: '' }
    }

    // Fetch milestones from Milestone Log DB
    const milestonesRes = await notion.databases.query({
      database_id: '34605054c0a34dd1ba45a60bb128f8d7',
      page_size: 100,
    })
    const milestones = milestonesRes.results
      .filter((m: any) => {
        const jobIdField = (m.properties?.['Job ID'] as any)?.rich_text?.[0]?.plain_text || ''
        return jobIdField === formattedId || jobIdField === formattedId.replace(/-/g, '')
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created_time).getTime()
        const dateB = new Date(b.created_time).getTime()
        return dateB - dateA
      })
      .slice(0, 5)
      .map((m: any) => ({
        id: m.id,
        title: (m.properties?.['Title'] as any)?.rich_text?.[0]?.plain_text || '',
        description: (m.properties?.['Description'] as any)?.rich_text?.[0]?.plain_text || '',
        date: (m as any).created_time?.split('T')[0] || '',
      }))

    // Fetch photos from Media DB
    const photosRes = await notion.databases.query({
      database_id: '349187ef-12be-81e3-b672-faffa07096b5',
      filter: {
        property: 'Job ID',
        rich_text: { contains: formattedId.replace(/-/g, '') }
      },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    })
    const photos = photosRes.results
      .map((p: any) => ({
        id: p.id,
        url: (p.properties?.['File URL'] as any)?.url || (p.properties?.['URL'] as any)?.url || '',
        description: (p.properties?.['Description'] as any)?.rich_text?.[0]?.plain_text || '',
        category: (p.properties?.['Category'] as any)?.select?.name || 'Progress',
      }))
      .filter((p: any) => p.url)

    return { job, tradieConfig, milestones, photos }
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

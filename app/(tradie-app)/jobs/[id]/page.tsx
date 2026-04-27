import { Client } from '@notionhq/client'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import JobDetailView from './job-detail-view'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

interface JobPageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: JobPageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return (
      <div className="p-4 text-center">
        <p className="text-[#9CA3AF]">Not authenticated</p>
        <Link href="/jobs" className="text-[#F97316] mt-4 inline-block">
          Back to Jobs
        </Link>
      </div>
    )
  }

  const tradieConfigId = session.user.tradieConfigId ?? 'joey-tradie'

  try {
    const page = await notion.pages.retrieve({ page_id: id }) as any
    const props = page.properties

    const tradieConfigId = props['Tradie Config ID']?.rich_text?.[0]?.plain_text ?? ''

    if (tradieConfigId && tradieConfigId !== session.user.tradieConfigId) {
      return (
        <div className="p-4 text-center">
          <p className="text-[#9CA3AF]">Unauthorized</p>
          <Link href="/jobs" className="text-[#F97316] mt-4 inline-block">
            Back to Jobs
          </Link>
        </div>
      )
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
    }

    return <JobDetailView job={job} jobId={id} />
  } catch (error: any) {
    return (
      <div style={{ color: 'white', padding: '20px' }}>
        <p>Error: {error?.message}</p>
        <p>Code: {error?.code}</p>
        <p>ID: {id}</p>
        <Link href="/jobs" className="text-[#F97316] mt-4 inline-block">
          Back to Jobs
        </Link>
      </div>
    )
  }
}

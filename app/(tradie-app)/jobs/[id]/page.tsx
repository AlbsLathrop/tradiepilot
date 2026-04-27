import { Client } from '@notionhq/client'
import Link from 'next/link'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let job: any = null
  let errorMsg: string | null = null

  try {
    const page = await notion.pages.retrieve({ page_id: id }) as any
    const p = page.properties

    job = {
      id: page.id,
      clientName: p['Client Name']?.title?.[0]?.plain_text ?? 'Unknown',
      status: p['Status']?.select?.name ?? '',
      address: p['Address']?.rich_text?.[0]?.plain_text ?? '',
      suburb: p['Suburb']?.rich_text?.[0]?.plain_text ?? '',
      clientPhone: p['Client Phone']?.phone_number ?? '',
      scope: p['Scope']?.rich_text?.[0]?.plain_text ?? '',
      service: p['Service']?.rich_text?.[0]?.plain_text ?? '',
      jobType: p['Job Type']?.select?.name ?? '',
      currentPhase: p['Current Phase']?.select?.name ?? '',
      materialsStatus: p['Materials Status']?.select?.name ?? '',
      foremanName: p['Foreman Name']?.rich_text?.[0]?.plain_text ?? '',
      foremanPhone: p['Foreman Phone']?.phone_number ?? '',
      notes: p['Notes']?.rich_text?.[0]?.plain_text ?? '',
      siteAccessNotes: p['Site Access Notes']?.rich_text?.[0]?.plain_text ?? '',
      estimatedCompletion: p['Estimated Completion']?.date?.start ?? null,
      tradieConfigId: p['Tradie Config ID']?.rich_text?.[0]?.plain_text ?? '',
    }
  } catch (err: any) {
    errorMsg = err?.message ?? 'Unknown error'
  }

  if (errorMsg) {
    return (
      <div className="p-6 text-white min-h-screen bg-[#0F0F0F]">
        <p className="text-red-400 font-bold text-lg">Failed to load job</p>
        <p className="text-gray-400 mt-2 text-sm">{errorMsg}</p>
        <p className="text-gray-600 text-xs mt-1">ID: {id}</p>
        <Link href="/jobs" className="text-[#F97316] mt-6 inline-block">
          ← Back to Jobs
        </Link>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-6 text-white min-h-screen bg-[#0F0F0F]">
        <p className="text-gray-400">Job not found</p>
        <Link href="/jobs" className="text-[#F97316] mt-4 inline-block">
          ← Back to Jobs
        </Link>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    'IN PROGRESS': 'bg-orange-500',
    'RUNNING LATE': 'bg-red-500',
    'SCHEDULED': 'bg-purple-500',
    'COMPLETE': 'bg-green-500',
    'INVOICED': 'bg-teal-500',
  }
  const statusColor = statusColors[job.status] ?? 'bg-gray-500'

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white pb-32">

      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-[#0F0F0F] border-b border-[#1F2937] px-4 py-3 flex items-center gap-3">
        <Link href="/jobs" className="text-[#F97316] text-xl">←</Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">{job.clientName}</h1>
          {job.suburb && <p className="text-xs text-gray-400">{job.suburb}</p>}
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${statusColor}`}>
          {job.status}
        </span>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* SECTION: Job Details */}
        <div className="bg-[#111827] rounded-xl p-4 space-y-3">
          <h2 className="text-[#F97316] text-xs font-bold uppercase tracking-wider">Job Details</h2>
          {job.service && <InfoRow label="Service" value={job.service} />}
          {job.scope && <InfoRow label="Scope" value={job.scope} />}
          {job.jobType && <InfoRow label="Type" value={job.jobType} />}
          {job.currentPhase && <InfoRow label="Phase" value={job.currentPhase} />}
          {job.materialsStatus && <InfoRow label="Materials" value={job.materialsStatus} />}
          {job.estimatedCompletion && (
            <InfoRow label="Est. Completion" value={job.estimatedCompletion} />
          )}
        </div>

        {/* SECTION: Client & Site */}
        <div className="bg-[#111827] rounded-xl p-4 space-y-3">
          <h2 className="text-[#F97316] text-xs font-bold uppercase tracking-wider">Client & Site</h2>
          {job.clientPhone && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Phone</span>
              <a href={`tel:${job.clientPhone}`} className="text-[#F97316] text-sm font-medium">
                {job.clientPhone}
              </a>
            </div>
          )}
          {job.address && <InfoRow label="Address" value={job.address} />}
          {job.siteAccessNotes && (
            <div className="mt-2 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
              <p className="text-orange-400 text-xs font-bold mb-1">⚠️ Site Access</p>
              <p className="text-gray-300 text-sm">{job.siteAccessNotes}</p>
            </div>
          )}
        </div>

        {/* SECTION: Team */}
        {(job.foremanName || job.foremanPhone) && (
          <div className="bg-[#111827] rounded-xl p-4 space-y-3">
            <h2 className="text-[#F97316] text-xs font-bold uppercase tracking-wider">Team</h2>
            {job.foremanName && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Foreman</span>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">{job.foremanName}</span>
                  {job.foremanPhone && (
                    <a href={`tel:${job.foremanPhone}`} className="text-[#F97316] text-xs">
                      📞
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION: Notes */}
        {job.notes && (
          <div className="bg-[#111827] rounded-xl p-4">
            <h2 className="text-[#F97316] text-xs font-bold uppercase tracking-wider mb-2">Notes</h2>
            <p className="text-gray-300 text-sm leading-relaxed">{job.notes}</p>
          </div>
        )}

        {/* TAP BUTTONS */}
        <div className="bg-[#111827] rounded-xl p-4">
          <h2 className="text-[#F97316] text-xs font-bold uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              'STARTING TODAY',
              'ON THE WAY',
              'RUNNING LATE',
              'PHASE DONE',
              'NEED DECISION',
              'DAY DONE',
              'JOB COMPLETE',
              'VARIATION REQUEST',
            ].map((action) => (
              <button
                key={action}
                className="bg-[#F97316] text-white text-xs font-bold py-3 px-2 rounded-lg active:opacity-70 text-center"
                onClick={() => alert(`Action: ${action} — connect to ALFRED next`)}
              >
                {action}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-400 text-sm shrink-0">{label}</span>
      <span className="text-white text-sm text-right">{value}</span>
    </div>
  )
}

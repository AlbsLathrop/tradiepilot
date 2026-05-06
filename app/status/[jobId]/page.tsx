import { Phone, Check, Clock, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface StatusData {
  job: any
  tradieConfig: any
  milestones: any[]
  photos: any[]
}

async function getStatusData(jobId: string): Promise<StatusData | null> {
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

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'SCHEDULED': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    'IN PROGRESS': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    'RUNNING LATE': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'DAY DONE': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    'COMPLETE': 'bg-green-500/20 text-green-400 border border-green-500/30',
    'INVOICED': 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    'PAID': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  }
  return colors[status] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'COMPLETE':
    case 'PAID':
    case 'INVOICED':
      return <Check className="w-5 h-5" />
    case 'IN PROGRESS':
    case 'RUNNING LATE':
    case 'DAY DONE':
      return <Clock className="w-5 h-5" />
    default:
      return <AlertCircle className="w-5 h-5" />
  }
}

const STATUS_TIMELINE = ['SCHEDULED', 'IN PROGRESS', 'COMPLETE', 'INVOICED', 'PAID']

function ProgressTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = STATUS_TIMELINE.indexOf(currentStatus)
  const isComplete = currentIndex >= 2 // COMPLETE or later

  return (
    <div className="bg-[#1F2937] rounded-xl p-6 border border-white/5">
      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-4">Progress</h3>
      <div className="flex items-center justify-between gap-2">
        {STATUS_TIMELINE.map((status, idx) => {
          const isActive = currentIndex >= idx
          const isCurrent = idx === currentIndex
          const isDone = currentIndex > idx

          return (
            <div key={status} className="flex-1 flex flex-col items-center">
              {/* Step circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all ${
                  isDone
                    ? 'bg-green-500/30 border border-green-500'
                    : isCurrent
                    ? 'bg-cyan-500/30 border border-cyan-500 ring-2 ring-cyan-400'
                    : 'bg-gray-700/30 border border-gray-600'
                }`}
              >
                {isDone && <Check className="w-4 h-4 text-green-400" />}
                {isCurrent && <Clock className="w-4 h-4 text-cyan-400" />}
              </div>
              {/* Label - responsive text size */}
              <span
                className={`text-xs text-center font-medium leading-tight ${
                  isActive ? 'text-white' : 'text-white/40'
                }`}
              >
                {status === 'IN PROGRESS' ? 'In Progress' : status.split('_').join(' ')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default async function StatusPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params
  const data = await getStatusData(jobId)

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

  const { job, tradieConfig, milestones, photos } = data
  const businessName = tradieConfig?.businessName || tradieConfig?.name || 'TradiePilot'

  return (
    <div className="min-h-screen bg-[#111827]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1F2937] to-[#111827] border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-lg font-bold text-white">
            <span className="text-cyan-400">{businessName}</span>
            <span className="text-white/60"> — Job Update</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">{job.clientName}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-2 rounded-lg font-semibold text-sm uppercase tracking-wide flex items-center gap-2 ${getStatusColor(job.status)}`}>
            {getStatusIcon(job.status)}
            {job.status}
          </div>
          {job.address && (
            <p className="text-sm text-white/50 flex-1">{job.address}</p>
          )}
        </div>

        {/* Address */}
        {job.suburb && (
          <div className="bg-[#1F2937] rounded-xl p-4 border border-white/5">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1">Location</p>
            <p className="text-white font-medium">{job.suburb}</p>
          </div>
        )}

        {/* Progress Timeline */}
        <ProgressTimeline currentStatus={job.status} />

        {/* Job Type & Service */}
        {(job.jobType || job.service) && (
          <div className="grid grid-cols-2 gap-3">
            {job.jobType && (
              <div className="bg-[#1F2937] rounded-lg p-3 border border-white/5">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1">Type</p>
                <p className="text-white text-sm font-medium">{job.jobType}</p>
              </div>
            )}
            {job.service && (
              <div className="bg-[#1F2937] rounded-lg p-3 border border-white/5">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1">Service</p>
                <p className="text-white text-sm font-medium">{job.service}</p>
              </div>
            )}
          </div>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">What's Been Done</h2>
            <div className="space-y-2">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="bg-[#1F2937] rounded-lg p-4 border border-white/5">
                  <div className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-white font-medium text-sm">{milestone.title}</h3>
                      {milestone.description && (
                        <p className="text-white/50 text-sm mt-1">{milestone.description}</p>
                      )}
                      {milestone.date && (
                        <p className="text-white/40 text-xs mt-2">{new Date(milestone.date).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">Photos</h2>
            {(['Before', 'Progress', 'After'] as const).map((category) => {
              const categoryPhotos = photos.filter(p => p.category === category)
              if (categoryPhotos.length === 0) return null
              return (
                <div key={category} className="mb-6">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2 px-1">{category}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {categoryPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-colors group cursor-pointer"
                      >
                        <img
                          src={photo.url}
                          alt={photo.description || 'Job photo'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {photo.description && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <p className="text-white text-xs">{photo.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Estimated Completion */}
        {job.estimatedCompletion && (
          <div className="bg-[#1F2937] rounded-xl p-6 border border-white/5">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              What's Next
            </h2>
            <p className="text-white font-medium">
              Est. Completion: <span className="text-cyan-400">{new Date(job.estimatedCompletion).toLocaleDateString()}</span>
            </p>
          </div>
        )}

        {/* Notes */}
        {job.notes && (
          <div className="bg-[#1F2937] rounded-xl p-6 border border-white/5">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </h2>
            <p className="text-white/80 text-sm">{job.notes}</p>
          </div>
        )}
      </div>

      {/* Footer - Sticky */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#111827] via-[#111827] to-transparent border-t border-white/5 px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {job.clientPhone && (
            <a
              href={`tel:${job.clientPhone}`}
              className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              <Phone className="w-5 h-5" />
              Call {businessName}
            </a>
          )}
          <p className="text-center text-xs text-white/40">
            Powered by <span className="text-cyan-400 font-medium">TradieFlow</span>
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'

interface Milestone {
  jobId: string
  event: string
  note: string
  date: string
  type: string
  loggedBy?: string
  clientNotified?: boolean
}

interface Job {
  id: string
  clientName: string
  status: string
  suburb: string
  service: string
  scope: string
  address: string
  clientPhone: string
  foreman: string
  foremanPhone: string
  notes: string
  siteAccessNotes: string
  materialsStatus: string
  currentPhase: string
  estimatedCompletion: string | null
  jobType: string
  lastMessageSent: string | null
  jobValue: number | null
  milestones: Milestone[]
}

const STATUS_COLORS: Record<string, string> = {
  'IN PROGRESS': 'bg-orange-500 text-white',
  'RUNNING LATE': 'bg-red-500 text-white',
  'SCHEDULED': 'bg-purple-500 text-white',
  'COMPLETE': 'bg-green-500 text-white',
  'INVOICED': 'bg-teal-500 text-white',
  'DAY DONE': 'bg-blue-500 text-white',
}

const QUICK_ACTIONS = [
  'STARTING TODAY',
  'ON THE WAY',
  'RUNNING LATE',
  'PHASE DONE',
  'NEED DECISION',
  'DAY DONE',
  'JOB COMPLETE',
  'VARIATION REQUEST',
]

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('All')
  const [toast, setToast] = useState<string | null>(null)
  const [openLogId, setOpenLogId] = useState<string | null>(null)

  const tabs = ['All', 'SCHEDULED', 'IN PROGRESS', 'RUNNING LATE', 'COMPLETE', 'INVOICED']

  useEffect(() => {
    fetch('/api/jobs')
      .then(r => r.json())
      .then(data => {
        setJobs(data.jobs ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredJobs = activeTab === 'All'
    ? jobs
    : jobs.filter(j => j.status === activeTab)

  const handleToggle = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const handleAction = async (job: Job, action: string) => {
    setToast(`Sending "${action}" for ${job.clientName}...`)
    try {
      await fetch('/api/alfred', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${action} — ${job.clientName}, ${job.suburb}`,
          tradieConfigId: 'joey-tradie',
        }),
      })
      setToast(`✓ ${action} sent for ${job.clientName}`)
    } catch {
      setToast('Failed to send action')
    }
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white pb-24">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-[#F97316] text-white text-center py-3 px-4 rounded-xl text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Jobs</h1>
          <p className="text-gray-400 text-sm">Your active projects</p>
        </div>
        <button className="w-10 h-10 bg-[#F97316] rounded-full flex items-center justify-center text-white text-xl font-bold">
          +
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === tab
                ? 'bg-[#F97316] text-white'
                : 'bg-[#1F2937] text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Job Cards */}
      <div className="px-4 space-y-3 mt-2">
        {loading && (
          <>
            {[1,2,3].map(i => (
              <div key={i} className="bg-[#111827] rounded-xl h-20 animate-pulse" />
            ))}
          </>
        )}

        {!loading && filteredJobs.map(job => {
          const isOpen = expandedId === job.id
          const statusClass = STATUS_COLORS[job.status] ?? 'bg-gray-600 text-white'

          return (
            <div
              key={job.id}
              className={`bg-[#111827] rounded-xl overflow-hidden transition-all duration-200 ${
                isOpen ? 'ring-2 ring-[#F97316]' : ''
              }`}
            >
              {/* Card Header — always visible, tap to toggle */}
              <button
                onClick={() => handleToggle(job.id)}
                className="w-full px-4 py-4 flex items-center justify-between text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-base truncate">
                    {job.clientName}
                  </p>
                  <p className="text-gray-400 text-sm mt-0.5 truncate">
                    {[job.service, job.suburb].filter(Boolean).join(' • ')}
                  </p>
                  {job.lastMessageSent && (() => {
                    const days = Math.floor(
                      (Date.now() - new Date(job.lastMessageSent).getTime())
                      / (1000 * 60 * 60 * 24)
                    )
                    return (
                      <p className={`text-xs mt-0.5 ${
                        days > 7
                          ? 'text-red-400'
                          : days > 3
                            ? 'text-yellow-400'
                            : 'text-gray-500'
                      }`}>
                        {days === 0
                          ? 'Contacted today'
                          : `Last contact: ${days}d ago`}
                      </p>
                    )
                  })()}
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {job.jobValue && (
                    <span className="text-gray-400 text-xs mr-2">
                      ${job.jobValue.toLocaleString()}
                    </span>
                  )}
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusClass}`}>
                    {job.status}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {/* Expanded Detail */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-[#1F2937]">

                  {/* Job Info */}
                  <div className="pt-3 space-y-2">
                    {job.scope && <InfoRow label="Scope" value={job.scope} />}
                    {job.jobType && <InfoRow label="Type" value={job.jobType} />}
                    {job.currentPhase && <InfoRow label="Phase" value={job.currentPhase} />}
                    {job.materialsStatus && <InfoRow label="Materials" value={job.materialsStatus} />}
                    {job.estimatedCompletion && (
                      <InfoRow label="Est. Completion" value={job.estimatedCompletion} />
                    )}
                  </div>

                  {/* Client & Site */}
                  <div className="bg-[#0F0F0F] rounded-lg p-3 space-y-2">
                    <p className="text-[#F97316] text-xs font-bold uppercase">Client & Site</p>
                    {job.clientPhone && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Phone</span>
                        <a href={`tel:${job.clientPhone}`} className="text-[#F97316] text-sm font-medium">
                          {job.clientPhone}
                        </a>
                      </div>
                    )}
                    {job.address && (
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-gray-400 text-sm shrink-0">Address</span>
                        <a
                          href={`https://maps.apple.com/?q=${encodeURIComponent(job.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#F97316] text-sm text-right hover:underline"
                        >
                          {job.address} 📍
                        </a>
                      </div>
                    )}
                    {job.siteAccessNotes && (
                      <div className="mt-1 bg-orange-500/10 border border-orange-500/30 rounded-lg p-2">
                        <p className="text-orange-400 text-xs font-bold">⚠️ Site Access</p>
                        <p className="text-gray-300 text-xs mt-1">{job.siteAccessNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Team */}
                  {(job.foreman || job.foremanPhone) && (
                    <div className="bg-[#0F0F0F] rounded-lg p-3 space-y-2">
                      <p className="text-[#F97316] text-xs font-bold uppercase">Team</p>
                      {job.foreman && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Foreman</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm">{job.foreman}</span>
                            {job.foremanPhone && (
                              <a href={`tel:${job.foremanPhone}`} className="text-[#F97316]">📞</a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {job.notes && (
                    <div className="bg-[#0F0F0F] rounded-lg p-3">
                      <p className="text-[#F97316] text-xs font-bold uppercase mb-1">Notes</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{job.notes}</p>
                    </div>
                  )}

                  {/* Job Log */}
                  {job.milestones && job.milestones.length > 0 && (
                    <div className="border-t border-[#1F2937] pt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenLogId(openLogId === job.id ? null : job.id)
                        }}
                        className="w-full flex items-center justify-between py-2"
                      >
                        <span className="text-[#F97316] text-xs font-bold uppercase">
                          📋 Job Log ({job.milestones.length} entries)
                        </span>
                        <span className="text-gray-500 text-xs">
                          {openLogId === job.id ? '▲' : '▼'}
                        </span>
                      </button>

                      {openLogId === job.id && (
                        <div className="space-y-2 mt-2">
                          {job.milestones.map((m: any, i: number) => (
                            <div
                              key={i}
                              className="bg-[#0F0F0F] rounded-lg p-3 border-l-2 border-[#F97316]"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="text-white text-xs font-semibold leading-tight">
                                  {m.event}
                                </span>
                                <span className="text-gray-500 text-[10px] shrink-0">
                                  {m.date ? new Date(m.date).toLocaleDateString('en-AU', {
                                    day: 'numeric',
                                    month: 'short',
                                  }) : ''}
                                </span>
                              </div>
                              {m.note && (
                                <p className="text-gray-400 text-xs leading-relaxed mb-1">
                                  {m.note}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  m.type === 'ISSUE_FOUND'
                                    ? 'bg-red-500/20 text-red-400'
                                    : m.type === 'ISSUE_RESOLVED'
                                      ? 'bg-green-500/20 text-green-400'
                                      : m.type === 'PHASE_COMPLETE'
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : m.type === 'VARIATION_APPROVED'
                                          ? 'bg-orange-500/20 text-orange-400'
                                          : m.type === 'JOB_STARTED'
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {m.type}
                                </span>
                                {m.loggedBy && (
                                  <span className="text-gray-500 text-[10px]">
                                    by {m.loggedBy}
                                  </span>
                                )}
                                {m.clientNotified && (
                                  <span className="text-green-400 text-[10px]">
                                    ✓ notified
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ask ALFRED Button */}
                  <a
                    href={`/chat?message=${encodeURIComponent(
                      `Give me a full update on the ${job.clientName} job in ${job.suburb}. What's the current status, what happened last, and what's coming up next?`
                    )}&jobId=${job.id}`}
                    className="w-full block bg-[#1F2937] border border-[#F97316] text-[#F97316] text-sm font-bold py-3 rounded-xl text-center mb-4"
                  >
                    🧠 Ask ALFRED about this job
                  </a>

                  {/* Quick Actions */}
                  <div>
                    <p className="text-[#F97316] text-xs font-bold uppercase mb-2">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_ACTIONS.map(action => (
                        <button
                          key={action}
                          onClick={() => handleAction(job, action)}
                          className="bg-[#F97316] text-white text-xs font-bold py-3 px-2 rounded-lg active:opacity-70 text-center"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )
        })}

        {!loading && filteredJobs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No jobs with status "{activeTab}"
          </div>
        )}
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

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Milestone {
  jobId: string
  event: string
  note: string
  date: string
  type: string
  loggedBy?: string
  clientNotified?: boolean
}

interface Photo {
  url: string
  description: string
  type: string
  createdAt: string
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
  foremanName?: string
  foremanPhone?: string
  leadingHand?: string
  leadingHandPhone?: string
  teamMembers?: string
  notes: string
  siteAccessNotes: string
  materialsStatus: string
  currentPhase: string
  estimatedCompletion: string | null
  jobType: string
  lastMessageSent: string | null
  jobValue: number | null
  tradieConfigId: string
  invoiceStatus: string
  invoiceDate: string | null
  invoiceAmount: number | null
  invoiceDueDays: number | null
  milestones: Milestone[]
  photos?: Photo[]
}

const STATUS_COLORS: Record<string, string> = {
  'IN PROGRESS': 'bg-orange-500 text-white',
  'RUNNING LATE': 'bg-red-500 text-white',
  'SCHEDULED': 'bg-purple-500 text-white',
  'COMPLETE': 'bg-green-500 text-white',
  'INVOICED': 'bg-teal-500 text-white',
  'PAID': 'bg-emerald-500 text-white',
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
  const { data: session } = useSession()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('All')
  const [toast, setToast] = useState<string | null>(null)
  const [openLogId, setOpenLogId] = useState<string | null>(null)
  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null)
  const [showNewJob, setShowNewJob] = useState(false)
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [newJob, setNewJob] = useState({
    clientName: '', clientPhone: '', address: '',
    suburb: '', service: '', scope: '',
    jobValue: '', estimatedCompletion: ''
  })

  const tabs = ['All', 'SCHEDULED', 'IN PROGRESS', 'BEHIND SCHEDULE', 'COMPLETE', 'INVOICED', 'PAID']
  const tabToStatusMap: Record<string, string> = {
    'BEHIND SCHEDULE': 'RUNNING LATE'
  }

  const fetchJobs = (tradieSlug: string) => {
    console.log('[JOBS] Fetching jobs for:', tradieSlug)
    fetch(`/api/jobs?tradieSlug=${tradieSlug}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        console.log('[JOBS] Data received:', data)
        if (data.error) {
          console.error('[JOBS] API error:', data.error)
          setJobs([])
        } else {
          setJobs(data.jobs ?? [])
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('[JOBS] Fetch error:', err)
        setJobs([])
        setLoading(false)
      })
  }

  useEffect(() => {
    if (!session?.user?.tradieSlug) {
      console.log('[JOBS] No tradieSlug available yet')
      return
    }
    setLoading(true)
    fetchJobs(session?.user?.tradieSlug)
  }, [session?.user?.tradieSlug])

  const filteredJobs = activeTab === 'All'
    ? jobs
    : jobs.filter(j => j.status === (tabToStatusMap[activeTab] || activeTab))

  const handleToggle = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const handleAction = async (job: Job, action: string) => {
    setToast(`Sending "${action}"...`)
    try {
      const res = await fetch('/api/alfred/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          jobId: job.id,
          clientName: job.clientName,
          clientPhone: job.clientPhone,
          suburb: job.suburb,
          tradieConfigId: job.tradieConfigId,
          tradieName: session?.user?.name || 'your tradie',
        }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.darkHours) {
          setToast(`🌙 After hours — logged but no SMS sent`)
        } else if (action === 'ON THE WAY') {
          setToast(`📱 SMS sent to ${job.clientName} — on the way!`)
        } else if (action === 'RUNNING LATE') {
          setToast(`📱 SMS sent to ${job.clientName} — running late notice`)
        } else {
          setToast(`✓ ${action} sent for ${job.clientName}`)
        }
        // Refresh jobs to show new milestone
        setTimeout(() => {
          if (session?.user?.tradieSlug) {
            fetchJobs(session?.user?.tradieSlug)
          }
        }, 1500)
      } else {
        setToast('Failed — try again')
      }
    } catch {
      setToast('Failed — try again')
    }
    setTimeout(() => setToast(null), 3000)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveEdit = async (jobId: string, fieldKey: string, value: string) => {
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldKey]: value }),
      })
      setJobs(prev => prev.map(j =>
        j.id === jobId ? { ...j, [fieldKey]: value } : j
      ))
      setEditingId(null)
      showToast('✓ Saved')
    } catch {
      showToast('Failed to save')
    }
  }

  const handleInvoiceUpdate = async (job: Job, status: string) => {
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceStatus: status,
          invoiceDate: status === 'SENT'
            ? new Date().toISOString().split('T')[0]
            : undefined
        }),
      })
      setJobs(prev => prev.map(j =>
        j.id === job.id
          ? { ...j, invoiceStatus: status }
          : j
      ))
      showToast(`✓ Invoice marked as ${status}`)
    } catch {
      showToast('Update failed')
    }
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
        <button
          onClick={() => setShowNewJob(true)}
          className="w-10 h-10 bg-[#F97316] rounded-full flex items-center justify-center text-white text-xl font-bold"
        >
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
                    {job.status === 'RUNNING LATE' ? 'BEHIND SCHEDULE' : job.status}
                  </span>
                  {job.invoiceStatus === 'SENT' && job.invoiceDueDays && job.invoiceDueDays > 14 && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full
                    bg-red-500 text-white animate-pulse">
                      💰 OVERDUE
                    </span>
                  )}
                  <span className="text-gray-500 text-sm">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {/* Expanded Detail */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-[#1F2937]">

                  {/* JOB DETAILS Section */}
                  <div className="pt-4 space-y-2">
                    <p className="text-[#F97316] text-xs font-bold uppercase tracking-wide mb-3">Job Details</p>
                    <EditField
                      label="Type of Work"
                      value={job.jobType || ''}
                      jobId={job.id}
                      field="jobType"
                      isEditing={editingId === `${job.id}-jobType`}
                      onEdit={() => {
                        setEditingId(`${job.id}-jobType`)
                        setEditValue(job.jobType || '')
                      }}
                      onSave={() => handleSaveEdit(job.id, 'jobType', editValue)}
                      onCancel={() => setEditingId(null)}
                      onChange={setEditValue}
                      editValue={editValue}
                    />
                    <EditField
                      label="Job Details"
                      value={job.scope || ''}
                      jobId={job.id}
                      field="scope"
                      isEditing={editingId === `${job.id}-scope`}
                      onEdit={() => {
                        setEditingId(`${job.id}-scope`)
                        setEditValue(job.scope || '')
                      }}
                      onSave={() => handleSaveEdit(job.id, 'scope', editValue)}
                      onCancel={() => setEditingId(null)}
                      onChange={setEditValue}
                      editValue={editValue}
                      isTextarea
                    />
                    {job.jobValue && (
                      <InfoRow label="Job Value" value={`$${job.jobValue.toLocaleString()}`} />
                    )}
                    <EditField
                      label="Est. Completion"
                      value={job.estimatedCompletion || ''}
                      jobId={job.id}
                      field="estimatedCompletion"
                      isEditing={editingId === `${job.id}-estimatedCompletion`}
                      onEdit={() => {
                        setEditingId(`${job.id}-estimatedCompletion`)
                        setEditValue(job.estimatedCompletion || '')
                      }}
                      onSave={() => handleSaveEdit(job.id, 'estimatedCompletion', editValue)}
                      onCancel={() => setEditingId(null)}
                      onChange={setEditValue}
                      editValue={editValue}
                      type="date"
                    />
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
                    <EditField
                      label="Notes"
                      value={job.notes || ''}
                      jobId={job.id}
                      field="notes"
                      isEditing={editingId === `${job.id}-notes`}
                      onEdit={() => {
                        setEditingId(`${job.id}-notes`)
                        setEditValue(job.notes || '')
                      }}
                      onSave={() => handleSaveEdit(job.id, 'notes', editValue)}
                      onCancel={() => setEditingId(null)}
                      onChange={setEditValue}
                      editValue={editValue}
                      isTextarea
                    />
                  </div>

                  {/* CLIENT Section */}
                  <div className="border-t border-[#1F2937] pt-4">
                    <p className="text-[#F97316] text-xs font-bold uppercase tracking-wide mb-3">Client</p>
                    <div className="bg-[#0F0F0F] rounded-lg p-3 space-y-2">
                      {job.clientName && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Name</span>
                          <span className="text-white text-sm font-medium">{job.clientName}</span>
                        </div>
                      )}
                      {job.clientPhone && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Phone</span>
                          <div className="flex items-center gap-3">
                            <a
                              href={`tel:${job.clientPhone}`}
                              className="text-[#F97316] text-sm font-medium"
                            >
                              {job.clientPhone}
                            </a>
                            <a
                              href={`tel:${job.clientPhone}`}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs
                              font-bold px-3 py-1.5 rounded-lg active:opacity-70 transition-colors inline-block"
                            >
                              📞 Call
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TEAM Section */}
                  <div className="border-t border-[#1F2937] pt-4">
                    <p className="text-[#F97316] text-xs font-bold uppercase tracking-wide mb-3">Team</p>
                    <div className="bg-[#0F0F0F] rounded-lg p-3 space-y-3">
                      <EditField
                        label="Foreman"
                        value={job.foremanName || ''}
                        jobId={job.id}
                        field="foremanName"
                        isEditing={editingId === `${job.id}-foremanName`}
                        onEdit={() => {
                          setEditingId(`${job.id}-foremanName`)
                          setEditValue(job.foremanName || '')
                        }}
                        onSave={() => handleSaveEdit(job.id, 'foremanName', editValue)}
                        onCancel={() => setEditingId(null)}
                        onChange={setEditValue}
                        editValue={editValue}
                      />
                      <EditField
                        label="Leading Hand"
                        value={job.leadingHand || ''}
                        jobId={job.id}
                        field="leadingHand"
                        isEditing={editingId === `${job.id}-leadingHand`}
                        onEdit={() => {
                          setEditingId(`${job.id}-leadingHand`)
                          setEditValue(job.leadingHand || '')
                        }}
                        onSave={() => handleSaveEdit(job.id, 'leadingHand', editValue)}
                        onCancel={() => setEditingId(null)}
                        onChange={setEditValue}
                        editValue={editValue}
                        placeholder="Tap to add"
                      />
                      <EditField
                        label="Leading Hand Phone"
                        value={job.leadingHandPhone || ''}
                        jobId={job.id}
                        field="leadingHandPhone"
                        isEditing={editingId === `${job.id}-leadingHandPhone`}
                        onEdit={() => {
                          setEditingId(`${job.id}-leadingHandPhone`)
                          setEditValue(job.leadingHandPhone || '')
                        }}
                        onSave={() => handleSaveEdit(job.id, 'leadingHandPhone', editValue)}
                        onCancel={() => setEditingId(null)}
                        onChange={setEditValue}
                        editValue={editValue}
                        type="tel"
                        placeholder="Tap to add"
                      />
                      <EditField
                        label="Team Members"
                        value={job.teamMembers || ''}
                        jobId={job.id}
                        field="teamMembers"
                        isEditing={editingId === `${job.id}-teamMembers`}
                        onEdit={() => {
                          setEditingId(`${job.id}-teamMembers`)
                          setEditValue(job.teamMembers || '')
                        }}
                        onSave={() => handleSaveEdit(job.id, 'teamMembers', editValue)}
                        onCancel={() => setEditingId(null)}
                        onChange={setEditValue}
                        editValue={editValue}
                        isTextarea
                        placeholder="Names, comma separated"
                      />
                    </div>
                  </div>

                  {/* Ask ALFRED Button */}
                  <a
                    href={`/chat?message=${encodeURIComponent(
                      `Give me a full update on the ${job.clientName} job in ${job.suburb}. What's the current status, what happened last, and what's coming up next?`
                    )}&jobId=${job.id}`}
                    className="w-full block bg-[#1F2937] border border-[#F97316] text-[#F97316] text-sm font-bold py-3 rounded-xl text-center"
                  >
                    🧠 Ask ALFRED about this job
                  </a>

                  {/* INVOICE */}
                  <div className="border-t border-[#1F2937] pt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenInvoiceId(
                          openInvoiceId === job.id ? null : job.id
                        )
                      }}
                      className="w-full flex items-center justify-between
                      px-3 py-2 rounded-lg border border-[#F97316]/50
                      hover:border-[#F97316] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#F97316] text-xs font-bold uppercase
                        tracking-wide">Invoice</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5
                        rounded-full ${
                          job.invoiceStatus === 'PAID'
                            ? 'bg-green-500/20 text-green-400'
                            : job.invoiceStatus === 'SENT' &&
                              (job.invoiceDueDays ?? 0) > 14
                            ? 'bg-red-500/20 text-red-400 animate-pulse'
                            : job.invoiceStatus === 'SENT'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-500/20 text-gray-500'
                        }`}>
                          {job.invoiceStatus === 'SENT' &&
                           (job.invoiceDueDays ?? 0) > 14
                            ? `OVERDUE ${job.invoiceDueDays}d`
                            : job.invoiceStatus || 'NOT SENT'}
                        </span>
                        {job.invoiceAmount && (
                          <span className="text-gray-400 text-xs">
                            ${job.invoiceAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className="text-[#F97316]/60 text-xs">
                        {openInvoiceId === job.id ? '▲' : '▼'}
                      </span>
                    </button>

                    {openInvoiceId === job.id && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {[
                          { value: 'NOT SENT', label: 'Not Sent' },
                          { value: 'SENT', label: 'Invoiced' },
                          { value: 'PAID', label: '✓ Paid' },
                        ].map(({ value, label }) => (
                          <button
                            key={value}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleInvoiceUpdate(job, value)
                            }}
                            className={`text-xs font-bold py-2.5 rounded-lg
                            transition-all active:scale-95 ${
                              (job.invoiceStatus || 'NOT SENT') === value
                                ? 'bg-[#F97316] text-white'
                                : 'bg-[#0F0F0F] border border-[#1F2937] text-gray-400'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

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

      {/* Lightbox Modal */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex flex-col
          items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.url}
            alt={lightbox.description}
            className="max-w-full max-h-[75vh] rounded-xl object-contain"
          />
          {lightbox.description && (
            <p className="text-white text-sm mt-4 text-center px-4">
              {lightbox.description}
            </p>
          )}
          <p className="text-gray-500 text-xs mt-2">Tap anywhere to close</p>
        </div>
      )}

      {/* New Job Modal */}
      {showNewJob && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-[#111827] rounded-t-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-bold text-lg">New Job</h2>
              <button onClick={() => setShowNewJob(false)} className="text-gray-400 text-xl">×</button>
            </div>
            {[
              { key: 'clientName', label: 'Client Name *', type: 'text', placeholder: '' },
              { key: 'clientPhone', label: 'Phone', type: 'tel', placeholder: '' },
              { key: 'suburb', label: 'Suburb *', type: 'text', placeholder: '' },
              { key: 'address', label: 'Full Address', type: 'text', placeholder: '32 Wark Ave, Pagewood NSW 2035' },
              { key: 'service', label: 'Type of Work', type: 'text', placeholder: 'e.g. Driveway paving, Pool coping, Retaining wall' },
              { key: 'scope', label: 'Job Details', type: 'text', placeholder: 'e.g. 40sqm driveway, exposed aggregate finish' },
              { key: 'jobValue', label: 'Job Value ($)', type: 'number', placeholder: '' },
              { key: 'estimatedCompletion', label: 'Est. Completion', type: 'date', placeholder: '' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="text-gray-400 text-xs mb-1 block">
                  {label}
                </label>
                <input
                  type={type}
                  value={(newJob as any)[key]}
                  onChange={e => setNewJob(prev => ({
                    ...prev, [key]: e.target.value
                  }))}
                  placeholder={placeholder}
                  className="w-full bg-[#0F0F0F] border border-[#1F2937] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:border-[#F97316] outline-none"
                />
              </div>
            ))}
            <button
              onClick={async () => {
                if (!newJob.clientName || !newJob.suburb) {
                  setToast('Client name and suburb required')
                  setTimeout(() => setToast(null), 3000)
                  return
                }
                const res = await fetch('/api/jobs', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...newJob,
                    tradieSlug: session?.user?.tradieSlug,
                    jobValue: newJob.jobValue ? Number(newJob.jobValue) : null,
                  }),
                })
                const data = await res.json()
                if (data.success) {
                  setToast('✓ Job created!')
                  setShowNewJob(false)
                  setNewJob({
                    clientName: '', clientPhone: '', address: '',
                    suburb: '', service: '', scope: '',
                    jobValue: '', estimatedCompletion: ''
                  })
                  if (session?.user?.tradieSlug) {
                    fetchJobs(session?.user?.tradieSlug)
                  }
                } else {
                  setToast('Failed to create job')
                }
                setTimeout(() => setToast(null), 3000)
              }}
              className="w-full bg-[#F97316] text-white font-bold py-3 rounded-xl text-sm"
            >
              Create Job
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface EditFieldProps {
  label: string
  value: string
  jobId: string
  field: string
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onChange: (val: string) => void
  editValue: string
  type?: string
  isTextarea?: boolean
  placeholder?: string
}

function EditField({
  label, value, isEditing, onEdit, onSave, onCancel, onChange, editValue,
  type = 'text', isTextarea, placeholder
}: EditFieldProps) {
  if (isEditing) {
    return (
      <div className="flex items-end justify-between gap-4">
        <label className="text-gray-400 text-sm shrink-0">{label}</label>
        <div className="flex-1 flex gap-2 items-end">
          {isTextarea ? (
            <textarea
              value={editValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || label}
              className="flex-1 bg-[#0F0F0F] border border-[#F97316] rounded px-3 py-2 text-white text-sm focus:outline-none"
              rows={3}
            />
          ) : (
            <input
              type={type}
              value={editValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || label}
              className="flex-1 bg-[#0F0F0F] border border-[#F97316] rounded px-3 py-2 text-white text-sm focus:outline-none"
            />
          )}
          <button
            onClick={onSave}
            className="text-green-400 font-bold text-sm hover:text-green-300">✓</button>
          <button
            onClick={onCancel}
            className="text-gray-400 font-bold text-sm hover:text-gray-300">✕</button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex items-start justify-between gap-4 cursor-pointer group"
      onClick={onEdit}
    >
      <span className="text-gray-400 text-sm shrink-0">{label}</span>
      <span className="text-white text-sm text-right group-hover:text-[#F97316] transition-colors">
        {value || '—'}
      </span>
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

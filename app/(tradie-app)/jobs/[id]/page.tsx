'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { STATUS_COLORS, JOB_STATUSES } from '@/lib/constants'
import { Job } from '@/lib/notion'

const PHASES = ['Scoping', 'Quoted', 'Scheduled', 'In Progress', 'Running Late', 'Complete']
const MATERIAL_STATUSES = ['Not Started', 'On Order', 'Arrived', 'In Use', 'Complete']

const STANDARD_TAPS = [
  { id: 'STARTING_TODAY', label: 'Starting Today', color: 'bg-green-600', desc: 'Kick off job comms' },
  { id: 'ON_THE_WAY', label: 'On The Way', color: 'bg-blue-600', desc: 'Heading to client' },
  { id: 'RUNNING_LATE', label: 'Running Late', color: 'bg-yellow-600', desc: 'Delay notification' },
  { id: 'PHASE_DONE', label: 'Phase Done', color: 'bg-purple-600', desc: 'Section complete' },
  { id: 'NEED_DECISION', label: 'Need Decision', color: 'bg-orange-600', desc: 'Client input needed' },
  { id: 'DAY_DONE', label: 'Day Done', color: 'bg-gray-600', desc: 'End of day wrap' },
  { id: 'JOB_COMPLETE', label: 'Job Complete', color: 'bg-emerald-600', desc: 'Final completion' },
  { id: 'VARIATION_REQUEST', label: 'Variation', color: 'bg-red-600', desc: 'Scope change' },
]

const TECHNICAL_TAPS = [
  { id: 'READY_FOR_INSPECTION', label: 'Ready for Inspection', color: 'bg-teal-600' },
  { id: 'AWAITING_MATERIALS', label: 'Awaiting Materials', color: 'bg-amber-700' },
  { id: 'ISSUE_ON_SITE', label: 'Issue on Site', color: 'bg-red-700' },
]

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const jobId = params.id as string

  console.log('Fetching job ID:', jobId)

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const [status, setStatus] = useState('')
  const [currentPhase, setCurrentPhase] = useState('')
  const [notes, setNotes] = useState('')
  const [materialsStatus, setMaterialsStatus] = useState('')
  const [errorData, setErrorData] = useState<any>(null)
  const [debugData, setDebugData] = useState<any>(null)

  useEffect(() => {
    if (!session?.user?.tradieConfigId) {
      setLoading(false)
      setError('Not authenticated')
      console.error('No tradie config ID in session', session)
      return
    }

    const fetchJob = async () => {
      try {
        console.log('Fetching job:', jobId)
        const res = await fetch(`/api/jobs/${jobId}`)
        console.log('API response status:', res.status)
        if (!res.ok) {
          const apiErrorData = await res.json()
          console.error('API error response:', apiErrorData)
          setErrorData(apiErrorData)
          setDebugData(apiErrorData)
          throw new Error(`API error (${res.status}): ${apiErrorData.error || apiErrorData.debug?.error || 'Unknown'}`)
        }
        const data = await res.json()
        console.log('Job data received:', data)
        setDebugData(data)
        setJob(data.job)
        setStatus(data.job.status || '')
        setCurrentPhase(data.job.currentPhase || '')
        setNotes(data.job.notes || '')
        setMaterialsStatus(data.job.materialsStatus || '')
        setError('')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('Failed to load job:', message)
        setError(`Failed to load job: ${message}`)
        if (!errorData) {
          setErrorData(err instanceof Error ? { message: err.message } : err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [jobId, session?.user?.tradieConfigId])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleTap = async (tapId: string) => {
    if (!job) return

    const message = `${tapId.replace(/_/g, ' ').toLowerCase()} — job: ${job.clientName}, client: ${job.clientName}, suburb: ${job.suburb}`

    try {
      const res = await fetch('/api/alfred', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          tradieId: 'joey',
        }),
      })
      const data = await res.json()
      showToast(data.reply || '✓ Done')
    } catch (err) {
      showToast('✓ Update sent')
    }
  }

  const handleSave = async () => {
    if (!job) return

    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          currentPhase,
          notes,
          materialsStatus,
        }),
      })

      if (!res.ok) throw new Error('Failed to update job')

      router.push('/jobs')
    } catch (err) {
      setError('Failed to save changes')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this job?')) return

    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete job')
      router.push('/jobs')
    } catch (err) {
      setError('Failed to delete job')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-[#1F2937] rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (!job) {
    return (
      <div style={{color:'white', padding:'20px'}}>
        <p>ID: {jobId}</p>
        <p>Raw response: {JSON.stringify(debugData)}</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top">
          {toast}
        </div>
      )}

      {/* Back button */}
      <Link
        href="/jobs"
        className="inline-flex items-center text-[#F97316] hover:text-[#C2580A] text-sm"
      >
        ← Back
      </Link>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm space-y-2">
          <p style={{color:'red', fontWeight: 'bold'}}>DEBUG ERROR:</p>
          <pre className="bg-red-900/50 p-2 rounded overflow-auto text-xs">
            {JSON.stringify(errorData || { error }, null, 2)}
          </pre>
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* Read-only info section */}
      <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151] space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">{job.clientName}</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[#9CA3AF] text-xs">Service</p>
            <p className="text-[#F9FAFB]">{job.service}</p>
          </div>
          <div>
            <p className="text-[#9CA3AF] text-xs">Suburb</p>
            <p className="text-[#F9FAFB]">{job.suburb}</p>
          </div>
          <div>
            <p className="text-[#9CA3AF] text-xs">Job Type</p>
            <p className="text-[#F9FAFB]">{job.jobType}</p>
          </div>
          <div>
            <p className="text-[#9CA3AF] text-xs">Foreman</p>
            <p className="text-[#F9FAFB]">{job.foreman || 'N/A'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[#9CA3AF] text-xs">Phone</p>
            <a href={`tel:${job.clientPhone}`} className="text-[#F97316] hover:text-[#C2580A]">
              {job.clientPhone}
            </a>
          </div>
        </div>
      </div>

      {/* Tap Buttons Section */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase mb-3">Send Update via ALFRED</p>
          <div className="grid grid-cols-2 gap-2">
            {STANDARD_TAPS.map(tap => (
              <button
                key={tap.id}
                onClick={() => handleTap(tap.id)}
                className={`${tap.color} text-white text-xs font-semibold py-3 px-2 rounded-lg text-center transition-opacity hover:opacity-90 active:opacity-70`}
              >
                {tap.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase mb-3">Technical Updates</p>
          <div className="grid grid-cols-1 gap-2">
            {TECHNICAL_TAPS.map(tap => (
              <button
                key={tap.id}
                onClick={() => handleTap(tap.id)}
                className={`${tap.color} text-white text-sm font-semibold py-2 px-3 rounded-lg text-center transition-opacity hover:opacity-90 active:opacity-70`}
              >
                {tap.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status - Dropdown backup */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#F9FAFB]">Status</label>
        <select
          value={status}
          onChange={async (e) => {
            const newStatus = e.target.value
            setStatus(newStatus)
            try {
              const res = await fetch('/api/orbit/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, status: newStatus }),
              })
              if (!res.ok) console.error('Failed to trigger webhook')
            } catch (err) {
              console.error('Webhook error:', err)
            }
          }}
          className="w-full px-4 py-3 h-12 bg-[#111827] border border-[#374151] rounded-lg text-[#F9FAFB] font-semibold text-base focus:outline-none focus:border-[#F97316] appearance-none flex items-center"
        >
          {JOB_STATUSES.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {status && (
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
            {status}
          </div>
        )}
      </div>

      {/* Current Phase */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#F9FAFB]">Current Phase</label>
        <select
          value={currentPhase}
          onChange={e => setCurrentPhase(e.target.value)}
          className="w-full px-3 py-3 h-12 bg-[#111827] border border-[#374151] rounded-lg text-[#F9FAFB] focus:outline-none focus:border-[#F97316] appearance-none flex items-center"
        >
          <option value="">Select a phase</option>
          {PHASES.map(phase => (
            <option key={phase} value={phase}>
              {phase}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#F9FAFB]">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full px-3 py-3 bg-[#111827] border border-[#374151] rounded-lg text-[#F9FAFB] focus:outline-none focus:border-[#F97316] min-h-32 resize-none"
          placeholder="Add notes about this job..."
        />
      </div>

      {/* Materials Status */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#F9FAFB]">Materials Status</label>
        <select
          value={materialsStatus}
          onChange={e => setMaterialsStatus(e.target.value)}
          className="w-full px-3 py-3 h-12 bg-[#111827] border border-[#374151] rounded-lg text-[#F9FAFB] focus:outline-none focus:border-[#F97316] appearance-none flex items-center"
        >
          <option value="">Select status</option>
          {MATERIAL_STATUSES.map(status => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Read-only system fields */}
      <div className="bg-[#111827] rounded-xl p-4 border border-[#374151]/50 space-y-3">
        <p className="text-xs text-[#9CA3AF] uppercase font-medium">Auto-updated by system</p>
        {job.lastMessageSent && (
          <div>
            <p className="text-[#9CA3AF] text-xs">Last Message Sent</p>
            <p className="text-[#F9FAFB] text-sm">
              {new Date(job.lastMessageSent).toLocaleDateString()}
            </p>
          </div>
        )}
        {job.nextAutoAction && (
          <div>
            <p className="text-[#9CA3AF] text-xs">Next Auto Action</p>
            <p className="text-[#F9FAFB] text-sm">{job.nextAutoAction}</p>
          </div>
        )}
      </div>

      {/* Buttons - Fixed bottom */}
      <div className="fixed bottom-[60px] left-0 right-0 p-4 bg-[#111827]/95 border-t border-[#374151] space-y-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-3 h-12 bg-[#F97316] text-white rounded-lg font-semibold hover:bg-[#C2580A] disabled:opacity-50 transition-all duration-200 ease focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316] flex items-center justify-center"
        >
          {saving ? 'Updating...' : 'Update Job'}
        </button>
        <button
          onClick={handleDelete}
          className="w-full px-4 py-3 h-12 bg-red-500/20 text-red-400 rounded-lg font-semibold hover:bg-red-500/30 transition flex items-center justify-center"
        >
          Delete Job
        </button>
      </div>
    </div>
  )
}

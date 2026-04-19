'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { STATUS_COLORS, JOB_STATUSES } from '@/lib/constants'
import { Job } from '@/lib/notion'

const PHASES = ['Scoping', 'Quoted', 'Scheduled', 'In Progress', 'Running Late', 'Complete']
const MATERIAL_STATUSES = ['Not Started', 'On Order', 'Arrived', 'In Use', 'Complete']

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [status, setStatus] = useState('')
  const [currentPhase, setCurrentPhase] = useState('')
  const [notes, setNotes] = useState('')
  const [materialsStatus, setMaterialsStatus] = useState('')

  useEffect(() => {
    if (!session?.user?.tradieConfigId) return

    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`)
        if (!res.ok) throw new Error('Failed to fetch job')
        const data = await res.json()
        setJob(data)
        setStatus(data.status)
        setCurrentPhase(data.currentPhase)
        setNotes(data.notes)
        setMaterialsStatus(data.materialsStatus)
      } catch (err) {
        setError('Failed to load job')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [jobId, session?.user?.tradieConfigId])

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

      router.push('/app/jobs')
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
      router.push('/app/jobs')
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
      <div className="p-4 text-center">
        <p className="text-[#9CA3AF]">Job not found</p>
        <Link href="/app/jobs" className="text-[#06B6D4] mt-4 inline-block">
          Back to Jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Back button */}
      <Link
        href="/app/jobs"
        className="inline-flex items-center text-[#06B6D4] hover:text-[#0891B2] text-sm"
      >
        ← Back
      </Link>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
          {error}
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
            <a href={`tel:${job.clientPhone}`} className="text-[#06B6D4] hover:text-[#0891B2]">
              {job.clientPhone}
            </a>
          </div>
        </div>
      </div>

      {/* Status - Main interaction */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#F9FAFB]">Status</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="w-full px-4 py-3 bg-[#111827] border border-[#06B6D4] rounded-lg text-[#F9FAFB] font-semibold text-lg focus:outline-none focus:border-[#0891B2] appearance-none"
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
          className="w-full px-3 py-2 bg-[#111827] border border-[#374151] rounded-lg text-[#F9FAFB] focus:outline-none focus:border-[#06B6D4]"
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
          className="w-full px-3 py-2 bg-[#111827] border border-[#374151] rounded-lg text-[#F9FAFB] focus:outline-none focus:border-[#06B6D4] min-h-24 resize-none"
          placeholder="Add notes about this job..."
        />
      </div>

      {/* Materials Status */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#F9FAFB]">Materials Status</label>
        <select
          value={materialsStatus}
          onChange={e => setMaterialsStatus(e.target.value)}
          className="w-full px-3 py-2 bg-[#111827] border border-[#374151] rounded-lg text-[#F9FAFB] focus:outline-none focus:border-[#06B6D4]"
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
          className="w-full px-4 py-3 bg-[#06B6D4] text-[#111827] rounded-lg font-semibold hover:bg-[#0891B2] disabled:opacity-50 transition"
        >
          {saving ? 'Updating...' : 'Update Job'}
        </button>
        <button
          onClick={handleDelete}
          className="w-full px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-semibold hover:bg-red-500/30 transition"
        >
          Delete Job
        </button>
      </div>
    </div>
  )
}

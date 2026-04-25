'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { STATUS_COLORS } from '@/lib/constants'
import { Job } from '@/lib/notion'
import { Plus, Filter } from 'lucide-react'

interface ApiJob extends Job {
  id: string
}

const STATUS_OPTIONS = ['SCHEDULED', 'IN PROGRESS', 'RUNNING LATE', 'COMPLETE', 'INVOICED']

export default function JobsPage() {
  const { data: session } = useSession()
  const [jobs, setJobs] = useState<ApiJob[]>([])
  const [filteredJobs, setFilteredJobs] = useState<ApiJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        setError(null)
        const tradieConfigId = session?.user?.tradieConfigId || 'joey-tradie'
        const res = await fetch(`/api/jobs?tradieConfigId=${tradieConfigId}`)
        if (!res.ok) {
          if (res.status === 401) {
            setError('Please log in to view jobs')
          } else {
            setError(`Error ${res.status}`)
          }
          setJobs([])
          return
        }
        const data = await res.json()
        if (!Array.isArray(data)) {
          setJobs([])
        } else {
          setJobs(data)
        }
      } catch (err) {
        console.error('Failed to fetch jobs:', err)
        setError('Unable to load jobs. Using demo mode.')
        setJobs([])
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [session?.user?.tradieConfigId])

  useEffect(() => {
    let filtered = selectedStatus ? jobs.filter(j => j?.status === selectedStatus) : jobs
    setFilteredJobs(filtered)
  }, [jobs, selectedStatus])

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4 pb-24">
        <div className="h-8 bg-[#1F2937] rounded w-32 animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-[#1F2937] rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error && jobs.length === 0) {
    return (
      <div className="px-4 py-6 pb-24">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p className="text-sm text-amber-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="px-4 md:px-8 py-6 space-y-6 pb-24">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#F9FAFB]">Jobs</h1>
              <p className="text-[#9CA3AF] text-sm">Your active projects</p>
            </div>
            <Link
              href="/jobs/new"
              className="inline-flex items-center justify-center w-12 h-12 bg-[#F97316] text-white rounded-lg hover:bg-[#C2580A] transition-all duration-200 ease focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316]"
            >
              <Plus size={20} />
            </Link>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-0 overflow-x-auto border-b border-[#374151] -mx-4 px-4">
            <button
              onClick={() => setSelectedStatus(null)}
              className={`px-4 py-3 text-sm font-semibold transition-all duration-200 ease whitespace-nowrap border-b-2 ${
                selectedStatus === null
                  ? 'border-[#F97316] text-white'
                  : 'border-transparent text-[#D1D5DB] hover:text-[#F9FAFB]'
              }`}
            >
              All
            </button>
            {STATUS_OPTIONS.map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-3 text-sm font-semibold transition-all duration-200 ease whitespace-nowrap border-b-2 ${
                  selectedStatus === status
                    ? 'border-[#F97316] text-white'
                    : 'border-transparent text-[#D1D5DB] hover:text-[#F9FAFB]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-3">
          {!filteredJobs || filteredJobs.length === 0 ? (
            <div className="bg-[#1F2937] rounded-lg p-8 border border-slate-700 text-center">
              <p className="text-[#9CA3AF] text-sm">{selectedStatus ? 'No jobs with this status' : 'No jobs assigned yet'}</p>
            </div>
          ) : (
            filteredJobs.map(job => {
              if (!job?.id) return null
              const status = job?.status || 'UNKNOWN'
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block bg-[#1F2937] rounded-lg p-5 border border-[#374151] hover:bg-[#111827] hover:shadow-[0_4px_12px_rgba(249,115,22,0.1)] hover:border-l-4 hover:border-[#F97316] transition-all duration-200 ease"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <h3 className="text-sm font-semibold text-[#F9FAFB]">{job?.clientName || 'Unnamed'}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[status] || 'bg-gray-500/10 text-gray-400'}`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-xs text-[#9CA3AF]">
                      {job?.service || 'Service'} • {job?.suburb || 'Location'}
                    </p>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { STATUS_COLORS, JOB_STATUSES } from '@/lib/constants'
import { Job } from '@/lib/notion'

interface ApiJob extends Job {
  id: string
}

const JOB_TYPES = ['Residential Direct', 'Commercial via Builder']
const PHASES = ['Scoping', 'Quoted', 'Scheduled', 'In Progress', 'Running Late', 'Complete']
const MATERIAL_STATUSES = ['Not Started', 'On Order', 'Arrived', 'In Use', 'Complete']

export default function JobsPage() {
  const { data: session } = useSession()
  const [jobs, setJobs] = useState<ApiJob[]>([])
  const [filteredJobs, setFilteredJobs] = useState<ApiJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [jobTypeFilter, setJobTypeFilter] = useState<string[]>([])
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showJobTypeDropdown, setShowJobTypeDropdown] = useState(false)

  useEffect(() => {
    if (!session?.user?.tradieConfigId) return

    const fetchJobs = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/jobs?tradieConfigId=${session?.user?.tradieConfigId}`)
        if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`)
        const data = await res.json()
        setJobs(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch jobs:', err)
        setError(err instanceof Error ? err.message : 'Failed to load jobs')
        setJobs([])
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [session?.user?.tradieConfigId])

  useEffect(() => {
    let filtered = jobs

    if (statusFilter.length > 0) {
      filtered = filtered.filter(job => statusFilter.includes(job.status))
    }

    if (jobTypeFilter.length > 0) {
      filtered = filtered.filter(job => jobTypeFilter.includes(job.jobType))
    }

    setFilteredJobs(filtered)
  }, [jobs, statusFilter, jobTypeFilter])

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  const toggleJobTypeFilter = (type: string) => {
    setJobTypeFilter(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const resetFilters = () => {
    setStatusFilter([])
    setJobTypeFilter([])
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 bg-[#1F2937] rounded w-24 animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-[#1F2937] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-400">
          <p className="font-semibold">Error loading jobs</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 pb-4">
      {/* Header with filters and button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown)
                setShowJobTypeDropdown(false)
              }}
              className="px-3 py-2 bg-[#1F2937] border border-[#374151] rounded-lg text-sm text-[#F9FAFB] hover:bg-[#374151] transition"
            >
              Status {statusFilter.length > 0 && `(${statusFilter.length})`}
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-[#111827] border border-[#374151] rounded-lg shadow-lg z-10 min-w-48 max-h-64 overflow-y-auto">
                {JOB_STATUSES.filter(s => s !== 'COMPLETE' && s !== 'PAID').map(status => (
                  <label key={status} className="flex items-center px-4 py-2 hover:bg-[#1F2937] cursor-pointer border-b border-[#374151] last:border-b-0">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(status)}
                      onChange={() => toggleStatusFilter(status)}
                      className="mr-2 w-4 h-4"
                    />
                    <span className="text-sm">{status}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Job Type Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowJobTypeDropdown(!showJobTypeDropdown)
                setShowStatusDropdown(false)
              }}
              className="px-3 py-2 bg-[#1F2937] border border-[#374151] rounded-lg text-sm text-[#F9FAFB] hover:bg-[#374151] transition"
            >
              Type {jobTypeFilter.length > 0 && `(${jobTypeFilter.length})`}
            </button>
            {showJobTypeDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-[#111827] border border-[#374151] rounded-lg shadow-lg z-10 min-w-48">
                {JOB_TYPES.map(type => (
                  <label key={type} className="flex items-center px-4 py-2 hover:bg-[#1F2937] cursor-pointer border-b border-[#374151] last:border-b-0">
                    <input
                      type="checkbox"
                      checked={jobTypeFilter.includes(type)}
                      onChange={() => toggleJobTypeFilter(type)}
                      className="mr-2 w-4 h-4"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Reset button */}
          {(statusFilter.length > 0 || jobTypeFilter.length > 0) && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-xs text-[#9CA3AF] hover:text-[#F9FAFB] transition"
            >
              Reset
            </button>
          )}
        </div>

        {/* New Job button */}
        <Link
          href="/jobs/new"
          className="px-4 py-2 bg-[#06B6D4] text-[#111827] rounded-lg text-sm font-semibold hover:bg-[#0891B2] transition"
        >
          + New
        </Link>
      </div>

      {/* Job cards with safety check */}
      <div className="space-y-3">
        {Array.isArray(filteredJobs) && filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block bg-[#1F2937] rounded-xl p-4 border border-[#374151] hover:border-[#06B6D4] transition cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-base font-bold text-[#F9FAFB]">{job.clientName}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[job.status]}`}>
                    {job.status}
                  </span>
                </div>

                <p className="text-sm text-[#9CA3AF]">
                  {job.service} • {job.suburb}
                </p>

                <div className="flex gap-2 flex-wrap">
                  {job.jobType && (
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                      {job.jobType}
                    </span>
                  )}
                </div>

                <div className="text-xs text-[#6B7280] space-y-0.5">
                  {job.foreman && <p>Foreman: {job.foreman}</p>}
                  {job.lastMessageSent && (
                    <p>Last msg: {new Date(job.lastMessageSent).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="bg-[#1F2937] rounded-xl p-6 border border-[#374151] text-center">
            <p className="text-[#9CA3AF]">No jobs match your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

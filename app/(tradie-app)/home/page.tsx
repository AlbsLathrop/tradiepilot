'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DashboardData {
  activeJobs: number
  inProgressJobs: number
  scheduledJobs: number
  behindScheduleJobs: number
  completeJobs: number
  monthRevenue: number
  monthInvoiced: number
  monthPaid: number
  newLeads: number
  qualifiedLeads: number
  smsSentToday: number
  smsThisWeek: number
  reviewCount: number
  reviewRating: number | null
  attentionJobs: Array<{ id: string; clientName: string; suburb: string; status: string }>
  todayJobs: Array<{ id: string; clientName: string; suburb: string; service: string; status: string }>
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const [dashData, setDashData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') return
    const slug = session?.user?.tradieSlug
    if (!slug) return

    fetch(`/api/dashboard?tradieSlug=${slug}`)
      .then(r => r.json())
      .then(data => {
        setDashData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('[HOME] Fetch error:', err)
        setLoading(false)
      })
  }, [status, session?.user?.tradieSlug])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (status === 'loading' || loading) {
    return <LoadingSkeleton />
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (!dashData) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex items-center justify-center">
        <p className="text-gray-400">Unable to load dashboard</p>
      </div>
    )
  }

  const businessName = session?.user?.name || 'Tradie'

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white pb-24">
      {/* Header */}
      <div className="px-4 pt-8 pb-6 border-l-4 border-[#F97316]">
        <p className="text-gray-400 text-sm">{greeting()},</p>
        <h1 className="text-3xl font-bold mt-1">{businessName}</h1>
        <p className="text-gray-500 text-sm mt-2">
          {new Date().toLocaleDateString('en-AU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </p>
      </div>

      <div className="px-4 space-y-4">
        {/* Row 1: Active Jobs + Monthly Revenue */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/jobs">
            <div className="bg-[#1F2937] rounded-xl p-5 cursor-pointer hover:bg-[#252f3f] transition-colors">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-3">
                Active Jobs
              </p>
              <p className="text-4xl font-bold text-[#F97316]">
                {dashData.activeJobs}
              </p>
              <p className="text-gray-400 text-xs mt-2">
                {dashData.inProgressJobs} in progress
              </p>
              <StatusBar
                segments={[
                  { label: 'Scheduled', count: dashData.scheduledJobs, color: 'bg-blue-500' },
                  { label: 'In Progress', count: dashData.inProgressJobs, color: 'bg-cyan-500' },
                  { label: 'Behind', count: dashData.behindScheduleJobs, color: 'bg-red-500' }
                ]}
              />
            </div>
          </Link>

          <button
            onClick={() => setShowRevenueBreakdown(!showRevenueBreakdown)}
            className="bg-[#1F2937] rounded-xl p-5 text-left hover:bg-[#252f3f] transition-colors">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-3">
              Monthly Revenue
            </p>
            <p className="text-4xl font-bold text-white">
              ${(dashData.monthRevenue || 0).toLocaleString()}
            </p>
            <p className="text-gray-400 text-xs mt-2">
              {dashData.monthInvoiced > 0 ? `${dashData.monthInvoiced > 0 ? '✓' : ''} Invoiced · Paid` : 'Tap for details'}
            </p>
          </button>
        </div>

        {/* Revenue Breakdown */}
        {showRevenueBreakdown && (
          <div className="bg-[#1F2937] rounded-xl p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Invoiced</span>
              <span className="text-white font-bold">${(dashData.monthInvoiced || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Paid</span>
              <span className="text-green-400 font-bold">${(dashData.monthPaid || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Outstanding</span>
              <span className="text-yellow-400 font-bold">${((dashData.monthInvoiced || 0) - (dashData.monthPaid || 0)).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Row 2: New Leads + Reviews */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/leads">
            <div className="bg-[#1F2937] rounded-xl p-5 cursor-pointer hover:bg-[#252f3f] transition-colors">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-3">
                New Leads
              </p>
              <p className="text-4xl font-bold text-green-400">
                {dashData.newLeads}
              </p>
              <p className="text-gray-400 text-xs mt-2">
                {dashData.qualifiedLeads} qualified this week
              </p>
            </div>
          </Link>

          <div className="bg-[#1F2937] rounded-xl p-5">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-3">
              Google Reviews
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold">
                {dashData.reviewRating ? `${dashData.reviewRating.toFixed(1)}⭐` : '—'}
              </p>
            </div>
            <p className="text-gray-400 text-xs mt-2">
              {dashData.reviewCount} review{dashData.reviewCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Row 3: SMS */}
        <div className="bg-[#1F2937] rounded-xl p-5">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-3">
            SMS Sent Today
          </p>
          <p className="text-4xl font-bold text-blue-400">
            {dashData.smsSentToday}
          </p>
          <p className="text-gray-400 text-xs mt-2">
            {dashData.smsThisWeek} sent this week • by ALFRED
          </p>
        </div>

        {/* Attention Jobs */}
        {dashData.attentionJobs?.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4">
            <p className="text-red-400 text-xs font-bold uppercase mb-3">
              ⚠️ Needs Attention
            </p>
            <div className="space-y-2">
              {dashData.attentionJobs.map(job => (
                <Link key={job.id} href={`/jobs?expand=${job.id}`}>
                  <div className="flex justify-between items-center cursor-pointer hover:bg-red-500/5 p-2 rounded transition-colors">
                    <span className="text-white text-sm">{job.clientName}</span>
                    <span className="text-red-400 text-xs">
                      {job.suburb} • {job.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Today's Jobs */}
        <div className="bg-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#F97316] text-xs font-bold uppercase">
              Today's Jobs
            </p>
            <Link href="/jobs" className="text-gray-400 hover:text-white text-xs transition-colors">
              View all →
            </Link>
          </div>
          {dashData.todayJobs?.length > 0 ? (
            <div className="space-y-2">
              {dashData.todayJobs.map(job => (
                <Link key={job.id} href={`/jobs?expand=${job.id}`}>
                  <div className="flex justify-between items-center cursor-pointer hover:bg-[#1a2332] p-2 rounded transition-colors">
                    <div>
                      <p className="text-white text-sm font-medium">{job.clientName}</p>
                      <p className="text-gray-400 text-xs">{job.suburb}</p>
                    </div>
                    {job.service && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#0F0F0F] text-[#F97316]">
                        {job.service}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No jobs scheduled today</p>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white pb-24">
      <div className="px-4 pt-8 pb-6 space-y-2">
        <div className="h-4 bg-[#1F2937] rounded w-32 animate-pulse" />
        <div className="h-8 bg-[#1F2937] rounded w-48 animate-pulse" />
        <div className="h-4 bg-[#1F2937] rounded w-40 animate-pulse mt-4" />
      </div>
      <div className="px-4 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-[#1F2937] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}

interface StatusSegment {
  label: string
  count: number
  color: string
}

function StatusBar({ segments }: { segments: StatusSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0)
  if (total === 0) return null

  return (
    <div className="flex gap-1 mt-3 h-1.5 rounded-full overflow-hidden bg-[#0F0F0F]">
      {segments.map((seg, i) => (
        <div
          key={i}
          className={`${seg.color}`}
          style={{ width: `${(seg.count / total) * 100}%` }}
          title={`${seg.label}: ${seg.count}`}
        />
      ))}
    </div>
  )
}

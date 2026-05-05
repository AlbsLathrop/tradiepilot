'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface DashboardData {
  activeJobs: number
  inProgressJobs: number
  runningLate: Array<{ id: string; clientName: string; suburb: string }>
  todayJobs: Array<{ id: string; clientName: string; suburb: string; status: string }>
  newLeads: number
  qualifiedLeads: number
  monthRevenue: number
  smsSentToday: number
  lastComm: { message: string; recipient: string; time: string } | null
  avgScore?: number | null
  reviewCount?: number
}

export default function HomePage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNotifBanner, setShowNotifBanner] = useState(
    typeof window !== 'undefined' && 'Notification' in window &&
    Notification.permission === 'default'
  )

  useEffect(() => {
    if (!session?.user?.tradieSlug) {
      return
    }

    Promise.all([
      fetch(`/api/dashboard?tradieSlug=${session.user.tradieSlug}`).then(r => r.json()),
      fetch(`/api/satisfaction?tradieSlug=${session.user.tradieSlug}`).then(r => r.json())
    ])
      .then(([dashData, satData]) => {
        setData({
          ...dashData,
          avgScore: satData.average,
          reviewCount: satData.count
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [session?.user?.tradieSlug])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white pb-24">
      <div className="px-4 pt-8 pb-4">
        <p className="text-gray-400 text-sm">{greeting()},</p>
        <h1 className="text-3xl font-bold text-white mt-1">{session?.user?.name || 'Tradie'} 👷</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-AU', {
            weekday: 'long', day: 'numeric', month: 'long'
          })}
        </p>
      </div>

      {loading && (
        <div className="px-4 space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-[#111827] rounded-xl h-24
            animate-pulse" />
          ))}
        </div>
      )}

      {!loading && data && (
        <div className="px-4 space-y-4">

          {/* NOTIFICATION PERMISSION BANNER */}
          {showNotifBanner && (
            <div className="bg-[#1F2937] border border-[#F97316]
            rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-bold">
                  Enable Notifications
                </p>
                <p className="text-gray-400 text-xs">
                  Get alerts for new leads and client replies
                </p>
              </div>
              <button
                onClick={async () => {
                  const permission = await Notification.requestPermission()
                  if (permission === 'granted') {
                    const reg = await navigator.serviceWorker.ready
                    const sub = await reg.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: process.env
                        .NEXT_PUBLIC_VAPID_PUBLIC_KEY
                    })
                    await fetch('/api/push/subscribe', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(sub)
                    })
                    setShowNotifBanner(false)
                  }
                }}
                className="bg-[#F97316] text-white text-xs font-bold
                px-4 py-2 rounded-lg whitespace-nowrap ml-4"
              >
                Allow
              </button>
            </div>
          )}

          {/* URGENT ALERT */}
          {data.runningLate?.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/40
            rounded-xl p-4">
              <p className="text-red-400 text-xs font-bold uppercase mb-2">
                ⚠️ Needs Attention
              </p>
              {data.runningLate.map((job) => (
                <div key={job.id} className="flex justify-between
                items-center py-1">
                  <span className="text-white text-sm">{job.clientName}</span>
                  <span className="text-red-400 text-xs">
                    {job.suburb} • RUNNING LATE
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* STATS ROW */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/jobs">
              <div className="bg-[#111827] border-l-4 border-[#F97316] rounded-xl p-5 cursor-pointer
              active:opacity-70">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">
                  Active Jobs
                </p>
                <p className="text-5xl font-bold text-[#F97316]">
                  {data.activeJobs ?? 0}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  {data.inProgressJobs ?? 0} in progress
                </p>
              </div>
            </Link>
            <Link href="/leads">
              <div className="bg-[#111827] border-l-4 border-[#F97316] rounded-xl p-5 cursor-pointer
              active:opacity-70">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">
                  New Leads
                </p>
                <p className="text-5xl font-bold text-green-400">
                  {data.newLeads ?? 0}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  {data.qualifiedLeads ?? 0} qualified
                </p>
              </div>
            </Link>
            <div className="bg-[#111827] border-l-4 border-[#F97316] rounded-xl p-5 col-span-2">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">
                Monthly Revenue
              </p>
              <p className="text-5xl font-bold text-white">
                ${(data.monthRevenue ?? 0).toLocaleString()}
              </p>
              <p className="text-gray-500 text-xs mt-2">jobs invoiced & paid</p>
            </div>
            <div className="bg-[#111827] border-l-4 border-[#F97316] rounded-xl p-5 cursor-pointer
              active:opacity-70">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">
                SMS Sent Today
              </p>
              <p className="text-5xl font-bold text-blue-400">
                {data.smsSentToday ?? 0}
              </p>
              <p className="text-gray-500 text-xs mt-2">sent by ALFRED</p>
            </div>
            <div className="bg-[#111827] border-l-4 border-[#F97316] rounded-xl p-5">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">
                Satisfaction
              </p>
              <p className="text-5xl font-bold text-yellow-400">
                {data.avgScore ? `${data.avgScore}⭐` : '—'}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                {data.reviewCount ?? 0} reviews
              </p>
            </div>
          </div>

          {/* TODAY'S JOBS */}
          {data.todayJobs?.length > 0 && (
            <div className="bg-[#111827] rounded-xl p-4">
              <p className="text-[#F97316] text-xs font-bold uppercase mb-3">
                On Site Today
              </p>
              <div className="space-y-2">
                {data.todayJobs.map((job) => (
                  <div key={job.id} className="flex justify-between
                  items-center">
                    <div>
                      <p className="text-white text-sm font-medium">
                        {job.clientName}
                      </p>
                      <p className="text-gray-400 text-xs">{job.suburb}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1
                    rounded-full ${
                      job.status === 'RUNNING LATE'
                        ? 'bg-red-500 text-white'
                        : 'bg-orange-500 text-white'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUICK ACCESS */}
          <div className="bg-[#111827] rounded-xl p-4">
            <p className="text-[#F97316] text-xs font-bold uppercase mb-3">
              Quick Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/chat" className="bg-[#0F0F0F] border
              border-[#F97316] text-[#F97316] text-xs font-bold py-3
              rounded-lg text-center">
                🧠 Ask ALFRED
              </Link>
              <Link href="/jobs" className="bg-[#0F0F0F] border
              border-gray-600 text-white text-xs font-bold py-3
              rounded-lg text-center">
                💼 All Jobs
              </Link>
              <Link href="/leads" className="bg-[#0F0F0F] border
              border-gray-600 text-white text-xs font-bold py-3
              rounded-lg text-center">
                🎯 Leads
              </Link>
              <Link href="/settings" className="bg-[#0F0F0F] border
              border-gray-600 text-white text-xs font-bold py-3
              rounded-lg text-center">
                ⚙️ Settings
              </Link>
            </div>
          </div>

          {/* LAST ALFRED MESSAGE */}
          {data.lastComm && (
            <div className="bg-[#111827] rounded-xl p-4">
              <p className="text-[#F97316] text-xs font-bold uppercase mb-2">
                Last ALFRED Message
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">
                &ldquo;{data.lastComm.message}&rdquo;
              </p>
              <p className="text-gray-500 text-xs mt-2">
                → {data.lastComm.recipient} • {data.lastComm.time}
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

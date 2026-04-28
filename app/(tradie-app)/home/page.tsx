'use client'

import { useState, useEffect } from 'react'
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
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

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
        <h1 className="text-3xl font-bold text-white mt-1">Joey 👷</h1>
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
              <div className="bg-[#111827] rounded-xl p-4 cursor-pointer
              active:opacity-70">
                <p className="text-gray-400 text-xs uppercase mb-1">
                  Active Jobs
                </p>
                <p className="text-3xl font-bold text-[#F97316]">
                  {data.activeJobs ?? 0}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {data.inProgressJobs ?? 0} in progress
                </p>
              </div>
            </Link>
            <Link href="/leads">
              <div className="bg-[#111827] rounded-xl p-4 cursor-pointer
              active:opacity-70">
                <p className="text-gray-400 text-xs uppercase mb-1">
                  New Leads
                </p>
                <p className="text-3xl font-bold text-green-400">
                  {data.newLeads ?? 0}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {data.qualifiedLeads ?? 0} qualified
                </p>
              </div>
            </Link>
            <div className="bg-[#111827] rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase mb-1">
                Month Revenue
              </p>
              <p className="text-2xl font-bold text-white">
                ${(data.monthRevenue ?? 0).toLocaleString()}
              </p>
              <p className="text-gray-500 text-xs mt-1">jobs invoiced</p>
            </div>
            <div className="bg-[#111827] rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase mb-1">
                SMS Sent Today
              </p>
              <p className="text-3xl font-bold text-blue-400">
                {data.smsSentToday ?? 0}
              </p>
              <p className="text-gray-500 text-xs mt-1">by ALFRED</p>
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

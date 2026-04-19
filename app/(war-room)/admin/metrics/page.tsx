export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Suspense } from 'react'
import { getActiveJobs, getRecentLeads } from '@/lib/notion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'

function DateDisplay() {
  return <div className="text-xs text-[#F9FAFB]/50 mt-1">{new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
}

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

export default async function MetricsPage() {
  const [jobs, leads] = await Promise.all([
    getActiveJobs(),
    getRecentLeads(500),
  ])

  const weekStart = getWeekStart()
  const leadsThisWeek = leads.filter(
    (l) => l.receivedDate !== null && new Date(l.receivedDate) >= weekStart
  ).length

  const completedJobs = jobs.filter((j) => j.status === 'COMPLETE').length
  const invoicedJobs = jobs.filter((j) => j.status === 'INVOICED').length
  const paidJobs = jobs.filter((j) => j.status === 'PAID').length
  const avgJobsPerWeek = (jobs.length / 4).toFixed(1)

  const metrics = [
    { label: 'Completed Jobs', value: completedJobs },
    { label: 'Invoiced Jobs', value: invoicedJobs },
    { label: 'Paid Jobs', value: paidJobs },
    { label: 'Avg Jobs/Week', value: avgJobsPerWeek },
    { label: 'Leads This Week', value: leadsThisWeek },
    { label: 'Total Leads', value: leads.length },
  ]

  return (
    <main className="min-h-screen bg-[#111827] p-4 text-[#F9FAFB]">
      <div className="mb-6">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-1 text-sm text-[#06B6D4] hover:underline transition-all mb-4">
          <ChevronLeft size={16} />
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-center">Metrics</h1>
        <Suspense fallback={<div className="text-xs text-[#F9FAFB]/30 mt-1 text-center">Loading...</div>}>
          <DateDisplay />
        </Suspense>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {metrics.map((metric) => (
          <Card key={metric.label} className="rounded-lg bg-slate-900 border border-cyan-500">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-[10px] font-medium text-[#F9FAFB]/60 uppercase tracking-wider">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <p className="text-lg font-bold text-cyan-400">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}

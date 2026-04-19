export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { getActiveJobs, getRecentLeads } from '@/lib/notion'
import { STATUS_COLORS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

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

export default async function DashboardPage() {
  const [jobs, leads] = await Promise.all([
    getActiveJobs(),
    getRecentLeads(100),
  ])

  const weekStart = getWeekStart()
  const leadsThisWeek = leads.filter(
    (l) => l.receivedDate !== null && new Date(l.receivedDate) >= weekStart
  ).length

  const agentsRunning = jobs.filter(
    (j) => j.status === 'IN PROGRESS' || j.status === 'RUNNING LATE'
  ).length

  const timeSaved = (jobs.length * 2.5).toFixed(0)

  const kpis = [
    { label: 'Active Jobs', value: jobs.length },
    { label: 'Leads This Week', value: leadsThisWeek },
    { label: 'Agents Running', value: agentsRunning },
    { label: 'Time Saved', value: `${timeSaved}h` },
  ]

  return (
    <main className="min-h-screen bg-[#111827] p-4 text-[#F9FAFB]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center">War Room</h1>
        <Suspense fallback={<div className="text-xs text-[#F9FAFB]/30 mt-1 text-center">Loading...</div>}>
          <DateDisplay />
        </Suspense>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="rounded-lg bg-slate-900 border border-cyan-500 h-32">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-[10px] font-medium text-[#F9FAFB]/60 uppercase tracking-wider">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <p className="text-3xl font-bold text-cyan-400">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        <Card className="rounded-lg bg-slate-900 border border-[#06B6D4]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#F9FAFB]">Active Jobs</CardTitle>
          </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent h-8">
                <TableHead className="text-[#F9FAFB]/40 font-medium text-xs">Client</TableHead>
                <TableHead className="text-[#F9FAFB]/40 font-medium text-xs">Status</TableHead>
                <TableHead className="text-[#F9FAFB]/40 font-medium text-xs">Suburb</TableHead>
                <TableHead className="text-[#F9FAFB]/40 font-medium text-xs">Service</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={4} className="text-center text-[#F9FAFB]/30 py-4">
                    No active jobs
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id} className="border-white/5 hover:bg-white/[0.02] h-9">
                    <TableCell className="font-medium text-sm py-2">{job.clientName}</TableCell>
                    <TableCell className="py-2">
                      <Badge
                        variant="outline"
                        className={`px-1.5 py-0 rounded-full text-[10px] font-medium uppercase ${STATUS_COLORS[job.status] ?? ''}`}
                      >
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#F9FAFB]/70 text-sm py-2">{job.suburb}</TableCell>
                    <TableCell className="text-[#F9FAFB]/70 text-sm py-2">{job.service}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        </Card>
      </div>
    </main>
  )
}

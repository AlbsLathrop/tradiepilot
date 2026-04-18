export const dynamic = 'force-dynamic'

import { getActiveJobs, getRecentLeads } from '@/lib/notion'
import { STATUS_COLORS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

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
    <main className="min-h-screen bg-[#111827] p-8 text-[#F9FAFB]">
      <h1 className="text-4xl font-bold mb-16 text-center">War Room</h1>

      <div className="max-w-6xl mx-auto grid grid-cols-2 gap-8 md:grid-cols-4 mb-16">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="rounded-xl bg-slate-900 border-2 border-cyan-500">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-medium text-[#F9FAFB]/60 uppercase tracking-wider">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <p className="text-5xl font-bold text-cyan-400">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        <Card className="rounded-xl bg-slate-900 border border-[#06B6D4]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#F9FAFB]">Active Jobs</CardTitle>
          </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[#F9FAFB]/40 font-medium">Client</TableHead>
                <TableHead className="text-[#F9FAFB]/40 font-medium">Status</TableHead>
                <TableHead className="text-[#F9FAFB]/40 font-medium">Suburb</TableHead>
                <TableHead className="text-[#F9FAFB]/40 font-medium">Service</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={4} className="text-center text-[#F9FAFB]/30 py-8">
                    No active jobs
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="font-medium">{job.customerName || job.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${STATUS_COLORS[job.status] ?? ''}`}
                      >
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#F9FAFB]/70">{job.suburb}</TableCell>
                    <TableCell className="text-[#F9FAFB]/70">{job.name}</TableCell>
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

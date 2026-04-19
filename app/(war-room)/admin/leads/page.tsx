export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Suspense } from 'react'
import { getRecentLeads } from '@/lib/notion'
import { STATUS_COLORS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft } from 'lucide-react'

function DateDisplay() {
  return <div className="text-xs text-[#F9FAFB]/50 mt-1">{new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
}

function getLeadsByStatus(leads: any[], status: string) {
  return leads.filter(lead => lead.status === status)
}

export default async function LeadsPage() {
  const leads = await getRecentLeads(500)

  const statusGroups = {
    'QUALIFIED': getLeadsByStatus(leads, 'QUALIFIED'),
    'PENDING DECLINE': getLeadsByStatus(leads, 'PENDING DECLINE'),
    'DECLINED': getLeadsByStatus(leads, 'DECLINED'),
    'COLD': getLeadsByStatus(leads, 'COLD'),
  }

  return (
    <main className="min-h-screen bg-[#111827] p-4 text-[#F9FAFB]">
      <div className="mb-6">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-1 text-sm text-[#06B6D4] hover:underline transition-all mb-4">
          <ChevronLeft size={16} />
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-center">Leads</h1>
        <Suspense fallback={<div className="text-xs text-[#F9FAFB]/30 mt-1 text-center">Loading...</div>}>
          <DateDisplay />
        </Suspense>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {Object.entries(statusGroups).map(([status, statusLeads]) => (
          <div key={status}>
            <h2 className="text-lg font-semibold text-[#F9FAFB] mb-4">{status} ({statusLeads.length})</h2>
            <Card className="rounded-lg bg-slate-900 border border-[#06B6D4]">
              <CardContent className="p-0">
                {statusLeads.length === 0 ? (
                  <div className="text-center text-[#F9FAFB]/30 py-6">No leads in this status</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent h-8">
                        <TableHead className="text-[#F9FAFB]/40 font-medium text-xs">Name</TableHead>
                        <TableHead className="text-[#F9FAFB]/40 font-medium text-xs">Status</TableHead>
                        <TableHead className="text-[#F9FAFB]/40 font-medium text-xs">Phone</TableHead>
                        <TableHead className="text-[#F9FAFB]/40 font-medium text-xs">Service</TableHead>
                        <TableHead className="text-[#F9FAFB]/40 font-medium text-xs">Suburb</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statusLeads.map((lead) => (
                        <TableRow key={lead.id} className="border-white/5 hover:bg-white/[0.02] h-9">
                          <TableCell className="font-medium text-sm py-2">{lead.name}</TableCell>
                          <TableCell className="py-2">
                            <Badge
                              variant="outline"
                              className={`px-1.5 py-0 rounded-full text-[10px] font-medium uppercase ${STATUS_COLORS[lead.status] ?? ''}`}
                            >
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[#F9FAFB]/70 text-sm py-2">{lead.phone}</TableCell>
                          <TableCell className="text-[#F9FAFB]/70 text-sm py-2">{lead.service}</TableCell>
                          <TableCell className="text-[#F9FAFB]/70 text-sm py-2">{lead.suburb}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </main>
  )
}

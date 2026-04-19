interface ReportStats {
  leadsResponded: number
  followUpsSent: number
  clientUpdates: number
  reviewsRequested: number
  messagesSent: number
  responseRate: string
  avgResponseTime: string
  timeSaved: string
}

async function getReportStats(): Promise<ReportStats> {
  try {
    // TODO: Fetch real data from Notion
    return {
      leadsResponded: 0,
      followUpsSent: 0,
      clientUpdates: 0,
      reviewsRequested: 0,
      messagesSent: 12,
      responseRate: '85%',
      avgResponseTime: '2.3h',
      timeSaved: '8.5h',
    }
  } catch (error) {
    console.error('Failed to fetch report stats:', error)
    return {
      leadsResponded: 0,
      followUpsSent: 0,
      clientUpdates: 0,
      reviewsRequested: 0,
      messagesSent: 0,
      responseRate: '0%',
      avgResponseTime: '0h',
      timeSaved: '0h',
    }
  }
}

export default async function ReportPage() {
  const stats = await getReportStats()
  const weekStart = new Date('2026-04-14')
  const weekEnd = new Date('2026-04-20')

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#F9FAFB]">Report</h1>
        <p className="text-[#9CA3AF]">Your automation performance</p>
      </div>

      {/* Week Card */}
      <div className="border-l-4 border-[#06B6D4] bg-[#1F2937] rounded-xl p-4 space-y-1">
        <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">This Week</p>
        <p className="text-lg font-semibold text-[#F9FAFB]">
          {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* FIXER Weekly Log Stats */}
      {stats ? (
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-[#F9FAFB]">FIXER Weekly Log</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Leads Responded</p>
              <p className="text-3xl font-bold text-[#06B6D4]">{stats?.leadsResponded ?? 0}</p>
            </div>
            <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Follow-ups Sent</p>
              <p className="text-3xl font-bold text-[#F9FAFB]">{stats?.followUpsSent ?? 0}</p>
            </div>
            <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Client Updates</p>
              <p className="text-3xl font-bold text-[#F9FAFB]">{stats?.clientUpdates ?? 0}</p>
            </div>
            <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Reviews Requested</p>
              <p className="text-3xl font-bold text-[#F9FAFB]">{stats?.reviewsRequested ?? 0}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Automation Performance */}
      {stats ? (
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-[#F9FAFB]">Automation Performance</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Messages Sent</p>
              <p className="text-3xl font-bold text-[#F9FAFB]">{stats?.messagesSent ?? 0}</p>
            </div>
            <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Response Rate</p>
              <p className="text-3xl font-bold text-[#06B6D4]">{stats?.responseRate ?? '0%'}</p>
            </div>
            <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Avg Response Time</p>
              <p className="text-3xl font-bold text-[#F9FAFB]">{stats?.avgResponseTime ?? '0h'}</p>
            </div>
            <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Time Saved</p>
              <p className="text-3xl font-bold text-[#06B6D4]">{stats?.timeSaved ?? '0h'}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Insights Section */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-[#F9FAFB]">Insights</h2>
        <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151] space-y-2">
          <p className="text-sm text-[#F9FAFB]">✓ You&apos;re responding 15% faster than last week</p>
          <p className="text-sm text-[#F9FAFB]">✓ FIXER helped with 8 lead responses</p>
          <p className="text-sm text-[#9CA3AF]">→ Reply to 2 pending quotes to increase conversion</p>
        </div>
      </div>
    </div>
  )
}

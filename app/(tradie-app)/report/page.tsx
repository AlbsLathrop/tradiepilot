export default function ReportPage() {
  const weekStart = new Date('2026-04-14')
  const weekEnd = new Date('2026-04-20')

  const stats = {
    leadsResponded: 8,
    followUpsSent: 3,
    clientUpdates: 5,
    reviewsRequested: 2,
    messagesSent: 12,
    responseRate: '85%',
    avgResponseTime: '2.3h',
    timeSaved: '8.5h',
  }

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Report</h1>
          <p className="text-[#9CA3AF] text-sm">Your FIXER performance this week</p>
        </div>

        {/* Week Highlight */}
        <div className="bg-[#1F2937] rounded-lg p-4 border-l-4 border-[#06B6D4] border border-slate-700 space-y-1">
          <p className="text-xs text-[#9CA3AF] uppercase tracking-wider font-medium">This Week</p>
          <p className="text-lg font-bold text-[#F9FAFB]">
            {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* FIXER Weekly Log */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#F9FAFB] uppercase tracking-wider">FIXER Weekly Log</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">Leads Replied</p>
              <p className="text-3xl font-bold text-[#06B6D4]">{stats.leadsResponded}</p>
            </div>
            <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">Follow-ups</p>
              <p className="text-3xl font-bold text-[#F9FAFB]">{stats.followUpsSent}</p>
            </div>
            <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">Client Updates</p>
              <p className="text-3xl font-bold text-[#F9FAFB]">{stats.clientUpdates}</p>
            </div>
            <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">Reviews Asked</p>
              <p className="text-3xl font-bold text-[#F9FAFB]">{stats.reviewsRequested}</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#F9FAFB] uppercase tracking-wider">Performance</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">Messages Sent</p>
              <p className="text-3xl font-bold text-[#F9FAFB]">{stats.messagesSent}</p>
            </div>
            <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">Response Rate</p>
              <p className="text-3xl font-bold text-[#06B6D4]">{stats.responseRate}</p>
            </div>
            <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">Avg Time</p>
              <p className="text-3xl font-bold text-[#F9FAFB]">{stats.avgResponseTime}</p>
            </div>
            <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">Time Saved</p>
              <p className="text-3xl font-bold text-[#06B6D4]">{stats.timeSaved}</p>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold text-[#F9FAFB] uppercase tracking-wider">Insights</h2>
          <div className="space-y-2 text-sm">
            <p className="text-[#F9FAFB]">✓ Responding 15% faster than last week</p>
            <p className="text-[#F9FAFB]">✓ FIXER handled 8 lead responses</p>
            <p className="text-[#9CA3AF]">→ Reply to 2 pending quotes to boost conversion</p>
          </div>
        </div>

        {/* Recent History */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#F9FAFB] uppercase tracking-wider">Recent Entries</h2>
          <div className="space-y-2">
            {[
              { date: '2026-04-19', action: 'Responded to Sarah Mitchell quote', status: 'completed' },
              { date: '2026-04-18', action: 'Sent follow-up to James Wong', status: 'completed' },
              { date: '2026-04-17', action: 'Client update sent - Emma Davis', status: 'completed' },
              { date: '2026-04-16', action: 'Quote request from Bondi client', status: 'completed' },
            ].map((entry, i) => (
              <div key={i} className="bg-[#1F2937] rounded-lg p-3 border border-slate-700 flex justify-between items-start">
                <div>
                  <p className="text-sm text-[#F9FAFB] font-semibold">{entry.action}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">✓</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

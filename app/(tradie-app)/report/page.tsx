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
      <div className="px-4 md:px-8 py-6 space-y-6 pb-24">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Report</h1>
          <p className="text-[#9CA3AF] text-sm">Your FIXER performance this week</p>
        </div>

        {/* Week Highlight */}
        <div className="bg-[#1F2937] rounded-lg p-4 border border-[#374151] border-t-2 border-t-[#F97316] space-y-1">
          <p className="text-xs text-[#D1D5DB] uppercase tracking-wider font-medium">This Week</p>
          <p className="text-lg font-bold text-[#F9FAFB]">
            {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* FIXER Weekly Log */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#F9FAFB] mb-4">FIXER Weekly Log</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1F2937] rounded-lg p-5 border border-[#374151] border-t-2 border-t-[#F97316]">
              <p className="text-[#D1D5DB] text-xs font-medium uppercase tracking-wider mb-3">Leads Replied</p>
              <p className="text-4xl font-bold text-[#F97316]">{stats.leadsResponded}</p>
            </div>
            <div className="bg-[#1F2937] rounded-lg p-5 border border-[#374151] border-t-2 border-t-[#F97316]">
              <p className="text-[#D1D5DB] text-xs font-medium uppercase tracking-wider mb-3">Follow-ups</p>
              <p className="text-4xl font-bold text-[#F97316]">{stats.followUpsSent}</p>
            </div>
            <div className="bg-[#1F2937] rounded-lg p-5 border border-[#374151] border-t-2 border-t-[#F97316]">
              <p className="text-[#D1D5DB] text-xs font-medium uppercase tracking-wider mb-3">Client Updates</p>
              <p className="text-4xl font-bold text-[#F97316]">{stats.clientUpdates}</p>
            </div>
            <div className="bg-[#1F2937] rounded-lg p-5 border border-[#374151] border-t-2 border-t-[#F97316]">
              <p className="text-[#D1D5DB] text-xs font-medium uppercase tracking-wider mb-3">Reviews Asked</p>
              <p className="text-4xl font-bold text-[#F97316]">{stats.reviewsRequested}</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#F9FAFB] mb-4">Performance</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1F2937] rounded-lg p-5 border border-[#374151] border-t-2 border-t-[#F97316]">
              <p className="text-[#D1D5DB] text-xs font-medium uppercase tracking-wider mb-3">Messages Sent</p>
              <p className="text-4xl font-bold text-[#F97316]">{stats.messagesSent}</p>
            </div>
            <div className="bg-[#1F2937] rounded-lg p-5 border border-[#374151] border-t-2 border-t-[#F97316]">
              <p className="text-[#D1D5DB] text-xs font-medium uppercase tracking-wider mb-3">Response Rate</p>
              <p className="text-4xl font-bold text-[#F97316]">{stats.responseRate}</p>
            </div>
            <div className="bg-[#1F2937] rounded-lg p-5 border border-[#374151] border-t-2 border-t-[#F97316]">
              <p className="text-[#D1D5DB] text-xs font-medium uppercase tracking-wider mb-3">Avg Time</p>
              <p className="text-4xl font-bold text-[#F97316]">{stats.avgResponseTime}</p>
            </div>
            <div className="bg-[#1F2937] rounded-lg p-5 border border-[#374151] border-t-2 border-t-[#F97316]">
              <p className="text-[#D1D5DB] text-xs font-medium uppercase tracking-wider mb-3">Time Saved</p>
              <p className="text-4xl font-bold text-[#F97316]">{stats.timeSaved}</p>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-[#111827] rounded-lg p-5 border border-[#374151] space-y-3">
          <h2 className="text-xl font-semibold text-[#F9FAFB]">Insights</h2>
          <div className="space-y-2 text-sm">
            <p className="text-[#D1D5DB]"><span className="text-[#F97316]">✓</span> Responding <span className="text-[#F97316] font-semibold">15% faster</span> than last week</p>
            <p className="text-[#D1D5DB]"><span className="text-[#F97316]">✓</span> FIXER handled <span className="text-[#F97316] font-semibold">8 lead responses</span></p>
            <p className="text-[#D1D5DB]"><span className="text-[#F97316]">→</span> Reply to <span className="text-[#F97316] font-semibold">2 pending quotes</span> to boost conversion</p>
          </div>
        </div>

        {/* Recent History */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#F9FAFB]">Recent Entries</h2>
          <div className="space-y-2">
            {[
              { date: '2026-04-19', action: 'Responded to Sarah Mitchell quote', status: 'completed' },
              { date: '2026-04-18', action: 'Sent follow-up to James Wong', status: 'completed' },
              { date: '2026-04-17', action: 'Client update sent - Emma Davis', status: 'completed' },
              { date: '2026-04-16', action: 'Quote request from Bondi client', status: 'completed' },
            ].map((entry, i) => (
              <div key={i} className="bg-[#1F2937] rounded-lg p-4 border border-[#374151] flex justify-between items-start">
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

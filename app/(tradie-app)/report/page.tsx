export default function ReportPage() {
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
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-[#F9FAFB]">FIXER Weekly Log</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Leads Responded</p>
            <p className="text-3xl font-bold text-[#06B6D4]">0</p>
          </div>
          <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Follow-ups Sent</p>
            <p className="text-3xl font-bold text-[#F9FAFB]">0</p>
          </div>
          <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Client Updates</p>
            <p className="text-3xl font-bold text-[#F9FAFB]">0</p>
          </div>
          <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Reviews Requested</p>
            <p className="text-3xl font-bold text-[#F9FAFB]">0</p>
          </div>
        </div>
      </div>

      {/* Automation Performance */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-[#F9FAFB]">Automation Performance</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Messages Sent</p>
            <p className="text-3xl font-bold text-[#F9FAFB]">12</p>
          </div>
          <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Response Rate</p>
            <p className="text-3xl font-bold text-[#06B6D4]">85%</p>
          </div>
          <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Avg Response Time</p>
            <p className="text-3xl font-bold text-[#F9FAFB]">2.3h</p>
          </div>
          <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Time Saved</p>
            <p className="text-3xl font-bold text-[#06B6D4]">8.5h</p>
          </div>
        </div>
      </div>

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

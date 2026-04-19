export default function ReportPage() {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Report</h1>
        <p className="text-[#9CA3AF]">Weekly automation insights</p>
      </div>

      <div className="border-l-4 border-[#06B6D4] bg-[#1F2937] rounded-xl p-4">
        <p className="text-sm text-[#9CA3AF]">
          Your TradiePilot Week — April 14-20
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
          <p className="text-[#9CA3AF] text-xs mb-1">Leads Responded</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
          <p className="text-[#9CA3AF] text-xs mb-1">Follow-ups Sent</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
          <p className="text-[#9CA3AF] text-xs mb-1">Client Updates</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
          <p className="text-[#9CA3AF] text-xs mb-1">Reviews Requested</p>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
}

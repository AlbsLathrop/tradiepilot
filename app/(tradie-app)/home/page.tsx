import { getServerSession } from 'next-auth';

export default async function HomePage() {
  const session = await getServerSession();

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <p className="text-[#9CA3AF] text-sm">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
        <h1 className="text-3xl font-bold">G&apos;day {session?.user?.name}</h1>
        <p className="text-[#9CA3AF]">Here&apos;s your day at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
          <p className="text-[#9CA3AF] text-xs mb-1">Active Jobs</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
          <p className="text-[#9CA3AF] text-xs mb-1">Open Quotes</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
          <p className="text-[#9CA3AF] text-xs mb-1">Reviews This Month</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
          <p className="text-[#9CA3AF] text-xs mb-1">Hours Saved</p>
          <p className="text-2xl font-bold text-[#06B6D4]">0</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Today&apos;s Jobs</h2>
        <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151] text-center text-[#9CA3AF]">
          No jobs scheduled
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">New Leads</h2>
        <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151] text-center text-[#9CA3AF]">
          No new leads
        </div>
      </div>

      <div className="space-y-3">
        <button className="w-full bg-[#06B6D4] text-[#111827] rounded-lg py-3 font-semibold hover:bg-[#0891B2]">
          + New Job
        </button>
        <button className="w-full bg-[#1F2937] text-[#F9FAFB] rounded-lg py-3 font-semibold border border-[#374151] hover:bg-[#374151]">
          + New Lead
        </button>
        <button className="w-full bg-[#1F2937] text-[#F9FAFB] rounded-lg py-3 font-semibold border border-[#374151] hover:bg-[#374151]">
          Message FIXER
        </button>
      </div>
    </div>
  );
}

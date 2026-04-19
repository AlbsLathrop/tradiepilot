export default function JobsPage() {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Jobs</h1>
        <p className="text-[#9CA3AF]">Manage your active jobs</p>
      </div>

      <div className="bg-[#1F2937] rounded-xl p-6 border border-[#374151] text-center">
        <p className="text-[#9CA3AF]">No jobs yet</p>
      </div>

      <button className="w-full bg-[#06B6D4] text-[#111827] rounded-lg py-3 font-semibold hover:bg-[#0891B2]">
        + New Job
      </button>
    </div>
  );
}

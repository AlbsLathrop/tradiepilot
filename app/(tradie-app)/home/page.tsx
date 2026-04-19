import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface Stats {
  activeJobs: number;
  openQuotes: number;
  reviews: number;
  hoursSaved: number;
}

async function getStats(tradieConfigId?: string): Promise<Stats> {
  if (!tradieConfigId) {
    return { activeJobs: 0, openQuotes: 0, reviews: 0, hoursSaved: 0 };
  }

  try {
    // TODO: Fetch real data from Notion
    // const jobs = await getActiveJobs(tradieConfigId);
    // const leads = await getNewLeads(tradieConfigId);
    return { activeJobs: 0, openQuotes: 0, reviews: 0, hoursSaved: 0 };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return { activeJobs: 0, openQuotes: 0, reviews: 0, hoursSaved: 0 };
  }
}

export default async function HomePage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/');
  }

  const stats = await getStats(session.user?.tradieConfigId);

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[#9CA3AF] text-sm">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
        <h1 className="text-4xl font-bold text-[#06B6D4]">G&apos;day {session?.user?.name || 'Tradie'}</h1>
        <p className="text-[#9CA3AF]">Here&apos;s your day at a glance</p>
      </div>

      {/* Stat Cards - 2x2 Grid */}
      {stats ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1F2937] rounded-xl p-4 border border-white/5 hover:border-[#06B6D4]/50 transition">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Active Jobs</p>
            <p className="text-3xl font-bold text-[#F9FAFB]">{stats?.activeJobs ?? 0}</p>
          </div>
          <div className="bg-[#1F2937] rounded-xl p-4 border border-white/5 hover:border-[#06B6D4]/50 transition">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Open Quotes</p>
            <p className="text-3xl font-bold text-[#F9FAFB]">{stats?.openQuotes ?? 0}</p>
          </div>
          <div className="bg-[#1F2937] rounded-xl p-4 border border-white/5 hover:border-[#06B6D4]/50 transition">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Reviews</p>
            <p className="text-3xl font-bold text-[#F9FAFB]">{stats?.reviews ?? 0}</p>
          </div>
          <div className="bg-[#1F2937] rounded-xl p-4 border border-white/5 hover:border-[#06B6D4]/50 transition">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-2">Hrs Saved</p>
            <p className="text-3xl font-bold text-[#06B6D4]">{stats?.hoursSaved ?? 0}</p>
          </div>
        </div>
      ) : (
        <div className="bg-[#1F2937] rounded-xl p-6 border border-white/5 text-center">
          <p className="text-[#9CA3AF]">Unable to load stats</p>
        </div>
      )}

      {/* Today's Jobs Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#F9FAFB]">Today&apos;s Jobs</h2>
        <div className="bg-[#1F2937] rounded-xl p-6 border border-white/5 text-center min-h-24 flex items-center justify-center">
          <p className="text-[#9CA3AF]">No jobs scheduled for today</p>
        </div>
      </div>

      {/* New Leads Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#F9FAFB]">New Leads</h2>
        <div className="bg-[#1F2937] rounded-xl p-6 border border-white/5 text-center min-h-24 flex items-center justify-center">
          <p className="text-[#9CA3AF]">No new leads</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="space-y-2 pt-4">
        <Link
          href="/jobs/new"
          className="block w-full bg-[#06B6D4] text-[#111827] rounded-lg py-4 px-4 font-semibold hover:bg-[#0891B2] transition text-center min-h-12 flex items-center justify-center"
        >
          + New Job
        </Link>
        <Link
          href="/leads"
          className="block w-full bg-[#1F2937] text-[#F9FAFB] rounded-lg py-4 px-4 font-semibold border border-[#374151] hover:bg-[#374151] transition text-center min-h-12 flex items-center justify-center"
        >
          + New Lead
        </Link>
        <button className="w-full bg-[#1F2937] text-[#F9FAFB] rounded-lg py-4 px-4 font-semibold border border-[#374151] hover:bg-[#374151] transition min-h-12">
          📱 Message FIXER
        </button>
      </div>
    </div>
  );
}

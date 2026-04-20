import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { MessageCircle, Briefcase, Users } from 'lucide-react';

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
    return { activeJobs: 0, openQuotes: 0, reviews: 0, hoursSaved: 0 };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return { activeJobs: 0, openQuotes: 0, reviews: 0, hoursSaved: 0 };
  }
}

export default async function HomePage() {
  const session = await getServerSession();

  // if (!session) {
  //   redirect('/');
  // }

  const stats = await getStats(session?.user?.tradieConfigId);
  const firstName = session?.user?.name?.split(' ')[0] || 'Tradie';

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-[#9CA3AF] text-xs uppercase tracking-widest font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <h1 className="text-3xl font-bold text-[#F9FAFB]">G&apos;day {firstName}</h1>
          <p className="text-[#9CA3AF] text-sm">Your dashboard at a glance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">Active Jobs</p>
            <p className="text-3xl font-bold text-[#F9FAFB]">{stats?.activeJobs ?? 0}</p>
          </div>
          <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">Open Quotes</p>
            <p className="text-3xl font-bold text-[#06B6D4]">{stats?.openQuotes ?? 0}</p>
          </div>
          <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">Reviews</p>
            <p className="text-3xl font-bold text-[#F9FAFB]">{stats?.reviews ?? 0}</p>
          </div>
          <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm">
            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">Saved This Week</p>
            <p className="text-3xl font-bold text-[#06B6D4]">{stats?.hoursSaved ?? 0}h</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-3 gap-2">
            <Link
              href="/jobs/new"
              className="flex flex-col items-center justify-center bg-[#06B6D4] text-[#111827] rounded-lg p-4 border border-slate-700 shadow-sm hover:bg-[#0891B2] transition min-h-12"
            >
              <Briefcase size={20} className="mb-1" />
              <span className="text-xs font-semibold text-center">New Job</span>
            </Link>
            <Link
              href="/leads"
              className="flex flex-col items-center justify-center bg-[#06B6D4] text-[#111827] rounded-lg p-4 border border-slate-700 shadow-sm hover:bg-[#0891B2] transition min-h-12"
            >
              <Users size={20} className="mb-1" />
              <span className="text-xs font-semibold text-center">New Lead</span>
            </Link>
            <button
              className="flex flex-col items-center justify-center bg-[#06B6D4] text-[#111827] rounded-lg p-4 border border-slate-700 shadow-sm hover:bg-[#0891B2] transition min-h-12"
            >
              <MessageCircle size={20} className="mb-1" />
              <span className="text-xs font-semibold text-center">FIXER</span>
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4 pt-2">
          <div>
            <h2 className="text-sm font-semibold text-[#F9FAFB] uppercase tracking-wider mb-3">Today&apos;s Jobs</h2>
            <div className="bg-[#1F2937] rounded-lg p-6 border border-slate-700 shadow-sm text-center">
              <p className="text-[#9CA3AF] text-sm">No jobs scheduled for today</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-[#F9FAFB] uppercase tracking-wider mb-3">New Leads</h2>
            <div className="bg-[#1F2937] rounded-lg p-6 border border-slate-700 shadow-sm text-center">
              <p className="text-[#9CA3AF] text-sm">No new leads this week</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

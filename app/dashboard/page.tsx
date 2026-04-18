import { Topbar } from '@/components/layout/topbar'
import { Sidebar } from '@/components/layout/sidebar'
import { AlfredPanel } from '@/components/layout/alfred-panel'
import { TrendingUp, TrendingDown } from 'lucide-react'

const kpiData = [
  {
    label: 'Weekly Revenue (AUD)',
    value: '$12,450',
    delta: '+8.2%',
    trend: 'up',
    color: '#f5c518',
  },
  {
    label: 'Active Clients',
    value: '24 / 30',
    delta: '+2 this week',
    trend: 'up',
    color: '#22c55e',
  },
  {
    label: 'Pipeline Leads',
    value: '47',
    delta: '+3 today',
    trend: 'up',
    color: '#3b82f6',
  },
  {
    label: 'Closures (Month)',
    value: '12',
    delta: '48% close rate',
    trend: 'up',
    color: '#f97316',
  },
  {
    label: 'Agent Tasks Today',
    value: '284',
    delta: '+42 vs yesterday',
    trend: 'up',
    color: '#a855f7',
  },
]

const agents = [
  { name: 'LUNA', icon: '🌙', currentTask: 'Qualifying 3 new leads from Instagram', tasks: '18', rate: '94%', responseTime: '2.1m' },
  { name: 'CHASE', icon: '🔵', currentTask: 'Following up with Rob K. - quote pending', tasks: '12', rate: '89%', responseTime: '3.4m' },
  { name: 'ORBIT', icon: '🌍', currentTask: 'Sending job completion updates to 5 clients', tasks: '22', rate: '96%', responseTime: '1.8m' },
  { name: 'ANCHOR', icon: '⚓', currentTask: 'Processing 2 invoices and payment reminders', tasks: '8', rate: '100%', responseTime: '5.2m' },
  { name: 'FIXER', icon: '🔧', currentTask: 'Handling support ticket from Dave P.', tasks: '5', rate: '92%', responseTime: '4.1m' },
]

const activityLog = [
  { agent: 'LUNA', action: 'Lead qualified - MRR $2,500', time: '2 mins ago' },
  { agent: 'ORBIT', action: 'Job update sent to Morrison Plumbing', time: '8 mins ago' },
  { agent: 'ANCHOR', action: 'Invoice #INV-2481 paid by Elite Electrical', time: '15 mins ago' },
  { agent: 'CHASE', action: 'Follow-up SMS sent to 4 warm leads', time: '22 mins ago' },
  { agent: 'LUNA', action: 'Lead disqualified - out of service area', time: '28 mins ago' },
  { agent: 'ORBIT', action: 'Job update sent to Harris Tiling', time: '35 mins ago' },
  { agent: 'FIXER', action: 'Support ticket resolved - client happy', time: '42 mins ago' },
  { agent: 'ANCHOR', action: 'Payment reminder sent to Smith Bros', time: '51 mins ago' },
]

export default function DashboardPage() {
  return (
    <div className="bg-[#0f111a] min-h-screen">
      <Sidebar />
      <Topbar title="Dashboard" />
      <AlfredPanel />

      <main className="ml-52 mr-80 pt-20 pb-8 px-8">
        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-6 mb-12">
          {kpiData.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-[#161929] border border-[#252a3d] rounded-xl p-6 hover:border-[#3d4570] transition-colors group"
              style={{ boxShadow: `0 0 20px ${kpi.color}22` }}
            >
              <div className="text-xs font-mono text-[#4a5280] uppercase tracking-widest mb-4">{kpi.label}</div>
              <div className="text-5xl font-mono font-bold mb-3" style={{ color: kpi.color }}>
                {kpi.value}
              </div>
              <div className="flex items-center gap-2">
                {kpi.trend === 'up' ? (
                  <>
                    <TrendingUp size={18} style={{ color: '#22c55e' }} />
                    <span className="text-sm text-[#22c55e]">{kpi.delta}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown size={18} style={{ color: '#ef4444' }} />
                    <span className="text-sm text-[#ef4444]">{kpi.delta}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Live Agents Row */}
        <div className="mb-12">
          <h2 className="text-lg font-mono font-bold text-[#e8eaf6] mb-6">Live Agents</h2>
          <div className="grid grid-cols-5 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="bg-[#161929] border border-[#252a3d] rounded-xl p-5 hover:border-[#3d4570] transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-2xl mb-1">{agent.icon}</div>
                    <div className="text-sm font-mono font-bold text-[#e8eaf6]">{agent.name}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-[#8892b0]">ONLINE</span>
                  </div>
                </div>

                <div className="text-xs text-[#8892b0] mb-4 line-clamp-2">{agent.currentTask}</div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#4a5280]">Tasks today</span>
                    <span className="text-[#e8eaf6] font-mono">{agent.tasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4a5280]">Success rate</span>
                    <span className="text-[#22c55e] font-mono">{agent.rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4a5280]">Avg response</span>
                    <span className="text-[#8892b0] font-mono">{agent.responseTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Two Column Section */}
        <div className="grid grid-cols-2 gap-8">
          {/* Activity Feed */}
          <div className="bg-[#161929] border border-[#252a3d] rounded-xl p-6">
            <h3 className="text-sm font-mono font-bold text-[#e8eaf6] uppercase tracking-widest mb-6">Recent Activity</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activityLog.map((entry, i) => (
                <div key={i} className="flex gap-3 pb-3 border-b border-[#252a3d] last:border-0">
                  <div className="text-2xl flex-shrink-0">
                    {entry.agent === 'LUNA' && '🌙'}
                    {entry.agent === 'ORBIT' && '🌍'}
                    {entry.agent === 'ANCHOR' && '⚓'}
                    {entry.agent === 'CHASE' && '🔵'}
                    {entry.agent === 'FIXER' && '🔧'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-mono text-[#8892b0]">{entry.agent}</span>
                      <span className="text-sm text-[#e8eaf6]">{entry.action}</span>
                    </div>
                    <div className="text-xs text-[#4a5280] mt-1">{entry.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-[#161929] border border-[#252a3d] rounded-xl p-6">
              <h3 className="text-sm font-mono font-bold text-[#e8eaf6] uppercase tracking-widest mb-6">Conversion Funnel</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#8892b0]">Leads</span>
                    <span className="text-[#e8eaf6] font-mono">542</span>
                  </div>
                  <div className="h-2 bg-[#252a3d] rounded-full overflow-hidden">
                    <div className="h-full bg-[#3b82f6]" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#8892b0]">Contacted</span>
                    <span className="text-[#e8eaf6] font-mono">423 (78%)</span>
                  </div>
                  <div className="h-2 bg-[#252a3d] rounded-full overflow-hidden">
                    <div className="h-full bg-[#3b82f6]" style={{ width: '78%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#8892b0]">Quoted</span>
                    <span className="text-[#e8eaf6] font-mono">156 (37%)</span>
                  </div>
                  <div className="h-2 bg-[#252a3d] rounded-full overflow-hidden">
                    <div className="h-full bg-[#22c55e]" style={{ width: '37%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#8892b0]">Booked</span>
                    <span className="text-[#e8eaf6] font-mono">75 (48%)</span>
                  </div>
                  <div className="h-2 bg-[#252a3d] rounded-full overflow-hidden">
                    <div className="h-full bg-[#f5c518]" style={{ width: '48%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#8892b0]">Active</span>
                    <span className="text-[#e8eaf6] font-mono">24 (32%)</span>
                  </div>
                  <div className="h-2 bg-[#252a3d] rounded-full overflow-hidden">
                    <div className="h-full bg-[#22c55e]" style={{ width: '32%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#161929] border border-[#252a3d] rounded-xl p-6">
              <h3 className="text-sm font-mono font-bold text-[#e8eaf6] uppercase tracking-widest mb-6">Top Performer</h3>
              <div className="flex items-center gap-4">
                <div className="text-5xl">🌍</div>
                <div>
                  <div className="text-lg font-mono font-bold text-[#22c55e]">ORBIT</div>
                  <div className="text-sm text-[#8892b0]">96% success rate</div>
                  <div className="text-xs text-[#4a5280] mt-2">22 tasks completed today</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

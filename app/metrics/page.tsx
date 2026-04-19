'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ComposedChart,
} from 'recharts'

type TimePeriod = '7D' | '30D' | '90D' | 'ALL'

export default function MetricsPage() {
  const [period, setPeriod] = useState<TimePeriod>('30D')

  // Revenue Trend Data
  const revenueData = [
    { date: 'Week 1', revenue: 24000, target: 20000 },
    { date: 'Week 2', revenue: 28000, target: 20000 },
    { date: 'Week 3', revenue: 22000, target: 20000 },
    { date: 'Week 4', revenue: 31000, target: 20000 },
  ]

  // Leads vs Closed
  const leadsData = [
    { week: 'W1', leads: 12, closed: 3 },
    { week: 'W2', leads: 14, closed: 4 },
    { week: 'W3', leads: 10, closed: 3 },
    { week: 'W4', leads: 15, closed: 5 },
  ]

  // Agent Performance
  const agentData = [
    { agent: 'Luna', closes: 8, response: 85, satisfaction: 92 },
    { agent: 'Jax', closes: 12, response: 78, satisfaction: 88 },
    { agent: 'Nova', closes: 15, response: 95, satisfaction: 96 },
    { agent: 'Fixer', closes: 10, response: 82, satisfaction: 90 },
    { agent: 'Orbit', closes: 9, response: 88, satisfaction: 91 },
  ]

  // MRR Growth
  const mrrData = [
    { month: 'Jan', mrr: 18000 },
    { month: 'Feb', mrr: 22000 },
    { month: 'Mar', mrr: 26000 },
    { month: 'Apr', mrr: 31000 },
    { month: 'May', mrr: 37000 },
  ]

  // Pipeline Velocity
  const velocityData = [
    { stage: 'LEAD', days: 3, count: 12 },
    { stage: 'CONTACTED', days: 5, count: 8 },
    { stage: 'QUOTE_SENT', days: 7, count: 6 },
    { stage: 'BOOKED', days: 14, count: 4 },
    { stage: 'ACTIVE', days: 30, count: 3 },
  ]

  // Conversion Funnel
  const funnelData = [
    { stage: 'Leads', value: 100, label: '100' },
    { stage: 'Contacted', value: 72, label: '72' },
    { stage: 'Quoted', value: 48, label: '48' },
    { stage: 'Booked', value: 18, label: '18' },
  ]

  // Response Time Histogram
  const responseData = [
    { minutes: '0-5', count: 24 },
    { minutes: '5-15', count: 18 },
    { minutes: '15-30', count: 12 },
    { minutes: '30-60', count: 8 },
    { minutes: '60+', count: 4 },
  ]

  // Activity Heatmap
  const heatmapData = [
    { day: 'Mon', calls: 8, texts: 12, emails: 6 },
    { day: 'Tue', calls: 10, texts: 14, emails: 8 },
    { day: 'Wed', calls: 7, texts: 10, emails: 5 },
    { day: 'Thu', calls: 11, texts: 15, emails: 9 },
    { day: 'Fri', calls: 9, texts: 13, emails: 7 },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#e8eaf6]">Metrics</h1>
        <div className="flex gap-2">
          {(['7D', '30D', '90D', 'ALL'] as TimePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-colors ${
                period === p
                  ? 'bg-[#f5c518] text-[#0f111a]'
                  : 'bg-[#1d2235] text-[#8892b0] hover:text-[#e8eaf6] border border-[#252a3d]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-[#161929] rounded-xl border border-white/5 p-6">
          <h2 className="text-sm font-bold text-[#f5c518] mb-4 uppercase tracking-widest">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#252a3d" />
              <XAxis dataKey="date" stroke="#4a5280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#4a5280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1d2235', border: '1px solid #252a3d', borderRadius: '8px' }}
                labelStyle={{ color: '#e8eaf6' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Leads vs Closed */}
        <div className="bg-[#161929] rounded-xl border border-white/5 p-6">
          <h2 className="text-sm font-bold text-[#f5c518] mb-4 uppercase tracking-widest">Leads vs Closed</h2>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={leadsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252a3d" />
              <XAxis dataKey="week" stroke="#4a5280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#4a5280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1d2235', border: '1px solid #252a3d', borderRadius: '8px' }}
                labelStyle={{ color: '#e8eaf6' }}
              />
              <Bar dataKey="leads" fill="#8892b0" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="closed" stroke="#10b981" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Agent Performance Radar */}
        <div className="bg-[#161929] rounded-xl border border-white/5 p-6">
          <h2 className="text-sm font-bold text-[#f5c518] mb-4 uppercase tracking-widest">Agent Performance</h2>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={agentData}>
              <PolarGrid stroke="#252a3d" />
              <PolarAngleAxis dataKey="agent" stroke="#4a5280" style={{ fontSize: '12px' }} />
              <PolarRadiusAxis stroke="#4a5280" style={{ fontSize: '12px' }} angle={90} domain={[0, 100]} />
              <Radar name="Satisfaction" dataKey="satisfaction" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1d2235', border: '1px solid #252a3d', borderRadius: '8px' }}
                labelStyle={{ color: '#e8eaf6' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* MRR Growth */}
        <div className="bg-[#161929] rounded-xl border border-white/5 p-6">
          <h2 className="text-sm font-bold text-[#f5c518] mb-4 uppercase tracking-widest">MRR Growth</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={mrrData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252a3d" />
              <XAxis dataKey="month" stroke="#4a5280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#4a5280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1d2235', border: '1px solid #252a3d', borderRadius: '8px' }}
                labelStyle={{ color: '#e8eaf6' }}
              />
              <Line type="monotone" dataKey="mrr" stroke="#f5c518" strokeWidth={3} dot={{ fill: '#f5c518', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Velocity */}
        <div className="bg-[#161929] rounded-xl border border-white/5 p-6">
          <h2 className="text-sm font-bold text-[#f5c518] mb-4 uppercase tracking-widest">Pipeline Velocity</h2>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252a3d" />
              <XAxis type="number" dataKey="days" name="Days in Stage" stroke="#4a5280" style={{ fontSize: '12px' }} />
              <YAxis type="number" dataKey="count" name="Count" stroke="#4a5280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1d2235', border: '1px solid #252a3d', borderRadius: '8px' }}
                labelStyle={{ color: '#e8eaf6' }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Scatter name="Opportunities" data={velocityData} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-[#161929] rounded-xl border border-white/5 p-6">
          <h2 className="text-sm font-bold text-[#f5c518] mb-4 uppercase tracking-widest">Conversion Funnel</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={funnelData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#252a3d" />
              <XAxis type="number" stroke="#4a5280" style={{ fontSize: '12px' }} />
              <YAxis dataKey="stage" type="category" stroke="#4a5280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1d2235', border: '1px solid #252a3d', borderRadius: '8px' }}
                labelStyle={{ color: '#e8eaf6' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time Distribution */}
        <div className="bg-[#161929] rounded-xl border border-white/5 p-6">
          <h2 className="text-sm font-bold text-[#f5c518] mb-4 uppercase tracking-widest">Response Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={responseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252a3d" />
              <XAxis dataKey="minutes" stroke="#4a5280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#4a5280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1d2235', border: '1px solid #252a3d', borderRadius: '8px' }}
                labelStyle={{ color: '#e8eaf6' }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Heatmap */}
        <div className="bg-[#161929] rounded-xl border border-white/5 p-6">
          <h2 className="text-sm font-bold text-[#f5c518] mb-4 uppercase tracking-widest">Activity Heatmap</h2>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={heatmapData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252a3d" />
              <XAxis dataKey="day" stroke="#4a5280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#4a5280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1d2235', border: '1px solid #252a3d', borderRadius: '8px' }}
                labelStyle={{ color: '#e8eaf6' }}
              />
              <Bar dataKey="calls" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="texts" fill="#f5c518" radius={[4, 4, 0, 0]} />
              <Bar dataKey="emails" fill="#8892b0" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useClientsStore, Client } from '@/lib/store/clients'
import { ChevronRight, Mail, Phone, MapPin, TrendingUp, Calendar, DollarSign } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'

function HealthScore({ score }: { score: number }) {
  let color = '#ef4444'
  if (score >= 85) color = '#10b981'
  else if (score >= 75) color = '#3b82f6'
  else if (score >= 60) color = '#f59e0b'

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1f2937" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.915"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${(score / 100) * 100} 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-[#e8eaf6]">{score}</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-[#8892b0]">Health</p>
        <p className="text-xs font-bold text-[#e8eaf6]">
          {score >= 85 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'At Risk'}
        </p>
      </div>
    </div>
  )
}

function ClientDetail({ client, onClose }: { client: Client; onClose: () => void }) {
  const healthData = [
    { month: 'Jan', score: Math.max(client.healthScore - 8, 40) },
    { month: 'Feb', score: Math.max(client.healthScore - 5, 50) },
    { month: 'Mar', score: Math.max(client.healthScore - 2, 60) },
    { month: 'Apr', score: client.healthScore - 1 },
    { month: 'May', score: client.healthScore },
  ]

  const days = Math.round((Date.now() - new Date(client.lastContact).getTime()) / 86400000)

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div onClick={onClose} className="flex-1 bg-black/40" />

      {/* Slide Panel */}
      <div className="w-96 bg-[#0f111a] border-l border-[#252a3d] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#252a3d] flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-[#e8eaf6]">{client.name}</h2>
              <p className="text-sm text-[#8892b0]">{client.businessName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-[#4a5280] hover:text-[#e8eaf6] text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="flex gap-4">
            <HealthScore score={client.healthScore} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-bold text-[#f5c518] mb-3 uppercase tracking-widest">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#e8eaf6]">
                <Phone size={14} className="text-[#4a5280]" />
                <a href={`tel:${client.phone}`}>{client.phone}</a>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#e8eaf6]">
                <Mail size={14} className="text-[#4a5280]" />
                <a href={`mailto:${client.email}`}>{client.email}</a>
              </div>
              <div className="flex items-start gap-2 text-sm text-[#e8eaf6]">
                <MapPin size={14} className="text-[#4a5280] flex-shrink-0 mt-0.5" />
                <span>{client.address}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1d2235] rounded-lg p-3 border border-[#252a3d]">
              <p className="text-xs text-[#4a5280] mb-1">Total Spent</p>
              <p className="text-lg font-bold text-[#e8eaf6]">${(client.totalSpent / 1000).toFixed(1)}k</p>
            </div>
            <div className="bg-[#1d2235] rounded-lg p-3 border border-[#252a3d]">
              <p className="text-xs text-[#4a5280] mb-1">Monthly Recurring</p>
              <p className="text-lg font-bold text-[#3b82f6]">${(client.mrr / 1000).toFixed(1)}k</p>
            </div>
            <div className="bg-[#1d2235] rounded-lg p-3 border border-[#252a3d]">
              <p className="text-xs text-[#4a5280] mb-1">Jobs Completed</p>
              <p className="text-lg font-bold text-[#10b981]">{client.jobsCompleted}</p>
            </div>
            <div className="bg-[#1d2235] rounded-lg p-3 border border-[#252a3d]">
              <p className="text-xs text-[#4a5280] mb-1">Last Contact</p>
              <p className="text-lg font-bold text-[#f59e0b]">{days}d ago</p>
            </div>
          </div>

          {/* Health Trend */}
          <div>
            <h3 className="text-xs font-bold text-[#f5c518] mb-3 uppercase tracking-widest">Health Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={healthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252a3d" />
                <XAxis dataKey="month" stroke="#4a5280" style={{ fontSize: '12px' }} />
                <YAxis domain={[0, 100]} stroke="#4a5280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1d2235', border: '1px solid #252a3d', borderRadius: '8px' }}
                  labelStyle={{ color: '#e8eaf6' }}
                />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Job History */}
          <div>
            <h3 className="text-xs font-bold text-[#f5c518] mb-3 uppercase tracking-widest">Recent Jobs</h3>
            <div className="space-y-2">
              {client.jobHistory.map((job) => (
                <div key={job.id} className="bg-[#1d2235] rounded-lg p-3 border border-[#252a3d]">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-[#e8eaf6]">{job.name}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        job.status === 'COMPLETE'
                          ? 'bg-[#10b981]/20 text-[#10b981]'
                          : 'bg-[#3b82f6]/20 text-[#3b82f6]'
                      }`}
                    >
                      {job.status === 'COMPLETE' ? '✓ Done' : '⧗ In Progress'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#4a5280]">
                    <span>{new Date(job.date).toLocaleDateString()}</span>
                    <span className="text-[#e8eaf6] font-medium">${job.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h3 className="text-xs font-bold text-[#f5c518] mb-3 uppercase tracking-widest">Payment History</h3>
            <div className="space-y-2">
              {client.paymentHistory.slice(0, 3).map((payment) => (
                <div key={payment.id} className="bg-[#1d2235] rounded-lg p-3 border border-[#252a3d]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#e8eaf6]">{payment.method}</p>
                      <p className="text-xs text-[#4a5280]">{new Date(payment.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          payment.status === 'PAID' ? 'text-[#10b981]' : 'text-[#f59e0b]'
                        }`}
                      >
                        ${payment.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#4a5280]">
                        {payment.status === 'PAID' ? '✓ Paid' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div>
              <h3 className="text-xs font-bold text-[#f5c518] mb-2 uppercase tracking-widest">Notes</h3>
              <p className="text-sm text-[#8892b0] bg-[#1d2235] rounded-lg p-3 border border-[#252a3d]">
                {client.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const { clients } = useClientsStore()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-[#e8eaf6] mb-6">Clients</h1>

      {/* Table */}
      <div className="bg-[#161929] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#252a3d]">
                <th className="px-6 py-3 text-left text-xs font-mono uppercase text-[#4a5280]">Client</th>
                <th className="px-6 py-3 text-left text-xs font-mono uppercase text-[#4a5280]">Health</th>
                <th className="px-6 py-3 text-right text-xs font-mono uppercase text-[#4a5280]">Monthly</th>
                <th className="px-6 py-3 text-right text-xs font-mono uppercase text-[#4a5280]">Total Spent</th>
                <th className="px-6 py-3 text-right text-xs font-mono uppercase text-[#4a5280]">Last Contact</th>
                <th className="px-6 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const days = Math.round((Date.now() - new Date(client.lastContact).getTime()) / 86400000)
                return (
                  <tr
                    key={client.id}
                    className="border-b border-[#252a3d] hover:bg-[#1d2235] transition-colors cursor-pointer"
                    onClick={() => setSelectedClient(client)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-[#e8eaf6]">{client.name}</p>
                        <p className="text-xs text-[#4a5280]">{client.businessName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                          backgroundColor: client.healthScore >= 85 ? '#10b981' : client.healthScore >= 75 ? '#3b82f6' : client.healthScore >= 60 ? '#f59e0b' : '#ef4444'
                        }} />
                        <span className="text-sm font-medium text-[#e8eaf6]">{client.healthScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-[#e8eaf6]">
                      ${(client.mrr / 1000).toFixed(1)}k
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-[#e8eaf6]">
                      ${(client.totalSpent / 1000).toFixed(0)}k
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-[#8892b0]">
                      {days}d ago
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight size={16} className="text-[#4a5280]" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Slide Panel */}
      {selectedClient && (
        <ClientDetail client={selectedClient} onClose={() => setSelectedClient(null)} />
      )}
    </div>
  )
}

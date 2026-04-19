'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Phone, MessageSquare } from 'lucide-react'

const LEAD_STATUSES = ['NEW', 'QUALIFIED', 'PENDING_DECLINE', 'DECLINED', 'COLD']
const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-cyan-500/20 text-cyan-400',
  QUALIFIED: 'bg-green-500/20 text-green-400',
  PENDING_DECLINE: 'bg-yellow-500/20 text-yellow-400',
  DECLINED: 'bg-red-500/20 text-red-400',
  COLD: 'bg-gray-500/20 text-gray-400',
}

interface Lead {
  id: string | number
  name: string
  service: string
  suburb: string
  status: string
  dateReceived: string
  phone: string
}

const SAMPLE_LEADS: Lead[] = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    service: 'Kitchen Renovation',
    suburb: 'Bondi',
    status: 'NEW',
    dateReceived: '2026-04-19',
    phone: '0412 345 678',
  },
  {
    id: 2,
    name: 'James Wong',
    service: 'Bathroom Tiles',
    suburb: 'Neutral Bay',
    status: 'QUALIFIED',
    dateReceived: '2026-04-18',
    phone: '0412 345 679',
  },
  {
    id: 3,
    name: 'Emma Davis',
    service: 'Deck Build',
    suburb: 'Paddington',
    status: 'PENDING_DECLINE',
    dateReceived: '2026-04-17',
    phone: '0412 345 680',
  },
]

export default function LeadsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const leads = SAMPLE_LEADS

  const filteredLeads = selectedStatus ? leads.filter(l => l.status === selectedStatus) : leads

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="px-4 py-6 space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F9FAFB]">Leads</h1>
            <p className="text-[#9CA3AF] text-sm">Qualified opportunities</p>
          </div>
          <Link
            href="/leads/new"
            className="inline-flex items-center justify-center w-12 h-12 bg-[#06B6D4] text-[#111827] rounded-lg hover:bg-[#0891B2] transition"
          >
            <Plus size={20} />
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <button
            onClick={() => setSelectedStatus(null)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              selectedStatus === null
                ? 'bg-[#06B6D4] text-[#111827]'
                : 'bg-[#1F2937] text-[#F9FAFB] border border-slate-700'
            }`}
          >
            All
          </button>
          {LEAD_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                selectedStatus === status
                  ? 'bg-[#06B6D4] text-[#111827]'
                  : 'bg-[#1F2937] text-[#F9FAFB] border border-slate-700'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Lead Cards */}
        <div className="space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="bg-[#1F2937] rounded-lg p-8 border border-slate-700 text-center">
              <p className="text-[#9CA3AF] text-sm">No leads in this status</p>
            </div>
          ) : (
            filteredLeads.map(lead => {
              const status = lead?.status || 'UNKNOWN'
              return (
                <div
                  key={lead.id}
                  className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 space-y-3"
                >
                  <div className="flex justify-between items-start gap-3">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="flex-1 hover:text-[#06B6D4] transition"
                    >
                      <h3 className="text-sm font-semibold text-[#F9FAFB]">{lead?.name || 'Unnamed'}</h3>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        {lead?.service || 'Service'} • {lead?.suburb || 'Location'}
                      </p>
                    </Link>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[status]}`}>
                      {status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-600">
                    <p className="text-xs text-[#6B7280] mb-3">
                      Received {new Date(lead.dateReceived).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.location.href = `tel:${lead.phone}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 h-12 bg-[#06B6D4] text-[#111827] rounded-lg py-2 text-xs font-semibold hover:bg-[#0891B2] transition"
                      >
                        <Phone size={14} />
                        Call
                      </button>
                      <button
                        className="flex-1 inline-flex items-center justify-center gap-2 h-12 bg-[#1F2937] text-[#F9FAFB] border border-slate-600 rounded-lg py-2 text-xs font-semibold hover:bg-slate-700 transition"
                      >
                        <MessageSquare size={14} />
                        Text
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

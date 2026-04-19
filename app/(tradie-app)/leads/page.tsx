'use client'

import { useState } from 'react'
import Link from 'next/link'

const LEAD_STATUSES = ['NEW', 'QUALIFIED', 'PENDING_DECLINE', 'DECLINED', 'COLD']
const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-green-500/20 text-green-400',
  QUALIFIED: 'bg-green-500/20 text-green-400',
  PENDING_DECLINE: 'bg-orange-500/20 text-orange-400',
  DECLINED: 'bg-red-500/20 text-red-400',
  COLD: 'bg-gray-500/20 text-gray-400',
}

export default function LeadsPage() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const sampleLeads = [
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

  const filteredLeads = activeFilter
    ? sampleLeads.filter(lead => lead.status === activeFilter)
    : sampleLeads

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#F9FAFB]">Leads</h1>
        <p className="text-[#9CA3AF]">Qualified leads and opportunities</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveFilter(null)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
            activeFilter === null
              ? 'bg-[#06B6D4] text-[#111827]'
              : 'bg-[#1F2937] text-[#F9FAFB] border border-[#374151] hover:bg-[#374151]'
          }`}
        >
          All
        </button>
        {LEAD_STATUSES.map(status => (
          <button
            key={status}
            onClick={() => setActiveFilter(status)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeFilter === status
                ? 'bg-[#06B6D4] text-[#111827]'
                : 'bg-[#1F2937] text-[#F9FAFB] border border-[#374151] hover:bg-[#374151]'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Lead Cards */}
      <div className="space-y-3">
        {filteredLeads.length > 0 ? (
          filteredLeads.map(lead => (
            <div
              key={lead.id}
              className="bg-[#1F2937] rounded-xl p-4 border border-[#374151] hover:border-[#06B6D4] transition space-y-3"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#F9FAFB]">{lead.name}</h3>
                  <p className="text-sm text-[#9CA3AF] mt-1">
                    {lead.service} • {lead.suburb}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    STATUS_COLORS[lead.status]
                  }`}
                >
                  {lead.status.replace('_', ' ')}
                </span>
              </div>

              <div className="text-xs text-[#6B7280] space-y-0.5">
                <p>Received: {new Date(lead.dateReceived).toLocaleDateString()}</p>
                <p>Phone: {lead.phone}</p>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-[#06B6D4] text-[#111827] rounded-lg py-2 px-3 text-sm font-semibold hover:bg-[#0891B2] transition">
                  Call
                </button>
                <button className="flex-1 bg-[#1F2937] text-[#F9FAFB] border border-[#374151] rounded-lg py-2 px-3 text-sm font-semibold hover:bg-[#374151] transition">
                  Message
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-[#1F2937] rounded-xl p-6 border border-[#374151] text-center">
            <p className="text-[#9CA3AF]">No leads in this filter</p>
          </div>
        )}
      </div>

      {/* New Lead Button */}
      <div className="pt-4">
        <Link
          href="/leads/new"
          className="block w-full bg-[#06B6D4] text-[#111827] rounded-lg py-4 px-4 font-semibold hover:bg-[#0891B2] transition text-center min-h-12 flex items-center justify-center"
        >
          + New Lead
        </Link>
      </div>
    </div>
  )
}

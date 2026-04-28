'use client'

import { useState, useEffect } from 'react'
import { Phone, MessageSquare } from 'lucide-react'

interface Lead {
  id: string
  name: string
  phone: string
  service: string
  suburb: string
  status: string
  receivedDate: string | null
  source: string
  lastContact: string | null
  nextFollowUp: string | null
  disqualifyReason: string
  notes: string
  leadScore: number | null
  tradieConfigId: string
}

const STATUS_COLORS: Record<string, string> = {
  'NEW': 'bg-[#F97316] text-white',
  'QUALIFIED': 'bg-[#10B981] text-white',
  'PENDING_DECLINE': 'bg-[#FBBF24] text-[#000]',
  'DECLINED': 'bg-[#EF4444] text-white',
  'COLD': 'bg-[#6B7280] text-white',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('All')
  const [toast, setToast] = useState<string | null>(null)
  const [openLogId, setOpenLogId] = useState<string | null>(null)

  const tabs = ['All', 'NEW', 'QUALIFIED', 'PENDING_DECLINE', 'DECLINED', 'COLD']

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then(data => {
        setLeads(data.leads ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredLeads = activeTab === 'All'
    ? leads
    : leads.filter(l => l.status === activeTab)

  const handleToggle = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const handleQualify = async (lead: Lead) => {
    setToast('Qualifying lead...')
    try {
      const res = await fetch('/api/leads/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      })
      const data = await res.json()
      if (data.success) {
        setToast('✓ Lead qualified')
        // Refresh leads
        setTimeout(() => {
          fetch('/api/leads')
            .then(r => r.json())
            .then(d => setLeads(d.leads ?? []))
        }, 1000)
      } else {
        setToast('Failed to qualify lead')
      }
    } catch {
      setToast('Failed to qualify lead')
    }
    setTimeout(() => setToast(null), 3000)
  }

  const handleDecline = async (lead: Lead) => {
    const reason = window.prompt('Reason for declining:')
    if (!reason) return

    setToast('Declining lead...')
    try {
      const res = await fetch('/api/leads/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, reason }),
      })
      const data = await res.json()
      if (data.success) {
        setToast('✓ Lead declined')
        // Refresh leads
        setTimeout(() => {
          fetch('/api/leads')
            .then(r => r.json())
            .then(d => setLeads(d.leads ?? []))
        }, 1000)
      } else {
        setToast('Failed to decline lead')
      }
    } catch {
      setToast('Failed to decline lead')
    }
    setTimeout(() => setToast(null), 3000)
  }

  const daysSince = (dateStr: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const now = new Date()
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white pb-24">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-[#F97316] text-white text-center py-3 px-4 rounded-xl text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-gray-400 text-sm">Qualified opportunities</p>
        </div>
        <button className="w-10 h-10 bg-[#F97316] rounded-full flex items-center justify-center text-white text-xl font-bold">
          +
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === tab
                ? 'bg-[#F97316] text-white'
                : 'bg-[#1F2937] text-gray-400'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Lead Cards */}
      <div className="px-4 space-y-3 mt-2">
        {loading && (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#111827] rounded-xl h-20 animate-pulse" />
            ))}
          </>
        )}

        {!loading && filteredLeads.map(lead => {
          const isOpen = expandedId === lead.id
          const statusClass = STATUS_COLORS[lead.status] ?? 'bg-gray-600 text-white'
          const daysReceived = daysSince(lead.receivedDate)
          const daysLastContact = daysSince(lead.lastContact)

          return (
            <div
              key={lead.id}
              className={`bg-[#111827] rounded-xl overflow-hidden transition-all duration-200 ${
                isOpen ? 'ring-2 ring-[#F97316]' : ''
              }`}
            >
              {/* Card Header — always visible, tap to toggle */}
              <button
                onClick={() => handleToggle(lead.id)}
                className="w-full px-4 py-4 flex items-center justify-between text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-base truncate">
                    {lead.name}
                  </p>
                  <p className="text-gray-400 text-sm mt-0.5 truncate">
                    {[lead.service, lead.suburb].filter(Boolean).join(' • ')}
                  </p>
                  {daysReceived !== null && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {daysReceived === 0 ? 'Received today' : `${daysReceived}d ago`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusClass}`}>
                    {lead.status.replace('_', ' ')}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {/* Expanded Detail */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-[#1F2937]">

                  {/* Lead Details */}
                  <div className="bg-[#0F0F0F] rounded-lg p-3 space-y-2 pt-3">
                    <p className="text-[#F97316] text-xs font-bold uppercase">Lead Details</p>
                    {lead.source && (
                      <InfoRow label="Source" value={lead.source} />
                    )}
                    {lead.receivedDate && (
                      <InfoRow label="Received" value={new Date(lead.receivedDate).toLocaleDateString('en-AU')} />
                    )}
                    {lead.leadScore !== null && (
                      <InfoRow label="Lead Score" value={`${lead.leadScore}/10`} />
                    )}
                    {lead.notes && (
                      <div>
                        <p className="text-gray-400 text-sm">Notes</p>
                        <p className="text-gray-300 text-sm mt-1">{lead.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Contact History */}
                  <div className="bg-[#0F0F0F] rounded-lg p-3 space-y-2">
                    <p className="text-[#F97316] text-xs font-bold uppercase">Contact History</p>
                    {lead.lastContact ? (
                      <InfoRow
                        label="Last Contact"
                        value={daysLastContact === 0 ? 'Today' : `${daysLastContact}d ago`}
                      />
                    ) : (
                      <p className="text-gray-400 text-sm">Never contacted</p>
                    )}
                    {lead.nextFollowUp && (
                      <InfoRow label="Next Follow Up" value={new Date(lead.nextFollowUp).toLocaleDateString('en-AU')} />
                    )}
                    {lead.status === 'DECLINED' && lead.disqualifyReason && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mt-2">
                        <p className="text-red-400 text-xs font-bold">Disqualify Reason</p>
                        <p className="text-gray-300 text-xs mt-1">{lead.disqualifyReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Contact Section */}
                  <div className="bg-[#0F0F0F] rounded-lg p-3">
                    <p className="text-[#F97316] text-xs font-bold uppercase mb-2">Contact</p>
                    {lead.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Phone</span>
                        <div className="flex items-center gap-2">
                          <a href={`tel:${lead.phone}`} className="text-[#F97316] text-sm font-medium">
                            {lead.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ask ALFRED */}
                  <a
                    href={`/chat?message=${encodeURIComponent(
                      `Give me a full update on the ${lead.name} lead. What's the current status, lead score, and recommended next steps?`
                    )}&leadId=${lead.id}`}
                    className="w-full block bg-[#1F2937] border border-[#F97316] text-[#F97316] text-sm font-bold py-3 rounded-xl text-center"
                  >
                    🧠 Ask ALFRED about this lead
                  </a>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleQualify(lead)}
                      className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold py-3 px-2 rounded-lg active:opacity-70 text-center"
                    >
                      ✓ QUALIFY
                    </button>
                    <button
                      onClick={() => handleDecline(lead)}
                      className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold py-3 px-2 rounded-lg active:opacity-70 text-center"
                    >
                      ✕ DECLINE
                    </button>
                    <a
                      href={`tel:${lead.phone}`}
                      className="bg-[#2A2A2A] border border-[#F97316] text-[#F97316] text-xs font-bold py-3 px-2 rounded-lg text-center inline-flex items-center justify-center gap-1"
                    >
                      <Phone size={14} />
                      CALL
                    </a>
                    <button
                      onClick={() => setToast('Opening SMS...')}
                      className="bg-[#2A2A2A] border border-[#F97316] text-[#F97316] text-xs font-bold py-3 px-2 rounded-lg active:opacity-70 inline-flex items-center justify-center gap-1"
                    >
                      <MessageSquare size={14} />
                      TEXT
                    </button>
                  </div>

                </div>
              )}
            </div>
          )
        })}

        {!loading && filteredLeads.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No leads with status "{activeTab}"
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-400 text-sm shrink-0">{label}</span>
      <span className="text-white text-sm text-right">{value}</span>
    </div>
  )
}

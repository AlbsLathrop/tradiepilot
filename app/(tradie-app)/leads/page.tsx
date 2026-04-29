'use client'

import { useState, useEffect } from 'react'

interface Lead {
  id: string
  clientName: string
  phone: string
  suburb: string
  service: string
  status: string
  source: string
  receivedDate: string
  lastContact: string
  nextFollowUp: string
  disqualifyReason: string
  notes: string
  leadScore: number | null
  jobValue: number | null
  tradieConfigId: string
  quoteStatus: string
  quoteAmount: number | null
  quoteDate: string | null
  quoteExpiry: string | null
  quoteDaysLeft: number | null
}

const STATUS_COLORS: Record<string, string> = {
  'NEW': 'bg-orange-500 text-white',
  'QUALIFIED': 'bg-green-500 text-white',
  'QUOTED': 'bg-blue-500 text-white',
  'PENDING DECLINE': 'bg-yellow-500 text-black',
  'DECLINED': 'bg-red-500 text-white',
  'COLD': 'bg-gray-600 text-white',
  'WON': 'bg-emerald-500 text-white',
}

const TABS = ['All', 'NEW', 'QUALIFIED', 'QUOTED',
               'PENDING DECLINE', 'DECLINED', 'COLD']

function daysSince(dateStr: string): number {
  if (!dateStr) return 0
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  )
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('All')
  const [toast, setToast] = useState<string | null>(null)
  const [showNewLead, setShowNewLead] = useState(false)
  const [newLead, setNewLead] = useState({
    clientName: '', phone: '', suburb: '',
    service: '', source: '', notes: '', jobValue: ''
  })

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then(d => { setLeads(d.leads ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = activeTab === 'All'
    ? leads
    : leads.filter(l => l.status === activeTab)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleStatusUpdate = async (lead: Lead, newStatus: string) => {
    showToast(`Updating ${lead.clientName} to ${newStatus}...`)
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setLeads(prev => prev.map(l =>
        l.id === lead.id ? { ...l, status: newStatus } : l
      ))
      showToast(`✓ ${lead.clientName} → ${newStatus}`)
    } catch {
      showToast('Update failed')
    }
  }

  const handleQuoteUpdate = async (lead: Lead, status: string) => {
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteStatus: status,
          quoteDate: status === 'SENT'
            ? new Date().toISOString().split('T')[0]
            : undefined,
          quoteExpiry: status === 'SENT'
            ? new Date(Date.now() + 14*24*60*60*1000)
              .toISOString().split('T')[0]
            : undefined
        }),
      })
      setLeads(prev => prev.map(l =>
        l.id === lead.id
          ? {
            ...l,
            quoteStatus: status,
            quoteDate: status === 'SENT' ? new Date().toISOString().split('T')[0] : l.quoteDate,
            quoteExpiry: status === 'SENT' ? new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0] : l.quoteExpiry,
            quoteDaysLeft: status === 'SENT' ? 14 : l.quoteDaysLeft
          }
          : l
      ))
      showToast(`✓ Quote marked as ${status}`)
    } catch {
      showToast('Update failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white pb-24">

      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-[#F97316]
        text-white text-center py-3 px-4 rounded-xl text-sm
        font-medium shadow-lg">
          {toast}
        </div>
      )}

      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-gray-400 text-sm">Qualified opportunities</p>
        </div>
        <button
          onClick={() => setShowNewLead(true)}
          className="w-10 h-10 bg-[#F97316] rounded-full
        flex items-center justify-center text-white text-xl font-bold">
          +
        </button>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs
            font-bold transition-all ${
              activeTab === tab
                ? 'bg-[#F97316] text-white'
                : 'bg-[#1F2937] text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3 mt-2">
        {loading && [1,2,3].map(i => (
          <div key={i} className="bg-[#111827] rounded-xl h-20
          animate-pulse" />
        ))}

        {!loading && filtered.map(lead => {
          const isOpen = expandedId === lead.id
          const statusClass = STATUS_COLORS[lead.status] ??
                              'bg-gray-600 text-white'
          const daysOld = daysSince(lead.receivedDate)
          const daysLastContact = lead.lastContact
            ? daysSince(lead.lastContact) : null

          return (
            <div
              key={lead.id}
              className={`bg-[#111827] rounded-xl overflow-hidden
              transition-all ${isOpen ? 'ring-2 ring-[#F97316]' : ''}`}
            >
              <button
                onClick={() => setExpandedId(
                  isOpen ? null : lead.id
                )}
                className="w-full px-4 py-4 flex items-center
                justify-between text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-base
                  truncate">{lead.clientName}</p>
                  <p className="text-gray-400 text-sm mt-0.5 truncate">
                    {[lead.service, lead.suburb].filter(Boolean).join(' • ')}
                  </p>
                  {lead.quoteDaysLeft !== null &&
                   lead.quoteDaysLeft <= 2 &&
                   lead.quoteStatus === 'SENT' && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full
                    bg-yellow-500 text-black mt-0.5 inline-block">
                      ⚠️ Quote expires {lead.quoteDaysLeft <= 0 ? 'today' :
                      `in ${lead.quoteDaysLeft}d`}
                    </span>
                  )}
                  {daysLastContact !== null && (
                    <p className={`text-xs mt-0.5 ${
                      daysLastContact > 7 ? 'text-red-400' :
                      daysLastContact > 3 ? 'text-yellow-400' :
                      'text-gray-500'
                    }`}>
                      {daysLastContact === 0
                        ? 'Contacted today'
                        : `Last contact: ${daysLastContact}d ago`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {lead.jobValue && (
                    <span className="text-gray-300 text-xs font-medium">
                      ${lead.jobValue.toLocaleString()}
                    </span>
                  )}
                  <span className={`text-xs font-bold px-2.5 py-1
                  rounded-full ${statusClass}`}>
                    {lead.status}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3
                border-t border-[#1F2937]">

                  {/* Lead Info */}
                  <div className="pt-3 space-y-2">
                    {lead.source && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Source</span>
                        <span className="text-white text-sm">
                          {lead.source}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Received</span>
                      <span className="text-white text-sm">
                        {daysOld === 0 ? 'Today' : `${daysOld} days ago`}
                      </span>
                    </div>
                    {lead.leadScore && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">
                          Lead Score
                        </span>
                        <span className="text-[#F97316] text-sm font-bold">
                          {lead.leadScore}/10
                        </span>
                      </div>
                    )}
                    {lead.nextFollowUp && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">
                          Next Follow-up
                        </span>
                        <span className="text-blue-400 text-sm">
                          {new Date(lead.nextFollowUp)
                            .toLocaleDateString('en-AU', {
                              day: 'numeric', month: 'short'
                            })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Disqualify reason */}
                  {lead.disqualifyReason && (
                    <div className="bg-red-500/10 border
                    border-red-500/30 rounded-lg p-3">
                      <p className="text-red-400 text-xs font-bold mb-1">
                        ❌ Disqualified
                      </p>
                      <p className="text-gray-300 text-sm">
                        {lead.disqualifyReason}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {lead.notes && (
                    <div className="bg-[#0F0F0F] rounded-lg p-3">
                      <p className="text-[#F97316] text-xs font-bold
                      uppercase mb-1">Notes</p>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {lead.notes}
                      </p>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="bg-[#0F0F0F] rounded-lg p-3 space-y-2">
                    <p className="text-[#F97316] text-xs font-bold uppercase">
                      Contact
                    </p>
                    {lead.phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Phone</span>
                        <a href={`tel:${lead.phone}`}
                          className="text-[#F97316] text-sm font-medium">
                          {lead.phone}
                        </a>
                      </div>
                    )}
                    {lead.suburb && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Suburb</span>
                        <span className="text-white text-sm">
                          {lead.suburb}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quote */}
                  <div className="bg-[#0F0F0F] rounded-lg p-3 space-y-2">
                    <p className="text-[#F97316] text-xs font-bold uppercase">Quote</p>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Status</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        lead.quoteStatus === 'ACCEPTED'
                          ? 'bg-green-500/20 text-green-400' :
                        lead.quoteStatus === 'SENT' && lead.quoteDaysLeft! < 0
                          ? 'bg-red-500/20 text-red-400' :
                        lead.quoteStatus === 'SENT' && lead.quoteDaysLeft! <= 2
                          ? 'bg-yellow-500/20 text-yellow-400' :
                        lead.quoteStatus === 'SENT'
                          ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {lead.quoteStatus === 'SENT' && lead.quoteDaysLeft !== null
                          ? lead.quoteDaysLeft < 0
                            ? 'EXPIRED'
                            : `SENT · ${lead.quoteDaysLeft}d left`
                          : lead.quoteStatus}
                      </span>
                    </div>

                    {lead.quoteAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Amount</span>
                        <span className="text-white text-sm font-bold">
                          ${lead.quoteAmount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {lead.quoteDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Sent</span>
                        <span className="text-white text-sm">
                          {new Date(lead.quoteDate).toLocaleDateString('en-AU', {
                            day: 'numeric', month: 'short'
                          })}
                        </span>
                      </div>
                    )}

                    {lead.quoteExpiry && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Expires</span>
                        <span className={`text-sm ${
                          lead.quoteDaysLeft !== null && lead.quoteDaysLeft <= 2
                            ? 'text-red-400 font-bold'
                            : 'text-white'
                        }`}>
                          {new Date(lead.quoteExpiry).toLocaleDateString('en-AU', {
                            day: 'numeric', month: 'short'
                          })}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {['NOT QUOTED','SENT','ACCEPTED'].map(status => (
                        <button
                          key={status}
                          onClick={() => handleQuoteUpdate(lead, status)}
                          className={`text-xs font-bold py-2 rounded-lg ${
                            lead.quoteStatus === status
                              ? 'bg-[#F97316] text-white'
                              : 'bg-[#1F2937] text-gray-400'
                          }`}
                        >
                          {status === 'NOT QUOTED' ? 'Not Sent' :
                           status === 'SENT' ? 'Quoted' : 'Won ✓'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ask ALFRED */}
                  <a
                    href={`/chat?message=${encodeURIComponent(
                      `Give me a full update on the lead: ${lead.clientName} from ${lead.suburb}. What's their status, what happened, and what should I do next?`
                    )}`}
                    className="w-full block bg-[#1F2937] border
                    border-[#F97316] text-[#F97316] text-sm font-bold
                    py-3 rounded-xl text-center"
                  >
                    🧠 Ask ALFRED about this lead
                  </a>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="bg-[#1F2937] border border-gray-600
                        text-white text-xs font-bold py-3 rounded-lg
                        text-center"
                      >
                        📞 Call
                      </a>
                    )}
                    {lead.phone && (
                      <a
                        href={`sms:${lead.phone}`}
                        className="bg-[#1F2937] border border-gray-600
                        text-white text-xs font-bold py-3 rounded-lg
                        text-center"
                      >
                        💬 Text
                      </a>
                    )}
                    {lead.status !== 'QUALIFIED' && (
                      <button
                        onClick={() => handleStatusUpdate(lead, 'QUALIFIED')}
                        className="bg-green-600 text-white text-xs
                        font-bold py-3 rounded-lg"
                      >
                        ✓ Qualify
                      </button>
                    )}
                    {lead.status !== 'DECLINED' && (
                      <button
                        onClick={() => handleStatusUpdate(lead, 'DECLINED')}
                        className="bg-red-600 text-white text-xs
                        font-bold py-3 rounded-lg"
                      >
                        ✗ Decline
                      </button>
                    )}
                    {lead.status !== 'COLD' && (
                      <button
                        onClick={() => handleStatusUpdate(lead, 'COLD')}
                        className="bg-gray-600 text-white text-xs
                        font-bold py-3 rounded-lg col-span-2"
                      >
                        🧊 Mark Cold
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No leads with status "{activeTab}"
          </div>
        )}
      </div>

      {/* New Lead Modal */}
      {showNewLead && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-[#111827] rounded-t-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-bold text-lg">New Lead</h2>
              <button onClick={() => setShowNewLead(false)} className="text-gray-400 text-xl">×</button>
            </div>
            {[
              { key: 'clientName', label: 'Client Name *', type: 'text' },
              { key: 'phone', label: 'Phone', type: 'tel' },
              { key: 'suburb', label: 'Suburb *', type: 'text' },
              { key: 'service', label: 'Service Type', type: 'text' },
              { key: 'source', label: 'Source', type: 'text' },
              { key: 'jobValue', label: 'Job Value ($)', type: 'number' },
              { key: 'notes', label: 'Notes', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-gray-400 text-xs mb-1 block">
                  {label}
                </label>
                <input
                  type={type}
                  value={(newLead as any)[key]}
                  onChange={e => setNewLead(prev => ({
                    ...prev, [key]: e.target.value
                  }))}
                  className="w-full bg-[#0F0F0F] border border-[#1F2937] rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#F97316] outline-none"
                />
              </div>
            ))}
            <button
              onClick={async () => {
                if (!newLead.clientName || !newLead.suburb) {
                  showToast('Client name and suburb required')
                  return
                }
                const res = await fetch('/api/leads', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...newLead,
                    jobValue: newLead.jobValue ? Number(newLead.jobValue) : null,
                  }),
                })
                const data = await res.json()
                if (data.success) {
                  showToast('✓ Lead created!')
                  setShowNewLead(false)
                  setNewLead({
                    clientName: '', phone: '', suburb: '',
                    service: '', source: '', notes: '', jobValue: ''
                  })
                  fetch('/api/leads').then(r => r.json())
                    .then(d => setLeads(d.leads ?? []))
                } else {
                  showToast('Failed to create lead')
                }
              }}
              className="w-full bg-[#F97316] text-white font-bold py-3 rounded-xl text-sm"
            >
              Create Lead
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

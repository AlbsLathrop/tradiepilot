'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Lead {
  id: string
  clientName: string
  phone: string
  suburb: string
  service: string
  status: string
  lunaStatus: string
  chaseStatus: string
  source: string
  receivedDate: string
  lastContact: string
  nextFollowUp: string
  quoteDate: string | null
  quoteDaysLeft: number | null
  notes: string
  lunaLastUpdate: string
  tradieConfigId: string
  jobValue: number | null
  quoteAmount: number | null
  quoteExpiry: string | null
  quoteStatus: string
  disqualifyReason: string
  leadLog?: any[]
  daysToClose?: number | null
}

const STATUS_COLORS: Record<string, string> = {
  'NEW': 'bg-orange-500 text-white',
  'CALLED': 'bg-blue-500 text-white',
  'QUOTED': 'bg-purple-500 text-white',
  'WON': 'bg-green-500 text-white',
  'COLD': 'bg-gray-600 text-white',
}

const TABS = ['All', 'NEW', 'CALLED', 'QUOTED', 'WON', 'COLD']

function daysSince(dateStr: string): number {
  if (!dateStr) return 0
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  )
}

export default function LeadsPage() {
  const { data: session, status } = useSession()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('All')
  const [toast, setToast] = useState<string | null>(null)
  const [showNewLead, setShowNewLead] = useState(false)
  const [openLeadLogId, setOpenLeadLogId] = useState<string | null>(null)
  const [quickNote, setQuickNote] = useState<Record<string, string>>({})
  const [newLead, setNewLead] = useState({
    clientName: '', phone: '', suburb: '',
    service: '', source: '', notes: ''
  })

  const fetchLeads = (tradieSlug: string) => {
    console.log('[LEADS] Fetching leads for:', tradieSlug)
    fetch(`/api/leads?tradieSlug=${tradieSlug}`)
      .then(r => {
        if (!r.ok) throw new Error(`Leads API: ${r.status}`)
        return r.json()
      })
      .then(d => {
        console.log('[LEADS] Received leads:', d.leads?.length ?? 0)
        setLeads(d.leads ?? [])
        setLoading(false)
      })
      .catch(err => {
        console.error('[LEADS] Fetch error:', err)
        setLoading(false)
      })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white pb-24">
        <div className="px-4 space-y-3 pt-8">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#111827] rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!session?.user?.tradieSlug) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex items-center justify-center">
        <p className="text-gray-400">Unable to load leads</p>
      </div>
    )
  }

  useEffect(() => {
    fetchLeads(session.user.tradieSlug)
  }, [session?.user?.tradieSlug])

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

  const handleAddLeadNote = async (lead: Lead) => {
    const note = quickNote[lead.id]?.trim()
    if (!note) return
    try {
      await fetch('/api/leads/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          leadName: lead.clientName,
          title: `Note — ${lead.clientName}`,
          description: note,
          eventType: 'NOTE',
          by: session?.user?.name || 'TradiePilot',
        }),
      })
      setQuickNote(prev => ({ ...prev, [lead.id]: '' }))
      if (session?.user?.tradieSlug) {
        fetchLeads(session.user.tradieSlug)
      }
      showToast('✓ Note added')
    } catch {
      showToast('Failed to add note')
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
                  {(() => {
                    const days = daysSince(lead.receivedDate)
                    const isHot = days <= 2 && lead.status === 'NEW'
                    const isStale = days > 14 &&
                      !['WON','COLD','DECLINED'].includes(lead.status)
                    return (
                      <p className={`text-xs mt-0.5 ${
                        isHot ? 'text-green-400' :
                        isStale ? 'text-red-400' :
                        'text-gray-500'
                      }`}>
                        {isHot ? '🔥 ' : isStale ? '⏰ ' : ''}
                        {days === 0 ? 'Today' : `${days}d in pipeline`}
                      </p>
                    )
                  })()}
                  {lead.quoteDaysLeft !== null &&
                   lead.quoteDaysLeft <= 2 && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full
                    bg-yellow-500 text-black mt-0.5 inline-block">
                      ⚠️ Quote expires {lead.quoteDaysLeft <= 0 ? 'today' :
                      `in ${lead.quoteDaysLeft}d`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1
                  rounded-full ${statusClass}`}>
                    {lead.status}
                  </span>
                  {lead.lunaStatus &&
                   lead.lunaStatus !== '' && (
                    <span className="text-[10px] text-gray-400
                    px-1.5 py-0.5 rounded bg-gray-500/10">
                      LUNA: {lead.lunaStatus}
                    </span>
                  )}
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
                    {lead.lunaStatus && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">
                          LUNA Status
                        </span>
                        <span className="text-[#F97316] text-sm font-bold">
                          {lead.lunaStatus}
                        </span>
                      </div>
                    )}
                    {lead.chaseStatus && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">
                          CHASE Status
                        </span>
                        <span className="text-blue-400 text-sm">
                          {lead.chaseStatus}
                        </span>
                      </div>
                    )}
                  </div>

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

                  {/* Lead Log */}
                  {lead.leadLog && lead.leadLog.length > 0 && (
                    <div className="border-t border-[#1F2937] pt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenLeadLogId(
                            openLeadLogId === lead.id ? null : lead.id
                          )
                        }}
                        className="w-full flex items-center justify-between py-2"
                      >
                        <span className="text-[#F97316] text-xs font-bold uppercase tracking-wide">
                          📋 Lead Log ({lead.leadLog.length} entries)
                        </span>
                        <span className="text-gray-500 text-xs">
                          {openLeadLogId === lead.id ? '▲' : '▼'}
                        </span>
                      </button>

                      {openLeadLogId === lead.id && (
                        <>
                          <div className="space-y-2 mt-1 max-h-72 overflow-y-auto pr-1">
                            {lead.leadLog.map((entry: any, i: number) => (
                              <div
                                key={i}
                                className="bg-[#0F0F0F] rounded-lg p-3 border-l-2 border-[#F97316]"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="text-white text-xs font-semibold leading-tight">
                                    {entry.title}
                                  </span>
                                  <span className="text-gray-500 text-[10px] shrink-0">
                                    {entry.date ? new Date(entry.date)
                                      .toLocaleDateString('en-AU', {
                                        day: 'numeric', month: 'short'
                                      }) : ''}
                                  </span>
                                </div>
                                {entry.description && (
                                  <p className="text-gray-400 text-xs leading-relaxed mb-1.5">
                                    {entry.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    entry.eventType === 'WON'
                                      ? 'bg-green-500/20 text-green-400'
                                      : entry.eventType === 'LOST'
                                        ? 'bg-red-500/20 text-red-400'
                                        : entry.eventType === 'OBJECTION'
                                          ? 'bg-red-500/20 text-red-400'
                                          : entry.eventType === 'QUOTE_SENT'
                                            ? 'bg-yellow-500/20 text-yellow-400'
                                            : entry.eventType === 'SITE_VISIT'
                                              ? 'bg-orange-500/20 text-orange-400'
                                              : entry.eventType === 'LUNA_RESPONSE'
                                                ? 'bg-purple-500/20 text-purple-400'
                                                : entry.eventType === 'NEGOTIATION'
                                                  ? 'bg-yellow-500/20 text-yellow-400'
                                                  : 'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {entry.eventType}
                                  </span>
                                  {entry.by && (
                                    <span className="text-gray-500 text-[10px]">
                                      by {entry.by}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <input
                              type="text"
                              placeholder="Add a note..."
                              value={quickNote[lead.id] ?? ''}
                              onChange={(e) => setQuickNote(prev => ({
                                ...prev, [lead.id]: e.target.value
                              }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddLeadNote(lead)
                              }}
                              className="flex-1 bg-[#0F0F0F] border border-[#1F2937]
                              rounded-lg px-3 py-2 text-white text-xs
                              focus:border-[#F97316] outline-none"
                            />
                            <button
                              onClick={() => handleAddLeadNote(lead)}
                              className="bg-[#F97316] text-white text-xs font-bold
                              px-3 py-2 rounded-lg"
                            >
                              +
                            </button>
                          </div>
                        </>
                      )}
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

                  {/* Quote Date */}
                  {lead.quoteDate && (
                    <div className="bg-[#0F0F0F] rounded-lg p-3">
                      <p className="text-[#F97316] text-xs font-bold uppercase mb-2">Quote Date</p>
                      <p className="text-white text-sm">
                        {new Date(lead.quoteDate).toLocaleDateString('en-AU', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

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
                    {lead.status !== 'CALLED' && (
                      <button
                        onClick={() => handleStatusUpdate(lead, 'CALLED')}
                        className="bg-blue-600 text-white text-xs
                        font-bold py-3 rounded-lg"
                      >
                        ✓ Called
                      </button>
                    )}
                    {lead.status !== 'QUOTED' && (
                      <button
                        onClick={() => handleStatusUpdate(lead, 'QUOTED')}
                        className="bg-purple-600 text-white text-xs
                        font-bold py-3 rounded-lg"
                      >
                        📋 Quoted
                      </button>
                    )}
                    {lead.status !== 'WON' && (
                      <button
                        onClick={() => handleStatusUpdate(lead, 'WON')}
                        className="bg-green-600 text-white text-xs
                        font-bold py-3 rounded-lg"
                      >
                        🎉 Won
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
                  body: JSON.stringify(newLead),
                })
                const data = await res.json()
                if (data.success) {
                  showToast('✓ Lead created!')
                  setShowNewLead(false)
                  setNewLead({
                    clientName: '', phone: '', suburb: '',
                    service: '', source: '', notes: ''
                  })
                  if (session?.user?.tradieSlug) {
                    fetchLeads(session.user.tradieSlug)
                  }
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

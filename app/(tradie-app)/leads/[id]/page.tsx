'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Phone, MessageSquare } from 'lucide-react'

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

const SAMPLE_LEADS: Record<string | number, Lead> = {
  1: {
    id: 1,
    name: 'Sarah Mitchell',
    service: 'Kitchen Renovation',
    suburb: 'Bondi',
    status: 'NEW',
    dateReceived: '2026-04-19',
    phone: '0412 345 678',
  },
  2: {
    id: 2,
    name: 'James Wong',
    service: 'Bathroom Tiles',
    suburb: 'Neutral Bay',
    status: 'QUALIFIED',
    dateReceived: '2026-04-18',
    phone: '0412 345 679',
  },
  3: {
    id: 3,
    name: 'Emma Davis',
    service: 'Deck Build',
    suburb: 'Paddington',
    status: 'PENDING_DECLINE',
    dateReceived: '2026-04-17',
    phone: '0412 345 680',
  },
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const lead = SAMPLE_LEADS[params.id]
  const [status, setStatus] = useState(lead?.status || 'NEW')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  if (!lead) {
    return (
      <div className="p-4 text-center pb-24">
        <p className="text-[#9CA3AF]">Lead not found</p>
        <Link href="/leads" className="text-[#06B6D4] mt-4 inline-block">
          Back to Leads
        </Link>
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 500))
      router.push('/leads')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-6 space-y-4 pb-24">
      {/* Back button */}
      <Link
        href="/leads"
        className="inline-flex items-center gap-2 text-[#06B6D4] hover:text-[#0891B2] text-sm font-semibold"
      >
        <ChevronLeft size={16} />
        Back to Leads
      </Link>

      {/* Lead Info Card */}
      <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 space-y-3">
        <h1 className="text-2xl font-bold text-[#F9FAFB]">{lead.name}</h1>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-[#9CA3AF] uppercase tracking-wider font-medium mb-1">Service</p>
            <p className="text-sm text-[#F9FAFB]">{lead.service}</p>
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] uppercase tracking-wider font-medium mb-1">Location</p>
            <p className="text-sm text-[#F9FAFB]">{lead.suburb}</p>
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] uppercase tracking-wider font-medium mb-1">Phone</p>
            <a href={`tel:${lead.phone}`} className="text-[#06B6D4] hover:text-[#0891B2] text-sm font-semibold">
              {lead.phone}
            </a>
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] uppercase tracking-wider font-medium mb-1">Received</p>
            <p className="text-sm text-[#F9FAFB]">{new Date(lead.dateReceived).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Status Dropdown */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#F9FAFB]">Status</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="w-full px-4 py-3 h-12 bg-[#111827] border border-[#06B6D4] rounded-lg text-[#F9FAFB] font-semibold focus:outline-none focus:border-[#0891B2] appearance-none flex items-center"
        >
          {LEAD_STATUSES.map(s => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        {status && (
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
            {status.replace('_', ' ')}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#F9FAFB]">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full px-3 py-3 bg-[#111827] border border-[#374151] rounded-lg text-[#F9FAFB] focus:outline-none focus:border-[#06B6D4] min-h-32 resize-none"
          placeholder="Add notes about this lead..."
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => window.location.href = `tel:${lead.phone}`}
          className="w-full h-12 inline-flex items-center justify-center gap-2 bg-[#06B6D4] text-[#111827] rounded-lg text-sm font-semibold hover:bg-[#0891B2] transition"
        >
          <Phone size={16} />
          Call
        </button>
        <button
          className="w-full h-12 inline-flex items-center justify-center gap-2 bg-[#1F2937] text-[#F9FAFB] border border-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-700 transition"
        >
          <MessageSquare size={16} />
          Send Message
        </button>
      </div>

      {/* Save Button - Fixed bottom */}
      <div className="fixed bottom-[60px] left-0 right-0 p-4 bg-[#111827]/95 border-t border-[#374151] space-y-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-3 h-12 bg-[#06B6D4] text-[#111827] rounded-lg font-semibold hover:bg-[#0891B2] disabled:opacity-50 transition flex items-center justify-center"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

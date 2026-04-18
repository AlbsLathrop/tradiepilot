'use client'

import { Lead } from '@/lib/store/pipeline'
import { MessageCircle, Phone, AlertCircle } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface LeadCardProps {
  lead: Lead
}

const agentColors = {
  LUNA: '#f5c518',
  CHASE: '#3b82f6',
  ORBIT: '#22c55e',
  ANCHOR: '#f97316',
  FIXER: '#a855f7',
}

const sourceColors = {
  Instagram: '#e4405f',
  Referral: '#22c55e',
  Google: '#ea4335',
  Cold: '#8892b0',
  Other: '#4a5280',
}

export function LeadCard({ lead }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-[#161929] border border-[#252a3d] rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'shadow-lg scale-105' : 'hover:border-[#3d4570]'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="font-semibold text-[#e8eaf6] text-sm">{lead.name}</div>
          <div className="text-xs text-[#8892b0]">{lead.businessName}</div>
        </div>
        <div className="text-lg flex-shrink-0">
          {lead.assignedAgent === 'LUNA' && '🌙'}
          {lead.assignedAgent === 'CHASE' && '🔵'}
          {lead.assignedAgent === 'ORBIT' && '🌍'}
          {lead.assignedAgent === 'ANCHOR' && '⚓'}
          {lead.assignedAgent === 'FIXER' && '🔧'}
        </div>
      </div>

      {/* MRR */}
      <div className="text-2xl font-mono font-bold mb-3" style={{ color: agentColors[lead.assignedAgent] }}>
        ${lead.mrrEstimate.toLocaleString()}
      </div>

      {/* Days in stage warning */}
      {lead.daysInStage > 7 && (
        <div className="flex items-center gap-1 text-xs text-[#ef4444] mb-3">
          <AlertCircle size={14} />
          {lead.daysInStage} days in stage
        </div>
      )}

      {/* Source badge */}
      <div className="mb-3">
        <span
          className="inline-block px-2 py-1 rounded-full text-xs font-mono uppercase tracking-wider"
          style={{
            backgroundColor: sourceColors[lead.source] + '22',
            color: sourceColors[lead.source],
            border: `1px solid ${sourceColors[lead.source]}`,
          }}
        >
          {lead.source}
        </span>
      </div>

      {/* Tags */}
      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {lead.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-[#252a3d] text-[#8892b0] rounded text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Last activity */}
      <div className="text-xs text-[#4a5280] mb-3 border-t border-[#252a3d] pt-3">
        {lead.lastActivity}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[#252a3d] hover:bg-[#2e3452] rounded text-xs text-[#8892b0] transition-colors">
          <Phone size={14} />
          Call
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[#252a3d] hover:bg-[#2e3452] rounded text-xs text-[#8892b0] transition-colors">
          <MessageCircle size={14} />
          Message
        </button>
      </div>
    </div>
  )
}

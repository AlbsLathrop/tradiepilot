'use client'

import { PipelineStage, Lead } from '@/lib/store/pipeline'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LeadCard } from './lead-card'
import { Plus } from 'lucide-react'

interface StageColumnProps {
  stage: PipelineStage
  leads: Lead[]
}

const stageConfig = {
  LEAD: { label: 'Lead', color: '#3b82f6', emoji: '⭐' },
  CONTACTED: { label: 'Contacted', color: '#8892b0', emoji: '📞' },
  QUOTE_SENT: { label: 'Quote Sent', color: '#f5c518', emoji: '📋' },
  BOOKED: { label: 'Booked', color: '#22c55e', emoji: '✅' },
  ACTIVE: { label: 'Active', color: '#a855f7', emoji: '🚀' },
}

export function StageColumn({ stage, leads }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const config = stageConfig[stage]
  const stageMRR = leads.reduce((acc, lead) => acc + lead.mrrEstimate, 0)

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-80 bg-[#0f111a] rounded-lg p-4 transition-all ${
        isOver ? 'ring-2 ring-offset-2 ring-offset-[#0f111a]' : ''
      }`}
      style={{ '--ring-color': isOver ? config.color : 'transparent' } as React.CSSProperties}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.emoji}</span>
            <div>
              <h3 className="font-mono font-bold text-[#e8eaf6]">{config.label}</h3>
              <div className="text-xs text-[#4a5280]">{leads.length} lead{leads.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-mono font-bold" style={{ color: config.color }}>
            ${(stageMRR / 1000).toFixed(1)}k
          </span>
          <span className="text-xs text-[#4a5280]">MRR</span>
        </div>
      </div>

      {/* Cards */}
      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 mb-4">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      </SortableContext>

      {/* Add button */}
      <button className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-[#252a3d] rounded-lg text-[#8892b0] hover:border-[#3d4570] hover:text-[#e8eaf6] transition-colors text-sm">
        <Plus size={16} />
        Add Lead
      </button>
    </div>
  )
}

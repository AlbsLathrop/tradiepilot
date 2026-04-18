'use client'

import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { usePipelineStore, PipelineStage } from '@/lib/store/pipeline'
import { StageColumn } from './stage-column'

const stages: PipelineStage[] = ['LEAD', 'CONTACTED', 'QUOTE_SENT', 'BOOKED', 'ACTIVE']

export function PipelineBoard() {
  const { leads, moveLead } = usePipelineStore()

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const overStage = over.id as PipelineStage
    const leadId = active.id as string
    const lead = leads.find((l) => l.id === leadId)

    if (lead && lead.stage !== overStage) {
      moveLead(leadId, overStage)
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <StageColumn key={stage} stage={stage} leads={leads.filter((l) => l.stage === stage)} />
        ))}
      </div>
    </DndContext>
  )
}

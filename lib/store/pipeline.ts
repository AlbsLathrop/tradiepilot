import { create } from 'zustand'

export type PipelineStage = 'LEAD' | 'CONTACTED' | 'QUOTE_SENT' | 'BOOKED' | 'ACTIVE'

export interface Lead {
  id: string
  name: string
  businessName: string
  stage: PipelineStage
  mrrEstimate: number
  source: 'Instagram' | 'Referral' | 'Google' | 'Cold' | 'Other'
  assignedAgent: 'LUNA' | 'CHASE' | 'ORBIT' | 'ANCHOR' | 'FIXER'
  daysInStage: number
  lastActivity: string
  tags: string[]
}

interface PipelineStore {
  leads: Lead[]
  moveLead: (leadId: string, newStage: PipelineStage) => void
  addLead: (lead: Lead) => void
  updateLead: (leadId: string, updates: Partial<Lead>) => void
}

const initialLeads: Lead[] = [
  {
    id: '1',
    name: 'Rob K.',
    businessName: 'Rob\'s Plumbing',
    stage: 'CONTACTED',
    mrrEstimate: 2500,
    source: 'Referral',
    assignedAgent: 'CHASE',
    daysInStage: 8,
    lastActivity: 'Follow-up SMS sent',
    tags: ['Plumbing'],
  },
  {
    id: '2',
    name: 'Dave P.',
    businessName: 'Dave\'s Electrical',
    stage: 'QUOTE_SENT',
    mrrEstimate: 3200,
    source: 'Google',
    assignedAgent: 'LUNA',
    daysInStage: 3,
    lastActivity: 'Quote sent via email',
    tags: ['Electrical'],
  },
  {
    id: '3',
    name: 'Morrison Plumbing',
    businessName: 'Morrison Bros',
    stage: 'ACTIVE',
    mrrEstimate: 4500,
    source: 'Referral',
    assignedAgent: 'ORBIT',
    daysInStage: 45,
    lastActivity: 'Job update sent',
    tags: ['Plumbing'],
  },
  {
    id: '4',
    name: 'Elite Electrical',
    businessName: 'Elite Electrical',
    stage: 'ACTIVE',
    mrrEstimate: 5200,
    source: 'Instagram',
    assignedAgent: 'ORBIT',
    daysInStage: 62,
    lastActivity: 'Invoice paid',
    tags: ['Electrical'],
  },
  {
    id: '5',
    name: 'Harris Tiling',
    businessName: 'Harris Tiling',
    stage: 'BOOKED',
    mrrEstimate: 2800,
    source: 'Referral',
    assignedAgent: 'LUNA',
    daysInStage: 5,
    lastActivity: 'Booking confirmed',
    tags: ['Tiling'],
  },
  {
    id: '6',
    name: 'Smith Bros',
    businessName: 'Smith Bros Painting',
    stage: 'QUOTE_SENT',
    mrrEstimate: 1800,
    source: 'Cold',
    assignedAgent: 'LUNA',
    daysInStage: 12,
    lastActivity: 'Reminder sent',
    tags: ['Painting'],
  },
  {
    id: '7',
    name: 'Lisa M.',
    businessName: 'Lisa\'s Cleaning',
    stage: 'LEAD',
    mrrEstimate: 1200,
    source: 'Instagram',
    assignedAgent: 'LUNA',
    daysInStage: 0,
    lastActivity: 'Lead qualified',
    tags: ['Cleaning'],
  },
  {
    id: '8',
    name: 'John T.',
    businessName: 'John\'s HVAC',
    stage: 'CONTACTED',
    mrrEstimate: 3800,
    source: 'Google',
    assignedAgent: 'CHASE',
    daysInStage: 2,
    lastActivity: 'Initial call scheduled',
    tags: ['HVAC'],
  },
]

export const usePipelineStore = create<PipelineStore>((set) => ({
  leads: initialLeads,
  moveLead: (leadId, newStage) =>
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === leadId
          ? { ...lead, stage: newStage, daysInStage: 0, lastActivity: 'Moved to ' + newStage }
          : lead
      ),
    })),
  addLead: (lead) =>
    set((state) => ({
      leads: [...state.leads, lead],
    })),
  updateLead: (leadId, updates) =>
    set((state) => ({
      leads: state.leads.map((lead) => (lead.id === leadId ? { ...lead, ...updates } : lead)),
    })),
}))

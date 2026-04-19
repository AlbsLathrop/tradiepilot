import { create } from 'zustand'

export interface JobHistory {
  id: string
  name: string
  date: string
  amount: number
  status: 'COMPLETE' | 'IN_PROGRESS'
}

export interface PaymentHistory {
  id: string
  date: string
  amount: number
  method: string
  status: 'PAID' | 'PENDING'
}

export interface Client {
  id: string
  name: string
  businessName: string
  phone: string
  email: string
  address: string
  healthScore: number
  mrr: number
  jobsCompleted: number
  jobsInProgress: number
  totalSpent: number
  lastContact: string
  joinedDate: string
  notes: string
  jobHistory: JobHistory[]
  paymentHistory: PaymentHistory[]
}

interface ClientsStore {
  clients: Client[]
}

const seedClients: Client[] = [
  {
    id: 'c1',
    name: 'John Smith',
    businessName: 'Smith Bros Construction',
    phone: '+61412345678',
    email: 'john@smithbros.com.au',
    address: '123 Main St, Sydney NSW 2000',
    healthScore: 92,
    mrr: 2800,
    jobsCompleted: 14,
    jobsInProgress: 1,
    totalSpent: 42000,
    lastContact: new Date(Date.now() - 86400000).toISOString(),
    joinedDate: new Date(Date.now() - 31536000000).toISOString(),
    notes: 'Great client, consistent work. Sometimes slow on payments.',
    jobHistory: [
      { id: '1', name: 'Kitchen Renovation', date: new Date(Date.now() - 604800000).toISOString(), amount: 3200, status: 'COMPLETE' },
      { id: '2', name: 'Bathroom Tiles', date: new Date(Date.now() - 1209600000).toISOString(), amount: 2100, status: 'COMPLETE' },
      { id: '3', name: 'Deck Build (In Progress)', date: new Date(Date.now() - 172800000).toISOString(), amount: 4500, status: 'IN_PROGRESS' },
    ],
    paymentHistory: [
      { id: '1', date: new Date(Date.now() - 604800000).toISOString(), amount: 3200, method: 'Bank Transfer', status: 'PAID' },
      { id: '2', date: new Date(Date.now() - 1209600000).toISOString(), amount: 2100, method: 'Card', status: 'PAID' },
      { id: '3', date: new Date(Date.now() - 2592000000).toISOString(), amount: 1500, method: 'Bank Transfer', status: 'PENDING' },
    ],
  },
  {
    id: 'c2',
    name: 'Elite Electrical',
    businessName: 'Elite Electrical Services',
    phone: '+61487654321',
    email: 'contact@elite-elec.com.au',
    address: '456 Business Ave, Melbourne VIC 3000',
    healthScore: 88,
    mrr: 3500,
    jobsCompleted: 22,
    jobsInProgress: 2,
    totalSpent: 68000,
    lastContact: new Date(Date.now() - 172800000).toISOString(),
    joinedDate: new Date(Date.now() - 63072000000).toISOString(),
    notes: 'Heavy hitter. Calls weekly. Referral source.',
    jobHistory: [
      { id: '1', name: 'House Wiring', date: new Date(Date.now() - 259200000).toISOString(), amount: 5200, status: 'COMPLETE' },
      { id: '2', name: 'Commercial Panel', date: new Date(Date.now() - 432000000).toISOString(), amount: 8900, status: 'COMPLETE' },
    ],
    paymentHistory: [
      { id: '1', date: new Date(Date.now() - 259200000).toISOString(), amount: 5200, method: 'Bank Transfer', status: 'PAID' },
    ],
  },
  {
    id: 'c3',
    name: 'Sarah Johnson',
    businessName: 'Johnson Property Management',
    phone: '+61466666666',
    email: 'sarah@jpmanage.com.au',
    address: '789 Park Rd, Brisbane QLD 4000',
    healthScore: 72,
    mrr: 1200,
    jobsCompleted: 8,
    jobsInProgress: 0,
    totalSpent: 15600,
    lastContact: new Date(Date.now() - 1209600000).toISOString(),
    joinedDate: new Date(Date.now() - 15552000000).toISOString(),
    notes: 'Slow responder. One-off jobs mostly. Consider following up.',
    jobHistory: [
      { id: '1', name: 'Painting Touch-up', date: new Date(Date.now() - 1209600000).toISOString(), amount: 1200, status: 'COMPLETE' },
    ],
    paymentHistory: [
      { id: '1', date: new Date(Date.now() - 1209600000).toISOString(), amount: 1200, method: 'Card', status: 'PAID' },
    ],
  },
  {
    id: 'c4',
    name: 'Mike Tiling',
    businessName: 'Harris Tiling Studio',
    phone: '+61499999999',
    email: 'mike@harristiling.com.au',
    address: '321 Craft Lane, Adelaide SA 5000',
    healthScore: 95,
    mrr: 4200,
    jobsCompleted: 31,
    jobsInProgress: 3,
    totalSpent: 105000,
    lastContact: new Date(Date.now() - 43200000).toISOString(),
    joinedDate: new Date(Date.now() - 94608000000).toISOString(),
    notes: 'VIP client. Best performer. Strategic partnership.',
    jobHistory: [
      { id: '1', name: 'Shower Reno', date: new Date(Date.now() - 172800000).toISOString(), amount: 6800, status: 'COMPLETE' },
      { id: '2', name: 'Pool Deck', date: new Date(Date.now() - 345600000).toISOString(), amount: 9200, status: 'COMPLETE' },
    ],
    paymentHistory: [
      { id: '1', date: new Date(Date.now() - 172800000).toISOString(), amount: 6800, method: 'Bank Transfer', status: 'PAID' },
    ],
  },
  {
    id: 'c5',
    name: 'Brisbane Constructions',
    businessName: 'Brisbane Constructions Ltd',
    phone: '+61488888888',
    email: 'info@brisbane-build.com.au',
    address: '555 Industry St, Gold Coast QLD 4200',
    healthScore: 61,
    mrr: 2100,
    jobsCompleted: 5,
    jobsInProgress: 2,
    totalSpent: 23000,
    lastContact: new Date(Date.now() - 2592000000).toISOString(),
    joinedDate: new Date(Date.now() - 7776000000).toISOString(),
    notes: 'New client, health declining. Need to check in.',
    jobHistory: [
      { id: '1', name: 'Foundation Work', date: new Date(Date.now() - 864000000).toISOString(), amount: 12000, status: 'COMPLETE' },
    ],
    paymentHistory: [
      { id: '1', date: new Date(Date.now() - 864000000).toISOString(), amount: 8000, method: 'Bank Transfer', status: 'PAID' },
      { id: '2', date: new Date(Date.now() - 604800000).toISOString(), amount: 4000, method: 'Bank Transfer', status: 'PENDING' },
    ],
  },
]

export const useClientsStore = create<ClientsStore>(() => ({
  clients: seedClients,
}))

import { create } from 'zustand'

export type NotificationType = 'urgent' | 'warning' | 'win' | 'info'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  linkTo: string
  readAt?: string
  createdAt: string
}

interface NotificationsStore {
  notifications: AppNotification[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
  addNotification: (n: AppNotification) => void
}

const seedNotifications: AppNotification[] = [
  {
    id: '1',
    type: 'urgent',
    title: 'Lead stale — 8 days',
    body: 'Rob K. has been in CONTACTED for 8 days with no close.',
    linkTo: '/pipeline',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    type: 'warning',
    title: 'Client health dropped',
    body: 'Smith Bros health score fell to 61 — follow-up needed.',
    linkTo: '/clients',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    type: 'win',
    title: 'Invoice paid 💸',
    body: 'Elite Electrical paid invoice #INV-2481 — $5,200.',
    linkTo: '/clients',
    readAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: '4',
    type: 'win',
    title: 'New client booked',
    body: 'Harris Tiling moved to BOOKED — $2,800 MRR.',
    linkTo: '/pipeline',
    readAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '5',
    type: 'info',
    title: 'ORBIT batch complete',
    body: 'ORBIT sent 22 job updates and completed all tasks for today.',
    linkTo: '/dashboard',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
]

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: seedNotifications,
  unreadCount: seedNotifications.filter((n) => !n.readAt).length,
  markRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
      return { notifications: updated, unreadCount: updated.filter((n) => !n.readAt).length }
    }),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
      unreadCount: 0,
    })),
  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
}))

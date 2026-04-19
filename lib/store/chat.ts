import { create } from 'zustand'

export type MessageType = 'text' | 'image' | 'mention_lead' | 'mention_client'

export interface Reaction {
  emoji: string
  userIds: string[]
}

export interface ChatMessage {
  id: string
  fromUserId: 'alberto' | 'benny'
  content: string
  messageType: MessageType
  mentionId?: string
  mentionLabel?: string
  imageUrl?: string
  reactions: Record<string, string[]>
  replyToId?: string
  replyToContent?: string
  readAt?: string
  createdAt: string
  pending?: boolean
}

export interface PresenceUser {
  userId: 'alberto' | 'benny'
  name: string
  color: string
  lastSeen: string
  online: boolean
}

interface ChatStore {
  messages: ChatMessage[]
  presence: Record<string, PresenceUser>
  isTyping: boolean
  unreadCount: number
  addMessage: (msg: ChatMessage) => void
  setMessages: (msgs: ChatMessage[]) => void
  updatePresence: (user: PresenceUser) => void
  setTyping: (typing: boolean) => void
  markAllRead: () => void
  addReaction: (messageId: string, emoji: string, userId: string) => void
  deleteMessage: (messageId: string) => void
}

const seedMessages: ChatMessage[] = [
  {
    id: '1',
    fromUserId: 'benny',
    content: 'Hey mate, que onda — Rob K. todavía sin firmar?',
    messageType: 'text',
    reactions: {},
    readAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    fromUserId: 'alberto',
    content: 'CHASE le mandó follow-up esta mañana. Quote está en $2,500. Dice que compara con otro.',
    messageType: 'text',
    reactions: { '🔥': ['benny'] },
    readAt: new Date(Date.now() - 3500000).toISOString(),
    createdAt: new Date(Date.now() - 3500000).toISOString(),
  },
  {
    id: '3',
    fromUserId: 'benny',
    content: 'Lo llamo yo hoy. Pongo en mi TODAY.',
    messageType: 'text',
    reactions: { '✅': ['alberto'] },
    readAt: new Date(Date.now() - 3400000).toISOString(),
    createdAt: new Date(Date.now() - 3400000).toISOString(),
  },
  {
    id: '4',
    fromUserId: 'alberto',
    content: 'Elite Electrical pagó la invoice. $5,200 confirmado 🤙',
    messageType: 'text',
    reactions: { '🤙': ['benny'], '🔥': ['benny'] },
    readAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: '5',
    fromUserId: 'benny',
    content: 'Sí! Firmó hoy 🤙',
    messageType: 'text',
    reactions: {},
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
]

export const useChatStore = create<ChatStore>((set) => ({
  messages: seedMessages,
  presence: {
    benny: { userId: 'benny', name: 'Benny', color: '#3b82f6', lastSeen: new Date().toISOString(), online: false },
  },
  isTyping: false,
  unreadCount: 1,
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs }),
  updatePresence: (user) =>
    set((state) => ({ presence: { ...state.presence, [user.userId]: user } })),
  setTyping: (typing) => set({ isTyping: typing }),
  markAllRead: () =>
    set((state) => ({
      unreadCount: 0,
      messages: state.messages.map((m) =>
        !m.readAt ? { ...m, readAt: new Date().toISOString() } : m
      ),
    })),
  addReaction: (messageId, emoji, userId) =>
    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id !== messageId) return m
        const existing = m.reactions[emoji] ?? []
        const updated = existing.includes(userId)
          ? existing.filter((id) => id !== userId)
          : [...existing, userId]
        return { ...m, reactions: { ...m.reactions, [emoji]: updated } }
      }),
    })),
  deleteMessage: (messageId) =>
    set((state) => ({ messages: state.messages.filter((m) => m.id !== messageId) })),
}))

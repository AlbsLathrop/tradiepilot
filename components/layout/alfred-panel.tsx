'use client'

import { Bot, Send, X, Check, CheckCheck } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useChatStore, ChatMessage } from '@/lib/store/chat'
import { usePipelineStore } from '@/lib/store/pipeline'
import { supabase } from '@/lib/supabase/client'

// --------------- Shared ---------------

type Tab = 'alfred' | 'benny'

const CURRENT_USER = 'alberto'
const QUICK_REACTIONS = ['👍', '✅', '🔥', '🤙', '😂', '💯']

// --------------- Alfred Tab ---------------

const alfredSuggestions = [
  'How many leads this month?',
  'Revenue trend?',
  'Who needs follow-up?',
]

interface AlfredMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function AlfredTab() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<AlfredMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg: AlfredMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/alfred', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          tradieSlug: session?.user?.tradieSlug,
          conversationHistory: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const assistantMsg: AlfredMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
      }

      setMessages((prev) => [...prev, assistantMsg])

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'text-delta' && data.text) {
                setMessages((prev) => {
                  const updated = [...prev]
                  const last = updated[updated.length - 1]
                  if (last?.role === 'assistant') {
                    last.content += data.text
                  }
                  return updated
                })
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error('Alfred error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center pt-8">
            <div className="text-5xl mb-3">🤖</div>
            <p className="text-sm text-[#8892b0]">Good to go. Ask me anything about the business.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#f5c518] text-[#0f111a] font-medium'
                  : 'bg-[#1d2235] border border-[#2e3452] text-[#e8eaf6]'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#1d2235] border border-[#2e3452] px-3 py-2 rounded-xl">
              <div className="flex gap-1 items-center h-5">
                <span className="w-1.5 h-1.5 bg-[#8892b0] rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-[#8892b0] rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-[#8892b0] rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[#252a3d] space-y-3">
        <div className="flex gap-2 flex-wrap">
          {alfredSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="px-2 py-1 text-xs text-[#8892b0] border border-[#252a3d] rounded-lg hover:border-[#3d4570] hover:text-[#e8eaf6] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Alfred anything..."
            className="flex-1 bg-[#1a1f30] border border-[#2e3452] rounded-lg px-3 py-2 text-sm text-[#e8eaf6] placeholder-[#4a5280] focus:outline-none focus:border-[#3d4570]"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-[#f5c518] disabled:opacity-40 hover:bg-[#f5c518]/90 text-[#0f111a] rounded-lg px-3 py-2 transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  )
}

// --------------- Ticks ---------------

function Ticks({ msg }: { msg: ChatMessage }) {
  if (msg.fromUserId !== CURRENT_USER) return null
  if (msg.readAt) return <CheckCheck size={12} className="text-[#3b82f6]" />
  if (!msg.pending) return <CheckCheck size={12} className="text-[#4a5280]" />
  return <Check size={12} className="text-[#4a5280]" />
}

// --------------- Mention Popover ---------------

function MentionPopover({
  query,
  onSelect,
}: {
  query: string
  onSelect: (label: string, id: string, type: 'lead' | 'client') => void
}) {
  const { leads } = usePipelineStore()
  const lq = query.toLowerCase()

  const matchedLeads = leads.filter(
    (l) => l.name.toLowerCase().includes(lq) || l.businessName.toLowerCase().includes(lq)
  ).slice(0, 4)

  if (matchedLeads.length === 0) return null

  return (
    <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1d2235] border border-[#2e3452] rounded-xl overflow-hidden shadow-xl z-50">
      <div className="px-3 py-2 text-xs text-[#4a5280] font-mono uppercase tracking-widest border-b border-[#252a3d]">
        Mention
      </div>
      {matchedLeads.map((l) => (
        <button
          key={l.id}
          onClick={() => onSelect(l.name, l.id, 'lead')}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#252a3d] transition-colors text-left"
        >
          <span className="text-xl">
            {l.stage === 'ACTIVE' ? '🏢' : '👤'}
          </span>
          <div>
            <div className="text-sm text-[#e8eaf6]">{l.name}</div>
            <div className="text-xs text-[#8892b0]">{l.businessName} · {l.stage}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

// --------------- Message Bubble ---------------

function MessageBubble({ msg, onReact }: { msg: ChatMessage; onReact: (messageId: string, emoji: string, userId: string) => void }) {
  const isMine = msg.fromUserId === CURRENT_USER

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className={`group flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}
    >
      <div className="relative max-w-[85%]">
        {/* Reply preview */}
        {msg.replyToContent && (
          <div className={`text-xs text-[#4a5280] mb-1 pl-2 border-l-2 border-[#3d4570] ${isMine ? 'text-right' : ''}`}>
            {msg.replyToContent.slice(0, 60)}…
          </div>
        )}

        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
            isMine
              ? 'bg-[#f5c518] text-[#0f111a] rounded-br-sm'
              : 'bg-[#1d2235] border border-[#2e3452] text-[#e8eaf6] rounded-bl-sm'
          }`}
        >
          {msg.messageType === 'mention_lead' ? (
            <span>
              {msg.content.split(`@${msg.mentionLabel}`)[0]}
              <span className="font-bold underline decoration-dotted">@{msg.mentionLabel}</span>
              {msg.content.split(`@${msg.mentionLabel}`)[1]}
            </span>
          ) : (
            msg.content
          )}
        </div>

        {/* Time + ticks */}
        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : ''}`}>
          <span className="text-[10px] text-[#4a5280]">{fmt(msg.createdAt)}</span>
          <Ticks msg={msg} />
        </div>

        {/* Reactions */}
        {Object.entries(msg.reactions).filter(([, ids]) => ids.length > 0).map(([emoji, ids]) => (
          <button
            key={emoji}
            onClick={() => onReact(msg.id, emoji, CURRENT_USER)}
            className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-[#252a3d] rounded-full text-xs"
          >
            {emoji} <span className="text-[#8892b0]">{ids.length}</span>
          </button>
        ))}

        {/* Hover reaction bar */}
        <div className={`absolute top-0 ${isMine ? 'right-full mr-2' : 'left-full ml-2'} hidden group-hover:flex gap-1 bg-[#1d2235] border border-[#2e3452] rounded-xl px-2 py-1`}>
          {QUICK_REACTIONS.map((e) => (
            <button
              key={e}
              onClick={() => onReact(msg.id, e, CURRENT_USER)}
              className="text-base hover:scale-125 transition-transform"
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// --------------- Benny Chat Tab ---------------

function BennyTab() {
  const { messages, presence, isTyping, unreadCount, addMessage, setTyping, markAllRead, addReaction } = useChatStore()
  const [input, setInput] = useState('')
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const bennyPresence = presence['benny']
  const isOnline = bennyPresence?.online ?? false

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark read on open
  useEffect(() => {
    if (unreadCount > 0) markAllRead()
  }, [markAllRead, unreadCount])

  // Supabase Realtime channel
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return

    const channel = supabase.channel('founder-chat', {
      config: { broadcast: { self: false }, presence: { key: CURRENT_USER } },
    })

    channel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        addMessage(payload as ChatMessage)
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== CURRENT_USER) setTyping(true)
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
        typingTimerRef.current = setTimeout(() => setTyping(false), 3000)
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ name: string; color: string }>()
        const bennyOnline = !!state['benny']
        useChatStore.getState().updatePresence({
          userId: 'benny',
          name: 'Benny',
          color: '#3b82f6',
          lastSeen: bennyOnline ? new Date().toISOString() : (bennyPresence?.lastSeen ?? new Date().toISOString()),
          online: bennyOnline,
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId: CURRENT_USER, name: 'Alberto', color: '#f5c518' })
        }
      })

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [addMessage, setTyping, bennyPresence?.lastSeen])

  const broadcastTyping = useCallback(() => {
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: CURRENT_USER } })
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInput(val)
    broadcastTyping()
    const atMatch = val.match(/@(\w*)$/)
    setMentionQuery(atMatch ? atMatch[1] : null)
  }

  const insertMention = (label: string, id: string, type: 'lead' | 'client') => {
    const newInput = input.replace(/@\w*$/, `@${label} `)
    setInput(newInput)
    setMentionQuery(null)
    inputRef.current?.focus()
  }

  const sendMessage = () => {
    const trimmed = input.trim()
    if (!trimmed) return

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      fromUserId: CURRENT_USER,
      content: trimmed,
      messageType: 'text',
      reactions: {},
      pending: true,
      createdAt: new Date().toISOString(),
    }

    addMessage(msg)
    setInput('')
    setMentionQuery(null)

    channelRef.current?.send({ type: 'broadcast', event: 'message', payload: msg })
  }

  const lastSeen = bennyPresence?.lastSeen
    ? Math.round((Date.now() - new Date(bennyPresence.lastSeen).getTime()) / 60000)
    : null

  return (
    <>
      {/* Benny status bar */}
      <div className="px-4 py-2 border-b border-[#252a3d] flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-[#4a5280]'}`} />
        <span className="text-xs text-[#8892b0]">
          {isOnline ? 'Benny is online' : lastSeen !== null ? `Last seen ${lastSeen}m ago` : 'Benny is offline'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        {!isOnline && (
          <div className="text-center text-xs text-[#4a5280] mb-4 px-4 py-2 bg-[#1d2235] rounded-lg border border-[#252a3d]">
            Messages will be delivered when Benny's back online.
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} onReact={addReaction} />
        ))}
        {isTyping && (
          <div className="flex justify-start mb-1">
            <div className="bg-[#1d2235] border border-[#2e3452] px-3 py-2 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-[#8892b0] rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-[#8892b0] rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-[#8892b0] rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#252a3d]">
        <div className="relative">
          {mentionQuery !== null && (
            <MentionPopover query={mentionQuery} onSelect={insertMention} />
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Message Benny..."
              className="flex-1 bg-[#1a1f30] border border-[#2e3452] rounded-xl px-3 py-2 text-sm text-[#e8eaf6] placeholder-[#4a5280] focus:outline-none focus:border-[#3d4570]"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="bg-[#3b82f6] disabled:opacity-40 hover:bg-[#3b82f6]/90 text-white rounded-xl px-3 py-2 transition-colors flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// --------------- Main Panel ---------------

export function AlfredPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('alfred')
  const [isOpen, setIsOpen] = useState(true)
  const { unreadCount: chatUnread, presence } = useChatStore()
  const bennyOnline = presence['benny']?.online ?? false

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#f5c518] rounded-full flex items-center justify-center shadow-lg hover:bg-[#f5c518]/90 transition-colors text-[#0f111a] z-50"
      >
        <Bot size={24} />
        {chatUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#3b82f6] rounded-full text-xs text-white flex items-center justify-center font-mono">
            {chatUnread}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="w-80 fixed right-0 top-0 bottom-0 bg-[#0f111a] border-l border-[#252a3d] flex flex-col z-40">
      {/* Header */}
      <div className="h-16 border-b border-[#252a3d] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex gap-1">
          {/* Alfred Tab */}
          <button
            onClick={() => setActiveTab('alfred')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-colors ${
              activeTab === 'alfred'
                ? 'bg-[#f5c518] text-[#0f111a]'
                : 'text-[#8892b0] hover:text-[#e8eaf6] hover:bg-[#161929]'
            }`}
          >
            <Bot size={16} />
            ALFRED
          </button>

          {/* Benny Tab */}
          <button
            onClick={() => setActiveTab('benny')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-colors relative ${
              activeTab === 'benny'
                ? 'bg-[#3b82f6] text-white'
                : 'text-[#8892b0] hover:text-[#e8eaf6] hover:bg-[#161929]'
            }`}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${bennyOnline ? 'bg-green-400 animate-pulse' : 'bg-[#4a5280]'}`} />
            BENNY
            {chatUnread > 0 && activeTab !== 'benny' && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ef4444] rounded-full text-[10px] text-white flex items-center justify-center">
                {chatUnread}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="text-[#4a5280] hover:text-[#e8eaf6] transition-colors ml-2"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'alfred' ? <AlfredTab /> : <BennyTab />}
    </div>
  )
}

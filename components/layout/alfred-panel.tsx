'use client'

import { Bot, Send, MessageCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const suggestions = [
  'How many leads this month?',
  'Revenue trend?',
  'Who needs follow-up?',
]

export function AlfredPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Good afternoon Alberto. You have 3 tasks for today and 2 new leads. Ready to help you run the business.',
    },
  ])
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages([...messages, userMessage])
    setInput('')

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is a simulated response. Full Alfred integration coming soon.',
      }
      setMessages((prev) => [...prev, aiMessage])
    }, 500)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#f5c518] rounded-full flex items-center justify-center shadow-lg hover:bg-[#f5c518]/90 transition-colors text-[#0f111a]"
      >
        <Bot size={24} />
      </button>
    )
  }

  return (
    <div className="w-80 fixed right-0 top-0 bottom-0 bg-[#0f111a] border-l border-[#252a3d] flex flex-col z-40">
      {/* Header */}
      <div className="h-16 border-b border-[#252a3d] flex items-center justify-between px-6">
        <div>
          <div className="text-lg font-mono font-bold text-[#f5c518] flex items-center gap-2">
            <Bot size={20} />
            ALFRED
          </div>
          <div className="text-xs text-[#4a5280]">TradiePilot Co-Pilot</div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-[#8892b0] hover:text-[#e8eaf6] transition-colors"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-[#f5c518] text-[#0f111a]'
                  : 'bg-[#161929] border border-[#252a3d] text-[#e8eaf6]'
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      <div className="px-6 py-4 border-t border-[#252a3d]">
        <div className="text-xs text-[#4a5280] mb-3 uppercase tracking-widest font-mono">Quick Questions</div>
        <div className="space-y-2">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setInput(suggestion)}
              className="w-full text-left px-3 py-2 text-xs text-[#8892b0] hover:text-[#e8eaf6] hover:bg-[#161929] rounded-lg transition-colors border border-[#252a3d]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-6 border-t border-[#252a3d] space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Alfred anything..."
            className="flex-1 bg-[#1a1f30] border border-[#2e3452] rounded-lg px-4 py-2 text-sm text-[#e8eaf6] placeholder-[#4a5280] focus:outline-none focus:border-[#3d4570]"
          />
          <button
            onClick={handleSend}
            className="bg-[#f5c518] hover:bg-[#f5c518]/90 text-[#0f111a] rounded-lg px-3 py-2 transition-colors flex items-center gap-2"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

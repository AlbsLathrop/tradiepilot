'use client'

import { Bell, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Topbar({ title }: { title: string }) {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-16 fixed top-0 left-52 right-0 bg-[#0f111a] border-b border-[#252a3d] flex items-center justify-between px-8 z-40">
      <h1 className="text-xl font-mono font-bold text-[#e8eaf6]">{title}</h1>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-[#8892b0]">
          <Clock size={18} />
          <span className="font-mono text-sm">{time || '00:00:00'}</span>
        </div>

        <button className="relative p-2 hover:bg-[#161929] rounded-lg transition-colors text-[#8892b0] hover:text-[#e8eaf6]">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full" />
        </button>

        <div className="w-10 h-10 rounded-lg bg-[#f5c518] flex items-center justify-center font-mono font-bold text-[#0f111a]">
          A
        </div>
      </div>
    </div>
  )
}

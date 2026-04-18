'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Zap,
  BarChart3,
  Shuffle,
  Building2,
  MessageSquare,
  CheckSquare2,
  Calendar,
  BookOpen,
  Settings,
} from 'lucide-react'

const navItems = [
  { icon: Zap, label: 'Dashboard', href: '/dashboard' },
  { icon: BarChart3, label: 'Metrics', href: '/metrics' },
  { icon: Shuffle, label: 'Pipeline', href: '/pipeline' },
  { icon: Building2, label: 'Clients', href: '/clients' },
  { icon: MessageSquare, label: 'Conversations', href: '/conversations' },
  { icon: CheckSquare2, label: 'Task Board', href: '/tasks' },
  { icon: Calendar, label: 'Weekly Planner', href: '/planner' },
]

const agents = [
  { name: 'LUNA', color: 'bg-yellow-400', label: 'Lead Response' },
  { name: 'CHASE', color: 'bg-blue-400', label: 'Follow-up' },
  { name: 'ORBIT', color: 'bg-green-400', label: 'Job Comms' },
  { name: 'ANCHOR', color: 'bg-orange-400', label: 'Invoice & Pay' },
  { name: 'FIXER', color: 'bg-purple-400', label: 'Support' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-52 fixed left-0 top-0 bottom-0 bg-[#0f111a] border-r border-[#252a3d] overflow-y-auto flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#252a3d]">
        <div className="text-2xl font-bold font-mono text-[#f5c518] mb-2">JOBFLOW</div>
        <div className="text-xs text-[#8892b0]">Alfred War Room · TradiePilot</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-1">
        <div className="text-xs font-mono text-[#4a5280] uppercase tracking-widest mb-4">Command</div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#161929] text-[#f5c518] border border-[#3d4570]'
                  : 'text-[#8892b0] hover:text-[#e8eaf6] hover:bg-[#161929]'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Agents */}
      <div className="px-6 py-4 border-t border-[#252a3d]">
        <div className="text-xs font-mono text-[#4a5280] uppercase tracking-widest mb-4">Intelligence</div>
        <div className="space-y-3">
          {agents.map((agent) => (
            <div key={agent.name} className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-2 h-2 rounded-full ${agent.color} animate-pulse`} />
                <div className={`absolute inset-0 w-2 h-2 rounded-full ${agent.color} opacity-50 blur`} />
              </div>
              <div>
                <div className="text-sm font-mono text-[#e8eaf6]">{agent.name}</div>
                <div className="text-xs text-[#4a5280]">{agent.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div className="px-6 py-4 border-t border-[#252a3d]">
        <div className="text-xs font-mono text-[#4a5280] uppercase tracking-widest mb-4">Resources</div>
        <div className="space-y-2">
          <Link href="/playbooks" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#8892b0] hover:text-[#e8eaf6] hover:bg-[#161929]">
            <BookOpen size={18} />
            <span>Playbooks</span>
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#8892b0] hover:text-[#e8eaf6] hover:bg-[#161929]">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      {/* Users */}
      <div className="px-6 py-4 border-t border-[#252a3d]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <div>
              <div className="text-sm text-[#e8eaf6]">[A] Alberto</div>
              <div className="text-xs text-[#4a5280]">online</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <div>
              <div className="text-sm text-[#e8eaf6]">[B] Benny</div>
              <div className="text-xs text-[#4a5280]">online</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

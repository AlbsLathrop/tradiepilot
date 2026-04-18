'use client'

import { Task, TaskPriority } from '@/lib/store/tasks'
import { useTasksStore } from '@/lib/store/tasks'
import { TaskCard } from './task-card'
import { Plus } from 'lucide-react'

interface TaskColumnProps {
  priority: TaskPriority
  tasks: Task[]
}

const priorityConfig = {
  TODAY: { label: '🔥 TODAY', emoji: '🔥', limit: 3 },
  THIS_WEEK: { label: '📋 THIS WEEK', emoji: '📋', limit: null },
  BACKLOG: { label: '🗂️ BACKLOG', emoji: '🗂️', limit: null },
}

export function TaskColumn({ priority, tasks }: TaskColumnProps) {
  const config = priorityConfig[priority]
  const completedCount = tasks.filter((t) => t.status === 'Done').length

  return (
    <div className="flex-1 min-w-80">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-mono font-bold text-[#e8eaf6]">{config.label}</h3>
          <span className="text-sm text-[#4a5280]">
            {completedCount}/{tasks.length}
          </span>
        </div>
        {priority === 'TODAY' && config.limit && (
          <div className="text-xs text-[#8892b0]">Max {config.limit} items</div>
        )}
      </div>

      {/* Warning if TODAY is over limit */}
      {priority === 'TODAY' && tasks.length > config.limit! && (
        <div className="mb-4 p-3 bg-[#ef4444]/10 border border-[#ef4444] rounded-lg text-xs text-[#ef4444]">
          ⚠️ Today already has {tasks.length} priorities. Move one to This Week first.
        </div>
      )}

      {/* Cards */}
      <div className="space-y-2 mb-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {/* Add button */}
      <button className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-[#252a3d] rounded-lg text-[#8892b0] hover:border-[#3d4570] hover:text-[#e8eaf6] transition-colors text-sm">
        <Plus size={16} />
        Add Task
      </button>
    </div>
  )
}

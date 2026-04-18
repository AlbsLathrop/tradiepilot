'use client'

import { Task, categoryColors } from '@/lib/store/tasks'
import { useTasksStore } from '@/lib/store/tasks'
import { CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const { updateTask, deleteTask } = useTasksStore()
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleStatus = () => {
    updateTask(task.id, {
      status: task.status === 'Done' ? 'Todo' : 'Done',
    })
  }

  return (
    <div
      className={`bg-[#161929] border border-[#252a3d] rounded-lg p-4 transition-all ${
        task.status === 'Done' ? 'opacity-60' : 'hover:border-[#3d4570]'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={toggleStatus}
          className="mt-1 flex-shrink-0 text-[#8892b0] hover:text-[#e8eaf6] transition-colors"
        >
          {task.status === 'Done' ? (
            <CheckCircle2 size={20} className="text-[#22c55e]" />
          ) : (
            <Circle size={20} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`text-sm font-medium text-left transition-all ${
              task.status === 'Done'
                ? 'text-[#4a5280] line-through'
                : 'text-[#e8eaf6] hover:text-[#f5c518]'
            }`}
          >
            {task.title}
          </button>

          {/* Category badge */}
          <div className="mt-2">
            <span
              className="inline-block px-2 py-1 rounded text-xs font-mono uppercase tracking-wider"
              style={{
                backgroundColor: categoryColors[task.category] + '22',
                color: categoryColors[task.category],
                border: `1px solid ${categoryColors[task.category]}`,
              }}
            >
              {task.category}
            </span>
          </div>

          {/* Expanded description */}
          {isExpanded && task.description && (
            <div className="mt-3 text-xs text-[#8892b0] leading-relaxed border-t border-[#252a3d] pt-3">
              {task.description}
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-2 mt-3 text-xs text-[#4a5280]">
            {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
            {task.linkedClient && <span>🏢 {task.linkedClient}</span>}
            {task.linkedLead && <span>👤 {task.linkedLead}</span>}
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={() => deleteTask(task.id)}
          className="flex-shrink-0 text-[#8892b0] hover:text-[#ef4444] transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

'use client'

import { useTasksStore, TaskPriority } from '@/lib/store/tasks'
import { TaskColumn } from './task-column'

const priorities: TaskPriority[] = ['TODAY', 'THIS_WEEK', 'BACKLOG']

export function TaskBoard() {
  const { tasks, getTodayStreak } = useTasksStore()

  const albertoTasks = tasks.filter((t) => t.userId === 'Alberto')
  const bennyTasks = tasks.filter((t) => t.userId === 'Benny')

  const albertoStreak = getTodayStreak('Alberto')
  const bennyStreak = getTodayStreak('Benny')

  return (
    <div className="space-y-8">
      {/* Alberto */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-[#f5c518] flex items-center justify-center font-mono font-bold text-[#0f111a] text-xl">
            A
          </div>
          <div>
            <h2 className="text-2xl font-mono font-bold text-[#e8eaf6]">Alberto's Board</h2>
            {albertoStreak > 0 && <div className="text-sm text-[#22c55e]">🔥 {albertoStreak} day streak</div>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {priorities.map((priority) => (
            <TaskColumn
              key={priority}
              priority={priority}
              tasks={albertoTasks.filter((t) => t.priority === priority)}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#252a3d]" />

      {/* Benny */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-[#3b82f6] flex items-center justify-center font-mono font-bold text-[#0f111a] text-xl">
            B
          </div>
          <div>
            <h2 className="text-2xl font-mono font-bold text-[#e8eaf6]">Benny's Board</h2>
            {bennyStreak > 0 && <div className="text-sm text-[#22c55e]">🔥 {bennyStreak} day streak</div>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {priorities.map((priority) => (
            <TaskColumn
              key={priority}
              priority={priority}
              tasks={bennyTasks.filter((t) => t.priority === priority)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

import { Topbar } from '@/components/layout/topbar'
import { Sidebar } from '@/components/layout/sidebar'
import { AlfredPanel } from '@/components/layout/alfred-panel'
import { TaskBoard } from '@/components/tasks/task-board'

export default function TasksPage() {
  return (
    <div className="bg-[#0f111a] min-h-screen">
      <Sidebar />
      <Topbar title="Task Board" />
      <AlfredPanel />

      <main className="ml-52 mr-80 pt-20 pb-8 px-8">
        <div className="mb-8">
          <p className="text-[#8892b0]">Manage daily priorities and delegate between Alberto and Benny</p>
        </div>
        <TaskBoard />
      </main>
    </div>
  )
}

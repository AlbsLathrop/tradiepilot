import { Topbar } from '@/components/layout/topbar'
import { Sidebar } from '@/components/layout/sidebar'
import { AlfredPanel } from '@/components/layout/alfred-panel'
import { PipelineBoard } from '@/components/pipeline/pipeline-board'
import { Filter } from 'lucide-react'

export default function PipelinePage() {
  return (
    <div className="bg-[#0f111a] min-h-screen">
      <Sidebar />
      <Topbar title="Pipeline" />
      <AlfredPanel />

      <main className="ml-52 mr-80 pt-20 pb-8 px-8">
        {/* Filters */}
        <div className="mb-8 flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#161929] border border-[#252a3d] rounded-lg text-sm text-[#8892b0] hover:border-[#3d4570] transition-colors">
            <Filter size={18} />
            Filters
          </button>
          <div className="flex gap-2 flex-wrap">
            <button className="px-3 py-1 bg-[#161929] border border-[#252a3d] rounded-full text-xs text-[#8892b0] hover:border-[#3d4570] transition-colors">
              All Agents
            </button>
            <button className="px-3 py-1 bg-[#161929] border border-[#252a3d] rounded-full text-xs text-[#8892b0] hover:border-[#3d4570] transition-colors">
              All Industries
            </button>
            <button className="px-3 py-1 bg-[#161929] border border-[#252a3d] rounded-full text-xs text-[#8892b0] hover:border-[#3d4570] transition-colors">
              All Sources
            </button>
          </div>
        </div>

        {/* Pipeline Board */}
        <PipelineBoard />
      </main>
    </div>
  )
}

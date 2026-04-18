import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#111827] p-8">
      <Skeleton className="h-10 w-48 mb-16 bg-white/10 mx-auto" />

      <div className="max-w-6xl mx-auto grid grid-cols-2 gap-8 md:grid-cols-4 mb-16">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-xl bg-slate-900 border-2 border-cyan-500">
            <CardHeader className="pb-4">
              <Skeleton className="h-3 w-28 bg-white/10" />
            </CardHeader>
            <CardContent className="pb-6">
              <Skeleton className="h-14 w-20 bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        <Card className="rounded-xl bg-slate-900 border border-[#06B6D4]">
          <CardHeader>
            <Skeleton className="h-6 w-32 bg-white/10" />
          </CardHeader>
        <CardContent className="p-0 pb-4">
          <div className="px-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4">
                <Skeleton className="h-4 bg-white/5" />
                <Skeleton className="h-4 w-24 bg-white/5" />
                <Skeleton className="h-4 bg-white/5" />
                <Skeleton className="h-4 bg-white/5" />
              </div>
            ))}
          </div>
        </CardContent>
        </Card>
      </div>
    </main>
  )
}

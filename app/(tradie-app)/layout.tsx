import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { BottomNav } from '@/components/tradie-app/bottom-nav';

export default async function TradieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#111827] text-[#F9FAFB]">
      <div className="pb-[60px]">{children}</div>
      <BottomNav />
    </div>
  );
}

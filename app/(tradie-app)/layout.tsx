import { BottomNav } from '@/components/tradie-app/bottom-nav';

export default async function TradieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: Do NOT redirect here - let individual pages handle auth
  // The root /page.tsx handles login, and child pages check their own sessions
  
  return (
    <div className="min-h-screen bg-[#111827] text-[#F9FAFB]">
      <div className="pb-[60px]">{children}</div>
      <BottomNav />
    </div>
  );
}

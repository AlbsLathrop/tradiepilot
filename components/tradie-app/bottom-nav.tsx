'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Briefcase,
  UserPlus,
  BarChart3,
  Settings,
} from 'lucide-react';

const tabs = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/leads', label: 'Leads', icon: UserPlus },
  { href: '/report', label: 'Report', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1F2937] border-t border-[#374151] h-[60px]">
      <div className="flex justify-around h-full">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 transition-colors ${
                isActive ? 'text-[#06B6D4]' : 'text-[#9CA3AF] hover:text-[#D1D5DB]'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-medium mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

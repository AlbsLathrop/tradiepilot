'use client'

import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { LogOut, MessageCircle, HelpCircle } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Settings</h1>
          <p className="text-[#9CA3AF] text-sm">Account & preferences</p>
        </div>

        {/* Profile Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#F9FAFB] uppercase tracking-wider">Profile</h2>

          <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm space-y-3">
            <div>
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wider font-medium mb-1">Name</p>
              <p className="text-sm font-semibold text-[#F9FAFB]">{session?.user?.name || 'Tradie'}</p>
            </div>
            <div className="border-t border-slate-600 pt-3">
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wider font-medium mb-1">Email</p>
              <p className="text-sm font-semibold text-[#F9FAFB]">{session?.user?.email || 'user@example.com'}</p>
            </div>
            <div className="border-t border-slate-600 pt-3">
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wider font-medium mb-1">Package</p>
              <span className="inline-block bg-[#06B6D4]/20 text-[#06B6D4] px-3 py-1 rounded-full text-xs font-semibold uppercase">
                Growth Plan
              </span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#F9FAFB] uppercase tracking-wider">This Month</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">Active Jobs</p>
              <p className="text-3xl font-bold text-[#06B6D4]">3</p>
            </div>
            <div className="bg-[#1F2937] rounded-lg p-4 border border-slate-700 shadow-sm">
              <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2">New Leads</p>
              <p className="text-3xl font-bold text-[#F9FAFB]">7</p>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#F9FAFB] uppercase tracking-wider">Support</h2>

          <div className="space-y-2">
            <a
              href="https://wa.me/61000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full h-12 bg-[#1F2937] text-[#F9FAFB] rounded-lg py-3 px-4 border border-slate-700 hover:border-[#06B6D4] transition"
            >
              <MessageCircle size={18} className="text-[#06B6D4]" />
              <span className="text-sm font-semibold">WhatsApp Support</span>
            </a>
            <a
              href="#"
              className="flex items-center justify-center gap-3 w-full h-12 bg-[#1F2937] text-[#F9FAFB] rounded-lg py-3 px-4 border border-slate-700 hover:border-[#06B6D4] transition"
            >
              <HelpCircle size={18} className="text-[#06B6D4]" />
              <span className="text-sm font-semibold">Message FIXER</span>
            </a>
          </div>
        </div>

        {/* Account Actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#F9FAFB] uppercase tracking-wider">Account</h2>

          <button
            onClick={() =>
              signOut({
                redirect: true,
                callbackUrl: '/',
              })
            }
            className="flex items-center justify-center gap-2 w-full h-12 bg-red-500/10 text-red-400 rounded-lg py-3 px-4 border border-red-500/30 hover:bg-red-500/20 transition font-semibold text-sm"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-700 text-center">
          <p className="text-xs text-[#6B7280]">
            TradiePilot v1.0.0 • © 2026
          </p>
        </div>
      </div>
    </div>
  )
}

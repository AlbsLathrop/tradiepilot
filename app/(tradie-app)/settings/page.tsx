'use client'

import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { LogOut, MessageCircle, HelpCircle } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="px-4 md:px-8 py-6 space-y-6 pb-24 max-w-2xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Settings</h1>
          <p className="text-[#9CA3AF] text-sm">Account & preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-[#1F2937] rounded-lg p-5 border border-[#374151] space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#F97316] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {(session?.user?.name || 'T')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">{session?.user?.name || 'Tradie'}</h2>
              <p className="text-sm text-[#D1D5DB]">{session?.user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-[#374151] pt-4">
            <p className="text-sm text-[#D1D5DB]">Plan</p>
            <span className="bg-[#F97316] text-white px-3 py-1 rounded-full text-xs font-semibold">
              Growth Plan
            </span>
          </div>
        </div>

        {/* Stats Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#F9FAFB] mb-3">This Month</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1F2937] rounded-lg p-5 border border-[#374151]">
              <p className="text-[#D1D5DB] text-xs font-medium uppercase tracking-wider mb-3">Active Jobs</p>
              <p className="text-4xl font-bold text-[#F97316]">3</p>
            </div>
            <div className="bg-[#1F2937] rounded-lg p-5 border border-[#374151]">
              <p className="text-[#D1D5DB] text-xs font-medium uppercase tracking-wider mb-3">New Leads</p>
              <p className="text-4xl font-bold text-[#F97316]">7</p>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#F9FAFB] mb-3">Support</h2>

          <div className="space-y-2">
            <a
              href="https://wa.me/61000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full h-11 bg-[#F97316] text-white rounded-lg py-3 px-4 hover:bg-[#C2580A] transition-all duration-200 ease font-semibold text-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316]"
            >
              <MessageCircle size={18} />
              <span>WhatsApp Support</span>
            </a>
            <a
              href="#"
              className="flex items-center justify-center gap-3 w-full h-11 bg-[#F97316] text-white rounded-lg py-3 px-4 hover:bg-[#C2580A] transition-all duration-200 ease font-semibold text-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316]"
            >
              <HelpCircle size={18} />
              <span>Message FIXER</span>
            </a>
          </div>
        </div>

        {/* Reports */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#F9FAFB] mb-3">Reports</h2>

          <a
            href="/report"
            className="flex items-center justify-center gap-3 w-full h-11 bg-[#F97316] text-white rounded-lg py-3 px-4 hover:bg-[#C2580A] transition-all duration-200 ease font-semibold text-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316]"
          >
            <span>View Weekly Report</span>
          </a>
        </div>

        {/* Account Actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#F9FAFB] mb-3">Account</h2>

          <button
            onClick={() =>
              signOut({
                redirect: true,
                callbackUrl: '/',
              })
            }
            className="flex items-center justify-center gap-2 w-full h-11 bg-transparent border-2 border-[#EF4444] text-[#EF4444] rounded-lg py-3 px-4 hover:bg-[#EF4444] hover:text-white transition-all duration-200 ease font-semibold text-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#EF4444]"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#374151] text-center">
          <p className="text-xs text-[#6B7280]">
            TradiePilot v1.0.0 • © 2026
          </p>
        </div>
      </div>
    </div>
  )
}

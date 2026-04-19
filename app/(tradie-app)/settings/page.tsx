'use client'

import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'

export default function SettingsPage() {
  const { data: session } = useSession()

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#F9FAFB]">Settings</h1>
        <p className="text-[#9CA3AF]">Manage your account</p>
      </div>

      {/* Profile Card */}
      <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151] space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Name</p>
          <p className="text-base font-semibold text-[#F9FAFB]">{session?.user?.name || 'Tradie'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Email</p>
          <p className="text-base font-semibold text-[#F9FAFB]">{session?.user?.email || 'user@example.com'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Package</p>
          <span className="inline-block bg-[#06B6D4]/20 text-[#06B6D4] px-2 py-1 rounded-full text-xs font-medium uppercase">
            Growth
          </span>
        </div>
      </div>

      {/* Support Section */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-[#F9FAFB]">Support</h2>
        <div className="space-y-3">
          <a
            href="https://wa.me/61000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-[#1F2937] text-[#F9FAFB] rounded-lg py-4 px-4 font-semibold border border-[#374151] hover:border-[#06B6D4] transition text-center min-h-12 flex items-center justify-center"
          >
            💬 Contact WhatsApp Support
          </a>
          <a
            href="#"
            className="block w-full bg-[#1F2937] text-[#F9FAFB] rounded-lg py-4 px-4 font-semibold border border-[#374151] hover:border-[#06B6D4] transition text-center min-h-12 flex items-center justify-center"
          >
            🤖 Message FIXER
          </a>
        </div>
      </div>

      {/* Account Actions */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-[#F9FAFB]">Account</h2>
        <button
          onClick={() =>
            signOut({
              redirect: true,
              callbackUrl: '/',
            })
          }
          className="w-full bg-[#EF4444]/10 text-[#EF4444] rounded-lg py-4 px-4 font-semibold border border-[#EF4444]/30 hover:bg-[#EF4444]/20 transition min-h-12 flex items-center justify-center"
        >
          Logout
        </button>
      </div>

      {/* Info Section */}
      <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151]">
        <p className="text-xs text-[#6B7280] space-y-2">
          <p>TradiePilot v1.0.0</p>
          <p>© 2026 TradiePilot. All rights reserved.</p>
        </p>
      </div>
    </div>
  )
}

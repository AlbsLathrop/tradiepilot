'use client';

import { signOut } from 'next-auth/react';

export default function SettingsPage() {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-[#9CA3AF]">Manage your account</p>
      </div>

      <div className="bg-[#1F2937] rounded-xl p-4 border border-[#374151] space-y-3">
        <div>
          <p className="text-xs text-[#9CA3AF]">Name</p>
          <p className="font-semibold">Tradie Name</p>
        </div>
        <div>
          <p className="text-xs text-[#9CA3AF]">Email</p>
          <p className="font-semibold">user@example.com</p>
        </div>
        <div>
          <p className="text-xs text-[#9CA3AF]">Package</p>
          <span className="inline-block bg-[#3B82F6] text-[#111827] px-2 py-0.5 rounded-full text-xs font-medium uppercase">
            Growth
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <a
          href="https://wa.me/61000000000"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-[#1F2937] text-[#F9FAFB] rounded-lg py-3 font-semibold border border-[#374151] hover:bg-[#374151] text-center"
        >
          Contact Support
        </a>
        <button
          onClick={() =>
            signOut({
              redirect: true,
              callbackUrl: '/',
            })
          }
          className="w-full bg-[#EF4444] text-[#111827] rounded-lg py-3 font-semibold hover:bg-[#DC2626]"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

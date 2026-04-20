'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'

export default function LandingPage() {

  return (
    <div className="min-h-screen bg-[#111827]">
      {/* NAVBAR */}
      <nav className="bg-[#0F0F0F] border-b border-[#374151] px-8 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <Link href="/landing" className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              <span className="text-[#F97316]">Cockpit</span>
            </span>
          </Link>
          <Link
            href="/app/auth/signin"
            className="px-5 py-2 bg-[#F97316] text-white rounded-lg font-semibold hover:bg-[#C2580A] transition-all duration-200 ease text-sm"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* HERO / LOGIN SECTION */}
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 md:px-8 py-16">
        <div className="w-full max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* LEFT COLUMN - Features (Desktop only) */}
          <div className="hidden md:flex flex-col justify-center space-y-8">
            <div>
              <h1 className="text-5xl font-black text-white mb-6">
                Tradie management, simplified
              </h1>
              <p className="text-base text-[#D1D5DB] leading-relaxed max-w-[550px]">
                Cockpit automates your lead responses, quotes, job updates, and client follow-ups. More importantly: we automate all your communications with clients, foremen, and team members. Everyone stays updated and on the same page—without needing to call you and steal your time on the tools.
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-4 pt-4">
              {[
                'Instant lead responses (90 seconds)',
                'Automatic quote follow-ups',
                'Job status updates (clients, foremen, your team)',
                'Reviews & client reactivation',
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check size={24} className="text-[#F97316] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#D1D5DB]">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN - Login Form */}
          <div className="w-full md:max-w-[450px] mx-auto md:mx-0">
            <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-10 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
              <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>

              <div className="space-y-5">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-semibold text-[#D1D5DB] mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="joey@tradie.test"
                    disabled
                    className="w-full px-4 py-3 bg-[#111827] border border-[#374151] rounded-lg text-white text-base placeholder-[#6B7280] opacity-60 cursor-not-allowed"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-semibold text-[#D1D5DB] mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    disabled
                    className="w-full px-4 py-3 bg-[#111827] border border-[#374151] rounded-lg text-white text-base placeholder-[#6B7280] opacity-60 cursor-not-allowed"
                  />
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <a
                    href="#"
                    className="text-sm text-[#F97316] hover:text-[#C2580A] transition-all duration-200 ease"
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Sign In Button */}
                <button
                  onClick={() => window.location.href = '/app/home'}
                  className="w-full py-3 px-4 bg-[#F97316] text-white rounded-lg font-semibold hover:bg-[#C2580A] transition-all duration-200 ease text-base min-h-[48px] flex items-center justify-center"
                >
                  Sign In
                </button>
              </div>

              {/* Demo Info */}
              <div className="mt-6 pt-6 border-t border-[#374151]">
                <p className="text-xs text-[#9CA3AF] text-center">
                  Demo: Use joey@tradie.test with any password
                </p>
              </div>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-[#D1D5DB]">
                  Don't have an account?{' '}
                  <a
                    href="/app/auth/signup"
                    className="text-[#F97316] hover:text-[#C2580A] font-semibold transition-all duration-200 ease"
                  >
                    Sign up
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

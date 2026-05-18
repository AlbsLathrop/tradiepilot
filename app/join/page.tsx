'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

type TradeType = 'Painter' | 'Stonemason' | 'Electrician' | 'Plumber' | 'Carpenter' | 'Landscaper' | 'Tiler' | 'Other'

const TRADE_TYPES: TradeType[] = ['Painter', 'Stonemason', 'Electrician', 'Plumber', 'Carpenter', 'Landscaper', 'Tiler', 'Other']

interface FormData {
  businessName: string
  tradieNname: string
  tradeType: TradeType
  email: string
  phone: string
  serviceArea: string
  servicesOffered: string
  minJobValue: number
}

interface SuccessState {
  businessName: string
  phone: string
  email: string
  tradieNname: string
}

export default function JoinPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SuccessState | null>(null)
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    tradieNname: '',
    tradeType: 'Carpenter',
    email: '',
    phone: '',
    serviceArea: '',
    servicesOffered: '',
    minJobValue: 500,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      // Success
      setSuccess({
        businessName: formData.businessName,
        phone: formData.phone,
        email: formData.email,
        tradieNname: formData.tradieNname,
      })
    } catch (err) {
      setError('Failed to create account. Please try again.')
      console.error('Onboarding error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-[#1F2937] rounded-xl p-8 border border-white/5 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-white mb-2">You're live on TradieFlow!</h1>
            <p className="text-gray-400 mb-6">Check your phone — we just sent your login details to {success.phone}.</p>

            <div className="bg-[#111827] rounded-lg p-4 mb-6 space-y-2 text-left">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Business</p>
                <p className="text-white font-medium">{success.businessName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Login</p>
                <p className="text-white font-medium">tradiepilot.vercel.app</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                <p className="text-white font-medium">{success.email}</p>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-6">LUNA is already active and handling your leads.</p>

            <a
              href="/login"
              className="inline-block bg-[#F97316] text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition"
            >
              Go to Dashboard →
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Join TradieFlow</h1>
          <p className="text-gray-400">Get automated lead management and get back to what you do best.</p>
        </div>

        {/* Form Card */}
        <div className="bg-[#1F2937] rounded-xl p-8 border border-white/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Business Name</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                placeholder="e.g. Ben's Stonework"
                className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#06B6D4] transition"
              />
            </div>

            {/* Your Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
              <input
                type="text"
                name="tradieNname"
                value={formData.tradieNname}
                onChange={handleChange}
                required
                placeholder="e.g. Ben"
                className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#06B6D4] transition"
              />
            </div>

            {/* Trade Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Trade Type</label>
              <select
                name="tradeType"
                value={formData.tradeType}
                onChange={handleChange}
                className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#06B6D4] transition"
              >
                {TRADE_TYPES.map(trade => (
                  <option key={trade} value={trade} className="bg-[#111827]">
                    {trade}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#06B6D4] transition"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mobile</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+61 2 XXXX XXXX"
                className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#06B6D4] transition"
              />
            </div>

            {/* Service Area */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Service Area</label>
              <input
                type="text"
                name="serviceArea"
                value={formData.serviceArea}
                onChange={handleChange}
                required
                placeholder="e.g. Sutherland Shire, St George"
                className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#06B6D4] transition"
              />
            </div>

            {/* Services Offered */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Services Offered</label>
              <textarea
                name="servicesOffered"
                value={formData.servicesOffered}
                onChange={handleChange}
                required
                placeholder="e.g. Driveways, retaining walls, pool coping"
                rows={3}
                className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#06B6D4] transition resize-none"
              />
            </div>

            {/* Min Job Value */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Job Value (AUD)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-400">$</span>
                <input
                  type="number"
                  name="minJobValue"
                  value={formData.minJobValue}
                  onChange={handleChange}
                  required
                  min="0"
                  step="100"
                  className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 pl-8 text-white placeholder-gray-600 focus:outline-none focus:border-[#06B6D4] transition"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F97316] hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>Get Started →</>
              )}
            </button>

            <p className="text-center text-gray-400 text-sm">Your account will be ready in under 2 minutes.</p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8">
          © {new Date().getFullYear()} TradieFlow. All rights reserved.
        </p>
      </div>
    </div>
  )
}

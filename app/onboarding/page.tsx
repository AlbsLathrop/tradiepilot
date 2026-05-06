'use client'

import { useState } from 'react'

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    businessName: '',
    ownerName: '',
    tradeType: '',
    serviceArea: '',
    minJobValue: 500,
    email: '',
    tone: 'Professional',
    hoursStart: '7:00',
    hoursEnd: '17:00',
    twilioNumber: ''
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const tradieConfigId = (data.ownerName.split(' ')[0] || 'user').toLowerCase() +
        '-' + (data.tradeType.toLowerCase().replace(/\s+/g, ''))

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, tradieConfigId }),
      })

      const result = await res.json()

      if (result.success) {
        setDone(true)
      } else {
        setError(result.error || 'Failed to create account')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-6">✅</p>
          <p className="text-white text-2xl font-bold mb-2">
            {data.businessName} is live!
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Tradie config created in Notion. They can now log in at the link sent to their email.
          </p>
          <p className="text-gray-500 text-xs">
            Config ID: <span className="font-mono text-[#F97316]">{(data.ownerName.split(' ')[0] || 'user').toLowerCase()}-{data.tradeType.toLowerCase().replace(/\s+/g, '')}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-1">New Tradie Setup</h1>
        <p className="text-gray-400 text-sm mb-8">TradieFlow Onboarding</p>

        <div className="space-y-5 bg-[#111827] rounded-xl p-6 border border-[#1F2937]">
          {[
            { key: 'businessName', label: 'Business Name', type: 'text' },
            { key: 'ownerName', label: 'Owner Full Name', type: 'text' },
            { key: 'tradeType', label: 'Trade (e.g. stonemason, painter, electrician)', type: 'text' },
            { key: 'serviceArea', label: 'Service Area (suburbs)', type: 'text' },
            { key: 'email', label: 'Email Address', type: 'email' },
            { key: 'minJobValue', label: 'Min Job Value ($)', type: 'number' },
            {
              key: 'tone',
              label: 'ALFRED Tone',
              type: 'select',
              options: ['Professional', 'Casual', 'Friendly']
            },
            { key: 'hoursStart', label: 'Work Hours Start (e.g. 7:00)', type: 'time' },
            { key: 'hoursEnd', label: 'Work Hours End (e.g. 17:00)', type: 'time' },
            { key: 'twilioNumber', label: 'Twilio Number (optional)', type: 'tel' },
          ].map(({ key, label, type, options }) => (
            <div key={key}>
              <label className="text-gray-400 text-xs font-medium mb-2 block">
                {label}
              </label>
              {type === 'select' ? (
                <select
                  value={(data as any)[key]}
                  onChange={e => setData(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full bg-[#0F0F0F] border border-[#374151] rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#F97316] outline-none transition-colors"
                >
                  {options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  value={(data as any)[key]}
                  onChange={e => setData(p => ({
                    ...p,
                    [key]: type === 'number' ? Number(e.target.value) : e.target.value
                  }))}
                  className="w-full bg-[#0F0F0F] border border-[#374151] rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#F97316] outline-none transition-colors"
                  placeholder={type === 'time' ? 'HH:MM' : ''}
                />
              )}
            </div>
          ))}

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !data.businessName || !data.ownerName || !data.email}
            className="w-full bg-[#F97316] hover:bg-[#C2580A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-base transition-colors mt-6"
          >
            {loading ? 'Creating...' : 'Create Tradie Account'}
          </button>
        </div>

        <p className="text-gray-500 text-xs mt-6 text-center">
          Or use <span className="text-[#F97316]">/chat onboard new tradie</span> for guided setup
        </p>
      </div>
    </div>
  )
}

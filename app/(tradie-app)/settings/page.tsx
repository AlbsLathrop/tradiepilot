'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'

interface TradiePilotConfig {
  businessName: string
  tradeType: string
  serviceArea: string
  minJobValue: number
  hoursStart: string
  hoursEnd: string
  tone: string
  twilioNumber: string
}

export default function SettingsPage() {
  const [config, setConfig] = useState<TradiePilotConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { setConfig(d.config); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      showToast('✓ Settings saved')
    } catch {
      showToast('Failed to save')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white pb-24">
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50
        bg-[#F97316] text-white text-center py-3 px-4
        rounded-xl text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-400 text-sm">Your TradiePilot config</p>
      </div>

      {loading && (
        <div className="px-4 space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#111827] rounded-xl h-16
            animate-pulse" />
          ))}
        </div>
      )}

      {!loading && config && (
        <div className="px-4 space-y-4">

          <Section title="Business Profile">
            <Field label="Business Name"
              value={config.businessName ?? ''}
              onChange={v => setConfig((p) => ({
                ...p, businessName: v
              }) as TradiePilotConfig)} />
            <Field label="Trade Type"
              value={config.tradeType ?? ''}
              onChange={v => setConfig((p) => ({
                ...p, tradeType: v
              }) as TradiePilotConfig)} />
            <Field label="Service Area"
              value={config.serviceArea ?? ''}
              onChange={v => setConfig((p) => ({
                ...p, serviceArea: v
              }) as TradiePilotConfig)} />
          </Section>

          <Section title="ALFRED Settings">
            <Field label="Min Job Value ($)"
              value={String(config.minJobValue ?? '')}
              type="number"
              onChange={v => setConfig((p) => ({
                ...p, minJobValue: Number(v)
              }) as TradiePilotConfig)} />
            <Field label="Business Hours Start"
              value={config.hoursStart ?? '7:00'}
              onChange={v => setConfig((p) => ({
                ...p, hoursStart: v
              }) as TradiePilotConfig)} />
            <Field label="Business Hours End"
              value={config.hoursEnd ?? '17:00'}
              onChange={v => setConfig((p) => ({
                ...p, hoursEnd: v
              }) as TradiePilotConfig)} />
            <Field label="ALFRED Tone"
              value={config.tone ?? 'Professional'}
              onChange={v => setConfig((p) => ({
                ...p, tone: v
              }) as TradiePilotConfig)} />
          </Section>

          <Section title="Twilio">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400 text-sm">
                TradiePilot Number
              </span>
              <span className="text-white text-sm font-mono">
                {config.twilioNumber ?? '+61468072974'}
              </span>
            </div>
          </Section>

          <Section title="Talk to ALFRED">
            <p className="text-gray-400 text-xs leading-relaxed">
              You can change any setting by talking to ALFRED in Chat.
              Try: "Make my messages more casual" or
              "Add Manly to my service area"
            </p>
            <a href="/chat" className="w-full block bg-[#1F2937]
            border border-[#F97316] text-[#F97316] text-sm font-bold
            py-3 rounded-xl text-center mt-2">
              🧠 Open ALFRED
            </a>
          </Section>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#F97316] text-white font-bold
            py-3.5 rounded-xl text-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold
            py-3.5 rounded-xl text-sm transition-colors active:opacity-70"
          >
            Sign Out
          </button>

        </div>
      )}
    </div>
  )
}

function Section({ title, children }: {
  title: string; children: React.ReactNode
}) {
  return (
    <div className="bg-[#111827] rounded-xl p-4">
      <p className="text-[#F97316] text-xs font-bold uppercase mb-3">
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: {
  label: string; value: string;
  onChange: (v: string) => void; type?: string
}) {
  return (
    <div>
      <label className="text-gray-400 text-xs mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#0F0F0F] border border-[#1F2937]
        rounded-lg px-3 py-2.5 text-white text-sm
        focus:border-[#F97316] outline-none"
      />
    </div>
  )
}

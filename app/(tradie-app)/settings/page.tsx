'use client'

import { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Check, X } from 'lucide-react'

interface TradieFlowConfig {
  businessName: string
  tradeType: string
  serviceArea: string
  minJobValue: number
  hoursStart: string
  hoursEnd: string
  tone: string
  twilioNumber: string
  workingHours: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [config, setConfig] = useState<TradieFlowConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [savingField, setSavingField] = useState<string | null>(null)

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white pb-24">
        <div className="px-4 space-y-3 pt-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#111827] rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (status !== 'authenticated') {
    return null
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (status !== 'authenticated') return

    console.log('SESSION:', JSON.stringify(session?.user))

    if (!session?.user?.tradieSlug) {
      console.log('[SETTINGS] tradieSlug missing:', session?.user?.tradieSlug)
      setError('tradieSlug not found in session')
      setLoading(false)
      return
    }

    console.log('[SETTINGS] Fetching config for slug:', session.user.tradieSlug)
    fetch(`/api/tradie-config?tradieSlug=${encodeURIComponent(session.user.tradieSlug)}`)
      .then(r => {
        if (!r.ok) throw new Error(`Tradie Config API: ${r.status}`)
        return r.json()
      })
      .then(d => {
        console.log('[SETTINGS] Config loaded:', d)
        setConfig({
          businessName: d.businessName ?? '',
          tradeType: d.trade ?? '',
          serviceArea: d.serviceArea ?? '',
          minJobValue: d.minJobValue ?? 0,
          hoursStart: d.hoursStart ?? '7:00',
          hoursEnd: d.hoursEnd ?? '17:00',
          tone: d.tone ?? 'Professional',
          twilioNumber: d.twilioNumber ?? '',
          workingHours: d.workingHours ?? '',
        })
        setError(null)
        setLoading(false)
      })
      .catch(err => {
        console.error('[SETTINGS] Fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load settings')
        setLoading(false)
      })
  }, [status, session?.user?.tradieSlug])

  const handleFieldSave = async (fieldKey: string, fieldNotionName: string, value: any) => {
    setSavingField(fieldKey)
    try {
      const payload: Record<string, any> = {}
      payload[fieldKey] = value

      const response = await fetch('/api/tradie-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Save failed')
      }

      showToast('✓ Saved')
      setEditingField(null)
      setConfig(prev => prev ? { ...prev, [fieldKey]: value } : null)
    } catch (err) {
      showToast('Failed to save')
      console.error('Field save error:', err)
    } finally {
      setSavingField(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white pb-24">
        <div className="px-4 space-y-3 pt-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#111827] rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white pb-24">
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-[#F97316] text-white text-center py-3 px-4 rounded-xl text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-400 text-sm">Your TradieFlow config</p>
      </div>

      {error && (
        <div className="mx-4 p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-200 text-sm">
          <p className="font-semibold">Error loading settings</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      )}

      {!loading && !config && !error && (
        <div className="mx-4 p-4 bg-yellow-500/20 border border-yellow-500 rounded-xl text-yellow-200 text-sm">
          <p className="font-semibold">No settings data available</p>
          <p className="text-xs mt-1">Your tradie configuration could not be loaded. Please contact support.</p>
        </div>
      )}

      {config && (
        <div className="px-4 space-y-4">

          <Section title="Business Profile">
            <EditableField
              label="Business Name"
              value={config.businessName}
              onSave={(v) => handleFieldSave('businessName', 'Business Name', v)}
              isEditing={editingField === 'businessName'}
              onEditStart={() => setEditingField('businessName')}
              onEditCancel={() => setEditingField(null)}
              isSaving={savingField === 'businessName'}
            />
            <EditableField
              label="Service Area"
              value={config.serviceArea}
              onSave={(v) => handleFieldSave('serviceArea', 'Service Area', v)}
              isEditing={editingField === 'serviceArea'}
              onEditStart={() => setEditingField('serviceArea')}
              onEditCancel={() => setEditingField(null)}
              isSaving={savingField === 'serviceArea'}
            />
          </Section>

          <Section title="ALFRED Settings">
            <EditableField
              label="Min Job Value ($)"
              value={String(config.minJobValue)}
              type="number"
              onSave={(v) => handleFieldSave('minJobValue', 'Min Job Value', v === '' ? 0 : Number(v))}
              isEditing={editingField === 'minJobValue'}
              onEditStart={() => setEditingField('minJobValue')}
              onEditCancel={() => setEditingField(null)}
              isSaving={savingField === 'minJobValue'}
            />
            <EditableField
              label="Working Hours"
              value={config.workingHours}
              onSave={(v) => handleFieldSave('workingHours', 'Working Hours', v)}
              isEditing={editingField === 'workingHours'}
              onEditStart={() => setEditingField('workingHours')}
              onEditCancel={() => setEditingField(null)}
              isSaving={savingField === 'workingHours'}
            />
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

function EditableField({ label, value, onSave, isEditing, onEditStart, onEditCancel, isSaving, type = 'text' }: {
  label: string
  value: string | number
  onSave: (v: string) => void
  isEditing: boolean
  onEditStart: () => void
  onEditCancel: () => void
  isSaving: boolean
  type?: string
}) {
  const [editValue, setEditValue] = useState(String(value))

  if (isEditing) {
    return (
      <div className="py-2">
        <label className="text-gray-400 text-xs mb-2 block">{label}</label>
        <div className="flex gap-2">
          <input
            type={type}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            autoFocus
            className="flex-1 bg-[#0F0F0F] border border-[#F97316] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none"
          />
          <button
            onClick={() => onSave(editValue)}
            disabled={isSaving}
            className="bg-[#F97316] text-white p-2.5 rounded-lg hover:bg-[#C2580A] disabled:opacity-50"
          >
            <Check size={18} />
          </button>
          <button
            onClick={onEditCancel}
            disabled={isSaving}
            className="bg-gray-600 text-white p-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onEditStart}
      className="w-full text-left py-2 group"
    >
      <label className="text-gray-400 text-xs block mb-1">{label}</label>
      <div className="flex justify-between items-center px-3 py-2.5 bg-[#0F0F0F] rounded-lg group-hover:border group-hover:border-[#F97316] border border-transparent transition-colors">
        <span className="text-white text-sm">{value || '—'}</span>
        <span className="text-gray-500 text-xs group-hover:text-[#F97316] transition-colors">tap to edit</span>
      </div>
    </button>
  )
}

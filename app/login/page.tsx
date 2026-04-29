'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSignIn = async () => {
    if (!email) {
      setError('Enter your email')
      return
    }
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        redirect: false,
      })

      if (result?.ok && !result?.error) {
        router.push('/')
        router.refresh()
      } else {
        setError('Email not recognised. Try joey@tradie.test')
      }
    } catch (e) {
      setError('Sign in failed. Try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F0F0F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: '#111827',
        border: '0.5px solid #1F2937',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '380px',
      }}>
        <h1 style={{
          color: 'white',
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '4px',
        }}>TradiePilot</h1>
        <p style={{
          color: '#9CA3AF',
          fontSize: '14px',
          marginBottom: '2rem',
        }}>Cockpit + War Room</p>

        <label style={{
          color: '#9CA3AF',
          fontSize: '13px',
          display: 'block',
          marginBottom: '6px',
        }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSignIn()}
          placeholder="joey@tradie.test"
          style={{
            width: '100%',
            background: '#1F2937',
            border: '0.5px solid #374151',
            borderRadius: '8px',
            padding: '12px',
            color: 'white',
            fontSize: '15px',
            marginBottom: '1rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#9CA3AF',
          fontSize: '13px',
          marginBottom: '1.5rem',
          cursor: 'pointer',
        }}>
          <input type="checkbox" defaultChecked />
          Keep me logged in for 30 days
        </label>

        {error && (
          <p style={{
            color: '#F87171',
            fontSize: '13px',
            marginBottom: '1rem',
          }}>{error}</p>
        )}

        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? '#9CA3AF' : '#F97316',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={{
          color: '#4B5563',
          fontSize: '12px',
          textAlign: 'center',
          marginTop: '1.5rem',
        }}>Test email: joey@tradie.test</p>
      </div>
    </div>
  )
}

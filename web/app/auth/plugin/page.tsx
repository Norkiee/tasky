'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PluginLoginPage() {
  return (
    <Suspense fallback={
      <main style={styles.main}>
        <div style={styles.card}>
          <p style={{ color: '#A1A1A1', textAlign: 'center' }}>Loading...</p>
        </div>
      </main>
    }>
      <PluginLoginContent />
    </Suspense>
  )
}

function PluginLoginContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [done, setDone] = useState(false)
  const [checking, setChecking] = useState(true)

  // On mount, check if user is already signed in (magic link redirect case)
  useEffect(() => {
    if (!code) {
      setChecking(false)
      return
    }

    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await storeTokensForPlugin(session)
        return
      }

      // No session yet — listen for auth state change
      setChecking(false)
    }

    const storeTokensForPlugin = async (session: { access_token: string; refresh_token: string; expires_at?: number; user?: { email?: string } | null }) => {
      try {
        const res = await fetch('/api/auth/plugin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            email: session.user?.email,
          }),
        })
        if (res.ok) {
          setDone(true)
        } else {
          const data = await res.json().catch(() => ({}))
          setError(`Failed to connect to plugin: ${data.details || data.error || res.status}`)
        }
      } catch {
        setError('Failed to connect to plugin. Please try again.')
      }
      setChecking(false)
    }

    checkExistingSession()

    // Also listen for future auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await storeTokensForPlugin(session)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [code, supabase.auth])

  const handleSendLink = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email || loading) return

    setLoading(true)
    setError('')

    const redirectUrl = `${window.location.origin}/auth/plugin?code=${code}`
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectUrl,
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSent(true)
  }

  if (!code) {
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <p style={styles.error}>Invalid link. Please sign in from the Figma plugin.</p>
        </div>
      </main>
    )
  }

  if (checking) {
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <p style={{ color: '#A1A1A1', textAlign: 'center' }}>Signing you in...</p>
        </div>
      </main>
    )
  }

  if (done) {
    return (
      <main style={styles.main}>
        <div style={{ ...styles.card, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const }}>
          <div style={styles.successIcon}>&#10003;</div>
          <h2 style={styles.heading}>Signed in!</h2>
          <p style={styles.subtext}>You can close this tab and return to the Figma plugin.</p>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="white" strokeWidth="2" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="white" strokeWidth="2" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="white" strokeWidth="2" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <span style={styles.logoText}>Tasky</span>
        </div>

        <p style={styles.subtitle}>Sign in to connect the Figma plugin</p>

        {sent ? (
          <div style={styles.sentState}>
            <p style={styles.sentHeading}>Check your email</p>
            <p style={styles.subtext}>
              We sent a magic link to <span style={{ color: '#FFFFFF' }}>{email}</span>
            </p>
            <p style={styles.hint}>Click the link in your email to complete sign in.</p>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail(''); setError(''); }}
              style={styles.linkBtn}
            >
              Use different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendLink}>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
              style={styles.input}
              required
            />
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Sending...' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    minHeight: '100vh',
    background: '#0A0A0A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    fontFamily: "'General Sans', Inter, system-ui, -apple-system, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    background: '#141414',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '24px 28px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  logo: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: '#8B5CF6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 500,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#A1A1A1',
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    height: '52px',
    background: '#0D0D0D',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '0 16px',
    fontSize: '14px',
    color: '#FFFFFF',
    outline: 'none',
    marginBottom: '16px',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  button: {
    width: '100%',
    height: '52px',
    background: '#8B5CF6',
    border: 'none',
    borderRadius: '12px',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  error: {
    color: '#EF4444',
    fontSize: '12px',
    marginBottom: '12px',
  },
  sentState: {
    textAlign: 'center' as const,
    padding: '20px 0',
  },
  sentHeading: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#FFFFFF',
    marginBottom: '12px',
  },
  subtext: {
    fontSize: '14px',
    color: '#A1A1A1',
    marginBottom: '8px',
  },
  hint: {
    fontSize: '12px',
    color: '#666666',
    marginBottom: '16px',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#666666',
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  successIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.15)',
    color: '#8B5CF6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    margin: '0 auto 12px',
  },
  heading: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    marginBottom: '8px',
  },
}

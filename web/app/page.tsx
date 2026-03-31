'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ClipboardIcon } from '@/components/icons'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/dashboard')
      }
    })
  }, [router, supabase.auth])

  const handleSendLink = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email || loading) return

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSent(true)
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center" style={{ padding: '32px' }}>
      <div className="w-full bg-[#141414] border border-[rgba(255,255,255,0.1)] rounded-2xl" style={{ maxWidth: '480px', padding: '24px 28px' }}>
        <div className="flex items-center gap-4" style={{ marginBottom: '20px' }}>
          <div className="bg-[#8B5CF6] rounded-xl flex items-center justify-center" style={{ width: '44px', height: '44px' }}>
            <ClipboardIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-medium text-white">Tasky</span>
        </div>

        {sent ? (
          <div className="text-center" style={{ padding: '20px 0' }}>
            <p className="text-lg font-semibold text-white" style={{ marginBottom: '12px' }}>
              Check your email
            </p>
            <p className="text-sm text-[#A1A1A1]" style={{ marginBottom: '24px' }}>
              We sent a magic link to <span className="text-white">{email}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false)
                setEmail('')
                setError('')
              }}
              className="text-xs text-[#666666] hover:text-[#A1A1A1] transition-colors"
            >
              Use different email
            </button>
          </div>
        ) : (
          <>
            <p className="text-lg font-semibold text-[#A1A1A1]" style={{ marginBottom: '20px' }}>
              Sign in to your workspace
            </p>

            <form onSubmit={handleSendLink}>
              <div style={{ marginBottom: '32px' }}>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  className="w-full bg-[#0D0D0D] border border-[rgba(255,255,255,0.1)] rounded-xl pr-6 text-sm text-white placeholder:text-[#666666] focus:border-[rgba(255,255,255,0.2)] outline-none"
                  style={{ height: '52px', paddingLeft: '16px' }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
                style={{ height: '52px', marginBottom: '32px' }}
              >
                {loading ? 'Sending...' : 'Send magic link'}
              </button>

              {error && (
                <p className="text-xs text-[#EF4444] text-center" style={{ marginBottom: '24px' }}>{error}</p>
              )}
            </form>
          </>
        )}
      </div>
    </main>
  )
}

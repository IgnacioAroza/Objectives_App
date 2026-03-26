'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const origin = window.location.origin

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-display font-bold text-3xl text-navy tracking-tight">
            Click<span className="text-sky">Store</span>
          </span>
          <p className="text-navy/50 text-sm mt-1 font-body">Objetivos 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-navy/10 p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-brand text-xl">✉</span>
              </div>
              <h2 className="font-display font-semibold text-navy text-lg mb-2">
                Revisá tu email
              </h2>
              <p className="text-navy/60 text-sm font-body">
                Te enviamos un link mágico a{' '}
                <span className="font-medium text-navy">{email}</span>.
                Hacé click en el link para ingresar.
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-display font-semibold text-navy text-xl mb-1">
                Ingresar
              </h2>
              <p className="text-navy/50 text-sm font-body mb-6">
                Te enviamos un link mágico por email
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-navy/70 mb-1.5 font-body"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-beige bg-cream text-navy placeholder-navy/30 text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-xs font-body">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-brand text-white py-2.5 rounded-lg text-sm font-medium font-body hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Enviando...' : 'Enviar link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

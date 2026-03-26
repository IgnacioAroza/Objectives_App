'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    if (authError) {
      console.error('[auth] signInWithOtp:', authError.message)
      setError('No se pudo enviar el código. Intentá de nuevo.')
      setLoading(false)
      return
    }

    setStep('code')
    setLoading(false)
  }

  async function handleVerifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    })

    if (verifyError) {
      console.error('[auth] verifyOtp:', verifyError.message)
      setError('Código incorrecto o expirado. Revisá el email o pedí uno nuevo.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
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
          {step === 'email' ? (
            <>
              <h2 className="font-display font-semibold text-navy text-xl mb-1">Ingresar</h2>
              <p className="text-navy/50 text-sm font-body mb-6">
                Te enviamos un código de 6 dígitos por email
              </p>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-navy/70 mb-1.5 font-body">
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

                {error && <p className="text-red-600 text-xs font-body">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-brand text-white py-2.5 rounded-lg text-sm font-medium font-body hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Enviando...' : 'Enviar código'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={() => { setStep('email'); setCode(''); setError(null) }}
                  className="text-navy/40 hover:text-navy transition-colors"
                  aria-label="Volver"
                >
                  ←
                </button>
                <div>
                  <h2 className="font-display font-semibold text-navy text-xl leading-tight">Ingresá el código</h2>
                  <p className="text-navy/50 text-xs font-body mt-0.5">Enviado a {email}</p>
                </div>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-navy/70 mb-1.5 font-body">
                    Código de 8 dígitos
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={8}
                    required
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="12345678"
                    className="w-full px-4 py-3 rounded-lg border border-beige bg-cream text-navy placeholder-navy/30 text-xl font-display font-bold tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                  />
                </div>

                {error && <p className="text-red-600 text-xs font-body">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || code.length < 8}
                  className="w-full bg-brand text-white py-2.5 rounded-lg text-sm font-medium font-body hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Verificando...' : 'Ingresar'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setError(null) }}
                  className="w-full text-navy/40 text-xs font-body hover:text-navy transition-colors"
                >
                  No recibí el código — volver a intentar
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

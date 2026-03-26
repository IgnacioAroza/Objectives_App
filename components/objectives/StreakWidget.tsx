'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calcStreakDays, formatDate } from '@/lib/utils'

type StreakWidgetProps = {
  quitDate: string | null
}

export default function StreakWidget({ quitDate: initialQuitDate }: StreakWidgetProps) {
  const [quitDate, setQuitDate] = useState<string | null>(initialQuitDate)
  const [dateInput, setDateInput] = useState('')
  const [showRelapse, setShowRelapse] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const days = quitDate ? calcStreakDays(quitDate) : null

  async function handleSetDate(e: React.FormEvent) {
    e.preventDefault()
    if (!dateInput) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: upsertError } = await supabase
      .from('config')
      .upsert({ key: 'quit_smoking_date', value: dateInput })

    if (upsertError) {
      console.error('[config] upsert quit_date:', upsertError.message)
      setError('No se pudo guardar la fecha.')
      setLoading(false)
      return
    }

    setQuitDate(dateInput)
    setDateInput('')
    setLoading(false)
  }

  async function handleRelapse() {
    if (!quitDate) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const { error: upsertError } = await supabase
      .from('config')
      .upsert({ key: 'quit_smoking_date', value: today })

    if (upsertError) {
      console.error('[config] relapse reset:', upsertError.message)
      setError('No se pudo guardar la recaída.')
      setLoading(false)
      return
    }

    setQuitDate(today)
    setShowRelapse(false)
    setLoading(false)
  }

  return (
    <div className="bg-white border border-navy/10 rounded-2xl p-5">
      <h3 className="font-display font-semibold text-navy text-sm mb-4">Racha sin fumar</h3>

      {quitDate && days !== null ? (
        <div>
          <div className="mb-2">
            <span className="font-display font-bold text-6xl text-navy">{days}</span>
            <span className="font-body text-navy/50 text-lg ml-2">días</span>
          </div>
          <p className="text-xs text-navy/50 font-body mb-4">
            Desde el {formatDate(quitDate)}
          </p>

          {!showRelapse ? (
            <button
              onClick={() => setShowRelapse(true)}
              className="text-xs font-body text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Tuve una recaída
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700 font-body mb-3">
                La racha se va a reiniciar desde hoy. El intento anterior ({days} días) queda guardado como historial.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRelapse(false)}
                  className="px-3 py-1.5 text-xs font-body text-navy/70 border border-navy/15 rounded-lg hover:bg-beige transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRelapse}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs font-body font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? '...' : 'Confirmar recaída'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-navy/60 font-body mb-3">
            ¿Cuándo dejaste de fumar? Ingresá la fecha de inicio.
          </p>
          <form onSubmit={handleSetDate} className="flex gap-2">
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              required
              className="flex-1 px-3 py-2 border border-navy/20 rounded-lg text-sm font-body text-navy bg-white focus:outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={loading || !dateInput}
              className="px-4 py-2 bg-brand text-white text-sm font-body font-medium rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors"
            >
              {loading ? '...' : 'Guardar'}
            </button>
          </form>
        </div>
      )}

      {error && <p className="text-xs text-red-600 font-body mt-2">{error}</p>}
    </div>
  )
}

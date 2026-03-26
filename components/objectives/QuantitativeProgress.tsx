'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Objective, ValueLog } from '@/lib/types'
import ProgressBar from '@/components/ui/ProgressBar'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { calcQuantitativeProgress, formatDate, getTodayString } from '@/lib/utils'

type QuantitativeProgressProps = {
  objective: Objective
  valueLogs: ValueLog[]
}

export default function QuantitativeProgress({ objective, valueLogs }: QuantitativeProgressProps) {
  const router = useRouter()
  const [newValue, setNewValue] = useState('')
  const [noteValue, setNoteValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progress =
    objective.current_value !== null &&
    objective.initial_value !== null &&
    objective.target_value !== null
      ? calcQuantitativeProgress(
          objective.current_value,
          objective.initial_value,
          objective.target_value
        )
      : 0

  async function handleLogValue() {
    const val = parseFloat(newValue)
    if (isNaN(val)) {
      setError('Ingresá un número válido')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: logError } = await supabase.from('value_logs').insert({
      objective_id: objective.id,
      value: val,
      logged_at: getTodayString(),
      note: noteValue.trim() || null,
    })

    if (logError) {
      setError(logError.message)
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('objectives')
      .update({ current_value: val })
      .eq('id', objective.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setNewValue('')
    setNoteValue('')
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-navy/10 rounded-[14px] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-navy/40 font-body mb-0.5">Progreso actual</p>
            <p className="font-display font-bold text-3xl text-navy">
              {progress}
              <span className="text-lg text-navy/50">%</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-navy/40 font-body mb-0.5">
              {objective.current_value ?? '—'} / {objective.target_value ?? '—'}
            </p>
            {objective.unit && (
              <p className="text-sm text-navy/60 font-body">{objective.unit}</p>
            )}
          </div>
        </div>

        <ProgressBar value={progress} showLabel={false} />

        <div className="flex items-center justify-between mt-2 text-xs text-navy/40 font-body">
          <span>Inicial: {objective.initial_value ?? '—'}</span>
          <span>Meta: {objective.target_value ?? '—'}</span>
        </div>
      </div>

      <div className="bg-white border border-navy/10 rounded-[14px] p-5">
        <h3 className="font-display font-semibold text-navy text-sm mb-4">
          Registrar nuevo valor
        </h3>

        <div className="space-y-3">
          <div className="flex gap-3">
            <input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={`Valor ${objective.unit ? `(${objective.unit})` : ''}`}
              className="flex-1 px-3 py-2.5 rounded-lg border border-beige bg-cream text-navy text-sm font-body placeholder-navy/30 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
            />
            <Button onClick={handleLogValue} disabled={loading || !newValue}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>

          <input
            type="text"
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            placeholder="Nota opcional..."
            className="w-full px-3 py-2.5 rounded-lg border border-beige bg-cream text-navy text-sm font-body placeholder-navy/30 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
          />

          {error && <p className="text-red-600 text-xs font-body">{error}</p>}
        </div>
      </div>

      {valueLogs.length > 0 && (
        <div className="bg-white border border-navy/10 rounded-[14px] p-5">
          <h3 className="font-display font-semibold text-navy text-sm mb-4">
            Historial de valores
          </h3>
          <div className="space-y-2">
            {valueLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 border-b border-beige last:border-0"
              >
                <div>
                  <span className="font-medium text-navy text-sm font-body">
                    {log.value} {objective.unit ?? ''}
                  </span>
                  {log.note && (
                    <p className="text-xs text-navy/40 font-body mt-0.5">{log.note}</p>
                  )}
                </div>
                <span className="text-xs text-navy/40 font-body">
                  {formatDate(log.logged_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

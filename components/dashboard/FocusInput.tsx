'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DailyFocus } from '@/lib/types'

type FocusInputProps = {
  initialFocus: DailyFocus | null
  today: string
}

export default function FocusInput({ initialFocus, today }: FocusInputProps) {
  const [f1, setF1] = useState(initialFocus?.f1 ?? '')
  const [f2, setF2] = useState(initialFocus?.f2 ?? '')
  const [f3, setF3] = useState(initialFocus?.f3 ?? '')
  const [done, setDone] = useState<[boolean, boolean, boolean]>([false, false, false])
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cargar estado "hecho" desde localStorage (se resetea cada día)
  useEffect(() => {
    const stored = localStorage.getItem(`focus_done_${today}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length === 3) {
          setDone(parsed as [boolean, boolean, boolean])
        }
      } catch {
        // ignorar JSON inválido
      }
    }
  }, [today])

  function toggleDone(idx: 0 | 1 | 2) {
    const next: [boolean, boolean, boolean] = [...done] as [boolean, boolean, boolean]
    next[idx] = !next[idx]
    setDone(next)
    localStorage.setItem(`focus_done_${today}`, JSON.stringify(next))
  }

  function schedule(newF1: string, newF2: string, newF3: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(newF1, newF2, newF3), 800)
  }

  async function save(f1Val: string, f2Val: string, f3Val: string) {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('daily_focus')
      .upsert({ date: today, f1: f1Val || null, f2: f2Val || null, f3: f3Val || null })

    if (error) {
      console.error('[daily_focus] upsert:', error.message)
    }
    setSaving(false)
  }

  const completedCount = done.filter(Boolean).length

  const items = [
    { idx: 0 as const, value: f1, setter: setF1, placeholder: '¿Cuál es tu prioridad #1 hoy?' },
    { idx: 1 as const, value: f2, setter: setF2, placeholder: 'Prioridad #2' },
    { idx: 2 as const, value: f3, setter: setF3, placeholder: 'Prioridad #3' },
  ]

  return (
    <div className="bg-white border border-navy/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-navy/50 uppercase tracking-wider font-body">
          Foco de hoy — top 3
        </h3>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs text-navy/30 font-body">Guardando...</span>}
          {completedCount > 0 && (
            <span className="text-xs font-body font-medium text-brand">
              {completedCount}/3 hechas
            </span>
          )}
        </div>
      </div>
      <div className="divide-y divide-navy/5">
        {items.map(({ idx, value, setter, placeholder }) => (
          <div key={idx} className="flex items-center gap-3 py-3">
            {/* Botón check */}
            <button
              onClick={() => toggleDone(idx)}
              aria-label={done[idx] ? 'Marcar como pendiente' : 'Marcar como hecha'}
              className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
                done[idx]
                  ? 'bg-brand border-brand'
                  : 'border-navy/25 hover:border-brand'
              }`}
            >
              {done[idx] && (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            <input
              type="text"
              value={value}
              onChange={(e) => {
                setter(e.target.value)
                const vals = [f1, f2, f3]
                vals[idx] = e.target.value
                schedule(vals[0], vals[1], vals[2])
              }}
              placeholder={placeholder}
              className={`flex-1 bg-transparent border-none text-sm font-body placeholder:text-navy/30 focus:outline-none transition-all ${
                done[idx] ? 'line-through text-navy/35' : 'text-navy'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Barra de progreso del foco */}
      {(f1 || f2 || f3) && (
        <div className="mt-4 pt-3 border-t border-navy/5">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  done[i] ? 'bg-brand' : 'bg-navy/10'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

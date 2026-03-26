'use client'

import { useState, useRef } from 'react'
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
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const items = [
    { num: '1', value: f1, setter: setF1, placeholder: '¿Cuál es tu prioridad #1 hoy?' },
    { num: '2', value: f2, setter: setF2, placeholder: 'Prioridad #2' },
    { num: '3', value: f3, setter: setF3, placeholder: 'Prioridad #3' },
  ]

  return (
    <div className="bg-white border border-navy/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-navy/50 uppercase tracking-wider font-body">
          Foco de hoy — top 3
        </h3>
        {saving && <span className="text-xs text-navy/30 font-body">Guardando...</span>}
      </div>
      <div className="divide-y divide-navy/5">
        {items.map(({ num, value, setter, placeholder }) => (
          <div key={num} className="flex items-center gap-3 py-3">
            <span className="font-display font-bold text-sm text-sky min-w-[20px]">{num}</span>
            <input
              type="text"
              value={value}
              onChange={(e) => {
                setter(e.target.value)
                const vals = [f1, f2, f3]
                const idx = parseInt(num) - 1
                vals[idx] = e.target.value
                schedule(vals[0], vals[1], vals[2])
              }}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-none text-sm font-body text-navy placeholder:text-navy/30 focus:outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

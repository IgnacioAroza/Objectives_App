'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Objective } from '@/lib/types'

type QualitativeSliderProps = {
  objective: Objective
}

export default function QualitativeSlider({ objective }: QualitativeSliderProps) {
  const [value, setValue] = useState(objective.progress_manual)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = parseInt(e.target.value, 10)
    setValue(newValue)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      save(newValue)
    }, 500)
  }

  async function save(newValue: number) {
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('objectives')
      .update({ progress_manual: newValue })
      .eq('id', objective.id)

    if (updateError) {
      console.error('[objectives] update progress_manual:', updateError.message)
      setError('No se pudo guardar el progreso.')
    }

    setSaving(false)
  }

  return (
    <div className="bg-white border border-navy/10 rounded-2xl p-5">
      <h3 className="font-display font-semibold text-navy text-sm mb-4">Progreso</h3>

      <div className="flex items-center gap-4 mb-2">
        <span className="font-display font-bold text-3xl text-navy">{value}%</span>
        {saving && <span className="text-xs text-navy/40 font-body">Guardando...</span>}
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={handleChange}
        className="w-full accent-brand cursor-pointer"
      />

      <div className="flex justify-between text-xs text-navy/30 font-body mt-1">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>

      {error && <p className="text-xs text-red-600 font-body mt-2">{error}</p>}

      <p className="text-xs text-navy/40 font-body mt-3">
        Mové el slider cuando sentís que avanzaste en este objetivo.
      </p>
    </div>
  )
}

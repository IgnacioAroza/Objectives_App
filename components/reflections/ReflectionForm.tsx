'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Objective } from '@/lib/types'
import ObjectiveTagSelector from '@/components/reflections/ObjectiveTagSelector'

type InitialData = {
  id: string
  what_i_did: string
  how_i_felt: string
  what_i_learned: string
  free_notes: string
  selectedObjectiveIds: string[]
}

type ReflectionFormProps = {
  objectives: Objective[]
  today: string
  initialData: InitialData | null
}

const FIELDS = [
  {
    key: 'what_i_did' as const,
    label: '¿Qué hice hoy?',
    placeholder: 'Describí las acciones que tomaste hoy...',
    rows: 4,
  },
  {
    key: 'how_i_felt' as const,
    label: '¿Cómo me sentí?',
    placeholder: 'Tu estado emocional, energía, motivación...',
    rows: 4,
  },
  {
    key: 'what_i_learned' as const,
    label: '¿Qué aprendí o me llevé de hoy?',
    placeholder: 'Un insight, una lección, algo que vas a recordar...',
    rows: 4,
  },
  {
    key: 'free_notes' as const,
    label: 'Espacio libre (opcional)',
    placeholder: 'Lo que quieras escribir sin estructura...',
    rows: 3,
  },
]

type FieldKey = 'what_i_did' | 'how_i_felt' | 'what_i_learned' | 'free_notes'

export default function ReflectionForm({ objectives, today, initialData }: ReflectionFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<Record<FieldKey, string>>({
    what_i_did:     initialData?.what_i_did     ?? '',
    how_i_felt:     initialData?.how_i_felt     ?? '',
    what_i_learned: initialData?.what_i_learned ?? '',
    free_notes:     initialData?.free_notes     ?? '',
  })
  const [selectedIds, setSelectedIds] = useState<string[]>(initialData?.selectedObjectiveIds ?? [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(key: FieldKey, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const supabase = createClient()
    let reflectionId = initialData?.id

    if (reflectionId) {
      const { error: updateError } = await supabase
        .from('reflections')
        .update({
          what_i_did:     values.what_i_did     || null,
          how_i_felt:     values.how_i_felt     || null,
          what_i_learned: values.what_i_learned || null,
          free_notes:     values.free_notes     || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reflectionId)

      if (updateError) {
        console.error('[reflections] update:', updateError.message)
        setError('No se pudo guardar la reflexión. Intentá de nuevo.')
        setSaving(false)
        return
      }
    } else {
      const { data: newReflection, error: insertError } = await supabase
        .from('reflections')
        .insert({
          date:           today,
          what_i_did:     values.what_i_did     || null,
          how_i_felt:     values.how_i_felt     || null,
          what_i_learned: values.what_i_learned || null,
          free_notes:     values.free_notes     || null,
        })
        .select()
        .single()

      if (insertError) {
        console.error('[reflections] insert:', insertError.message)
        setError('No se pudo guardar la reflexión. Intentá de nuevo.')
        setSaving(false)
        return
      }
      reflectionId = newReflection.id
    }

    const { error: deleteError } = await supabase
      .from('reflection_objectives')
      .delete()
      .eq('reflection_id', reflectionId)

    if (deleteError) {
      console.error('[reflection_objectives] delete:', deleteError.message)
    }

    if (selectedIds.length > 0) {
      const { error: insertTagsError } = await supabase
        .from('reflection_objectives')
        .insert(selectedIds.map((objId) => ({ reflection_id: reflectionId, objective_id: objId })))

      if (insertTagsError) {
        console.error('[reflection_objectives] insert:', insertTagsError.message)
      }
    }

    setSaving(false)
    setSaved(true)
    router.push('/reflections')
    router.refresh()
  }

  const canSave = values.what_i_did.trim().length > 0

  return (
    <form onSubmit={handleSubmit}>

      {/* Single card with stacked fields */}
      <div className="bg-surface border border-navy/10 rounded-2xl overflow-hidden mb-5">
        {FIELDS.map((field) => (
          <div key={field.key} className="border-b border-navy/5 last:border-0">
            <div className="px-5 pt-4 pb-1">
              <label className="text-xs font-bold text-brand tracking-[0.04em]">
                {field.label}
              </label>
            </div>
            <textarea
              value={values[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows}
              className="w-full px-5 pb-4 pt-1 border-none outline-none bg-transparent text-sm font-body text-navy placeholder:text-navy/30 resize-none leading-relaxed block"
            />
          </div>
        ))}

        {/* Objective chips */}
        <div className="px-5 py-4 border-t border-navy/5">
          <p className="text-xs font-bold text-navy font-body mb-3">
            ¿Sobre qué objetivos trabajaste hoy?
          </p>
          <ObjectiveTagSelector
            objectives={objectives}
            selected={selectedIds}
            onChange={setSelectedIds}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 font-body mb-4">{error}</p>}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 border border-navy/15 rounded-xl text-sm font-body text-navy/60 hover:bg-beige transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !canSave}
          className="flex-[2] py-3 bg-brand text-white rounded-xl text-sm font-display font-bold hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar reflexión'}
        </button>
      </div>
    </form>
  )
}

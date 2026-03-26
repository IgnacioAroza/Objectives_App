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

export default function ReflectionForm({ objectives, today, initialData }: ReflectionFormProps) {
  const router = useRouter()
  const [whatIDid, setWhatIDid] = useState(initialData?.what_i_did ?? '')
  const [howIFelt, setHowIFelt] = useState(initialData?.how_i_felt ?? '')
  const [whatILearned, setWhatILearned] = useState(initialData?.what_i_learned ?? '')
  const [freeNotes, setFreeNotes] = useState(initialData?.free_notes ?? '')
  const [selectedIds, setSelectedIds] = useState<string[]>(initialData?.selectedObjectiveIds ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          what_i_did: whatIDid || null,
          how_i_felt: howIFelt || null,
          what_i_learned: whatILearned || null,
          free_notes: freeNotes || null,
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
          date: today,
          what_i_did: whatIDid || null,
          how_i_felt: howIFelt || null,
          what_i_learned: whatILearned || null,
          free_notes: freeNotes || null,
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

    // Sync objective tags
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
    router.push('/reflections')
    router.refresh()
  }

  const fields = [
    {
      label: '¿Qué hice hoy?',
      value: whatIDid,
      setter: setWhatIDid,
      placeholder: 'Describí las acciones que tomaste hoy...',
    },
    {
      label: '¿Cómo me sentí?',
      value: howIFelt,
      setter: setHowIFelt,
      placeholder: 'Tu estado emocional, energía, motivación...',
    },
    {
      label: '¿Qué aprendí o me llevé de hoy?',
      value: whatILearned,
      setter: setWhatILearned,
      placeholder: 'Un insight, una lección, algo que vas a recordar...',
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {fields.map(({ label, value, setter, placeholder }) => (
        <div key={label}>
          <label className="block text-sm font-medium text-navy font-body mb-2">{label}</label>
          <textarea
            value={value}
            onChange={(e) => setter(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full px-3 py-2.5 border border-navy/20 rounded-xl text-sm font-body text-navy bg-white focus:outline-none focus:border-brand resize-none leading-relaxed"
          />
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-navy font-body mb-2">Espacio libre (opcional)</label>
        <textarea
          value={freeNotes}
          onChange={(e) => setFreeNotes(e.target.value)}
          placeholder="Lo que quieras escribir sin estructura..."
          rows={3}
          className="w-full px-3 py-2.5 border border-navy/20 rounded-xl text-sm font-body text-navy bg-white focus:outline-none focus:border-brand resize-none leading-relaxed"
        />
      </div>

      <div className="bg-white border border-navy/10 rounded-2xl p-5">
        <label className="block text-sm font-medium text-navy font-body mb-3">
          ¿Sobre qué objetivos trabajaste hoy?
        </label>
        <ObjectiveTagSelector
          objectives={objectives}
          selected={selectedIds}
          onChange={setSelectedIds}
        />
      </div>

      {error && <p className="text-sm text-red-600 font-body">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 border border-navy/20 rounded-xl text-sm font-body text-navy/70 hover:bg-beige transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 bg-brand text-white rounded-xl text-sm font-body font-medium hover:bg-brand/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar reflexión'}
        </button>
      </div>
    </form>
  )
}

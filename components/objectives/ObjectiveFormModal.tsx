'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import type { Objective } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  objective?: Objective // si viene → modo edición
}

type FormState = {
  title: string
  category: 'negocio' | 'salud' | 'lifestyle'
  type: 'quantitative' | 'qualitative' | 'streak'
  target_value: string
  initial_value: string
  unit: string
}

export default function ObjectiveFormModal({ open, onClose, objective }: Props) {
  const router = useRouter()
  const isEdit = !!objective

  const [form, setForm] = useState<FormState>({
    title: objective?.title ?? '',
    category: objective?.category ?? 'negocio',
    type: objective?.type ?? 'qualitative',
    target_value: objective?.target_value?.toString() ?? '',
    initial_value: objective?.initial_value?.toString() ?? '',
    unit: objective?.unit ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.title.trim()) {
      setError('El título es obligatorio.')
      return
    }
    if (form.type === 'quantitative' && !form.target_value) {
      setError('El valor meta es obligatorio para objetivos cuantitativos.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const payload = {
      title: form.title.trim(),
      category: form.category,
      type: form.type,
      target_value: form.type === 'quantitative' ? parseFloat(form.target_value) : null,
      initial_value: form.type === 'quantitative' ? parseFloat(form.initial_value || '0') : null,
      current_value: form.type === 'quantitative' ? parseFloat(form.initial_value || '0') : null,
      unit: form.type === 'quantitative' ? form.unit.trim() || null : null,
    }

    if (isEdit) {
      const { error: updateError } = await supabase
        .from('objectives')
        .update(payload)
        .eq('id', objective.id)

      if (updateError) {
        console.error('[ObjectiveFormModal] update:', updateError.message)
        setError('No se pudo guardar el objetivo. Intentá de nuevo.')
        setLoading(false)
        return
      }
    } else {
      const { error: insertError } = await supabase
        .from('objectives')
        .insert({ ...payload, progress_manual: 0 })

      if (insertError) {
        console.error('[ObjectiveFormModal] insert:', insertError.message)
        setError('No se pudo crear el objetivo. Intentá de nuevo.')
        setLoading(false)
        return
      }
    }

    router.refresh()
    onClose()
    setLoading(false)
  }

  const inputClass = 'w-full rounded-xl border border-beige bg-white px-3 py-2.5 text-sm font-body text-navy placeholder:text-navy/30 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors'
  const labelClass = 'block text-xs font-body text-navy/60 mb-1'

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar objetivo' : 'Nuevo objetivo'}>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className={labelClass}>Título *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Ej: Llegar a 90 kg"
            className={inputClass}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Categoría</label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value as FormState['category'])}
              className={inputClass}
            >
              <option value="negocio">Negocio</option>
              <option value="salud">Salud</option>
              <option value="lifestyle">Estilo de vida</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Tipo</label>
            <select
              value={form.type}
              onChange={e => set('type', e.target.value as FormState['type'])}
              className={inputClass}
            >
              <option value="qualitative">Cualitativo</option>
              <option value="quantitative">Cuantitativo</option>
              <option value="streak">Racha</option>
            </select>
          </div>
        </div>

        {form.type === 'quantitative' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Valor inicial</label>
                <input
                  type="number"
                  value={form.initial_value}
                  onChange={e => set('initial_value', e.target.value)}
                  placeholder="0"
                  step="any"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Meta *</label>
                <input
                  type="number"
                  value={form.target_value}
                  onChange={e => set('target_value', e.target.value)}
                  placeholder="100"
                  step="any"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Unidad (opcional)</label>
              <input
                type="text"
                value={form.unit}
                onChange={e => set('unit', e.target.value)}
                placeholder="Ej: kg, USD, M ARS/mes"
                className={inputClass}
              />
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-red-500 font-body">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-beige text-sm font-body text-navy hover:bg-beige transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-body font-medium hover:bg-navy transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear objetivo'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

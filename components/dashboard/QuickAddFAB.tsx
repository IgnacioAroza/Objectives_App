'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Objective } from '@/lib/types'

export default function QuickAddFAB() {
  const [open, setOpen] = useState(false)
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [title, setTitle] = useState('')
  const [objectiveId, setObjectiveId] = useState('')
  const [priority, setPriority] = useState<1 | 2 | 3>(2)
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open || objectives.length > 0) return
    const supabase = createClient()
    supabase
      .from('objectives')
      .select('id, title, category, type, sort_order')
      .order('sort_order')
      .then(({ data }) => {
        if (data) setObjectives(data as Objective[])
      })
  }, [open, objectives.length])

  // Cerrar al presionar Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function handleClose() {
    setOpen(false)
    setTitle('')
    setObjectiveId('')
    setPriority(2)
    setDueDate('')
    setError(null)
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !objectiveId) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('tasks').insert({
      title: title.trim(),
      objective_id: objectiveId,
      priority,
      due_date: dueDate || null,
      done: false,
    })

    if (insertError) {
      console.error('[quick-add] insert task:', insertError.message)
      setError('No se pudo agregar la tarea. Intentá de nuevo.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => handleClose(), 900)
  }

  const categoryLabel: Record<string, string> = {
    negocio: 'Negocio',
    salud: 'Salud',
    lifestyle: 'Estilo de vida',
  }

  return (
    <>
      {/* Botón FAB */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-[88px] right-4 z-40 w-14 h-14 bg-brand text-white rounded-full shadow-lg shadow-brand/40 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Agregar tarea rápida"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-navy/15 rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-2">
          <h2 className="font-display font-bold text-lg text-navy mb-5">Nueva tarea</h2>

          {success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-body text-navy/70">¡Tarea agregada!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-xs text-navy/50 font-body uppercase tracking-wider mb-1.5">
                  ¿Qué tenés que hacer?
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Llamar al proveedor de China"
                  required
                  autoFocus
                  className="w-full px-4 py-3 border border-navy/20 rounded-xl text-sm font-body text-navy bg-white focus:outline-none focus:border-brand"
                />
              </div>

              {/* Objetivo */}
              <div>
                <label className="block text-xs text-navy/50 font-body uppercase tracking-wider mb-1.5">
                  Objetivo
                </label>
                <select
                  value={objectiveId}
                  onChange={(e) => setObjectiveId(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-navy/20 rounded-xl text-sm font-body text-navy bg-white focus:outline-none focus:border-brand"
                >
                  <option value="">Seleccioná un objetivo</option>
                  {(['negocio', 'salud', 'lifestyle'] as const).map((cat) => {
                    const group = objectives.filter((o) => o.category === cat)
                    if (group.length === 0) return null
                    return (
                      <optgroup key={cat} label={categoryLabel[cat]}>
                        {group.map((o) => (
                          <option key={o.id} value={o.id}>{o.title}</option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>
              </div>

              {/* Prioridad y fecha en fila */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-navy/50 font-body uppercase tracking-wider mb-1.5">
                    Prioridad
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value) as 1 | 2 | 3)}
                    className="w-full px-4 py-3 border border-navy/20 rounded-xl text-sm font-body text-navy bg-white focus:outline-none focus:border-brand"
                  >
                    <option value={1}>Alta</option>
                    <option value={2}>Media</option>
                    <option value={3}>Baja</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-navy/50 font-body uppercase tracking-wider mb-1.5">
                    Vence
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 border border-navy/20 rounded-xl text-sm font-body text-navy bg-white focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-600 font-body">{error}</p>}

              <button
                type="submit"
                disabled={loading || !title.trim() || !objectiveId}
                className="w-full py-3.5 bg-brand text-white font-body font-semibold text-sm rounded-xl hover:bg-brand/90 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {loading ? 'Guardando...' : 'Agregar tarea'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

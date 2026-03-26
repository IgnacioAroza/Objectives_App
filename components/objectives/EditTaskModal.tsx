'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/lib/types'

type EditTaskModalProps = {
  task: Task
  open: boolean
  onClose: () => void
  onEdited: (updated: Task) => void
}

export default function EditTaskModal({ task, open, onClose, onEdited }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title)
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const [priority, setPriority] = useState<1 | 2 | 3>(task.priority)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: updateError } = await supabase
      .from('tasks')
      .update({
        title: title.trim(),
        due_date: dueDate || null,
        priority,
      })
      .eq('id', task.id)
      .select()
      .single()

    if (updateError) {
      console.error('[tasks] edit:', updateError.message)
      setError('No se pudo guardar los cambios. Intentá de nuevo.')
      setLoading(false)
      return
    }

    onEdited(data as Task)
    setLoading(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar tarea">
      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="block text-xs text-navy/60 font-body mb-1.5">Descripción</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-navy/20 rounded-lg text-sm font-body text-navy bg-white focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-navy/60 font-body mb-1.5">Fecha límite</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-navy/20 rounded-lg text-sm font-body text-navy bg-white focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-xs text-navy/60 font-body mb-1.5">Prioridad</label>
            <select
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value) as 1 | 2 | 3)}
              className="px-3 py-2 border border-navy/20 rounded-lg text-sm font-body text-navy bg-white focus:outline-none focus:border-brand"
            >
              <option value={1}>Alta</option>
              <option value={2}>Media</option>
              <option value={3}>Baja</option>
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-red-600 font-body">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-body text-navy/70 border border-navy/15 rounded-lg hover:bg-beige transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-4 py-2 text-sm font-body font-medium bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

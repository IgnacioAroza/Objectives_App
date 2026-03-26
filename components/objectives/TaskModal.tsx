'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { Task } from '@/lib/types'

type TaskModalProps = {
  task: Task
  open: boolean
  onClose: () => void
  onCompleted: (taskId: string) => void
}

export default function TaskModal({ task, open, onClose, onCompleted }: TaskModalProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleComplete() {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        done: true,
        done_at: new Date().toISOString(),
        note: note.trim() || null,
      })
      .eq('id', task.id)

    if (updateError) {
      console.error('[tasks] complete:', updateError.message)
      setError('No se pudo guardar la tarea. Intentá de nuevo.')
      setLoading(false)
      return
    }

    onCompleted(task.id)
    setNote('')
    setLoading(false)
    onClose()
  }

  function handleClose() {
    setNote('')
    setError(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Marcar como completada">
      <p className="text-sm text-navy/70 font-body mb-4">
        <span className="font-medium text-navy">{task.title}</span>
      </p>

      <div className="mb-4">
        <label className="block text-xs text-navy/60 font-body mb-1.5">
          ¿Querés agregar una nota sobre cómo resultó? (opcional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej: Lo terminé antes de lo esperado, aprendí que..."
          rows={3}
          className="w-full px-3 py-2 border border-navy/20 rounded-lg text-sm font-body text-navy bg-white focus:outline-none focus:border-brand resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 font-body mb-3">{error}</p>
      )}

      <div className="flex gap-2 justify-end">
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm font-body text-navy/70 border border-navy/15 rounded-lg hover:bg-beige transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleComplete}
          disabled={loading}
          className="px-4 py-2 text-sm font-body font-medium bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Guardando...' : 'Marcar como hecha'}
        </button>
      </div>
    </Modal>
  )
}

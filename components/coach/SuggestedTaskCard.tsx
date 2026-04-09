'use client'

import { useState } from 'react'
import { SuggestedTask } from '@/lib/types'

type Props = {
  task: SuggestedTask
  objectiveName: string
  onAdded: () => void
}

const priorityLabel = { 1: 'Alta', 2: 'Media', 3: 'Baja' }
const priorityColor = {
  1: 'bg-red-50 text-red-600 border-red-200',
  2: 'bg-amber-50 text-amber-600 border-amber-200',
  3: 'bg-green-50 text-green-600 border-green-200',
}

export default function SuggestedTaskCard({ task, objectiveName, onAdded }: Props) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/coach/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Error al agregar tarea')
      }
      setAdded(true)
      onAdded()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      console.error('[SuggestedTaskCard]', msg)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${added ? 'bg-green-50 border-green-200' : 'bg-white border-beige'}`}>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-body font-medium leading-snug ${added ? 'text-green-700 line-through' : 'text-navy'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[11px] text-navy/50 font-body">{objectiveName}</span>
          <span className={`text-[10px] font-body px-1.5 py-0.5 rounded-full border ${priorityColor[task.priority]}`}>
            {priorityLabel[task.priority]}
          </span>
          {task.due_date && (
            <span className="text-[11px] text-navy/40 font-body">
              {new Date(task.due_date + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
      </div>

      {added ? (
        <span className="text-green-600 shrink-0 mt-0.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
      ) : (
        <button
          onClick={handleAdd}
          disabled={loading}
          className="shrink-0 mt-0.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-body font-medium hover:bg-navy transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'Agregar'}
        </button>
      )}
    </div>
  )
}

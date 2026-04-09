'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ObjectiveFormModal from './ObjectiveFormModal'
import type { Objective } from '@/lib/types'

type Props = {
  objective: Objective
}

export default function ObjectiveActions({ objective }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!window.confirm(`¿Seguro que querés eliminar "${objective.title}"? Esta acción también elimina todas sus tareas.`)) return

    setDeleting(true)
    setError(null)
    const supabase = createClient()

    const { error: deleteError } = await supabase
      .from('objectives')
      .delete()
      .eq('id', objective.id)

    if (deleteError) {
      console.error('[ObjectiveActions] delete:', deleteError.message)
      setError('No se pudo eliminar el objetivo. Intentá de nuevo.')
      setDeleting(false)
      return
    }

    router.push('/objectives')
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-beige text-xs font-body text-navy hover:bg-beige transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
          </svg>
          Editar
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-body text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          {deleting ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 font-body mt-1">{error}</p>
      )}

      <ObjectiveFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        objective={objective}
      />
    </>
  )
}

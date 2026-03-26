'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import TaskModal from '@/components/objectives/TaskModal'
import EditTaskModal from '@/components/objectives/EditTaskModal'
import { formatDate, getPriorityLabel } from '@/lib/utils'

type TaskItemProps = {
  task: Task
  onCompleted?: (taskId: string) => void
  onEdited?: (updated: Task) => void
  onDeleted?: (taskId: string) => void
}

export default function TaskItem({ task, onCompleted, onEdited, onDeleted }: TaskItemProps) {
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const priorityVariants: Record<number, 'priority-high' | 'priority-mid' | 'priority-low'> = {
    1: 'priority-high',
    2: 'priority-mid',
    3: 'priority-low',
  }

  async function handleDelete() {
    if (!confirm('¿Seguro que querés eliminar esta tarea?')) return
    setDeleting(true)
    setError(null)

    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id)

    if (deleteError) {
      console.error('[tasks] delete:', deleteError.message)
      setError('No se pudo eliminar la tarea.')
      setDeleting(false)
      return
    }

    onDeleted?.(task.id)
  }

  return (
    <>
      <div
        className={`group flex items-start gap-3 p-3 rounded-xl border transition-colors ${
          task.done
            ? 'bg-beige/30 border-beige opacity-60'
            : 'bg-white border-navy/10 hover:border-navy/20'
        }`}
      >
        <button
          onClick={() => !task.done && setShowCompleteModal(true)}
          disabled={task.done}
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 transition-colors flex items-center justify-center ${
            task.done
              ? 'border-brand bg-brand text-white'
              : 'border-navy/30 hover:border-brand'
          }`}
          aria-label={task.done ? 'Completada' : 'Marcar como completada'}
        >
          {task.done && <span className="text-[10px]">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-body text-navy leading-snug ${
              task.done ? 'line-through text-navy/50' : ''
            }`}
          >
            {task.title}
          </p>
          {task.note && task.done && (
            <p className="text-xs text-navy/50 font-body mt-1 italic">{task.note}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={priorityVariants[task.priority]}>
              {getPriorityLabel(task.priority)}
            </Badge>
            {task.due_date && (
              <span className="text-xs text-navy/40 font-body">
                {formatDate(task.due_date)}
              </span>
            )}
            {task.done && task.done_at && (
              <span className="text-xs text-navy/40 font-body">
                Completada {formatDate(task.done_at)}
              </span>
            )}
          </div>
          {error && <p className="text-xs text-red-600 font-body mt-1">{error}</p>}
        </div>

        {/* Acciones — solo en tareas pendientes */}
        {!task.done && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1.5 text-navy/30 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
              aria-label="Editar tarea"
              title="Editar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-navy/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Eliminar tarea"
              title="Eliminar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <TaskModal
        task={task}
        open={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onCompleted={(taskId: string) => {
          setShowCompleteModal(false)
          onCompleted?.(taskId)
        }}
      />

      <EditTaskModal
        task={task}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onEdited={(updated) => {
          setShowEditModal(false)
          onEdited?.(updated)
        }}
      />
    </>
  )
}

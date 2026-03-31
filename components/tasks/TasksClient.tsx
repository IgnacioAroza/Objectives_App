'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { TaskWithObjective, Task } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import TaskModal from '@/components/objectives/TaskModal'
import EditTaskModal from '@/components/objectives/EditTaskModal'
import { formatDateShort, getPriorityLabel, getCategoryLabel } from '@/lib/utils'

type Filter = 'all' | 'negocio' | 'salud' | 'lifestyle'
type PriorityFilter = 'all' | '1' | '2' | '3'

type TasksClientProps = {
  initialPendingTasks: TaskWithObjective[]
  initialDoneTasks: TaskWithObjective[]
}

export default function TasksClient({ initialPendingTasks, initialDoneTasks }: TasksClientProps) {
  const [pendingTasks, setPendingTasks] = useState<TaskWithObjective[]>(initialPendingTasks)
  const [doneTasks, setDoneTasks] = useState<TaskWithObjective[]>(initialDoneTasks)
  const [categoryFilter, setCategoryFilter] = useState<Filter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [showDone, setShowDone] = useState(false)
  const [activeCompleteModal, setActiveCompleteModal] = useState<TaskWithObjective | null>(null)
  const [activeEditModal, setActiveEditModal] = useState<TaskWithObjective | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredPending = useMemo(() => {
    return pendingTasks.filter((t) => {
      const catOk = categoryFilter === 'all' || t.objectives?.category === categoryFilter
      const priOk = priorityFilter === 'all' || String(t.priority) === priorityFilter
      return catOk && priOk
    })
  }, [pendingTasks, categoryFilter, priorityFilter])

  const filteredDone = useMemo(() => {
    return doneTasks.filter((t) => {
      return categoryFilter === 'all' || t.objectives?.category === categoryFilter
    })
  }, [doneTasks, categoryFilter])

  function handleCompleted(taskId: string) {
    const task = pendingTasks.find((t) => t.id === taskId)
    if (!task) return
    setPendingTasks(pendingTasks.filter((t) => t.id !== taskId))
    setDoneTasks([{ ...task, done: true, done_at: new Date().toISOString() }, ...doneTasks])
    setActiveCompleteModal(null)
  }

  function handleEdited(updated: Task) {
    setPendingTasks(pendingTasks.map((t) =>
      t.id === updated.id ? { ...t, ...updated } : t
    ))
    setActiveEditModal(null)
  }

  async function handleDelete(task: TaskWithObjective) {
    if (!confirm('¿Seguro que querés eliminar esta tarea?')) return
    setDeletingId(task.id)

    const supabase = createClient()
    const { error } = await supabase.from('tasks').delete().eq('id', task.id)

    if (error) {
      console.error('[tasks] delete:', error.message)
      setDeletingId(null)
      return
    }

    setPendingTasks(pendingTasks.filter((t) => t.id !== task.id))
    setDeletingId(null)
  }

  const categoryFilters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'negocio', label: 'Negocio' },
    { value: 'salud', label: 'Salud' },
    { value: 'lifestyle', label: 'Lifestyle' },
  ]

  const priorityFilters: { value: PriorityFilter; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: '1', label: 'Alta' },
    { value: '2', label: 'Media' },
    { value: '3', label: 'Baja' },
  ]

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date(new Date().toDateString())
  }

  const isDueSoon = (dueDate: string | null) => {
    if (!dueDate) return false
    const d = new Date(dueDate)
    const now = new Date()
    const in7 = new Date()
    in7.setDate(now.getDate() + 7)
    return d >= new Date(now.toDateString()) && d <= in7
  }

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="bg-white border border-navy/10 rounded-2xl p-4 space-y-3">
        <div>
          <p className="text-xs text-navy/40 font-body uppercase tracking-wider mb-2">Categoría</p>
          <div className="flex flex-wrap gap-2">
            {categoryFilters.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setCategoryFilter(value)}
                className={`px-3 py-1.5 rounded-full text-xs font-body border transition-colors ${
                  categoryFilter === value
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-navy/70 border-navy/20 hover:border-brand hover:text-brand'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-navy/40 font-body uppercase tracking-wider mb-2">Prioridad</p>
          <div className="flex flex-wrap gap-2">
            {priorityFilters.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPriorityFilter(value)}
                className={`px-3 py-1.5 rounded-full text-xs font-body border transition-colors ${
                  priorityFilter === value
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-navy/70 border-navy/20 hover:border-navy hover:text-navy'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-navy/10 rounded-xl p-3 text-center">
          <p className="font-display font-bold text-2xl text-navy">{filteredPending.length}</p>
          <p className="text-xs text-navy/40 font-body mt-0.5">Pendientes</p>
        </div>
        <div className="bg-white border border-red-100 rounded-xl p-3 text-center">
          <p className="font-display font-bold text-2xl text-red-500">
            {filteredPending.filter((t) => isOverdue(t.due_date)).length}
          </p>
          <p className="text-xs text-navy/40 font-body mt-0.5">Vencidas</p>
        </div>
        <div className="bg-white border border-navy/10 rounded-xl p-3 text-center">
          <p className="font-display font-bold text-2xl text-sky">
            {filteredPending.filter((t) => isDueSoon(t.due_date)).length}
          </p>
          <p className="text-xs text-navy/40 font-body mt-0.5">Esta semana</p>
        </div>
      </div>

      {/* Lista de pendientes */}
      <div className="space-y-3">
        <h2 className="font-display font-semibold text-navy text-sm px-1">
          Pendientes ({filteredPending.length})
        </h2>

        {filteredPending.length === 0 ? (
          <div className="bg-white border border-navy/10 rounded-2xl px-5 py-10 text-center">
            <p className="text-sm text-navy/40 font-body">
              {pendingTasks.length === 0 ? 'No hay tareas pendientes.' : 'No hay tareas con ese filtro.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPending.map((task) => {
              const priorityColor =
                task.priority === 1
                  ? 'border-l-red-400'
                  : task.priority === 2
                    ? 'border-l-amber-400'
                    : 'border-l-sky'

              return (
                <div
                  key={task.id}
                  className={`bg-white border border-navy/10 border-l-4 ${priorityColor} rounded-2xl px-4 py-4 flex items-start gap-4`}
                >
                  {/* Botón check grande */}
                  <button
                    onClick={() => setActiveCompleteModal(task)}
                    className="flex-shrink-0 w-9 h-9 rounded-full border-2 border-navy/25 hover:border-brand hover:bg-brand/5 active:scale-95 transition-all flex items-center justify-center mt-0.5"
                    aria-label="Marcar como completada"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-navy/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body text-navy leading-snug">{task.title}</p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {task.objectives && (
                        <Link
                          href={`/objectives/${task.objective_id}`}
                          className="text-xs font-body text-navy/50 hover:text-brand transition-colors truncate max-w-[140px]"
                        >
                          {task.objectives.title}
                        </Link>
                      )}
                      <Badge
                        variant={
                          task.priority === 1 ? 'priority-high' : task.priority === 2 ? 'priority-mid' : 'priority-low'
                        }
                      >
                        {getPriorityLabel(task.priority)}
                      </Badge>
                      {task.objectives && (
                        <Badge variant={task.objectives.category}>
                          {getCategoryLabel(task.objectives.category)}
                        </Badge>
                      )}
                    </div>

                    {task.due_date && (
                      <p
                        className={`text-xs font-body mt-2 ${
                          isOverdue(task.due_date)
                            ? 'text-red-500 font-semibold'
                            : isDueSoon(task.due_date)
                              ? 'text-amber-500 font-medium'
                              : 'text-navy/40'
                        }`}
                      >
                        {isOverdue(task.due_date) ? '⚠ Vencida · ' : 'Vence '}
                        {formatDateShort(task.due_date)}
                      </p>
                    )}
                  </div>

                  {/* Acciones siempre visibles */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveEditModal(task)}
                      className="p-2 text-navy/30 hover:text-brand hover:bg-brand/10 active:bg-brand/20 rounded-xl transition-colors"
                      aria-label="Editar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(task)}
                      disabled={deletingId === task.id}
                      className="p-2 text-navy/30 hover:text-red-500 hover:bg-red-50 active:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
                      aria-label="Eliminar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Historial de completadas */}
      {filteredDone.length > 0 && (
        <div className="bg-white border border-navy/10 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowDone(!showDone)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-cream/50 transition-colors"
          >
            <h2 className="font-display font-semibold text-navy text-sm">
              Completadas ({filteredDone.length})
            </h2>
            <span className="text-navy/30 text-xs">{showDone ? '▲' : '▼'}</span>
          </button>

          {showDone && (
            <div className="divide-y divide-navy/5 border-t border-navy/5">
              {filteredDone.map((task) => (
                <div key={task.id} className="flex items-start gap-3 px-5 py-3 opacity-60">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-brand bg-brand flex items-center justify-center mt-0.5">
                    <span className="text-white text-[10px]">✓</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body text-navy line-through leading-snug">{task.title}</p>
                    {task.note && (
                      <p className="text-xs text-navy/50 font-body mt-0.5 italic">{task.note}</p>
                    )}
                    {task.objectives && (
                      <p className="text-xs font-body text-navy/40 mt-1">{task.objectives.title}</p>
                    )}
                  </div>
                  {task.done_at && (
                    <span className="text-xs text-navy/30 font-body shrink-0">
                      {formatDateShort(task.done_at)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      {activeCompleteModal && (
        <TaskModal
          task={activeCompleteModal}
          open={!!activeCompleteModal}
          onClose={() => setActiveCompleteModal(null)}
          onCompleted={handleCompleted}
        />
      )}
      {activeEditModal && (
        <EditTaskModal
          task={activeEditModal}
          open={!!activeEditModal}
          onClose={() => setActiveEditModal(null)}
          onEdited={handleEdited}
        />
      )}
    </div>
  )
}

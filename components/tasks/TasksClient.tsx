'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { TaskWithObjective } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import TaskModal from '@/components/objectives/TaskModal'
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
  const [activeModal, setActiveModal] = useState<TaskWithObjective | null>(null)

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
    setActiveModal(null)
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
      <div className="bg-white border border-navy/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-navy/5">
          <h2 className="font-display font-semibold text-navy text-sm">
            Pendientes ({filteredPending.length})
          </h2>
        </div>

        {filteredPending.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-navy/40 font-body">
              {pendingTasks.length === 0
                ? 'No hay tareas pendientes.'
                : 'No hay tareas con ese filtro.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-navy/5">
            {filteredPending.map((task) => (
              <div key={task.id} className="flex items-start gap-3 px-5 py-3 hover:bg-cream/50 transition-colors">
                <button
                  onClick={() => setActiveModal(task)}
                  className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-navy/30 hover:border-brand mt-0.5 transition-colors"
                  aria-label="Marcar como completada"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body text-navy leading-snug">{task.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {task.objectives && (
                      <Link
                        href={`/objectives/${task.objective_id}`}
                        className="text-xs font-body text-navy/50 hover:text-brand transition-colors"
                      >
                        {task.objectives.title}
                      </Link>
                    )}
                    <Badge
                      variant={
                        task.priority === 1
                          ? 'priority-high'
                          : task.priority === 2
                            ? 'priority-mid'
                            : 'priority-low'
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
                </div>

                {task.due_date && (
                  <span
                    className={`text-xs font-body shrink-0 ${
                      isOverdue(task.due_date)
                        ? 'text-red-500 font-medium'
                        : isDueSoon(task.due_date)
                          ? 'text-amber-500'
                          : 'text-navy/40'
                    }`}
                  >
                    {isOverdue(task.due_date) ? '⚠ ' : ''}
                    {formatDateShort(task.due_date)}
                  </span>
                )}
              </div>
            ))}
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
                    <div className="flex items-center gap-2 mt-1">
                      {task.objectives && (
                        <span className="text-xs font-body text-navy/40">{task.objectives.title}</span>
                      )}
                    </div>
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

      {/* Modal de completar */}
      {activeModal && (
        <TaskModal
          task={activeModal}
          open={!!activeModal}
          onClose={() => setActiveModal(null)}
          onCompleted={handleCompleted}
        />
      )}
    </div>
  )
}

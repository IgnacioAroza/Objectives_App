'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { TaskWithObjective, Task } from '@/lib/types'
import TaskModal from '@/components/objectives/TaskModal'
import EditTaskModal from '@/components/objectives/EditTaskModal'
import { formatDateShort, getPriorityLabel, getCategoryLabel } from '@/lib/utils'

type Filter = 'all' | 'negocio' | 'salud' | 'lifestyle'
type PriorityFilter = 'all' | '1' | '2' | '3'

type TasksClientProps = {
  initialPendingTasks: TaskWithObjective[]
  initialDoneTasks: TaskWithObjective[]
}

const PRIORITY_COLORS: Record<number, { text: string; bg: string }> = {
  1: { text: '#ef4444', bg: '#ef444418' },
  2: { text: '#f59e0b', bg: '#f59e0b18' },
  3: { text: '#22c55e', bg: '#22c55e18' },
}

function SectionHeader({ label, count, dotColor }: { label: string; count: number; dotColor: string }) {
  return (
    <div className="flex items-center gap-2 mb-1 pb-3 border-b-2 border-navy/5">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
      <span className="font-display font-bold text-sm text-navy">{label}</span>
      <span className="ml-auto text-xs font-semibold text-navy/40 font-body">{count}</span>
    </div>
  )
}

function TaskRow({
  task,
  onComplete,
  onEdit,
  onDelete,
  deleting,
  isOverdue,
}: {
  task: TaskWithObjective
  onComplete: () => void
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
  isOverdue: boolean
}) {
  const pc = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS[3]

  return (
    <div className="flex items-center gap-3 py-3 border-b border-navy/5 last:border-0 hover:bg-cream/40 -mx-1 px-1 rounded-lg transition-colors">
      {/* Checkbox */}
      <button
        onClick={onComplete}
        className="flex-shrink-0 w-5 h-5 rounded-[5px] border-2 border-navy/20 hover:border-brand hover:bg-brand/5 flex items-center justify-center transition-all"
        aria-label="Marcar como completada"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body text-navy leading-snug truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.objectives && (
            <Link
              href={`/objectives/${task.objective_id}`}
              className="text-[11px] text-navy/40 font-body hover:text-brand transition-colors truncate max-w-[120px]"
              onClick={(e) => e.stopPropagation()}
            >
              {task.objectives.title}
            </Link>
          )}
        </div>
      </div>

      {/* Priority badge */}
      <span
        className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
        style={{ color: pc.text, background: pc.bg }}
      >
        {getPriorityLabel(task.priority)}
      </span>

      {/* Date */}
      {task.due_date && (
        <span
          className={`text-[11px] font-semibold font-body flex-shrink-0 ${
            isOverdue ? 'text-red-500' : 'text-navy/40'
          }`}
        >
          {isOverdue ? `${Math.abs(Math.floor((Date.now() - new Date(task.due_date).getTime()) / 86400000))}d atrás` : formatDateShort(task.due_date)}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 text-navy/20 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
          aria-label="Editar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="p-1.5 text-navy/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
          aria-label="Eliminar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
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

  function isOverdue(dueDate: string | null) {
    if (!dueDate) return false
    return new Date(dueDate) < new Date(new Date().toDateString())
  }

  const overdueTasks = filteredPending.filter((t) => isOverdue(t.due_date))
  const upcomingTasks = filteredPending.filter((t) => !isOverdue(t.due_date))

  function handleCompleted(taskId: string) {
    const task = pendingTasks.find((t) => t.id === taskId)
    if (!task) return
    setPendingTasks(pendingTasks.filter((t) => t.id !== taskId))
    setDoneTasks([{ ...task, done: true, done_at: new Date().toISOString() }, ...doneTasks])
    setActiveCompleteModal(null)
  }

  function handleEdited(updated: Task) {
    setPendingTasks(pendingTasks.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
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

  const CATEGORY_FILTERS: { value: Filter; label: string }[] = [
    { value: 'all',       label: 'Todas' },
    { value: 'negocio',   label: 'Negocio' },
    { value: 'salud',     label: 'Salud' },
    { value: 'lifestyle', label: 'Lifestyle' },
  ]

  const PRIORITY_FILTERS: { value: PriorityFilter; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: '1',   label: 'Alta' },
    { value: '2',   label: 'Media' },
    { value: '3',   label: 'Baja' },
  ]

  return (
    <div className="space-y-5">

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 bg-surface border border-navy/10 rounded-xl p-1 w-fit">
          {CATEGORY_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setCategoryFilter(value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-body font-semibold transition-all ${
                categoryFilter === value
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-navy/50 hover:text-navy hover:bg-cream'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-surface border border-navy/10 rounded-xl p-1 w-fit">
          {PRIORITY_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPriorityFilter(value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-body font-semibold transition-all ${
                priorityFilter === value
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-navy/50 hover:text-navy hover:bg-cream'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Active tasks card */}
      <div className="bg-surface border border-navy/10 rounded-2xl px-5 py-5">
        {overdueTasks.length > 0 && (
          <div className="mb-6">
            <SectionHeader label="Vencidas" count={overdueTasks.length} dotColor="#ef4444" />
            <div className="mt-3">
              {overdueTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isOverdue={true}
                  onComplete={() => setActiveCompleteModal(task)}
                  onEdit={() => setActiveEditModal(task)}
                  onDelete={() => handleDelete(task)}
                  deleting={deletingId === task.id}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <SectionHeader label="Próximas" count={upcomingTasks.length} dotColor="#1E4FD8" />
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-navy/40 font-body text-center py-6">
              Todo al día — sin tareas pendientes ✓
            </p>
          ) : (
            <div className="mt-3">
              {upcomingTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isOverdue={false}
                  onComplete={() => setActiveCompleteModal(task)}
                  onEdit={() => setActiveEditModal(task)}
                  onDelete={() => handleDelete(task)}
                  deleting={deletingId === task.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Completed card */}
      {filteredDone.length > 0 && (
        <div className="bg-surface border border-navy/10 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowDone(!showDone)}
            className="w-full px-5 py-4 hover:bg-cream/50 transition-colors"
          >
            <div className="flex items-center gap-2 pb-0">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] flex-shrink-0" />
              <span className="font-display font-bold text-sm text-navy">Completadas</span>
              <span className="ml-auto text-xs font-semibold text-navy/40 font-body">{filteredDone.length}</span>
              <span className="text-navy/30 text-xs ml-1">{showDone ? '▲' : '▼'}</span>
            </div>
          </button>

          {showDone && (
            <div className="px-5 pb-4 border-t border-navy/5">
              {filteredDone.map((task) => (
                <div key={task.id} className="flex items-center gap-3 py-3 border-b border-navy/5 last:border-0 opacity-60">
                  <div className="w-5 h-5 rounded-[5px] bg-[#22c55e] flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2">
                      <path d="M2 5l2.5 2.5L8 3" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body text-navy line-through truncate">{task.title}</p>
                    {task.note && (
                      <p className="text-xs text-navy/50 font-body mt-0.5 italic">{task.note}</p>
                    )}
                    {task.objectives && (
                      <p className="text-[11px] text-navy/40 font-body mt-0.5">{task.objectives.title}</p>
                    )}
                  </div>
                  {task.done_at && (
                    <span className="text-[11px] text-navy/30 font-body flex-shrink-0">
                      {formatDateShort(task.done_at)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

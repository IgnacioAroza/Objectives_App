'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/lib/types'
import TaskItem from '@/components/objectives/TaskItem'

type TaskListClientProps = {
  objectiveId: string
  initialPendingTasks: Task[]
  initialDoneTasks: Task[]
}

export default function TaskListClient({
  objectiveId,
  initialPendingTasks,
  initialDoneTasks,
}: TaskListClientProps) {
  const [pendingTasks, setPendingTasks] = useState<Task[]>(initialPendingTasks)
  const [doneTasks, setDoneTasks] = useState<Task[]>(initialDoneTasks)
  const [showDone, setShowDone] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newPriority, setNewPriority] = useState<1 | 2 | 3>(2)
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    setError(null)

    const supabase = createClient()
    const { data: newTask, error: insertError } = await supabase
      .from('tasks')
      .insert({
        objective_id: objectiveId,
        title: newTitle.trim(),
        due_date: newDate || null,
        priority: newPriority,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[tasks] insert:', insertError.message)
      setError('No se pudo agregar la tarea. Intentá de nuevo.')
      setAdding(false)
      return
    }

    setPendingTasks([...pendingTasks, newTask as Task])
    setNewTitle('')
    setNewDate('')
    setNewPriority(2)
    setShowForm(false)
    setAdding(false)
  }

  function handleCompleted(taskId: string) {
    const task = pendingTasks.find((t) => t.id === taskId)
    if (!task) return
    const completedTask = {
      ...task,
      done: true,
      done_at: new Date().toISOString(),
    }
    setPendingTasks(pendingTasks.filter((t) => t.id !== taskId))
    setDoneTasks([completedTask, ...doneTasks])
  }

  return (
    <div className="space-y-4">
      {/* Pending tasks */}
      <div className="bg-white border border-navy/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-navy text-sm">
            Tareas pendientes ({pendingTasks.length})
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs font-body font-medium text-brand hover:underline"
          >
            {showForm ? 'Cancelar' : '+ Agregar tarea'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="mb-4 space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              placeholder="Descripción de la tarea"
              className="w-full px-3 py-2 border border-navy/20 rounded-lg text-sm font-body text-navy bg-white focus:outline-none focus:border-brand"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-navy/20 rounded-lg text-sm font-body text-navy bg-white focus:outline-none focus:border-brand"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(parseInt(e.target.value) as 1 | 2 | 3)}
                className="px-3 py-2 border border-navy/20 rounded-lg text-sm font-body text-navy bg-white focus:outline-none focus:border-brand"
              >
                <option value={1}>Alta</option>
                <option value={2}>Media</option>
                <option value={3}>Baja</option>
              </select>
              <button
                type="submit"
                disabled={adding}
                className="px-4 py-2 bg-brand text-white text-sm font-body font-medium rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors"
              >
                {adding ? '...' : 'Agregar'}
              </button>
            </div>
            {error && <p className="text-xs text-red-600 font-body">{error}</p>}
          </form>
        )}

        {pendingTasks.length === 0 ? (
          <p className="text-sm text-navy/40 font-body">Sin tareas pendientes.</p>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <TaskItem key={task.id} task={task} onCompleted={handleCompleted} />
            ))}
          </div>
        )}
      </div>

      {/* Done tasks */}
      {doneTasks.length > 0 && (
        <div className="bg-white border border-navy/10 rounded-2xl p-5">
          <button
            onClick={() => setShowDone(!showDone)}
            className="flex items-center gap-2 w-full text-left"
          >
            <h3 className="font-display font-semibold text-navy text-sm">
              Tareas completadas ({doneTasks.length})
            </h3>
            <span className="text-navy/30 text-xs ml-auto">{showDone ? '▲' : '▼'}</span>
          </button>

          {showDone && (
            <div className="mt-4 space-y-2">
              {doneTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

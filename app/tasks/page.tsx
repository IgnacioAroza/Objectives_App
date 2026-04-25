import { createClient } from '@/lib/supabase/server'
import type { TaskWithObjective } from '@/lib/types'
import TasksClient from '@/components/tasks/TasksClient'

export default async function TasksPage() {
  const supabase = createClient()

  const { data: pendingTasks, error: pendingError } = await supabase
    .from('tasks')
    .select('*, objectives(title, category)')
    .eq('done', false)
    .order('priority', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (pendingError) {
    throw new Error(`No se pudieron cargar las tareas: ${pendingError.message}`)
  }

  const { data: doneTasks, error: doneError } = await supabase
    .from('tasks')
    .select('*, objectives(title, category)')
    .eq('done', true)
    .order('done_at', { ascending: false })
    .limit(30)

  if (doneError) {
    throw new Error(`No se pudieron cargar el historial: ${doneError.message}`)
  }

  const pending = (pendingTasks ?? []) as TaskWithObjective[]
  const today = new Date(new Date().toDateString())
  const overdueCount = pending.filter(
    (t) => t.due_date && new Date(t.due_date) < today
  ).length

  return (
    <div className="space-y-5 pb-20 md:pb-0">

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] text-navy/40 font-body uppercase tracking-widest mb-1">
            Action items
          </p>
          <h1 className="font-display font-bold text-[26px] leading-none text-navy">Tareas</h1>
        </div>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
              {overdueCount} vencida{overdueCount !== 1 ? 's' : ''}
            </span>
          )}
          <span className="bg-surface border border-navy/10 text-navy/50 text-xs font-semibold px-2.5 py-1 rounded-lg font-body">
            {pending.length - overdueCount} próximas
          </span>
        </div>
      </div>

      <TasksClient
        initialPendingTasks={pending}
        initialDoneTasks={(doneTasks ?? []) as TaskWithObjective[]}
      />
    </div>
  )
}

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

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <p className="text-xs text-navy/40 font-body uppercase tracking-wider mb-1">Global</p>
        <h1 className="font-display font-bold text-2xl text-navy">Todas las tareas</h1>
      </div>

      <TasksClient
        initialPendingTasks={(pendingTasks ?? []) as TaskWithObjective[]}
        initialDoneTasks={(doneTasks ?? []) as TaskWithObjective[]}
      />
    </div>
  )
}

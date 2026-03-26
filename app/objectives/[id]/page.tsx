import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Objective, Task, ValueLog, Config } from '@/lib/types'
import QuantitativeProgress from '@/components/objectives/QuantitativeProgress'
import QualitativeSlider from '@/components/objectives/QualitativeSlider'
import StreakWidget from '@/components/objectives/StreakWidget'
import TaskListClient from '@/components/objectives/TaskListClient'
import Link from 'next/link'
import { getCategoryLabel } from '@/lib/utils'

export default async function ObjectiveDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const [
    { data: objective, error: objError },
    { data: pendingTasks, error: taskError },
    { data: doneTasks },
    { data: valueLogs },
    { data: configData },
  ] = await Promise.all([
    supabase.from('objectives').select('*').eq('id', params.id).single(),
    supabase
      .from('tasks')
      .select('*')
      .eq('objective_id', params.id)
      .eq('done', false)
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
    supabase
      .from('tasks')
      .select('*')
      .eq('objective_id', params.id)
      .eq('done', true)
      .order('done_at', { ascending: false }),
    supabase
      .from('value_logs')
      .select('*')
      .eq('objective_id', params.id)
      .order('logged_at', { ascending: false }),
    supabase.from('config').select('*'),
  ])

  if (objError || !objective) {
    notFound()
  }

  if (taskError) {
    throw new Error(`No se pudieron cargar las tareas: ${taskError.message}`)
  }

  const obj = objective as Objective
  const configs = (configData ?? []) as Config[]
  const quitDate = configs.find((c) => c.key === 'quit_smoking_date')?.value ?? null

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <Link
          href={`/objectives?category=${obj.category}`}
          className="inline-flex items-center gap-1.5 text-xs text-navy/40 font-body hover:text-navy mb-3"
        >
          ← {getCategoryLabel(obj.category)}
        </Link>
        <h1 className="font-display font-bold text-xl text-navy">{obj.title}</h1>
        {obj.unit && (
          <p className="text-sm text-navy/50 font-body mt-1">Unidad: {obj.unit}</p>
        )}
      </div>

      {/* Progress widget */}
      {obj.type === 'quantitative' && (
        <QuantitativeProgress
          objective={obj}
          valueLogs={(valueLogs ?? []) as ValueLog[]}
        />
      )}
      {obj.type === 'qualitative' && (
        <QualitativeSlider objective={obj} />
      )}
      {obj.type === 'streak' && (
        <StreakWidget quitDate={quitDate} />
      )}

      {/* Tasks */}
      <TaskListClient
        objectiveId={obj.id}
        initialPendingTasks={(pendingTasks ?? []) as Task[]}
        initialDoneTasks={(doneTasks ?? []) as Task[]}
      />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import type { Objective } from '@/lib/types'
import ReflectionForm from '@/components/reflections/ReflectionForm'
import { getTodayString } from '@/lib/utils'

export default async function NewReflectionPage() {
  const supabase = createClient()
  const today = getTodayString()

  const [
    { data: objectives, error: objError },
    { data: todayReflection },
  ] = await Promise.all([
    supabase.from('objectives').select('*').order('sort_order'),
    supabase
      .from('reflections')
      .select('*, reflection_objectives(objective_id)')
      .eq('date', today)
      .single(),
  ])

  if (objError) {
    throw new Error(`No se pudieron cargar los objetivos: ${objError.message}`)
  }

  const allObjectives = (objectives ?? []) as Objective[]
  const existingSelectedIds =
    todayReflection?.reflection_objectives?.map(
      (ro: { objective_id: string }) => ro.objective_id
    ) ?? []

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy">
          {todayReflection ? 'Editar reflexión de hoy' : 'Reflexión de hoy'}
        </h1>
        <p className="text-sm text-navy/50 font-body mt-1">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <ReflectionForm
        objectives={allObjectives}
        today={today}
        initialData={
          todayReflection
            ? {
                id: todayReflection.id,
                what_i_did: todayReflection.what_i_did ?? '',
                how_i_felt: todayReflection.how_i_felt ?? '',
                what_i_learned: todayReflection.what_i_learned ?? '',
                free_notes: todayReflection.free_notes ?? '',
                selectedObjectiveIds: existingSelectedIds,
              }
            : null
        }
      />
    </div>
  )
}

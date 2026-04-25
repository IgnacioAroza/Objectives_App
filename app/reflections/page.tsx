import { createClient } from '@/lib/supabase/server'
import type { ReflectionWithObjectives, Objective } from '@/lib/types'
import ReflectionsList from '@/components/reflections/ReflectionsList'
import Link from 'next/link'
import { getTodayString } from '@/lib/utils'

export default async function ReflectionsPage() {
  const supabase = createClient()
  const today = getTodayString()

  const [
    { data: reflections, error },
    { data: objectives },
  ] = await Promise.all([
    supabase
      .from('reflections')
      .select('*, reflection_objectives(objective_id, objectives(title, category))')
      .order('date', { ascending: false }),
    supabase
      .from('objectives')
      .select('id, title, category')
      .order('sort_order'),
  ])

  if (error) {
    throw new Error(`No se pudieron cargar las reflexiones: ${error.message}`)
  }

  const allReflections = (reflections ?? []) as ReflectionWithObjectives[]
  const allObjectives = (objectives ?? []) as Pick<Objective, 'id' | 'title' | 'category'>[]

  return (
    <div className="space-y-6 pb-20 md:pb-0">

      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] text-navy/40 font-body uppercase tracking-widest mb-1">
            Práctica diaria
          </p>
          <h1 className="font-display font-bold text-[26px] leading-none text-navy">
            Reflexiones
          </h1>
        </div>
        <Link
          href="/reflections/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-display font-bold hover:bg-brand/90 transition-all hover:-translate-y-px shadow-sm hover:shadow-md flex-shrink-0"
          style={{ boxShadow: '0 4px 14px rgba(30,79,216,0.3)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2">
            <path d="M6 1v10M1 6h10" />
          </svg>
          Nueva reflexión
        </Link>
      </div>

      <ReflectionsList
        reflections={allReflections}
        objectives={allObjectives}
        today={today}
      />
    </div>
  )
}

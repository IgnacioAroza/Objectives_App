import type React from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Objective, Config } from '@/lib/types'
import ObjectiveCard from '@/components/objectives/ObjectiveCard'
import CategoryIcon from '@/components/ui/CategoryIcon'
import { calcStreakDays } from '@/lib/utils'

type SearchParams = {
  category?: string
}

export default async function ObjectivesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createClient()

  const [
    { data: objectives, error },
    { data: configData },
  ] = await Promise.all([
    supabase.from('objectives').select('*').order('sort_order'),
    supabase.from('config').select('*'),
  ])

  if (error) {
    throw new Error(`No se pudieron cargar los objetivos: ${error.message}`)
  }

  const allObjectives = (objectives ?? []) as Objective[]
  const configs = (configData ?? []) as Config[]
  const quitDate = configs.find((c) => c.key === 'quit_smoking_date')?.value ?? null
  const streakDays = quitDate ? calcStreakDays(quitDate) : undefined

  const categoryFilter = searchParams.category as 'negocio' | 'salud' | 'lifestyle' | undefined

  const filtered = categoryFilter
    ? allObjectives.filter((o) => o.category === categoryFilter)
    : allObjectives

  const grouped = {
    negocio: filtered.filter((o) => o.category === 'negocio'),
    salud: filtered.filter((o) => o.category === 'salud'),
    lifestyle: filtered.filter((o) => o.category === 'lifestyle'),
  }

  const categoryMeta: Record<string, { label: string; icon: React.ReactNode }> = {
    negocio: { label: 'Negocio', icon: <CategoryIcon category="negocio" className="w-5 h-5 text-brand" /> },
    salud: { label: 'Salud', icon: <CategoryIcon category="salud" className="w-5 h-5 text-sky" /> },
    lifestyle: { label: 'Estilo de vida', icon: <CategoryIcon category="lifestyle" className="w-5 h-5 text-navy" /> },
  }

  const title = categoryFilter
    ? categoryMeta[categoryFilter]?.label ?? 'Objetivos'
    : 'Todos los objetivos'

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div>
        <p className="text-xs text-navy/40 font-body uppercase tracking-wider mb-1">2026</p>
        <h1 className="font-display font-bold text-2xl text-navy">{title}</h1>
      </div>

      {Object.entries(grouped).map(([cat, objs]) => {
        if (objs.length === 0) return null
        const meta = categoryMeta[cat]
        return (
          <section key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center">{meta.icon}</span>
              <h2 className="font-display font-semibold text-navy text-base">{meta.label}</h2>
              <span className="text-xs text-navy/40 font-body">({objs.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {objs.map((obj) => (
                <ObjectiveCard
                  key={obj.id}
                  objective={obj}
                  streakDays={obj.type === 'streak' ? streakDays : undefined}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

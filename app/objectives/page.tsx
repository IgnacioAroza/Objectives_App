import type React from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Objective, Config } from '@/lib/types'
import ObjectiveCard from '@/components/objectives/ObjectiveCard'
import { calcStreakDays } from '@/lib/utils'
import CreateObjectiveButton from '@/components/objectives/CreateObjectiveButton'
import Link from 'next/link'

type SearchParams = {
  category?: string
}

const FILTERS = [
  { value: undefined,   label: 'Todas' },
  { value: 'negocio',   label: 'Negocio' },
  { value: 'salud',     label: 'Salud' },
  { value: 'lifestyle', label: 'Estilo de vida' },
]

const CAT_DOT: Record<string, string> = {
  negocio:   'bg-brand',
  salud:     'bg-sky',
  lifestyle: 'bg-navy',
}

const CAT_LABEL: Record<string, string> = {
  negocio:   'Negocio',
  salud:     'Salud',
  lifestyle: 'Estilo de vida',
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
    negocio:   filtered.filter((o) => o.category === 'negocio'),
    salud:     filtered.filter((o) => o.category === 'salud'),
    lifestyle: filtered.filter((o) => o.category === 'lifestyle'),
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] text-navy/40 font-body uppercase tracking-widest mb-1">
            2026 Objetivos
          </p>
          <h1 className="font-display font-bold text-[26px] leading-none text-navy">
            {categoryFilter ? CAT_LABEL[categoryFilter] ?? 'Objetivos' : 'Todos los objetivos'}
          </h1>
        </div>
        <CreateObjectiveButton />
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-1.5 bg-surface border border-navy/10 rounded-xl p-1 w-fit">
        {FILTERS.map(({ value, label }) => {
          const isActive = (value === undefined && !categoryFilter) || value === categoryFilter
          return (
            <Link
              key={label}
              href={value ? `/objectives?category=${value}` : '/objectives'}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-body font-semibold transition-all ${
                isActive
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-navy/50 hover:text-navy hover:bg-cream'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Category sections */}
      <div className="space-y-8">
        {(Object.keys(grouped) as Array<keyof typeof grouped>).map((cat) => {
          const objs = grouped[cat]
          if (objs.length === 0) return null
          return (
            <section key={cat}>
              {/* Section header */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full ${CAT_DOT[cat]} flex-shrink-0`} />
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-navy/50 font-body">
                  {CAT_LABEL[cat]}
                </span>
                <span className="ml-auto text-[11px] text-navy/40 font-body">
                  {objs.length} objetivo{objs.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Cards grid */}
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
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
    </div>
  )
}

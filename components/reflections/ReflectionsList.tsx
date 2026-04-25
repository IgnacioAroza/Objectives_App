'use client'

import { useState } from 'react'
import type { ReflectionWithObjectives, Objective } from '@/lib/types'
import ReflectionCard from '@/components/reflections/ReflectionCard'

type Props = {
  reflections: ReflectionWithObjectives[]
  objectives: Pick<Objective, 'id' | 'title'>[]
  today: string
}

export default function ReflectionsList({ reflections, objectives, today }: Props) {
  const [filterGoal, setFilterGoal] = useState('all')

  const filtered = filterGoal === 'all'
    ? reflections
    : reflections.filter((r) =>
        r.reflection_objectives.some((ro) => ro.objective_id === filterGoal)
      )

  return (
    <div className="space-y-5">

      {/* Filter row */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-navy/50 font-body">
          {filtered.length} {filtered.length === 1 ? 'entrada' : 'entradas'}
        </span>
        <select
          value={filterGoal}
          onChange={(e) => setFilterGoal(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-navy/15 bg-surface text-navy text-xs font-body outline-none cursor-pointer hover:border-brand transition-colors"
        >
          <option value="all">Todos los objetivos</option>
          {objectives.map((o) => (
            <option key={o.id} value={o.id}>{o.title}</option>
          ))}
        </select>
      </div>

      {/* Entry list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-navy/40 font-body text-sm">Sin entradas para este filtro.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r) => (
            <ReflectionCard
              key={r.id}
              reflection={r}
              isToday={r.date === today}
            />
          ))}
        </div>
      )}
    </div>
  )
}

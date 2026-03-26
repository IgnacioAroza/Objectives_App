import { createClient } from '@/lib/supabase/server'
import type { ReflectionWithObjectives, Objective } from '@/lib/types'
import ReflectionCard from '@/components/reflections/ReflectionCard'
import Link from 'next/link'

type SearchParams = {
  objective?: string
}

export default async function ReflectionsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createClient()

  const [
    { data: reflections, error },
    { data: objectives },
  ] = await Promise.all([
    supabase
      .from('reflections')
      .select('*, reflection_objectives(objective_id, objectives(title, category))')
      .order('date', { ascending: false }),
    supabase.from('objectives').select('id, title, category').order('sort_order'),
  ])

  if (error) {
    throw new Error(`No se pudieron cargar las reflexiones: ${error.message}`)
  }

  const allReflections = (reflections ?? []) as ReflectionWithObjectives[]
  const allObjectives = (objectives ?? []) as Pick<Objective, 'id' | 'title' | 'category'>[]

  const filtered = searchParams.objective
    ? allReflections.filter((r) =>
        r.reflection_objectives.some((ro) => ro.objective_id === searchParams.objective)
      )
    : allReflections

  const selectedObj = searchParams.objective
    ? allObjectives.find((o) => o.id === searchParams.objective)
    : null

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-navy/40 font-body uppercase tracking-wider mb-1">Tu diario</p>
          <h1 className="font-display font-bold text-2xl text-navy">Reflexiones</h1>
          {selectedObj && (
            <p className="text-sm text-navy/60 font-body mt-1">
              Filtrando por: <span className="font-medium">{selectedObj.title}</span>
              <Link href="/reflections" className="ml-2 text-brand hover:underline">× Limpiar</Link>
            </p>
          )}
        </div>
        <Link
          href="/reflections/new"
          className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-body font-medium hover:bg-brand/90 transition-colors"
        >
          + Nueva
        </Link>
      </div>

      {/* Filter by objective */}
      <div>
        <p className="text-xs text-navy/50 font-body mb-2">Filtrar por objetivo</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/reflections"
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition-colors ${
              !searchParams.objective
                ? 'bg-brand text-white border-brand'
                : 'bg-white text-navy/70 border-navy/20 hover:border-brand'
            }`}
          >
            Todos
          </Link>
          {allObjectives.map((obj) => (
            <Link
              key={obj.id}
              href={`/reflections?objective=${obj.id}`}
              className={`px-3 py-1.5 rounded-full text-xs font-body border transition-colors ${
                searchParams.objective === obj.id
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-navy/70 border-navy/20 hover:border-brand'
              }`}
            >
              {obj.title}
            </Link>
          ))}
        </div>
      </div>

      {/* Reflections list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-navy/40 font-body mb-3">Todavía no hay reflexiones.</p>
          <Link
            href="/reflections/new"
            className="inline-block bg-brand text-white px-4 py-2 rounded-xl text-sm font-body font-medium hover:bg-brand/90"
          >
            Escribir la primera
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((reflection) => (
            <ReflectionCard key={reflection.id} reflection={reflection} />
          ))}
        </div>
      )}
    </div>
  )
}

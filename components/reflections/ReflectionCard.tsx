'use client'

import { useState } from 'react'
import type { ReflectionWithObjectives } from '@/lib/types'

type ReflectionCardProps = {
  reflection: ReflectionWithObjectives
  isToday?: boolean
}

const CAT_COLORS: Record<string, { color: string; bg: string }> = {
  negocio:   { color: '#1E4FD8', bg: '#EEF2FF' },
  salud:     { color: '#4DA3FF', bg: '#EBF5FF' },
  lifestyle: { color: '#141B63', bg: '#EEEFFE' },
}

const FIELDS = [
  { key: 'what_i_did',     label: '¿Qué hice hoy?' },
  { key: 'how_i_felt',     label: '¿Cómo me sentí?' },
  { key: 'what_i_learned', label: '¿Qué aprendí o me llevé de hoy?' },
  { key: 'free_notes',     label: 'Espacio libre' },
]

function spanishDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

export default function ReflectionCard({ reflection, isToday = false }: ReflectionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const objectives = reflection.reflection_objectives
    .map((ro) => ro.objectives)
    .filter(Boolean)

  return (
    <div
      className={`bg-surface rounded-2xl overflow-hidden transition-shadow hover:shadow-sm border ${
        isToday ? 'border-brand' : 'border-navy/10'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 hover:bg-cream/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Date + badges row */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-display font-bold text-sm text-navy capitalize">
                {spanishDate(reflection.date)}
              </span>
              {isToday && (
                <span className="text-[10px] bg-brand text-white font-bold px-1.5 py-0.5 rounded">
                  Hoy
                </span>
              )}
              {objectives.slice(0, 2).map((obj, i) =>
                obj ? (
                  <span
                    key={i}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                    style={{
                      color: CAT_COLORS[obj.category]?.color ?? '#141B63',
                      background: CAT_COLORS[obj.category]?.bg ?? '#ECEDF8',
                      borderColor: (CAT_COLORS[obj.category]?.color ?? '#141B63') + '33',
                    }}
                  >
                    {obj.title.split(' ').slice(0, 3).join(' ')}
                  </span>
                ) : null
              )}
            </div>
            {/* Preview text */}
            <p
              className="text-xs text-navy/50 font-body leading-snug"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: expanded ? 99 : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {reflection.what_i_did ?? 'Sin registro de actividad.'}
            </p>
          </div>
          <span className="text-navy/30 text-xs flex-shrink-0 mt-0.5">
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-navy/5">
          {FIELDS.map((f) => {
            const value = reflection[f.key as keyof typeof reflection] as string | null
            if (!value) return null
            return (
              <div key={f.key} className="px-5 py-4 border-b border-navy/5 last:border-0">
                <p className="text-[10px] font-bold text-brand uppercase tracking-[0.07em] mb-1.5">
                  {f.label}
                </p>
                <p className="text-sm text-navy font-body leading-relaxed whitespace-pre-wrap">
                  {value}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

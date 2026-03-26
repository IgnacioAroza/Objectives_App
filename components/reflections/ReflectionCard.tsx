'use client'

import { useState } from 'react'
import type { ReflectionWithObjectives } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

type ReflectionCardProps = {
  reflection: ReflectionWithObjectives
}

export default function ReflectionCard({ reflection }: ReflectionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const objectives = reflection.reflection_objectives
    .map((ro) => ro.objectives)
    .filter(Boolean)

  return (
    <div className="bg-white border border-navy/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 hover:bg-cream/50 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-navy/50 font-body uppercase tracking-wider">
            {formatDate(reflection.date)}
          </span>
          <span className="text-navy/30 text-sm">{expanded ? '▲' : '▼'}</span>
        </div>

        <p className="text-sm text-navy font-body leading-snug line-clamp-2">
          {reflection.what_i_did ?? 'Sin registro de actividad.'}
        </p>

        {objectives.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {objectives.map((obj, i) =>
              obj ? (
                <Badge key={i} variant={obj.category}>{obj.title}</Badge>
              ) : null
            )}
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-navy/5 pt-4 space-y-4">
          {reflection.what_i_did && (
            <div>
              <p className="text-xs font-medium text-navy/50 font-body mb-1">¿Qué hice?</p>
              <p className="text-sm text-navy font-body leading-relaxed whitespace-pre-wrap">
                {reflection.what_i_did}
              </p>
            </div>
          )}
          {reflection.how_i_felt && (
            <div>
              <p className="text-xs font-medium text-navy/50 font-body mb-1">¿Cómo me sentí?</p>
              <p className="text-sm text-navy font-body leading-relaxed whitespace-pre-wrap">
                {reflection.how_i_felt}
              </p>
            </div>
          )}
          {reflection.what_i_learned && (
            <div>
              <p className="text-xs font-medium text-navy/50 font-body mb-1">¿Qué aprendí?</p>
              <p className="text-sm text-navy font-body leading-relaxed whitespace-pre-wrap">
                {reflection.what_i_learned}
              </p>
            </div>
          )}
          {reflection.free_notes && (
            <div>
              <p className="text-xs font-medium text-navy/50 font-body mb-1">Notas libres</p>
              <p className="text-sm text-navy font-body leading-relaxed whitespace-pre-wrap">
                {reflection.free_notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

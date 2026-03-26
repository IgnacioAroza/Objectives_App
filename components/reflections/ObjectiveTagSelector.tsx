'use client'

import type { Objective } from '@/lib/types'

type ObjectiveTagSelectorProps = {
  objectives: Objective[]
  selected: string[]
  onChange: (ids: string[]) => void
}

export default function ObjectiveTagSelector({ objectives, selected, onChange }: ObjectiveTagSelectorProps) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const grouped = {
    negocio: objectives.filter((o) => o.category === 'negocio'),
    salud: objectives.filter((o) => o.category === 'salud'),
    lifestyle: objectives.filter((o) => o.category === 'lifestyle'),
  }

  const categoryLabels = {
    negocio: 'Negocio',
    salud: 'Salud',
    lifestyle: 'Estilo de vida',
  }

  return (
    <div className="space-y-3">
      {(Object.keys(grouped) as Array<keyof typeof grouped>).map((cat) => (
        <div key={cat}>
          <p className="text-xs font-medium text-navy/50 font-body mb-2 uppercase tracking-wider">
            {categoryLabels[cat]}
          </p>
          <div className="flex flex-wrap gap-2">
            {grouped[cat].map((obj) => {
              const isSelected = selected.includes(obj.id)
              return (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => toggle(obj.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-body border transition-colors ${
                    isSelected
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white text-navy/70 border-navy/20 hover:border-brand hover:text-brand'
                  }`}
                >
                  {obj.title}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

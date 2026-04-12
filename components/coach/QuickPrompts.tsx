'use client'

type Props = {
  onSelect: (prompt: string) => void
  disabled: boolean
}

const prompts = [
  { label: '¿Cómo voy?', text: '¿Cómo estoy yendo con mis objetivos de 2026? Dame un análisis honesto del progreso actual.' },
  { label: 'Planificá mi semana', text: 'Planificá mi semana. Teniendo en cuenta mis objetivos y tareas pendientes, sugerí qué hacer cada día.' },
  { label: '3 tareas para hoy', text: 'Dame 3 tareas concretas y accionables para hacer hoy, priorizando lo que más impacto tiene en mis objetivos.' },
  { label: '¿En qué enfocarme?', text: '¿En qué objetivo debería enfocarme más este mes? ¿Por qué?' },
  { label: 'Revisá mis reflexiones', text: 'Revisá mis reflexiones recientes y decime qué patrones ves, qué estoy descuidando y qué estoy haciendo bien.' },
]

export default function QuickPrompts({ onSelect, disabled }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {prompts.map((p) => (
        <button
          key={p.label}
          onClick={() => onSelect(p.text)}
          disabled={disabled}
          className="shrink-0 px-3 py-1.5 rounded-full border border-beige bg-surface text-xs font-body text-navy hover:bg-brand hover:text-white hover:border-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

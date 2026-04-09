'use client'

export default function CoachError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      <p className="text-navy font-body font-medium mb-2">Error al cargar el coach</p>
      <p className="text-navy/50 font-body text-sm mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-body hover:bg-navy transition-colors"
      >
        Reintentar
      </button>
    </div>
  )
}

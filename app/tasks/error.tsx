'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
      <p className="font-display font-semibold text-navy text-lg">Algo salió mal</p>
      <p className="text-sm text-navy/60 font-body">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-brand text-white text-sm font-body font-medium rounded-lg hover:bg-brand/90 transition-colors"
      >
        Reintentar
      </button>
    </div>
  )
}

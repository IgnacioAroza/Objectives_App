export function calcQuantitativeProgress(
  current: number,
  initial: number,
  target: number
): number {
  if (target === initial) return 0
  return Math.min(100, Math.max(0, Math.round(((current - initial) / (target - initial)) * 100)))
}

export function calcStreakDays(quitDate: string): number {
  return Math.floor((Date.now() - new Date(quitDate).getTime()) / 86400000)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  })
}

export function getDaysLeftIn2026(): number {
  const end = new Date('2026-12-31T23:59:59')
  return Math.max(0, Math.floor((end.getTime() - Date.now()) / 86400000))
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function getPriorityLabel(priority: 1 | 2 | 3): string {
  switch (priority) {
    case 1:
      return 'Alta'
    case 2:
      return 'Media'
    case 3:
      return 'Baja'
  }
}

export function getPriorityColor(priority: 1 | 2 | 3): string {
  switch (priority) {
    case 1:
      return 'text-red-600 bg-red-50'
    case 2:
      return 'text-yellow-600 bg-yellow-50'
    case 3:
      return 'text-green-600 bg-green-50'
  }
}

export function getCategoryLabel(category: 'negocio' | 'salud' | 'lifestyle'): string {
  switch (category) {
    case 'negocio':
      return 'Negocio'
    case 'salud':
      return 'Salud'
    case 'lifestyle':
      return 'Estilo de vida'
  }
}

export function getCategoryColor(category: 'negocio' | 'salud' | 'lifestyle'): string {
  switch (category) {
    case 'negocio':
      return 'text-brand bg-brand/10'
    case 'salud':
      return 'text-sky bg-sky/10'
    case 'lifestyle':
      return 'text-navy bg-navy/10'
  }
}

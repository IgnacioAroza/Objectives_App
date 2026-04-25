import Link from 'next/link'
import type { Objective } from '@/lib/types'
import { calcQuantitativeProgress, getCategoryLabel } from '@/lib/utils'

type ObjectiveCardProps = {
  objective: Objective
  streakDays?: number
}

function getProgressValue(objective: Objective, streakDays?: number): number {
  if (objective.type === 'quantitative') {
    if (
      objective.current_value !== null &&
      objective.initial_value !== null &&
      objective.target_value !== null
    ) {
      return calcQuantitativeProgress(
        objective.current_value,
        objective.initial_value,
        objective.target_value
      )
    }
    return 0
  }
  if (objective.type === 'streak') {
    return streakDays !== undefined ? Math.min(100, Math.round((streakDays / 365) * 100)) : 0
  }
  return objective.progress_manual
}

function getProgressLabel(objective: Objective, streakDays?: number): string {
  if (objective.type === 'quantitative') {
    if (objective.current_value !== null && objective.unit) {
      return `${objective.current_value} ${objective.unit}`
    }
    if (objective.current_value !== null) return String(objective.current_value)
    return '—'
  }
  if (objective.type === 'streak') return `${streakDays ?? 0} días`
  return `${objective.progress_manual}%`
}

const CAT_COLORS: Record<string, { ring: string; badge: string; badgeBg: string }> = {
  negocio:   { ring: '#1E4FD8', badge: '#1E4FD8', badgeBg: '#EEF2FF' },
  salud:     { ring: '#4DA3FF', badge: '#4DA3FF', badgeBg: '#EBF5FF' },
  lifestyle: { ring: '#141B63', badge: '#141B63', badgeBg: '#EEEFFE' },
}

const RADIUS = 15.9155
const CIRCUMFERENCE = 100

function ProgressRing({ value, color }: { value: number; color: string }) {
  const filled = Math.min(100, Math.max(0, value))
  const empty = CIRCUMFERENCE - filled
  return (
    <svg width="72" height="72" viewBox="0 0 36 36" className="-rotate-90">
      <circle cx="18" cy="18" r={RADIUS} fill="none" stroke="rgb(var(--color-surface-muted))" strokeWidth="2.8" />
      <circle
        cx="18" cy="18" r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${empty}`}
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  )
}

export default function ObjectiveCard({ objective, streakDays }: ObjectiveCardProps) {
  const progress = getProgressValue(objective, streakDays)
  const label = getProgressLabel(objective, streakDays)
  const cat = CAT_COLORS[objective.category] ?? CAT_COLORS.negocio

  return (
    <Link href={`/objectives/${objective.id}`}>
      <div className="bg-surface border border-navy/10 rounded-[14px] p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
        {/* Top: category badge */}
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded"
            style={{ color: cat.badge, background: cat.badgeBg }}
          >
            {getCategoryLabel(objective.category)}
          </span>
          <span className="text-[11px] font-semibold" style={{ color: cat.ring }}>
            {progress}%
          </span>
        </div>

        {/* Progress ring centered */}
        <div className="flex justify-center mb-3">
          <div className="relative w-[72px] h-[72px] flex items-center justify-center">
            <ProgressRing value={progress} color={cat.ring} />
            <span
              className="absolute font-display font-bold text-[13px] leading-none"
              style={{ color: cat.ring }}
            >
              {progress}%
            </span>
          </div>
        </div>

        {/* Title centered */}
        <h3 className="font-display font-bold text-sm text-navy text-center mb-2 leading-snug group-hover:text-brand transition-colors">
          {objective.title}
        </h3>

        {/* Value below */}
        <div className="bg-cream rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-navy/50 font-body">{label}</p>
        </div>
      </div>
    </Link>
  )
}

import Link from 'next/link'
import type { Objective } from '@/lib/types'
import Badge from '@/components/ui/Badge'
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

const typeLabel: Record<string, string> = {
  quantitative: 'Cuantitativo',
  qualitative: 'Cualitativo',
  streak: 'Racha',
}

// Radio 15.9155 → circunferencia = 2πr ≈ 100 → dasharray usa % directamente
const RADIUS = 15.9155
const CIRCUMFERENCE = 100

function ProgressRing({ value }: { value: number }) {
  const filled = Math.min(100, Math.max(0, value))
  const empty = CIRCUMFERENCE - filled
  const ringColor = filled >= 75 ? '#1E4FD8' : filled >= 30 ? '#4DA3FF' : '#CBD5E1'

  return (
    <svg width="48" height="48" viewBox="0 0 36 36" className="-rotate-90">
      {/* Track */}
      <circle
        cx="18" cy="18" r={RADIUS}
        fill="none"
        stroke="#E8E0D5"
        strokeWidth="3"
      />
      {/* Progress */}
      <circle
        cx="18" cy="18" r={RADIUS}
        fill="none"
        stroke={ringColor}
        strokeWidth="3"
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

  return (
    <Link href={`/objectives/${objective.id}`}>
      <div className="bg-white border border-navy/10 rounded-[14px] p-5 hover:shadow-md hover:border-navy/20 transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <Badge variant={objective.category}>
            {getCategoryLabel(objective.category)}
          </Badge>

          {/* Ring con % en el centro */}
          <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center">
            <ProgressRing value={progress} />
            <span className="absolute font-display font-bold text-[11px] text-navy leading-none">
              {progress}%
            </span>
          </div>
        </div>

        <h3 className="font-display font-semibold text-navy text-sm mb-3 group-hover:text-brand transition-colors leading-snug">
          {objective.title}
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-xs text-navy/40 font-body">{typeLabel[objective.type] ?? objective.type}</span>
          <span className="text-xs font-medium text-navy/60 font-body">{label}</span>
        </div>
      </div>
    </Link>
  )
}

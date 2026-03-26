import Link from 'next/link'
import type { Objective } from '@/lib/types'
import ProgressBar from '@/components/ui/ProgressBar'
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
    if (objective.current_value !== null) {
      return String(objective.current_value)
    }
    return '—'
  }
  if (objective.type === 'streak') {
    return `${streakDays ?? 0} días`
  }
  return `${objective.progress_manual}%`
}

export default function ObjectiveCard({ objective, streakDays }: ObjectiveCardProps) {
  const progress = getProgressValue(objective, streakDays)
  const label = getProgressLabel(objective, streakDays)

  const categoryVariants: Record<string, 'negocio' | 'salud' | 'lifestyle'> = {
    negocio: 'negocio',
    salud: 'salud',
    lifestyle: 'lifestyle',
  }

  return (
    <Link href={`/objectives/${objective.id}`}>
      <div className="bg-white border border-navy/10 rounded-[14px] p-5 hover:shadow-md hover:border-navy/20 transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <Badge variant={categoryVariants[objective.category]}>
            {getCategoryLabel(objective.category)}
          </Badge>
          <span className="text-xs text-navy/40 font-body">{label}</span>
        </div>

        <h3 className="font-display font-semibold text-navy text-sm mb-3 group-hover:text-brand transition-colors leading-snug">
          {objective.title}
        </h3>

        <ProgressBar value={progress} />

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-navy/40 font-body capitalize">{objective.type}</span>
          <span className="text-xs font-medium text-navy/60 font-body">{progress}%</span>
        </div>
      </div>
    </Link>
  )
}

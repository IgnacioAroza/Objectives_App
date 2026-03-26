type ProgressBarProps = {
  value: number // 0-100
  className?: string
  showLabel?: boolean
  color?: 'brand' | 'sky' | 'navy'
}

const colorClasses = {
  brand: 'bg-brand',
  sky: 'bg-sky',
  navy: 'bg-navy',
}

export default function ProgressBar({
  value,
  className = '',
  showLabel = false,
  color = 'brand',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-navy/50 font-body">{clamped}%</span>
        </div>
      )}
      <div className="h-1.5 bg-beige rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-300`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

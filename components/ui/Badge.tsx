type BadgeVariant = 'negocio' | 'salud' | 'lifestyle' | 'default' | 'priority-high' | 'priority-mid' | 'priority-low'

type BadgeProps = {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  negocio: 'text-brand bg-brand/10',
  salud: 'text-sky bg-sky/10',
  lifestyle: 'text-navy bg-navy/10',
  default: 'text-navy/60 bg-navy/5',
  'priority-high': 'text-red-600 bg-red-50',
  'priority-mid': 'text-yellow-600 bg-yellow-50',
  'priority-low': 'text-green-600 bg-green-50',
}

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-body ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

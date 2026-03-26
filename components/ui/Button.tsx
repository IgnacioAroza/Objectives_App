import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
  onClick?: () => void
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand/90 border-transparent',
  secondary: 'bg-white text-navy border-navy/15 hover:bg-beige',
  ghost: 'bg-transparent text-navy/70 border-transparent hover:bg-beige',
  danger: 'bg-red-600 text-white hover:bg-red-700 border-transparent',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-sm rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  type = 'button',
  className = '',
  onClick,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 font-medium font-body border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}

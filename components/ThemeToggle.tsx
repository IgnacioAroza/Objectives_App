'use client'

import { useState, useEffect } from 'react'
import { getStoredTheme, applyTheme, type Theme } from '@/lib/theme'

const IconSun = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
  </svg>
)

const IconMoon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
  </svg>
)

type ThemeToggleProps = {
  className?: string
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTheme(getStoredTheme())
    setMounted(true)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  if (!mounted) {
    return <div className={`h-9 ${className}`} />
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Change to light mode' : 'Change to dark mode'}
      className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sidebar-fg/60 hover:text-sidebar-fg hover:bg-sidebar-fg/10 transition-colors ${className}`}
    >
      {theme === 'dark' ? <IconSun /> : <IconMoon />}
      <span className="text-[12px] font-body font-medium leading-none">
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

const IconDashboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)

const IconGoals = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
  </svg>
)

const IconTasks = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
  </svg>
)

const IconJournal = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
)

const IconCoach = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
  </svg>
)

const NAV = [
  { href: '/dashboard',   label: 'Dashboard', icon: <IconDashboard /> },
  { href: '/objectives',  label: 'Goals',     icon: <IconGoals /> },
  { href: '/tasks',       label: 'Tasks',     icon: <IconTasks /> },
  { href: '/reflections', label: 'Journal',   icon: <IconJournal /> },
  { href: '/coach',       label: 'AI Coach',  icon: <IconCoach /> },
]

export default function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard')   return pathname === '/dashboard'
    if (href === '/objectives')  return pathname.startsWith('/objectives')
    if (href === '/tasks')       return pathname === '/tasks'
    if (href === '/reflections') return pathname.startsWith('/reflections')
    if (href === '/coach')       return pathname === '/coach'
    return false
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[220px] bg-sidebar flex-col z-40 border-r border-sidebar-fg/10">

        {/* Logo */}
        <div className="px-5 py-6 border-b border-sidebar-fg/10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
              <IconGoals />
            </div>
            <div>
              <span className="font-display font-extrabold text-[15px] text-sidebar-fg tracking-[-0.02em] leading-none block">
                Objetives
              </span>
              <span className="text-sidebar-fg/40 text-[10px] font-body font-medium leading-none block mt-0.5">
                2026
              </span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-[13px] font-body transition-all ${
                  active
                    ? 'bg-brand text-white font-bold'
                    : 'text-sidebar-fg/60 hover:bg-sidebar-fg/10 hover:text-sidebar-fg font-medium'
                }`}
              >
                <span className="flex items-center justify-center shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px]">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom: user + theme toggle */}
        <div className="px-3 py-4 border-t border-sidebar-fg/10 space-y-1">
          <ThemeToggle />
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <div
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-display font-extrabold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1E4FD8, #4DA3FF)' }}
            >
              I
            </div>
            <div>
              <p className="text-[12px] font-bold text-sidebar-fg font-body leading-none">Ignacio</p>
              <p className="text-[10px] text-sidebar-fg/40 font-body leading-none mt-0.5">Founder</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-fg/10 flex z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-body transition-colors ${
                active ? 'text-sky' : 'text-sidebar-fg/50'
              }`}
            >
              <span className="flex items-center justify-center w-6 h-6 [&>svg]:w-[22px] [&>svg]:h-[22px]">
                {item.icon}
              </span>
              <span className="leading-none truncate px-0.5">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

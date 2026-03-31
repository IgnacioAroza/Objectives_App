'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import CategoryIcon from '@/components/ui/CategoryIcon'

// Iconos de navegación (Heroicons v2 outline)
const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)

const IconFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
  </svg>
)

const IconClipboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
  </svg>
)

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <IconHome /> },
  { href: '/objectives?category=negocio', label: 'Negocio', icon: <CategoryIcon category="negocio" className="w-4 h-4" /> },
  { href: '/objectives?category=salud', label: 'Salud', icon: <CategoryIcon category="salud" className="w-4 h-4" /> },
  { href: '/objectives?category=lifestyle', label: 'Estilo de vida', icon: <CategoryIcon category="lifestyle" className="w-4 h-4" /> },
  { href: '/objectives', label: 'Todos los objetivos', icon: <IconFlag /> },
  { href: '/tasks', label: 'Tareas', icon: <IconClipboard /> },
  { href: '/reflections', label: 'Diario', icon: '✎' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = (href: string) => {
    const [base, query] = href.split('?')
    if (base === '/dashboard') return pathname === '/dashboard'
    if (base === '/reflections') return pathname.startsWith('/reflections')
    if (base === '/tasks') return pathname === '/tasks'

    // Para items con query params (ej: category=negocio)
    if (query) {
      const itemParams = new URLSearchParams(query)
      const itemCategory = itemParams.get('category')
      return pathname === '/objectives' && searchParams.get('category') === itemCategory
    }

    // "Todos los objetivos": activo solo si no hay category filter y no es detalle
    if (base === '/objectives') {
      return pathname === '/objectives' && !searchParams.get('category')
    }

    return pathname.startsWith(base)
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[220px] bg-navy flex-col z-40">
        <div className="px-6 py-6 border-b border-white/10">
          <Link href="/dashboard" className="block">
            <span className="font-display font-bold text-lg text-white tracking-tight">
              Click<span className="text-sky">Store</span>
            </span>
            <span className="block text-white/40 text-xs mt-0.5 font-body">
              Objetivos 2026
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors ${
                isActive(item.href)
                  ? 'bg-sky/15 text-sky'
                  : 'text-white/60 hover:bg-white/8 hover:text-white'
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center text-base shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-white/30 text-xs font-body">Ignacio — 2026</p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-navy border-t border-white/10 flex z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {[navItems[0], navItems[4], navItems[5], navItems[6]].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-4 text-xs font-body transition-colors ${
              isActive(item.href) ? 'text-sky' : 'text-white/50'
            }`}
          >
            <span className="flex items-center justify-center w-6 h-6">{item.icon}</span>
            <span className="text-[10px] leading-none truncate px-1">
              {item.label === 'Todos los objetivos' ? 'Objetivos' : item.label}
            </span>
          </Link>
        ))}
      </nav>
    </>
  )
}

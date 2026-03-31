'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

type NavItem = {
  href: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '◉' },
  { href: '/objectives?category=negocio', label: 'Negocio', icon: '◈' },
  { href: '/objectives?category=salud', label: 'Salud', icon: '♦' },
  { href: '/objectives?category=lifestyle', label: 'Estilo de vida', icon: '◇' },
  { href: '/objectives', label: 'Todos los objetivos', icon: '≡' },
  { href: '/tasks', label: 'Tareas', icon: '✓' },
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
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-white/30 text-xs font-body">Ignacio — 2026</p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-navy border-t border-white/10 flex z-40">
        {[navItems[0], navItems[4], navItems[5], navItems[6]].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-4 text-xs font-body transition-colors ${
              isActive(item.href) ? 'text-sky' : 'text-white/50'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] leading-none truncate px-1">
              {item.label === 'Todos los objetivos' ? 'Objetivos' : item.label}
            </span>
          </Link>
        ))}
      </nav>
    </>
  )
}

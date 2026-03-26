'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicRoute = pathname.startsWith('/login') || pathname.startsWith('/auth')

  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-[220px] p-4 md:p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}

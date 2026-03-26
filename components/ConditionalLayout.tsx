'use client'

import { Suspense } from 'react'
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
      <Suspense fallback={<div className="hidden md:block w-[220px] bg-navy" />}>
        <Sidebar />
      </Suspense>
      <main className="flex-1 md:ml-[220px] p-4 md:p-8 pb-24 md:pb-8 min-h-screen max-w-2xl mx-auto md:max-w-none md:mx-0">
        {children}
      </main>
    </div>
  )
}

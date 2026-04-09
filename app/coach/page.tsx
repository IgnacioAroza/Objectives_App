import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatInterface from '@/components/coach/ChatInterface'
import { CoachMessage, Objective } from '@/lib/types'

export const metadata = { title: 'Coach — Objetivos 2026' }

export default async function CoachPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: history, error: historyError },
    { data: objectives, error: objError },
  ] = await Promise.all([
    supabase
      .from('coach_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50),
    supabase
      .from('objectives')
      .select('id, title, category')
      .order('sort_order'),
  ])

  if (historyError) {
    console.error('[coach page] history fetch:', historyError.message)
    throw new Error('No se pudo cargar el historial del coach')
  }
  if (objError) {
    console.error('[coach page] objectives fetch:', objError.message)
    throw new Error('No se pudieron cargar los objetivos')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen">
      {/* Header */}
      <div className="border-b border-beige bg-cream px-4 md:px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display font-bold text-navy text-base leading-none">Coach IA</h1>
            <p className="text-navy/40 text-xs font-body mt-0.5">Basado en tus objetivos y progreso real</p>
          </div>
        </div>
      </div>

      <ChatInterface
        initialHistory={(history ?? []) as CoachMessage[]}
        objectives={(objectives ?? []) as Pick<Objective, 'id' | 'title' | 'category'>[]}
      />
    </div>
  )
}

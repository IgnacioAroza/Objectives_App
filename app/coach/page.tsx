import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatInterface from '@/components/coach/ChatInterface'
import { CoachMessage, Objective } from '@/lib/types'
import { calcQuantitativeProgress } from '@/lib/utils'

export const metadata = { title: 'Coach — Objetivos 2026' }

function getProgressValue(obj: Objective): number {
  if (obj.type === 'quantitative') {
    if (obj.current_value !== null && obj.initial_value !== null && obj.target_value !== null) {
      return calcQuantitativeProgress(obj.current_value, obj.initial_value, obj.target_value)
    }
    return 0
  }
  if (obj.type === 'qualitative') return obj.progress_manual
  return 0
}

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
      .select('*')
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

  const allObjectives = (objectives ?? []) as Objective[]

  const objectivesWithProgress = allObjectives.map((obj) => ({
    id:       obj.id,
    title:    obj.title,
    category: obj.category,
    progress: getProgressValue(obj),
  }))

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen -m-4 md:-m-6 lg:-m-8">
      {/* Header */}
      <div className="border-b border-beige bg-surface px-4 md:px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1E4FD8, #4DA3FF)' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-navy/40 font-body uppercase tracking-[0.06em] leading-none mb-0.5">
                AI powered
              </p>
              <h1 className="font-display font-bold text-navy text-base leading-none">
                Performance Coach
              </h1>
            </div>
          </div>
        </div>
      </div>

      <ChatInterface
        initialHistory={(history ?? []) as CoachMessage[]}
        objectives={objectivesWithProgress}
      />
    </div>
  )
}

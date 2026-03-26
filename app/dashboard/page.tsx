import { createClient } from '@/lib/supabase/server'
import type { Objective, TaskWithObjective, DailyFocus, Config } from '@/lib/types'
import StatsCard from '@/components/dashboard/StatsCard'
import FocusInput from '@/components/dashboard/FocusInput'
import UpcomingTasks from '@/components/dashboard/UpcomingTasks'
import ProgressBar from '@/components/ui/ProgressBar'
import Link from 'next/link'
import { calcQuantitativeProgress, getDaysLeftIn2026, formatDate, getTodayString } from '@/lib/utils'

function calcObjectiveProgress(obj: Objective): number {
  if (obj.type === 'quantitative') {
    if (obj.current_value !== null && obj.initial_value !== null && obj.target_value !== null) {
      return calcQuantitativeProgress(obj.current_value, obj.initial_value, obj.target_value)
    }
    return 0
  }
  if (obj.type === 'qualitative') return obj.progress_manual
  return 0
}

function avgProgress(objectives: Objective[]): number {
  if (objectives.length === 0) return 0
  const total = objectives.reduce((sum, obj) => sum + calcObjectiveProgress(obj), 0)
  return Math.round(total / objectives.length)
}

export default async function DashboardPage() {
  const supabase = createClient()

  const [
    { data: objectives, error: objError },
    { data: focusData },
    { data: reflections },
    { data: upcomingTasks },
    { data: configData },
  ] = await Promise.all([
    supabase.from('objectives').select('*').order('sort_order'),
    supabase.from('daily_focus').select('*').eq('date', getTodayString()).single(),
    supabase
      .from('reflections')
      .select('id, date, what_i_did')
      .order('date', { ascending: false })
      .limit(3),
    supabase
      .from('tasks')
      .select('*, objectives(title, category)')
      .eq('done', false)
      .lte('due_date', (() => {
        const d = new Date()
        d.setDate(d.getDate() + 7)
        return d.toISOString().split('T')[0]
      })())
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true }),
    supabase.from('config').select('*'),
  ])

  if (objError) {
    throw new Error(`No se pudieron cargar los objetivos: ${objError.message}`)
  }

  const allObjectives = (objectives ?? []) as Objective[]

  const negocio = allObjectives.filter((o) => o.category === 'negocio')
  const salud = allObjectives.filter((o) => o.category === 'salud')
  const lifestyle = allObjectives.filter((o) => o.category === 'lifestyle')

  const pctNegocio = avgProgress(negocio)
  const pctSalud = avgProgress(salud)
  const pctLifestyle = avgProgress(lifestyle)

  const configs = (configData ?? []) as Config[]
  const quitDate = configs.find((c) => c.key === 'quit_smoking_date')?.value ?? null

  const streakDays = quitDate
    ? Math.floor((Date.now() - new Date(quitDate).getTime()) / 86400000)
    : null

  const pesoObj = allObjectives.find((o) => o.title === 'Llegar a 90 kg')
  const pesoActual = pesoObj?.current_value ?? 83.5

  const facturacionObj = allObjectives.find((o) => o.category === 'negocio' && o.type === 'quantitative' && o.unit?.includes('ARS'))
  const facturacionCurrent = facturacionObj?.current_value ?? 0

  const daysLeft = getDaysLeftIn2026()
  const today = getTodayString()

  const categories = [
    { label: 'Negocio', icon: '◈', pct: pctNegocio, href: '/objectives?category=negocio', color: 'bg-brand' },
    { label: 'Salud', icon: '♦', pct: pctSalud, href: '/objectives?category=salud', color: 'bg-sky' },
    { label: 'Estilo de vida', icon: '◇', pct: pctLifestyle, href: '/objectives?category=lifestyle', color: 'bg-navy' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-navy/40 font-body uppercase tracking-wider mb-1">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h1 className="font-display font-bold text-2xl text-navy">Hola, Ignacio</h1>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="bg-white border border-navy/10 rounded-2xl p-3 md:p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="text-lg md:text-xl mb-1.5">{cat.icon}</div>
            <p className="font-display font-bold text-[10px] md:text-xs text-navy mb-1 leading-tight">{cat.label}</p>
            <p className="font-display font-bold text-xl md:text-2xl text-navy">
              {cat.pct}<span className="text-xs md:text-sm font-body font-normal text-navy/40">%</span>
            </p>
            <ProgressBar value={cat.pct} className="mt-1.5 md:mt-2" />
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <StatsCard
          label="Peso"
          value={`${pesoActual}kg`}
          sub="Meta: 90"
        />
        <StatsCard
          label="Sin fumar"
          value={streakDays !== null ? String(streakDays) : '—'}
          sub="días"
        />
        <StatsCard
          label="Facturación"
          value={`$${facturacionCurrent}M`}
          sub="ARS"
        />
      </div>

      {/* Days left */}
      <div className="bg-navy text-white rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-white/50 text-xs font-body">Días restantes en 2026</p>
          <p className="font-display font-bold text-3xl text-sky">{daysLeft}</p>
        </div>
        <div className="text-right">
          <p className="text-white/50 text-xs font-body">del año completado</p>
          <p className="font-display font-bold text-2xl text-white">
            {Math.round(((365 - daysLeft) / 365) * 100)}%
          </p>
        </div>
      </div>

      {/* Focus */}
      <FocusInput initialFocus={focusData as DailyFocus | null} today={today} />

      {/* Upcoming tasks */}
      <UpcomingTasks tasks={(upcomingTasks ?? []) as TaskWithObjective[]} />

      {/* Recent reflections */}
      {reflections && reflections.length > 0 && (
        <div className="bg-white border border-navy/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-navy/50 uppercase tracking-wider font-body">
              Últimas reflexiones
            </h3>
            <Link href="/reflections" className="text-xs text-brand font-body hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-3">
            {reflections.map((r) => (
              <div key={r.id} className="pb-3 border-b border-navy/5 last:border-0 last:pb-0">
                <p className="text-xs text-navy/40 font-body mb-1">{formatDate(r.date)}</p>
                <p className="text-sm text-navy font-body line-clamp-2 leading-snug">
                  {r.what_i_did ?? '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write reflection CTA */}
      <Link
        href="/reflections/new"
        className="block bg-brand text-white text-center py-3 rounded-2xl font-body font-medium text-sm hover:bg-brand/90 transition-colors"
      >
        ✎ Escribir reflexión de hoy
      </Link>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import type { Objective, TaskWithObjective, DailyFocus, Config } from '@/lib/types'
import FocusInput from '@/components/dashboard/FocusInput'
import UpcomingTasks from '@/components/dashboard/UpcomingTasks'
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

type CategoryConfig = {
  label: string
  color: string
  textColor: string
  borderColor: string
  bgLight: string
  objectives: Objective[]
}

function CategorySection({ label, color, textColor, borderColor, bgLight, objectives }: CategoryConfig) {
  if (objectives.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-navy/50 font-body">
          {label}
        </span>
        <span className="ml-auto text-[11px] text-navy/40 font-body">{objectives.length} objetivo{objectives.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-2">
        {objectives.map((obj) => {
          const pct = calcObjectiveProgress(obj)
          return (
            <Link
              key={obj.id}
              href={`/objectives/${obj.id}`}
              className="flex items-center gap-4 bg-surface border border-navy/10 rounded-xl p-4 hover:shadow-sm hover:-translate-y-px transition-all relative overflow-hidden group"
            >
              <span
                className={`absolute left-0 top-0 bottom-0 w-[3px] ${color} rounded-l-xl`}
              />
              <div className="flex-1 min-w-0 pl-1">
                <p className="font-body text-sm font-medium text-navy truncate group-hover:text-brand transition-colors">
                  {obj.title}
                </p>
                <div className="mt-2 h-1.5 bg-beige rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className={`font-display font-bold text-xl shrink-0 ${textColor}`}>
                {pct}<span className="text-xs font-body font-normal text-navy/35">%</span>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
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
  const overallProgress = allObjectives.length > 0
    ? Math.round((pctNegocio + pctSalud + pctLifestyle) / 3)
    : 0

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
  const yearElapsed = Math.round(((365 - daysLeft) / 365) * 100)

  const categories: CategoryConfig[] = [
    {
      label: 'Negocio',
      color: 'bg-brand',
      textColor: 'text-brand',
      borderColor: 'border-brand',
      bgLight: 'bg-brand/5',
      objectives: negocio,
    },
    {
      label: 'Salud',
      color: 'bg-sky',
      textColor: 'text-sky',
      borderColor: 'border-sky',
      bgLight: 'bg-sky/5',
      objectives: salud,
    },
    {
      label: 'Estilo de vida',
      color: 'bg-navy',
      textColor: 'text-navy',
      borderColor: 'border-navy',
      bgLight: 'bg-navy/5',
      objectives: lifestyle,
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-[11px] text-navy/40 font-body uppercase tracking-widest mb-1">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h1 className="font-display font-bold text-[26px] leading-none text-navy">
          Hola, Ignacio.
        </h1>
        {streakDays !== null && streakDays > 0 && (
          <p className="text-sm text-navy/50 font-body mt-2">
            Día {streakDays} sin fumar. Seguí la racha.
          </p>
        )}
      </div>

      {/* Stats bar — horizontal, 4 cols */}
      <div className="bg-surface border border-navy/10 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-navy/5">
          <div className="p-4">
            <p className="text-[11px] font-body font-semibold uppercase tracking-[0.08em] text-navy/40 mb-1">
              Peso actual
            </p>
            <p className="font-display font-extrabold text-2xl text-sky leading-none">{pesoActual} kg</p>
            <p className="text-[11px] text-navy/40 font-body mt-1">Meta: 90 kg</p>
          </div>
          <div className="p-4">
            <p className="text-[11px] font-body font-semibold uppercase tracking-[0.08em] text-navy/40 mb-1">
              Sin fumar
            </p>
            <p className="font-display font-extrabold text-2xl leading-none" style={{ color: '#22c55e' }}>
              {streakDays !== null ? `${streakDays} días` : '—'}
            </p>
            <p className="text-[11px] text-navy/40 font-body mt-1">Racha actual</p>
          </div>
          <div className="p-4">
            <p className="text-[11px] font-body font-semibold uppercase tracking-[0.08em] text-navy/40 mb-1">
              Facturación
            </p>
            <p className="font-display font-extrabold text-2xl text-brand leading-none">
              ${facturacionCurrent}M
            </p>
            <p className="text-[11px] text-navy/40 font-body mt-1">ARS acumulado</p>
          </div>
          <div className="p-4">
            <p className="text-[11px] font-body font-semibold uppercase tracking-[0.08em] text-navy/40 mb-1">
              Progreso general
            </p>
            <p className="font-display font-extrabold text-2xl leading-none" style={{ color: '#f59e0b' }}>
              {overallProgress}%
            </p>
            <p className="text-[11px] text-navy/40 font-body mt-1">{allObjectives.length} objetivos</p>
          </div>
        </div>
      </div>

      {/* Year progress bar */}
      <div className="bg-surface border border-navy/10 rounded-2xl p-5">
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-display font-bold text-sm text-navy">Año 2026</span>
          <div className="flex gap-4">
            <span className="text-xs text-navy/50 font-body">
              <span className="font-bold text-brand">{yearElapsed}%</span> transcurrido
            </span>
            <span className="text-xs text-navy/50 font-body">
              <span className="font-bold text-navy">{daysLeft}</span> días restantes
            </span>
          </div>
        </div>
        <div className="h-2 bg-beige rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${yearElapsed}%`, background: 'linear-gradient(90deg, #1E4FD8, #4DA3FF)' }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {['Ene', 'Abr', 'Jul', 'Oct', 'Dic'].map((m) => (
            <span key={m} className="text-[10px] text-navy/35 font-body">{m}</span>
          ))}
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* Left: Category sections with individual objective cards */}
        <div className="space-y-6">
          {categories.map((cat) => (
            <CategorySection key={cat.label} {...cat} />
          ))}
        </div>

        {/* Right: widgets */}
        <div className="space-y-4">
          <FocusInput initialFocus={focusData as DailyFocus | null} today={today} />

          <UpcomingTasks tasks={(upcomingTasks ?? []) as TaskWithObjective[]} />

          {reflections && reflections.length > 0 && (
            <div className="bg-surface border border-navy/10 rounded-2xl p-5">
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

          <Link
            href="/reflections/new"
            className="block bg-brand text-white text-center py-3 rounded-2xl font-body font-medium text-sm hover:bg-brand/90 transition-colors"
          >
            ✎ Escribir reflexión de hoy
          </Link>
        </div>
      </div>
    </div>
  )
}

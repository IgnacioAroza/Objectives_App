export type Objective = {
  id: string
  category: 'negocio' | 'salud' | 'lifestyle'
  title: string
  type: 'quantitative' | 'qualitative' | 'streak'
  target_value: number | null
  current_value: number | null
  initial_value: number | null
  unit: string | null
  progress_manual: number
  sort_order: number
  created_at: string
}

export type Task = {
  id: string
  objective_id: string
  title: string
  due_date: string | null
  priority: 1 | 2 | 3
  done: boolean
  done_at: string | null
  note: string | null
  created_at: string
}

export type TaskWithObjective = Task & {
  objectives: {
    title: string
    category: 'negocio' | 'salud' | 'lifestyle'
  } | null
}

export type ValueLog = {
  id: string
  objective_id: string
  value: number
  logged_at: string
  note: string | null
}

export type Reflection = {
  id: string
  date: string
  what_i_did: string | null
  how_i_felt: string | null
  what_i_learned: string | null
  free_notes: string | null
  created_at: string
  updated_at: string
}

export type ReflectionWithObjectives = Reflection & {
  reflection_objectives: {
    objective_id: string
    objectives: {
      title: string
      category: 'negocio' | 'salud' | 'lifestyle'
    } | null
  }[]
}

export type DailyFocus = {
  date: string
  f1: string | null
  f2: string | null
  f3: string | null
}

export type Config = {
  key: string
  value: string
}

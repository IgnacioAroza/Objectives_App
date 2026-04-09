import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { SuggestedTask } from '@/lib/types'

export async function POST(req: NextRequest) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const task = await req.json() as SuggestedTask

  if (!task.title?.trim() || !task.objective_id) {
    return NextResponse.json({ error: 'Datos de tarea inválidos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: task.title.trim(),
      objective_id: task.objective_id,
      priority: task.priority ?? 2,
      due_date: task.due_date ?? null,
      done: false,
    })
    .select()
    .single()

  if (error) {
    console.error('[coach/tasks] insert:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

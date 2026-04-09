import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response('No autorizado', { status: 401 })
  }

  const { message } = await req.json() as { message: string }
  if (!message?.trim()) {
    return new Response('Mensaje requerido', { status: 400 })
  }

  // Guardar mensaje del usuario
  const { error: insertError } = await supabase
    .from('coach_messages')
    .insert({ role: 'user', content: message })
  if (insertError) {
    console.error('[coach] insert user message:', insertError.message)
    return new Response('Error al guardar mensaje', { status: 500 })
  }

  // Leer contexto de Supabase en paralelo
  const [
    { data: objectives },
    { data: pendingTasks },
    { data: recentReflections },
    { data: valueLogs },
    { data: quitDateConfig },
    { data: history },
  ] = await Promise.all([
    supabase.from('objectives').select('*').order('category').order('sort_order'),
    supabase.from('tasks').select('*, objectives(title, category)').eq('done', false).order('priority').order('due_date', { ascending: true }).limit(30),
    supabase.from('reflections').select('*').order('date', { ascending: false }).limit(3),
    supabase.from('value_logs').select('*, objectives(title, unit)').order('logged_at', { ascending: false }).limit(10),
    supabase.from('config').select('value').eq('key', 'quit_date').single(),
    supabase.from('coach_messages').select('role, content').order('created_at', { ascending: false }).limit(20),
  ])

  // Construir system prompt con contexto real
  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const objectivesContext = (objectives ?? []).map(obj => {
    let progressStr = ''
    if (obj.type === 'quantitative') {
      const pct = obj.target_value && obj.initial_value !== null
        ? Math.min(100, Math.round(((obj.current_value ?? obj.initial_value) - obj.initial_value) / (obj.target_value - obj.initial_value) * 100))
        : 0
      progressStr = `${pct}% (actual: ${obj.current_value ?? obj.initial_value} ${obj.unit}, meta: ${obj.target_value} ${obj.unit})`
    } else if (obj.type === 'qualitative') {
      progressStr = `${obj.progress_manual}% (slider manual)`
    } else if (obj.type === 'streak') {
      if (quitDateConfig?.value) {
        const days = Math.floor((Date.now() - new Date(quitDateConfig.value).getTime()) / 86400000)
        progressStr = `${days} días de racha`
      } else {
        progressStr = 'sin fecha de inicio registrada'
      }
    }
    return `- [${obj.category}] ${obj.title} → ${progressStr}`
  }).join('\n')

  const tasksContext = (pendingTasks ?? []).slice(0, 20).map(t => {
    const obj = t.objectives as { title: string; category: string } | null
    const due = t.due_date ? ` (vence: ${t.due_date})` : ''
    const prio = t.priority === 1 ? 'alta' : t.priority === 2 ? 'media' : 'baja'
    return `- [${obj?.category ?? ''}] "${t.title}" — prioridad ${prio}${due} | objetivo_id: ${t.objective_id}`
  }).join('\n')

  const reflectionsContext = (recentReflections ?? []).map(r =>
    `[${r.date}] Hice: ${r.what_i_did?.slice(0, 120) ?? '-'} | Sentí: ${r.how_i_felt?.slice(0, 80) ?? '-'} | Aprendí: ${r.what_i_learned?.slice(0, 80) ?? '-'}`
  ).join('\n')

  const valueLogsContext = (valueLogs ?? []).map(v => {
    const obj = v.objectives as { title: string; unit: string | null } | null
    return `- ${obj?.title ?? 'objetivo'}: ${v.value} ${obj?.unit ?? ''} el ${v.logged_at}`
  }).join('\n')

  const objectivesForTasks = (objectives ?? []).map(o => `${o.id} = "${o.title}" [${o.category}]`).join('\n')

  const systemPrompt = `Sos el coach personal de Ignacio para sus objetivos de 2026. Hoy es ${today}.
Ignacio tiene un ecommerce argentino llamado ClickStore (Home & Deco, Tiendanube). Sos directo, práctico y usás voseo rioplatense.

## Objetivos y progreso actual
${objectivesContext}

## Tareas pendientes (hasta 20)
${tasksContext || 'Sin tareas pendientes cargadas.'}

## Últimas reflexiones
${reflectionsContext || 'Sin reflexiones recientes.'}

## Registros de valores recientes
${valueLogsContext || 'Sin registros.'}

---

## Cómo sugerir tareas
Cuando propongas tareas concretas que Ignacio pueda agregar a su lista, incluilas en un bloque especial al FINAL de tu respuesta con este formato exacto:

\`\`\`tasks
[{"title":"Título de la tarea","objective_id":"UUID_del_objetivo","priority":1,"due_date":"2026-04-15"}]
\`\`\`

IDs de objetivos disponibles:
${objectivesForTasks}

- priority: 1=alta, 2=media, 3=baja
- due_date: formato YYYY-MM-DD, o null si no tiene fecha
- Solo incluí el bloque tasks cuando tengas sugerencias concretas y accionables. No lo incluyas en respuestas conversacionales.
- Podés sugerir hasta 5 tareas por respuesta.`

  // Historial en orden cronológico
  const historyMessages = (history ?? []).reverse().slice(-20)

  const stream = await anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      ...historyMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ],
  })

  // Streaming al cliente + guardar respuesta completa
  const encoder = new TextEncoder()
  let fullResponse = ''

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text
            fullResponse += text
            controller.enqueue(encoder.encode(text))
          }
        }
      } catch (err) {
        console.error('[coach] stream error:', err)
        controller.error(err)
        return
      }

      // Guardar respuesta del asistente
      const { error: saveError } = await supabase
        .from('coach_messages')
        .insert({ role: 'assistant', content: fullResponse })
      if (saveError) {
        console.error('[coach] insert assistant message:', saveError.message)
      }

      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

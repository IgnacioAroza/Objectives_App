import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Detecta si el mensaje es conversacional simple (no necesita contexto pesado)
function isLightQuery(message: string): boolean {
  const light = ['hola', 'buenas', 'gracias', 'ok', 'dale', 'bien', 'perfecto', 'listo']
  const lower = message.toLowerCase().trim()
  return lower.length < 40 && light.some(w => lower.startsWith(w))
}

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

  const lightQuery = isLightQuery(message)
  const today = new Date()
  const todayStr = today.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // % del año transcurrido y días restantes
  const startOfYear = new Date(today.getFullYear(), 0, 1)
  const endOfYear = new Date(today.getFullYear(), 11, 31)
  const daysElapsed = Math.floor((today.getTime() - startOfYear.getTime()) / 86400000)
  const daysLeft = Math.floor((endOfYear.getTime() - today.getTime()) / 86400000)
  const yearPct = Math.round((daysElapsed / 365) * 100)

  // Leer contexto de Supabase en paralelo
  const [
    { data: objectives },
    { data: allTasks },
    { data: recentReflections },
    { data: valueLogs },
    { data: quitDateConfig },
    { data: history },
    { data: memory },
  ] = await Promise.all([
    supabase.from('objectives').select('*').order('category').order('sort_order'),
    supabase
      .from('tasks')
      .select('*, objectives(title, category)')
      .eq('done', false)
      .order('priority')
      .order('due_date', { ascending: true })
      .limit(lightQuery ? 0 : 15),
    supabase
      .from('reflections')
      .select('*')
      .order('date', { ascending: false })
      .limit(lightQuery ? 1 : 3),
    supabase
      .from('value_logs')
      .select('*, objectives(title, unit)')
      .order('logged_at', { ascending: false })
      .limit(lightQuery ? 0 : 8),
    supabase.from('config').select('value').eq('key', 'quit_smoking_date').single(),
    supabase
      .from('coach_messages')
      .select('role, content')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('coach_memory')
      .select('category, content')
      .eq('still_relevant', true)
      .order('learned_at', { ascending: false })
      .limit(15),
  ])

  // ── Contexto de objetivos (con semáforo on-track) ───────────────────────────
  const todayDateStr = today.toISOString().split('T')[0]
  const objectivesContext = (objectives ?? []).map(obj => {
    let progressStr = ''
    if (obj.type === 'quantitative') {
      const curr = obj.current_value ?? obj.initial_value ?? 0
      const pct = obj.target_value && obj.initial_value !== null && obj.target_value !== obj.initial_value
        ? Math.min(100, Math.round(((curr) - obj.initial_value) / (obj.target_value - obj.initial_value) * 100))
        : 0
      const onTrack = pct >= yearPct * 0.8 ? '✓' : pct >= yearPct * 0.4 ? '⚠' : '✗'
      progressStr = `${onTrack} ${pct}% | actual: ${curr} ${obj.unit ?? ''} / meta: ${obj.target_value} ${obj.unit ?? ''}`
    } else if (obj.type === 'qualitative') {
      const pct = obj.progress_manual ?? 0
      const onTrack = pct >= yearPct * 0.8 ? '✓' : pct >= yearPct * 0.4 ? '⚠' : '✗'
      progressStr = `${onTrack} ${pct}%`
    } else if (obj.type === 'streak') {
      if (quitDateConfig?.value) {
        const days = Math.floor((Date.now() - new Date(quitDateConfig.value).getTime()) / 86400000)
        progressStr = `${days} días de racha`
      } else {
        progressStr = 'sin inicio registrado'
      }
    }
    return `- [${obj.category}] ${obj.title} → ${progressStr} (id:${obj.id})`
  }).join('\n')

  // ── Tareas: separar vencidas de próximas ────────────────────────────────────
  const overdueTasks = (allTasks ?? []).filter(t => t.due_date && t.due_date < todayDateStr)
  const upcomingTasks = (allTasks ?? []).filter(t => !t.due_date || t.due_date >= todayDateStr)

  const formatTask = (t: any) => {
    const obj = t.objectives as { title: string; category: string } | null
    const due = t.due_date ? ` (${t.due_date})` : ''
    const prio = t.priority === 1 ? '🔴' : t.priority === 2 ? '🟡' : '🟢'
    return `${prio} "${t.title}" — ${obj?.title ?? ''}${due}`
  }

  const overdueContext = overdueTasks.length > 0
    ? `⚠ TAREAS VENCIDAS (${overdueTasks.length}):\n${overdueTasks.map(formatTask).join('\n')}`
    : ''

  const upcomingContext = upcomingTasks.length > 0
    ? `Próximas tareas:\n${upcomingTasks.map(formatTask).join('\n')}`
    : 'Sin tareas próximas.'

  // ── Reflexiones ──────────────────────────────────────────────────────────────
  const reflectionsContext = (recentReflections ?? []).map(r => {
    if (r.content) return `[${r.date}] ${r.content.slice(0, 200)}`
    return `[${r.date}] ${r.what_i_did?.slice(0, 120) ?? '-'}`
  }).join('\n')

  // ── Value logs ───────────────────────────────────────────────────────────────
  const valueLogsContext = (valueLogs ?? []).map(v => {
    const obj = v.objectives as { title: string; unit: string | null } | null
    const date = v.logged_at?.split('T')[0] ?? ''
    return `${obj?.title ?? 'obj'}: ${v.value}${obj?.unit ? ' ' + obj.unit : ''} (${date})`
  }).join(' | ')

  // ── Memoria persistente ──────────────────────────────────────────────────────
  const memoryContext = memory && memory.length > 0
    ? `## Lo que aprendí sobre vos (memoria acumulada)\n` +
      memory.map(m => `- [${m.category}] ${m.content}`).join('\n')
    : ''

  // ── System prompt ────────────────────────────────────────────────────────────
  const systemPrompt = `Sos el coach personal de Ignacio para sus objetivos de 2026.
Hoy: ${todayStr} | Año al ${yearPct}% (${daysElapsed} días transcurridos, ${daysLeft} restantes).

## Quién es Ignacio
- 26 años, argentino. Vive con su familia; su meta personal es independizarse y vivir solo en Buenos Aires.
- Tiene un socio llamado Joaquín, quien vive en CABA y maneja toda la logística: compra los productos a proveedores locales y los despacha desde allá.
- Dedica 6-8 horas por día al negocio. Rutina: mañana = tareas que requieren concentración (estrategia, análisis, creación de contenido, ads). Tarde = ejecución liviana (fotos, videos, responder mensajes).
- Tiene otra fuente de ingresos además de ClickStore. Planea agregar una nueva cuando comercialice esta app.
- Los $30.000 USD son ahorro personal separado del negocio — empieza a alimentarlos cuando las ventas sean estables.

## Cómo funciona ClickStore
- Ecommerce de productos para el hogar (Home & Deco) en Tiendanube. Todo el profit se reinvierte: stock, ads, marca. No se saca sueldo todavía.
- Modelo capital-light: no mantiene stock previo. Cuando entra una venta, Joaquín compra el producto en CABA y lo despacha. Proveedores locales por ahora.
- Objetivo China: traer algún producto importado a lo largo del año, pero PRIMERO validar demanda con proveedores locales. No es la clave de hoy — es objetivo de más largo plazo.

## La estrategia de Meta Ads
- Presupuesto de testeo: $30 USD por campaña (o $14 USD cuando el capital es más ajustado).
- Regla de escala: si el primer día de testeo entra 4 o más ventas → se duplica el presupuesto. Si no, se corta.
- Frecuencia actual: 1-2 testeos por mes. **Este es el cuello de botella real del negocio.**
- Para encontrar un "winner" (producto + creativo que convierte y escala) la estadística exige volumen de pruebas. Con 1-2 testeos/mes la probabilidad es baja. El objetivo es llegar a 4-6 testeos por mes.

## Cuándo considera "ventas estables"
Alrededor de $2M ARS/mes de facturación. Con ~30% de margen eso le da ~$600K ARS de profit y podría empezar a separar algo para su ahorro personal.

## Tus objetivos de coaching
1. **Foco en cadencia de testeos**: preguntá cuántos testeos van este mes y si puede subirlo. Es lo que más mueve la aguja.
2. Que Ignacio ejecute, no analice — siempre terminá con una acción concreta.
3. Ser honesto cuando algo está atrasado: decirlo claro y proponer solución.
4. Reconocer lo que va bien brevemente — sin palmaditas en exceso.
5. Respetar su rutina: tareas pesadas a la mañana, liviano a la tarde.

## Estilo de respuesta
- Voseo rioplatense, directo, sin frases genéricas ni motivacionales vacías.
- Máximo 250 palabras salvo que el usuario pida un análisis profundo.
- Usá negrita y listas para que sea fácil de leer.
- No repitas el contexto que ya conoce — ve al punto.

---

${memoryContext ? memoryContext + '\n\n---\n\n' : ''}## Objetivos y progreso (✓=on-track ⚠=en riesgo ✗=atrasado vs año al ${yearPct}%)
${objectivesContext}

${overdueContext ? overdueContext + '\n\n' : ''}${upcomingContext}

## Reflexiones recientes
${reflectionsContext || 'Sin reflexiones recientes.'}

## Últimos valores registrados
${valueLogsContext || 'Sin registros.'}

---

## Cómo sugerir tareas
Solo cuando tengas sugerencias concretas y accionables, incluí al FINAL un bloque con este formato exacto:
\`\`\`tasks
[{"title":"Título","objective_id":"UUID","priority":1,"due_date":"2026-04-15"}]
\`\`\`
priority: 1=alta 2=media 3=baja | due_date: YYYY-MM-DD o null | máx 3 tareas por respuesta.`

  // Historia en orden cronológico
  const historyMessages = (history ?? []).reverse()

  const stream = await anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
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

      // ── Extracción de memoria (fire-and-forget, no bloquea el stream) ────────
      extractAndSaveMemory(supabase, message, fullResponse).catch(err =>
        console.error('[coach] memory extraction error:', err)
      )

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

// ── Memoria persistente: extrae aprendizajes de cada conversación ─────────────
async function extractAndSaveMemory(
  supabase: any,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  // Solo extraemos si hay contenido sustancial (evita gastar tokens en saludos)
  if (userMessage.length < 30 && assistantResponse.length < 100) return

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const extractionPrompt = `Analizá este intercambio entre Ignacio y su coach IA.
¿Hay algún dato concreto NUEVO sobre Ignacio que valga la pena recordar en futuras conversaciones?
Ejemplos: una decisión tomada, un dato de negocio específico, un cambio de situación, un patrón de comportamiento observado, una preferencia expresada.

Usuario: "${userMessage.slice(0, 300)}"
Coach: "${assistantResponse.slice(0, 300)}"

Si hay algo relevante, respondé SOLO con este JSON (sin markdown, sin explicación):
{"category":"negocio|personal|ads|patron","content":"El aprendizaje en una oración corta y concreta"}

Si no hay nada nuevo que valga la pena recordar, respondé SOLO con: null`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 120,
    messages: [{ role: 'user', content: extractionPrompt }],
  })

  const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : null
  if (!text || text === 'null') return

  try {
    const parsed = JSON.parse(text)
    if (parsed?.category && parsed?.content) {
      await supabase.from('coach_memory').insert({
        category: parsed.category,
        content: parsed.content,
      })
    }
  } catch {
    // Si el JSON está mal formado, ignoramos silenciosamente
  }
}

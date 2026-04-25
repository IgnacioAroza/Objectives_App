'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { CoachMessage, SuggestedTask } from '@/lib/types'
import QuickPrompts from './QuickPrompts'
import SuggestedTaskCard from './SuggestedTaskCard'

type ObjectiveWithProgress = {
  id: string
  title: string
  category: string
  progress: number
}

type Message = Pick<CoachMessage, 'role' | 'content'>

type Props = {
  initialHistory: CoachMessage[]
  objectives: ObjectiveWithProgress[]
}

function parseSuggestedTasks(content: string): { text: string; tasks: SuggestedTask[] } {
  const taskBlockRegex = /```tasks\n([\s\S]*?)```/g
  const tasks: SuggestedTask[] = []
  let text = content
  let match
  while ((match = taskBlockRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as SuggestedTask[]
      if (Array.isArray(parsed)) tasks.push(...parsed)
    } catch {
      // bloque mal formado, ignorar
    }
    text = text.replace(match[0], '')
  }
  return { text: text.trim(), tasks }
}

const CAT_COLORS: Record<string, { label: string; color: string }> = {
  negocio:   { label: 'Negocio',        color: '#1E4FD8' },
  salud:     { label: 'Salud',          color: '#4DA3FF' },
  lifestyle: { label: 'Estilo de vida', color: '#141B63' },
}

function statusIcon(progress: number) {
  if (progress >= 75) return '✅'
  if (progress >= 40) return '⚠️'
  return '🔴'
}

function GoalStatusPanel({ objectives }: { objectives: ObjectiveWithProgress[] }) {
  const categories = ['negocio', 'salud', 'lifestyle']
  return (
    <div className="w-56 flex-shrink-0 border-l border-beige overflow-y-auto bg-surface hidden lg:block">
      <div className="p-4">
        <p className="font-display font-bold text-sm text-navy mb-4">Goal Status</p>
        {categories.map((cat) => {
          const objs = objectives.filter((o) => o.category === cat)
          if (objs.length === 0) return null
          const meta = CAT_COLORS[cat]
          return (
            <div key={cat} className="mb-5">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.08em] mb-2"
                style={{ color: meta.color }}
              >
                {meta.label}
              </p>
              <div className="space-y-1.5">
                {objs.map((obj) => (
                  <div
                    key={obj.id}
                    className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-cream"
                  >
                    <span className="text-xs flex-shrink-0 leading-tight mt-px">
                      {statusIcon(obj.progress)}
                    </span>
                    <span className="text-[11px] text-navy font-body leading-snug flex-1">
                      {obj.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  objectives,
  onTaskAdded,
}: {
  message: Message
  objectives: ObjectiveWithProgress[]
  onTaskAdded: () => void
}) {
  const isUser = message.role === 'user'
  const { text, tasks } = isUser
    ? { text: message.content, tasks: [] }
    : parseSuggestedTasks(message.content)

  const objectiveMap = Object.fromEntries(objectives.map((o) => [o.id, o.title]))

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-1"
          style={{ background: 'linear-gradient(135deg, #1E4FD8, #4DA3FF)' }}
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
        </div>
      )}

      <div className={`max-w-[75%] md:max-w-[65%] space-y-2`}>
        <div
          className={`px-4 py-3 text-sm font-body leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-brand text-white rounded-2xl rounded-br-sm'
              : 'bg-surface border border-beige text-navy rounded-2xl rounded-bl-sm'
          }`}
        >
          {text}
        </div>

        {tasks.length > 0 && (
          <div className="space-y-2 mt-2">
            <p className="text-xs text-navy/50 font-body px-1">Tareas sugeridas:</p>
            {tasks.map((task, i) => (
              <SuggestedTaskCard
                key={i}
                task={task}
                objectiveName={objectiveMap[task.objective_id] ?? 'Objetivo desconocido'}
                onAdded={onTaskAdded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatInterface({ initialHistory, objectives }: Props) {
  const [messages, setMessages] = useState<Message[]>(
    initialHistory.map((m) => ({ role: m.role, content: m.content }))
  )
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return

      const userMsg: Message = { role: 'user', content: text.trim() }
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setStreaming(true)
      setError(null)
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      try {
        const res = await fetch('/api/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text.trim() }),
        })

        if (!res.ok || !res.body) {
          throw new Error('Error al conectar con el coach')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: accumulated }
            return updated
          })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido'
        console.error('[ChatInterface]', msg)
        setError(msg)
        setMessages((prev) =>
          prev.filter((_, i) => i !== prev.length - 1 || prev[prev.length - 1].content !== '')
        )
      } finally {
        setStreaming(false)
        textareaRef.current?.focus()
      }
    },
    [streaming]
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden min-h-0">
      {/* Chat area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #1E4FD8, #4DA3FF)' }}
              >
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
              <h2 className="font-display font-bold text-navy text-lg mb-2">
                Tu coach de objetivos
              </h2>
              <p className="text-navy/50 font-body text-sm leading-relaxed">
                Preguntame sobre tu progreso, pedime que planifique tu semana o que sugiera tareas concretas para avanzar en tus objetivos de 2026.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              objectives={objectives}
              onTaskAdded={() => {}}
            />
          ))}

          {streaming && messages[messages.length - 1]?.content === '' && (
            <div className="flex items-end gap-2 justify-start">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1E4FD8, #4DA3FF)' }}
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
              <div className="bg-surface border border-beige rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-navy/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-navy/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-navy/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center">
              <p className="text-sm text-red-500 font-body">{error}</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-beige bg-cream px-4 py-3 space-y-2.5 shrink-0">
          <QuickPrompts onSelect={sendMessage} disabled={streaming} />
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              rows={1}
              placeholder="Escribí tu pregunta... (Enter para enviar)"
              className="flex-1 resize-none rounded-xl border border-beige bg-surface px-4 py-3 text-sm font-body text-navy placeholder:text-navy/30 focus:outline-none focus:border-brand transition-colors disabled:opacity-50 max-h-32"
              style={{ lineHeight: '1.5' }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={streaming || !input.trim()}
              className="shrink-0 w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center hover:bg-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Goal status panel — desktop only */}
      <GoalStatusPanel objectives={objectives} />
    </div>
  )
}

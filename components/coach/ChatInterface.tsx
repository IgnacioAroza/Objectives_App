'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { CoachMessage, SuggestedTask, Objective } from '@/lib/types'
import QuickPrompts from './QuickPrompts'
import SuggestedTaskCard from './SuggestedTaskCard'

type Message = Pick<CoachMessage, 'role' | 'content'>

type Props = {
  initialHistory: CoachMessage[]
  objectives: Pick<Objective, 'id' | 'title' | 'category'>[]
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

function MessageBubble({
  message,
  objectives,
  onTaskAdded,
}: {
  message: Message
  objectives: Props['objectives']
  onTaskAdded: () => void
}) {
  const isUser = message.role === 'user'
  const { text, tasks } = isUser ? { text: message.content, tasks: [] } : parseSuggestedTasks(message.content)

  const objectiveMap = Object.fromEntries(objectives.map(o => [o.id, o.title]))

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] md:max-w-[70%] space-y-2`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <span className="text-xs text-navy/40 font-body">Coach</span>
          </div>
        )}

        <div
          className={`px-4 py-3 rounded-2xl text-sm font-body leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-brand text-white rounded-tr-sm'
              : 'bg-white border border-beige text-navy rounded-tl-sm'
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
    initialHistory.map(m => ({ role: m.role, content: m.content }))
  )
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return

    const userMsg: Message = { role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)
    setError(null)

    // Placeholder del asistente mientras streamea
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

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
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: accumulated }
          return updated
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      console.error('[ChatInterface]', msg)
      setError(msg)
      // Quitar placeholder vacío
      setMessages(prev => prev.filter((_, i) => i !== prev.length - 1 || prev[prev.length - 1].content !== ''))
    } finally {
      setStreaming(false)
      textareaRef.current?.focus()
    }
  }, [streaming])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
            <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <h2 className="font-display font-bold text-navy text-lg mb-2">Tu coach de objetivos</h2>
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
          <div className="flex justify-start">
            <div className="bg-white border border-beige rounded-2xl rounded-tl-sm px-4 py-3">
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
      <div className="border-t border-beige bg-cream px-4 py-3 space-y-3">
        <QuickPrompts onSelect={sendMessage} disabled={streaming} />

        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            rows={1}
            placeholder="Escribí tu pregunta... (Enter para enviar)"
            className="flex-1 resize-none rounded-xl border border-beige bg-white px-4 py-3 text-sm font-body text-navy placeholder:text-navy/30 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors disabled:opacity-50 max-h-32"
            style={{ lineHeight: '1.5' }}
            onInput={e => {
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
  )
}

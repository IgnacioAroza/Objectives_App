'use client'

import { useState } from 'react'
import type { Task } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import TaskModal from '@/components/objectives/TaskModal'
import { formatDate, getPriorityLabel } from '@/lib/utils'

type TaskItemProps = {
  task: Task
  onCompleted?: (taskId: string) => void
}

export default function TaskItem({ task, onCompleted }: TaskItemProps) {
  const [showModal, setShowModal] = useState(false)

  const priorityVariants: Record<number, 'priority-high' | 'priority-mid' | 'priority-low'> = {
    1: 'priority-high',
    2: 'priority-mid',
    3: 'priority-low',
  }

  return (
    <>
      <div
        className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
          task.done
            ? 'bg-beige/30 border-beige opacity-60'
            : 'bg-white border-navy/10 hover:border-navy/20'
        }`}
      >
        <button
          onClick={() => !task.done && setShowModal(true)}
          disabled={task.done}
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 transition-colors flex items-center justify-center ${
            task.done
              ? 'border-brand bg-brand text-white'
              : 'border-navy/30 hover:border-brand'
          }`}
          aria-label={task.done ? 'Completada' : 'Marcar como completada'}
        >
          {task.done && <span className="text-[10px]">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-body text-navy leading-snug ${
              task.done ? 'line-through text-navy/50' : ''
            }`}
          >
            {task.title}
          </p>
          {task.note && task.done && (
            <p className="text-xs text-navy/50 font-body mt-1 italic">{task.note}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={priorityVariants[task.priority]}>
              {getPriorityLabel(task.priority)}
            </Badge>
            {task.due_date && (
              <span className="text-xs text-navy/40 font-body">
                {formatDate(task.due_date)}
              </span>
            )}
            {task.done && task.done_at && (
              <span className="text-xs text-navy/40 font-body">
                Completada {formatDate(task.done_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      <TaskModal
        task={task}
        open={showModal}
        onClose={() => setShowModal(false)}
        onCompleted={(taskId: string) => {
          setShowModal(false)
          onCompleted?.(taskId)
        }}
      />
    </>
  )
}

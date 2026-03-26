import Link from 'next/link'
import type { TaskWithObjective } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import { formatDateShort, getPriorityLabel } from '@/lib/utils'

type UpcomingTasksProps = {
  tasks: TaskWithObjective[]
}

export default function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white border border-navy/10 rounded-2xl p-5">
        <h3 className="text-xs font-medium text-navy/50 uppercase tracking-wider font-body mb-3">
          Tareas próximas (7 días)
        </h3>
        <p className="text-sm text-navy/40 font-body">Sin tareas con vencimiento próximo.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-navy/10 rounded-2xl p-5">
      <h3 className="text-xs font-medium text-navy/50 uppercase tracking-wider font-body mb-3">
        Tareas próximas (7 días)
      </h3>
      <div className="space-y-2">
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/objectives/${task.objective_id}`}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-beige transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body text-navy truncate">{task.title}</p>
              <div className="flex items-center gap-2 mt-1">
                {task.objectives && (
                  <Badge variant={task.objectives.category}>{task.objectives.title}</Badge>
                )}
                <Badge
                  variant={
                    task.priority === 1
                      ? 'priority-high'
                      : task.priority === 2
                        ? 'priority-mid'
                        : 'priority-low'
                  }
                >
                  {getPriorityLabel(task.priority)}
                </Badge>
              </div>
            </div>
            {task.due_date && (
              <span className="text-xs text-navy/40 font-body shrink-0">
                {formatDateShort(task.due_date)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

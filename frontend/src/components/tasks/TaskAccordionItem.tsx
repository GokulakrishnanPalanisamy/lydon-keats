import { useState } from 'react'
import Badge from '../ui/Badge'
import { MinusIcon, PlusIcon } from '../icons/Icons'
import { formatDuration, formatTotalMinutes } from '../../utils/formatDuration'
import type { Task } from '../../types'

export default function TaskAccordionItem({
  task,
  index,
  onEdit,
  onDelete,
}: {
  task: Task
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="task-accordion-item">
      <button
        type="button"
        className="task-accordion-header"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <span className="task-accordion-title">
          <span className="task-accordion-number">{index}.</span>
          {task.name}
        </span>
        <span className="task-accordion-toggle">{expanded ? <MinusIcon /> : <PlusIcon />}</span>
      </button>

      {expanded && (
        <div className="task-accordion-body">
          <div className="task-accordion-row">
            <span className="task-accordion-label">Description</span>
            <p>{task.description}</p>
          </div>

          <div className="task-accordion-row">
            <span className="task-accordion-label">Work Tags</span>
            <div className="tag-pills">
              {task.work_tags.length === 0 ? (
                <span className="muted">—</span>
              ) : (
                task.work_tags.map((tag) => (
                  <Badge key={tag.id} tone="neutral">
                    {tag.name}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="task-accordion-row">
            <span className="task-accordion-label">Frequency</span>
            <div>
              {task.frequency ? (
                <Badge tone="neutral">{task.frequency.name}</Badge>
              ) : (
                <span className="muted">—</span>
              )}
            </div>
          </div>

          <div className="task-accordion-row">
            <span className="task-accordion-label">Subtasks</span>
            <ul className="subtask-list">
              {task.subtasks.map((subtask, subtaskIndex) => (
                <li key={subtask.id} className="subtask-list-item">
                  <div className="subtask-list-row">
                    <span className="subtask-number">
                      {index}.{subtaskIndex + 1}
                    </span>
                    <span className="subtask-name">{subtask.name}</span>
                    <span className="subtask-time">
                      {formatDuration(subtask.estimated_time, subtask.estimated_time_unit)}
                    </span>
                  </div>
                  {subtask.description && <p className="subtask-description">{subtask.description}</p>}
                </li>
              ))}
            </ul>
          </div>

          <div className="task-accordion-total">
            Total Estimated Time: {formatTotalMinutes(task.total_estimated_minutes)}
          </div>

          <div className="task-accordion-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit}>
              Edit
            </button>
            <button type="button" className="btn btn-ghost btn-sm btn-danger-text" onClick={onDelete}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import DashboardLayout from '../components/layout/DashboardLayout'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { ClipboardIcon } from '../components/icons/Icons'
import { useToast } from '../context/ToastContext'
import { formatDuration, formatTotalMinutes } from '../utils/formatDuration'
import type { TaskStatus, TechnicianTask } from '../types'

const STATUS_LABELS: Record<TaskStatus, string> = {
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
}

const STATUS_TONES: Record<TaskStatus, 'neutral' | 'warning' | 'success'> = {
  assigned: 'neutral',
  in_progress: 'warning',
  completed: 'success',
}

export default function TechnicianTaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const { notify } = useToast()

  const [task, setTask] = useState<TechnicianTask | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [updating, setUpdating] = useState(false)

  function loadTask() {
    setLoading(true)
    setError(false)

    api
      .get<{ task: TechnicianTask }>(`/technician/tasks/${taskId}`)
      .then((data) => setTask(data.task))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  // Intentional: resetting state synchronously here (inside loadTask, via
  // setLoading/setError) guarantees the previous task's data never flashes
  // on screen while the new task is loading.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTask()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  async function updateStatus(status: TaskStatus) {
    setUpdating(true)

    try {
      const data = await api.put<{ task: TechnicianTask }>(`/technician/tasks/${taskId}/status`, { status })
      setTask(data.task)
      notify('success', status === 'in_progress' ? 'Task started.' : 'Task completed.')
    } catch (err) {
      notify('error', err instanceof ApiError ? err.message : 'Could not update the task.')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <DashboardLayout title="Task Details" breadcrumb={['Home', 'My Tasks', 'Task Details']}>
      {loading ? (
        <Spinner center />
      ) : error || !task ? (
        <EmptyState
          icon={<ClipboardIcon />}
          title="Unable to load task."
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={loadTask}>
              Try Again
            </button>
          }
        />
      ) : (
        <div className="card task-detail">
          <div className="task-detail-header">
            <h2>{task.name}</h2>
            <Badge tone={STATUS_TONES[task.status]}>{STATUS_LABELS[task.status]}</Badge>
          </div>

          <div className="task-accordion-row">
            <span className="task-accordion-label">Description</span>
            <p>{task.description}</p>
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
            <span className="task-accordion-label">Estimated Time</span>
            <p>{formatTotalMinutes(task.total_estimated_minutes)}</p>
          </div>

          <div className="task-accordion-row">
            <span className="task-accordion-label">Subtasks</span>
            <ul className="subtask-list">
              {task.subtasks.map((subtask, subtaskIndex) => (
                <li key={subtask.id} className="subtask-list-item">
                  <div className="subtask-list-row">
                    <span className="subtask-number">1.{subtaskIndex + 1}</span>
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

          <div className="task-detail-actions">
            <Link to="/technician/tasks" className="btn btn-ghost">
              ← Back to My Tasks
            </Link>

            {task.status === 'assigned' && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={updating}
                onClick={() => updateStatus('in_progress')}
              >
                {updating ? 'Starting...' : 'Start Task'}
              </button>
            )}

            {task.status === 'in_progress' && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={updating}
                onClick={() => updateStatus('completed')}
              >
                {updating ? 'Completing...' : 'Complete Task'}
              </button>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

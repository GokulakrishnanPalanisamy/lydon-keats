import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import DashboardLayout from '../components/layout/DashboardLayout'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import TaskBuilderTaskCard from '../components/tasks/TaskBuilderTaskCard'
import type { BuilderSubtask, BuilderTask } from '../components/tasks/builderTypes'
import { PlusIcon } from '../components/icons/Icons'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatTotalMinutes } from '../utils/formatDuration'
import type { Frequency, Task, TechnicianSummary, WorkTag } from '../types'

// Module-level (not a React ref) so unique keys can be generated during the
// initial render, e.g. inside useState([newTask()]).
let nextBuilderKey = 0

function newSubtask(): BuilderSubtask {
  nextBuilderKey += 1
  return { key: `subtask-${nextBuilderKey}`, name: '', description: '', hours: '', minutes: '' }
}

function newTask(): BuilderTask {
  nextBuilderKey += 1
  return {
    key: `task-${nextBuilderKey}`,
    name: '',
    description: '',
    work_tag_ids: [],
    frequency_id: '',
    technician_ids: [],
    subtasks: [newSubtask()],
  }
}

/** Maps an already-saved task from the API into an editable builder row. */
function taskToBuilderTask(task: Task): BuilderTask {
  nextBuilderKey += 1

  return {
    key: `task-${nextBuilderKey}`,
    id: task.id,
    name: task.name,
    description: task.description,
    work_tag_ids: task.work_tags.map((tag) => tag.id),
    frequency_id: task.frequency ? String(task.frequency.id) : '',
    technician_ids: task.technician_ids,
    subtasks:
      task.subtasks.length > 0
        ? task.subtasks.map((subtask) => {
            nextBuilderKey += 1
            // Normalize whatever unit it was stored in (old data may be
            // hours-only) into separate hours + minutes for editing.
            const totalMinutes =
              subtask.estimated_time_unit === 'hours' ? subtask.estimated_time * 60 : subtask.estimated_time

            return {
              key: `subtask-${nextBuilderKey}`,
              name: subtask.name,
              description: subtask.description ?? '',
              hours: String(Math.floor(totalMinutes / 60)),
              minutes: String(totalMinutes % 60),
            }
          })
        : [newSubtask()],
  }
}

/**
 * Unified Task Builder: this single page both lists every saved task (as
 * editable rows, no separate view/edit modal) and lets an admin stage new
 * ones alongside them. Numbering (1, 1.1, 1.2, 2, 2.1 ...) is derived purely
 * from array position at render time — it is never stored on the task or
 * subtask objects. Saving submits every row (creates + edits) in one bulk
 * request; deleting a saved row calls the real delete endpoint immediately,
 * while removing an unsaved draft just drops it from local state.
 */
export default function TaskBuilderPage() {
  const { account } = useAuth()
  const { notify } = useToast()

  const [workTags, setWorkTags] = useState<WorkTag[]>([])
  const [frequencies, setFrequencies] = useState<Frequency[]>([])
  const [technicians, setTechnicians] = useState<TechnicianSummary[]>([])
  const [loading, setLoading] = useState(true)

  const [tasks, setTasks] = useState<BuilderTask[]>([])
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<BuilderTask | null>(null)
  const [deleting, setDeleting] = useState(false)

  function loadAll() {
    if (!account || account.type !== 'admin') {
      return
    }

    Promise.all([
      api.get<{ tasks: Task[] }>('/tasks'),
      api.get<{ work_tags: WorkTag[] }>('/work-tags'),
      api.get<{ frequencies: Frequency[] }>('/frequencies'),
      // Technician search with no query returns every technician
      // system-wide, filtered here to this organization's — there's no
      // dedicated "my org's technicians" endpoint.
      api.get<{ technicians: TechnicianSummary[] }>('/admin/technicians?search='),
    ])
      .then(([taskData, tagData, frequencyData, technicianData]) => {
        setTasks(taskData.tasks.length > 0 ? taskData.tasks.map(taskToBuilderTask) : [newTask()])
        setWorkTags(tagData.work_tags)
        setFrequencies(frequencyData.frequencies)
        setTechnicians(
          technicianData.technicians.filter((technician) =>
            technician.organizations?.some((organization) => organization.id === account.organization.id),
          ),
        )
        setErrors({})
      })
      .catch((error) => notify('error', error instanceof ApiError ? error.message : 'Could not load tasks.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addTask() {
    setTasks((current) => [...current, newTask()])
  }

  function removeTaskLocal(taskKey: string) {
    setTasks((current) => current.filter((task) => task.key !== taskKey))
  }

  /** A saved task needs a real, confirmed delete; an unsaved draft can just be dropped. */
  function requestRemoveTask(task: BuilderTask) {
    if (task.id) {
      setPendingDelete(task)
    } else {
      removeTaskLocal(task.key)
    }
  }

  async function confirmDeleteTask() {
    if (!pendingDelete?.id) {
      return
    }

    setDeleting(true)

    try {
      await api.delete(`/admin/tasks/${pendingDelete.id}`)
      removeTaskLocal(pendingDelete.key)
      notify('success', 'Task deleted.')
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'Could not delete task.')
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  function updateTask(taskKey: string, patch: Partial<BuilderTask>) {
    setTasks((current) => current.map((task) => (task.key === taskKey ? { ...task, ...patch } : task)))
  }

  function addSubtask(taskKey: string) {
    setTasks((current) =>
      current.map((task) => (task.key === taskKey ? { ...task, subtasks: [...task.subtasks, newSubtask()] } : task)),
    )
  }

  function updateSubtask(taskKey: string, subtaskKey: string, patch: Partial<BuilderSubtask>) {
    setTasks((current) =>
      current.map((task) =>
        task.key === taskKey
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask) =>
                subtask.key === subtaskKey ? { ...subtask, ...patch } : subtask,
              ),
            }
          : task,
      ),
    )
  }

  function removeSubtask(taskKey: string, subtaskKey: string) {
    setTasks((current) =>
      current.map((task) => {
        if (task.key !== taskKey) {
          return task
        }
        if (task.subtasks.length <= 1) {
          notify('error', 'A task must contain at least one subtask.')
          return task
        }
        return { ...task, subtasks: task.subtasks.filter((subtask) => subtask.key !== subtaskKey) }
      }),
    )
  }

  function resetSubtask(taskKey: string, subtaskKey: string) {
    setTasks((current) =>
      current.map((task) =>
        task.key === taskKey
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask) =>
                subtask.key === subtaskKey
                  ? { ...subtask, name: '', description: '', hours: '', minutes: '' }
                  : subtask,
              ),
            }
          : task,
      ),
    )
  }

  function subtaskMinutes(subtask: BuilderSubtask): number {
    return (Number(subtask.hours) || 0) * 60 + (Number(subtask.minutes) || 0)
  }

  function taskMinutes(task: BuilderTask): number {
    return task.subtasks.reduce((sum, subtask) => sum + subtaskMinutes(subtask), 0)
  }

  // Purely derived from the current tasks/frequencies state — recomputed on
  // every render, so adding, editing, or deleting a task updates it live.
  // Only frequencies with at least one assigned task are shown.
  const frequencySummary = frequencies
    .map((frequency) => {
      const matching = tasks
        .map((task, index) => ({ task, number: index + 1 }))
        .filter(({ task }) => task.frequency_id === String(frequency.id))

      return {
        frequency,
        numbers: matching.map(({ number }) => number),
        totalMinutes: matching.reduce((sum, { task }) => sum + taskMinutes(task), 0),
      }
    })
    .filter((group) => group.numbers.length > 0)

  /** Turns the first `tasks.<i>[.subtasks.<j>].<field>` error key into a human-readable, 1-indexed summary. */
  function summarizeFirstError(apiErrors: Record<string, string[]>): string | null {
    const keys = Object.keys(apiErrors)
    if (keys.length === 0) {
      return null
    }

    const subtaskMatch = keys[0].match(/^tasks\.(\d+)\.subtasks\.(\d+)\./)
    if (subtaskMatch) {
      const taskNumber = Number(subtaskMatch[1]) + 1
      const subtaskNumber = Number(subtaskMatch[2]) + 1
      return `Task ${taskNumber} → Subtask ${taskNumber}.${subtaskNumber}: ${apiErrors[keys[0]][0]}`
    }

    const taskMatch = keys[0].match(/^tasks\.(\d+)\./)
    if (taskMatch) {
      const taskNumber = Number(taskMatch[1]) + 1
      return `Task ${taskNumber}: ${apiErrors[keys[0]][0]}`
    }

    return apiErrors[keys[0]][0]
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving) {
      return
    }
    setErrors({})

    for (const [taskIndex, task] of tasks.entries()) {
      const invalidSubtask = task.subtasks.some((subtask) => subtaskMinutes(subtask) <= 0)
      if (invalidSubtask) {
        notify('error', `Task ${taskIndex + 1}: enter an estimated time (hours and/or minutes) for every subtask.`)
        return
      }
    }

    setSaving(true)

    const payload = {
      tasks: tasks.map((task) => ({
        id: task.id ?? null,
        name: task.name,
        description: task.description,
        work_tag_ids: task.work_tag_ids,
        frequency_id: task.frequency_id === '' ? null : Number(task.frequency_id),
        subtasks: task.subtasks.map((subtask) => ({
          name: subtask.name,
          description: subtask.description.trim() === '' ? null : subtask.description,
          estimated_time: subtaskMinutes(subtask),
          estimated_time_unit: 'minutes',
        })),
        technician_ids: task.technician_ids,
      })),
    }

    try {
      const data = await api.post<{ message: string; count: number }>('/admin/tasks/bulk', payload)
      notify('success', data.message ?? `${data.count} task(s) saved.`)
      loadAll()
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setErrors(error.errors)
        const summary = summarizeFirstError(error.errors)
        notify('error', summary ?? 'Please fix the highlighted fields.')
      } else {
        notify('error', error instanceof ApiError ? error.message : 'Could not save the tasks. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="Task Builder" breadcrumb={['Home', 'Tasks']}>
      {frequencySummary.length > 0 && (
        <div className="task-frequency-summary">
          {frequencySummary.map(({ frequency, numbers, totalMinutes }) => (
            <div key={frequency.id} className="task-frequency-summary-row">
              <div className="task-frequency-summary-box">
                <span className="task-frequency-summary-label">
                  {frequency.name}({frequency.name.charAt(0).toUpperCase()})
                </span>
                <span className="task-frequency-summary-value">{numbers.join(',')},</span>
              </div>
              <div className="task-frequency-summary-box">
                <span className="task-frequency-summary-label">Time</span>
                <span className="task-frequency-summary-value">{formatTotalMinutes(totalMinutes)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="task-builder">
        {loading ? (
          <p className="muted">Loading tasks…</p>
        ) : (
          <div className="task-builder-panel">
            <div className="task-builder-scroll">
              {tasks.map((task, taskIndex) => (
                <TaskBuilderTaskCard
                  key={task.key}
                  task={task}
                  taskIndex={taskIndex}
                  workTags={workTags}
                  frequencies={frequencies}
                  technicians={technicians}
                  errors={errors}
                  onChange={(patch) => updateTask(task.key, patch)}
                  onRemove={() => requestRemoveTask(task)}
                  onAddSubtask={() => addSubtask(task.key)}
                  onUpdateSubtask={(subtaskKey, patch) => updateSubtask(task.key, subtaskKey, patch)}
                  onRemoveSubtask={(subtaskKey) => removeSubtask(task.key, subtaskKey)}
                  onResetSubtask={(subtaskKey) => resetSubtask(task.key, subtaskKey)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="task-builder-footer">
          <button type="button" className="btn btn-secondary" onClick={addTask} disabled={loading}>
            <PlusIcon /> Add Task
          </button>

          <div className="task-builder-footer-actions">
            <button type="button" className="btn btn-ghost" onClick={loadAll} disabled={loading || saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || loading}>
              {saving ? 'Saving…' : 'Save All Tasks'}
            </button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete task?"
        description={pendingDelete ? `"${pendingDelete.name}" will be permanently deleted.` : undefined}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        tone="danger"
        onConfirm={confirmDeleteTask}
        onCancel={() => setPendingDelete(null)}
      />
    </DashboardLayout>
  )
}

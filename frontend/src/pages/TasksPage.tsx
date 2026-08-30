import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import DashboardLayout from '../components/layout/DashboardLayout'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import MultiSelectDropdown from '../components/ui/MultiSelectDropdown'
import Spinner from '../components/ui/Spinner'
import TaskAccordionItem from '../components/tasks/TaskAccordionItem'
import { ClipboardIcon, PlusIcon, TrashIcon } from '../components/icons/Icons'
import { useToast } from '../context/ToastContext'
import { formatTotalMinutes } from '../utils/formatDuration'
import type { Frequency, Task, WorkTag } from '../types'

interface SubtaskFormRow {
  key: string
  name: string
  description: string
  hours: string
  minutes: string
}

export default function TasksPage() {
  const { notify } = useToast()

  const [tasks, setTasks] = useState<Task[]>([])
  const [workTags, setWorkTags] = useState<WorkTag[]>([])
  const [frequencies, setFrequencies] = useState<Frequency[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [frequencyId, setFrequencyId] = useState('')
  const [subtaskRows, setSubtaskRows] = useState<SubtaskFormRow[]>([])
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)

  const nextRowKey = useRef(0)

  function newSubtaskRow(): SubtaskFormRow {
    nextRowKey.current += 1
    return { key: `row-${nextRowKey.current}`, name: '', description: '', hours: '', minutes: '' }
  }

  useEffect(() => {
    Promise.all([
      api.get<{ tasks: Task[] }>('/tasks'),
      api.get<{ work_tags: WorkTag[] }>('/work-tags'),
      api.get<{ frequencies: Frequency[] }>('/frequencies'),
    ])
      .then(([taskData, tagData, frequencyData]) => {
        setTasks(taskData.tasks)
        setWorkTags(tagData.work_tags)
        setFrequencies(frequencyData.frequencies)
      })
      .catch((error) => notify('error', error instanceof ApiError ? error.message : 'Could not load tasks.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreate() {
    setEditing(null)
    setName('')
    setDescription('')
    setSelectedTagIds([])
    setFrequencyId('')
    setSubtaskRows([newSubtaskRow()])
    setErrors({})
    setFormOpen(true)
  }

  function openEdit(task: Task) {
    setEditing(task)
    setName(task.name)
    setDescription(task.description)
    setSelectedTagIds(task.work_tags.map((tag) => tag.id))
    setFrequencyId(task.frequency ? String(task.frequency.id) : '')
    setSubtaskRows(
      task.subtasks.length > 0
        ? task.subtasks.map((subtask) => {
            nextRowKey.current += 1
            // Normalize whatever unit it was stored in (old data may be
            // hours-only) into separate hours + minutes for editing.
            const totalMinutes =
              subtask.estimated_time_unit === 'hours' ? subtask.estimated_time * 60 : subtask.estimated_time

            return {
              key: `row-${nextRowKey.current}`,
              name: subtask.name,
              description: subtask.description ?? '',
              hours: String(Math.floor(totalMinutes / 60)),
              minutes: String(totalMinutes % 60),
            }
          })
        : [newSubtaskRow()],
    )
    setErrors({})
    setFormOpen(true)
  }

  function addSubtaskRow() {
    setSubtaskRows((current) => [...current, newSubtaskRow()])
  }

  function updateSubtaskRow(key: string, patch: Partial<SubtaskFormRow>) {
    setSubtaskRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function removeSubtaskRow(key: string) {
    if (subtaskRows.length <= 1) {
      notify('error', 'A task must contain at least one subtask.')
      return
    }
    setSubtaskRows((current) => current.filter((row) => row.key !== key))
  }

  function subtaskRowMinutes(row: SubtaskFormRow): number {
    return (Number(row.hours) || 0) * 60 + (Number(row.minutes) || 0)
  }

  const formTotalMinutes = subtaskRows.reduce((sum, row) => sum + subtaskRowMinutes(row), 0)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})

    if (subtaskRows.length === 0) {
      notify('error', 'At least one subtask is required.')
      return
    }

    if (subtaskRows.some((row) => subtaskRowMinutes(row) <= 0)) {
      notify('error', 'Enter an estimated time (hours and/or minutes) for every subtask.')
      return
    }

    setSaving(true)

    const payload = {
      name,
      description,
      work_tag_ids: selectedTagIds,
      frequency_id: frequencyId === '' ? null : Number(frequencyId),
      subtasks: subtaskRows.map((row) => ({
        name: row.name,
        description: row.description.trim() === '' ? null : row.description,
        // Hours + minutes are combined into one total (e.g. 1h30m -> 90)
        // and always stored in minutes — see formatDuration for how this
        // is displayed back as combined hours/minutes regardless of unit.
        estimated_time: subtaskRowMinutes(row),
        estimated_time_unit: 'minutes',
      })),
    }

    try {
      if (editing) {
        const data = await api.put<{ task: Task }>(`/admin/tasks/${editing.id}`, payload)
        setTasks((current) => current.map((task) => (task.id === editing.id ? data.task : task)))
        notify('success', 'Task updated.')
      } else {
        const data = await api.post<{ task: Task }>('/admin/tasks', payload)
        setTasks((current) => [data.task, ...current])
        notify('success', 'Task created.')
      }
      setFormOpen(false)
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setErrors(error.errors)
        const subtaskErrorKey = Object.keys(error.errors).find((key) => key.startsWith('subtasks'))
        if (subtaskErrorKey) {
          notify('error', error.errors[subtaskErrorKey][0])
        }
      } else {
        notify('error', error instanceof ApiError ? error.message : 'Something went wrong.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return
    }

    setDeleting(true)

    try {
      await api.delete(`/admin/tasks/${pendingDelete.id}`)
      setTasks((current) => current.filter((task) => task.id !== pendingDelete.id))
      notify('success', 'Task deleted.')
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'Could not delete task.')
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  return (
    <DashboardLayout title="Tasks" breadcrumb={['Home', 'Tasks']}>
      <div className="card">
        <div className="card-header">
          <h2>Tasks</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
            <PlusIcon /> Create Task
          </button>
        </div>

        {loading ? (
          <Spinner center />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<ClipboardIcon />}
            title="No tasks yet"
            description="Create your first task, break it into subtasks, and tag it with the relevant work tags."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
                Create Task
              </button>
            }
          />
        ) : (
          <div className="task-accordion-list">
            {tasks.map((task, taskIndex) => (
              <TaskAccordionItem
                key={task.id}
                task={task}
                index={taskIndex + 1}
                onEdit={() => openEdit(task)}
                onDelete={() => setPendingDelete(task)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal open={formOpen} title={editing ? 'Edit Task' : 'Create Task'} onClose={() => setFormOpen(false)} wide>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} autoFocus required />
            {errors.name && <span className="field-error">{errors.name[0]}</span>}
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              required
            />
            {errors.description && <span className="field-error">{errors.description[0]}</span>}
          </label>

          <label>
            Work Tags
            <MultiSelectDropdown
              options={workTags.map((tag) => ({ id: tag.id, label: tag.name }))}
              selectedIds={selectedTagIds}
              onChange={setSelectedTagIds}
              placeholder="Select Work Tags"
              emptyMessage="No work tags yet — create one from the Work Tags page first."
            />
          </label>

          <label>
            Frequency
            <select value={frequencyId} onChange={(event) => setFrequencyId(event.target.value)} required>
              <option value="" disabled>
                {frequencies.length === 0 ? 'No frequencies yet' : 'Select a frequency'}
              </option>
              {frequencies.map((frequency) => (
                <option key={frequency.id} value={frequency.id}>
                  {frequency.name}
                </option>
              ))}
            </select>
            {errors.frequency_id && <span className="field-error">{errors.frequency_id[0]}</span>}
            {frequencies.length === 0 && (
              <span className="field-hint">Create a frequency from the Frequencies page first.</span>
            )}
          </label>

          <label>
            Subtasks
            {errors.subtasks && <span className="field-error">{errors.subtasks[0]}</span>}
            <div className="subtask-form-list">
              {subtaskRows.map((row, rowIndex) => (
                <div key={row.key} className="subtask-form-card">
                  <div className="subtask-form-card-header">
                    <span className="subtask-form-card-title">Subtask {rowIndex + 1}</span>
                    <button
                      type="button"
                      className="subtask-form-remove"
                      onClick={() => removeSubtaskRow(row.key)}
                    >
                      <TrashIcon /> Remove
                    </button>
                  </div>

                  <input
                    className="subtask-form-name"
                    placeholder="Subtask name"
                    value={row.name}
                    onChange={(event) => updateSubtaskRow(row.key, { name: event.target.value })}
                    required
                  />

                  <input
                    className="subtask-form-description"
                    placeholder="Description (optional)"
                    value={row.description}
                    onChange={(event) => updateSubtaskRow(row.key, { description: event.target.value })}
                  />

                  <div className="subtask-form-time-row">
                    <label className="subtask-form-time-field">
                      Hours
                      <input
                        type="number"
                        min={0}
                        value={row.hours}
                        onChange={(event) => updateSubtaskRow(row.key, { hours: event.target.value })}
                      />
                    </label>
                    <label className="subtask-form-time-field">
                      Minutes
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={row.minutes}
                        onChange={(event) => updateSubtaskRow(row.key, { minutes: event.target.value })}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="btn btn-secondary btn-sm" onClick={addSubtaskRow}>
              <PlusIcon /> Add Subtask
            </button>

            <div className="subtask-form-total">Total Estimated Time: {formatTotalMinutes(formTotalMinutes)}</div>
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete task?"
        description={pendingDelete ? `"${pendingDelete.name}" will be permanently deleted.` : undefined}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </DashboardLayout>
  )
}

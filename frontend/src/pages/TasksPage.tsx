import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import DashboardLayout from '../components/layout/DashboardLayout'
import Badge from '../components/ui/Badge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import MultiSelectDropdown from '../components/ui/MultiSelectDropdown'
import Spinner from '../components/ui/Spinner'
import { ClipboardIcon, PlusIcon } from '../components/icons/Icons'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../utils/formatDate'
import type { Frequency, Task, WorkTag } from '../types'

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
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)

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
    setErrors({})
    setFormOpen(true)
  }

  function openEdit(task: Task) {
    setEditing(task)
    setName(task.name)
    setDescription(task.description)
    setSelectedTagIds(task.work_tags.map((tag) => tag.id))
    setFrequencyId(task.frequency ? String(task.frequency.id) : '')
    setErrors({})
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    setSaving(true)

    const payload = {
      name,
      description,
      work_tag_ids: selectedTagIds,
      frequency_id: frequencyId === '' ? null : Number(frequencyId),
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
            description="Create your first task and tag it with the relevant work tags."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
                Create Task
              </button>
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Tags</th>
                  <th>Frequency</th>
                  <th>Created At</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.name}</td>
                    <td className="truncate">{task.description}</td>
                    <td>
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
                    </td>
                    <td>
                      {task.frequency ? (
                        <Badge tone="neutral">{task.frequency.name}</Badge>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>{formatDate(task.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(task)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-danger-text"
                          onClick={() => setPendingDelete(task)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={formOpen} title={editing ? 'Edit Task' : 'Create Task'} onClose={() => setFormOpen(false)}>
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
              rows={4}
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

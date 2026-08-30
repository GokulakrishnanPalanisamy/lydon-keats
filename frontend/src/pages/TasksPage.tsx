import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import DashboardLayout from '../components/layout/DashboardLayout'
import Badge from '../components/ui/Badge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import { ClipboardIcon, PlusIcon } from '../components/icons/Icons'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../utils/formatDate'
import type { Task, WorkTag } from '../types'

const TAG_SEARCH_THRESHOLD = 6

export default function TasksPage() {
  const { notify } = useToast()

  const [tasks, setTasks] = useState<Task[]>([])
  const [workTags, setWorkTags] = useState<WorkTag[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [tagQuery, setTagQuery] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.all([api.get<{ tasks: Task[] }>('/tasks'), api.get<{ work_tags: WorkTag[] }>('/work-tags')])
      .then(([taskData, tagData]) => {
        setTasks(taskData.tasks)
        setWorkTags(tagData.work_tags)
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
    setTagQuery('')
    setErrors({})
    setFormOpen(true)
  }

  function openEdit(task: Task) {
    setEditing(task)
    setName(task.name)
    setDescription(task.description)
    setSelectedTagIds(task.work_tags.map((tag) => tag.id))
    setTagQuery('')
    setErrors({})
    setFormOpen(true)
  }

  function toggleTag(tagId: number) {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    setSaving(true)

    const payload = { name, description, work_tag_ids: selectedTagIds }

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

  const filteredTags =
    workTags.length > TAG_SEARCH_THRESHOLD && tagQuery.trim() !== ''
      ? workTags.filter((tag) => tag.name.toLowerCase().includes(tagQuery.trim().toLowerCase()))
      : workTags

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

          <div className="tag-select">
            <span className="tag-select-label">Work Tags</span>

            {workTags.length > TAG_SEARCH_THRESHOLD && (
              <input
                type="text"
                className="tag-select-search"
                placeholder="Search work tags"
                value={tagQuery}
                onChange={(event) => setTagQuery(event.target.value)}
              />
            )}

            {workTags.length === 0 ? (
              <p className="muted">No work tags yet — create one from the Work Tags page first.</p>
            ) : (
              <div className="tag-select-options">
                {filteredTags.map((tag) => {
                  const checked = selectedTagIds.includes(tag.id)

                  return (
                    <label key={tag.id} className={`tag-select-option${checked ? ' selected' : ''}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleTag(tag.id)} />
                      {tag.name}
                    </label>
                  )
                })}
              </div>
            )}
          </div>

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

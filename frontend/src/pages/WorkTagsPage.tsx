import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import DashboardLayout from '../components/layout/DashboardLayout'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import { PlusIcon, TagIcon } from '../components/icons/Icons'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../utils/formatDate'
import type { WorkTag } from '../types'

export default function WorkTagsPage() {
  const { notify } = useToast()

  const [tags, setTags] = useState<WorkTag[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<WorkTag | null>(null)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<WorkTag | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api
      .get<{ work_tags: WorkTag[] }>('/work-tags')
      .then((data) => setTags(data.work_tags))
      .catch((error) => notify('error', error instanceof ApiError ? error.message : 'Could not load work tags.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreate() {
    setEditing(null)
    setName('')
    setNameError(null)
    setFormOpen(true)
  }

  function openEdit(tag: WorkTag) {
    setEditing(tag)
    setName(tag.name)
    setNameError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setNameError(null)
    setSaving(true)

    try {
      if (editing) {
        const data = await api.put<{ work_tag: WorkTag }>(`/admin/work-tags/${editing.id}`, { name })
        setTags((current) => current.map((tag) => (tag.id === editing.id ? data.work_tag : tag)))
        notify('success', 'Work tag updated.')
      } else {
        const data = await api.post<{ work_tag: WorkTag }>('/admin/work-tags', { name })
        setTags((current) => [...current, data.work_tag].sort((a, b) => a.name.localeCompare(b.name)))
        notify('success', 'Work tag created.')
      }
      setFormOpen(false)
    } catch (error) {
      if (error instanceof ApiError && error.errors?.name) {
        setNameError(error.errors.name[0])
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
      await api.delete(`/admin/work-tags/${pendingDelete.id}`)
      setTags((current) => current.filter((tag) => tag.id !== pendingDelete.id))
      notify('success', 'Work tag deleted.')
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'Could not delete work tag.')
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  return (
    <DashboardLayout title="Work Tags" breadcrumb={['Home', 'Work Tags']}>
      <div className="card">
        <div className="card-header">
          <h2>Organization Work Tags</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
            <PlusIcon /> Add Work Tag
          </button>
        </div>

        {loading ? (
          <Spinner center />
        ) : tags.length === 0 ? (
          <EmptyState
            icon={<TagIcon />}
            title="No work tags yet"
            description="Create work tags to categorize the tasks in your organization."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
                Add Work Tag
              </button>
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Tag Name</th>
                  <th>Created At</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id}>
                    <td>{tag.name}</td>
                    <td>{formatDate(tag.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(tag)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-danger-text"
                          onClick={() => setPendingDelete(tag)}
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

      <Modal open={formOpen} title={editing ? 'Edit Work Tag' : 'Add Work Tag'} onClose={() => setFormOpen(false)}>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Tag Name
            <input value={name} onChange={(event) => setName(event.target.value)} autoFocus required />
            {nameError && <span className="field-error">{nameError}</span>}
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Work Tag'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete work tag?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will be removed from any tasks that use it. This cannot be undone.`
            : undefined
        }
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </DashboardLayout>
  )
}

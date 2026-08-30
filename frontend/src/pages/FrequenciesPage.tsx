import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import DashboardLayout from '../components/layout/DashboardLayout'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import { PlusIcon, RepeatIcon } from '../components/icons/Icons'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../utils/formatDate'
import type { Frequency } from '../types'

export default function FrequenciesPage() {
  const { notify } = useToast()

  const [frequencies, setFrequencies] = useState<Frequency[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Frequency | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<Frequency | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api
      .get<{ frequencies: Frequency[] }>('/frequencies')
      .then((data) => setFrequencies(data.frequencies))
      .catch((error) => notify('error', error instanceof ApiError ? error.message : 'Could not load frequencies.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreate() {
    setEditing(null)
    setName('')
    setDescription('')
    setErrors({})
    setFormOpen(true)
  }

  function openEdit(frequency: Frequency) {
    setEditing(frequency)
    setName(frequency.name)
    setDescription(frequency.description ?? '')
    setErrors({})
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    setSaving(true)

    const payload = { name, description: description.trim() === '' ? null : description }

    try {
      if (editing) {
        const data = await api.put<{ frequency: Frequency }>(`/admin/frequencies/${editing.id}`, payload)
        setFrequencies((current) => current.map((freq) => (freq.id === editing.id ? data.frequency : freq)))
        notify('success', 'Frequency updated.')
      } else {
        const data = await api.post<{ frequency: Frequency }>('/admin/frequencies', payload)
        setFrequencies((current) => [...current, data.frequency].sort((a, b) => a.name.localeCompare(b.name)))
        notify('success', 'Frequency created.')
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
      await api.delete(`/admin/frequencies/${pendingDelete.id}`)
      setFrequencies((current) => current.filter((freq) => freq.id !== pendingDelete.id))
      notify('success', 'Frequency deleted.')
      setPendingDelete(null)
    } catch (error) {
      // e.g. "This frequency is currently assigned to tasks and cannot be deleted."
      notify('error', error instanceof ApiError ? error.message : 'Could not delete frequency.')
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <DashboardLayout title="Frequencies" breadcrumb={['Home', 'Frequencies']}>
      <div className="card">
        <div className="card-header">
          <h2>Task Frequencies</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
            <PlusIcon /> Add Frequency
          </button>
        </div>

        {loading ? (
          <Spinner center />
        ) : frequencies.length === 0 ? (
          <EmptyState
            icon={<RepeatIcon />}
            title="No frequencies yet"
            description="Create frequencies like Daily, Weekly, or Monthly to assign to your tasks."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
                Add Frequency
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
                  <th>Created At</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {frequencies.map((frequency) => (
                  <tr key={frequency.id}>
                    <td>{frequency.name}</td>
                    <td className="truncate">{frequency.description || <span className="muted">—</span>}</td>
                    <td>{formatDate(frequency.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(frequency)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-danger-text"
                          onClick={() => setPendingDelete(frequency)}
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

      <Modal open={formOpen} title={editing ? 'Edit Frequency' : 'Add Frequency'} onClose={() => setFormOpen(false)}>
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
              placeholder="Optional"
            />
            {errors.description && <span className="field-error">{errors.description[0]}</span>}
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Save Frequency'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete frequency?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently deleted. This isn't allowed if it's currently assigned to any tasks.`
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

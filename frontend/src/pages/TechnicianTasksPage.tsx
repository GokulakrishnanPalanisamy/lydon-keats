import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import DashboardLayout from '../components/layout/DashboardLayout'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { ClipboardIcon, SearchIcon } from '../components/icons/Icons'
import { useAuth } from '../context/AuthContext'
import { formatTotalMinutes } from '../utils/formatDuration'
import type { Frequency, PaginationMeta, TechnicianTask, TaskStatus, WorkTag } from '../types'

interface Filters {
  search: string
  status: string
  frequencyId: string
  workTagId: string
  page: number
}

const EMPTY_FILTERS: Filters = { search: '', status: '', frequencyId: '', workTagId: '', page: 1 }

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

export default function TechnicianTasksPage() {
  const { activeOrganization, switchingOrganization } = useAuth()

  const [tasks, setTasks] = useState<TechnicianTask[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [frequencies, setFrequencies] = useState<Frequency[]>([])
  const [workTags, setWorkTags] = useState<WorkTag[]>([])

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [searchInput, setSearchInput] = useState('')

  function loadTasks(next: Filters) {
    setLoading(true)
    setError(false)

    const params = new URLSearchParams()
    if (next.search) params.set('search', next.search)
    if (next.status) params.set('status', next.status)
    if (next.frequencyId) params.set('frequency_id', next.frequencyId)
    if (next.workTagId) params.set('work_tag_id', next.workTagId)
    params.set('page', String(next.page))

    api
      .get<{ tasks: TechnicianTask[]; meta: PaginationMeta }>(`/technician/tasks?${params.toString()}`)
      .then((data) => {
        setTasks(data.tasks)
        setMeta(data.meta)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  // Reset everything on mount and whenever the active organization
  // changes — never show the previous organization's tasks while the
  // new one's are loading. The resets below are deliberately synchronous
  // (not deferred into a .then()): that's what guarantees the old org's
  // tasks/filters never flash on screen while the new fetch is in flight.
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    setTasks([])
    setMeta(null)
    setSearchInput('')
    setFilters(EMPTY_FILTERS)
    setError(false)

    if (!activeOrganization) {
      setLoading(false)
      return
    }

    loadTasks(EMPTY_FILTERS)

    api
      .get<{ frequencies: Frequency[] }>('/frequencies')
      .then((data) => setFrequencies(data.frequencies))
      .catch(() => undefined)

    api
      .get<{ work_tags: WorkTag[] }>('/work-tags')
      .then((data) => setWorkTags(data.work_tags))
      .catch(() => undefined)
  }, [activeOrganization?.id])
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault()
    const next = { ...filters, search: searchInput, page: 1 }
    setFilters(next)
    loadTasks(next)
  }

  function handleFilterChange(patch: Partial<Filters>) {
    const next = { ...filters, ...patch, page: 1 }
    setFilters(next)
    loadTasks(next)
  }

  function goToPage(page: number) {
    const next = { ...filters, page }
    setFilters(next)
    loadTasks(next)
  }

  function retry() {
    loadTasks(filters)
  }

  const showSwitching = switchingOrganization
  const showNoOrganization = !showSwitching && !activeOrganization

  return (
    <DashboardLayout title="My Tasks" breadcrumb={['Home', 'My Tasks']}>
      {showSwitching ? (
        <div className="switching-organization">
          <Spinner center />
          <p className="muted">Switching organization... Loading your tasks...</p>
        </div>
      ) : showNoOrganization ? (
        <EmptyState
          icon={<ClipboardIcon />}
          title="Select an organization"
          description="Use the organization switcher in the top navigation bar to see your assigned tasks."
        />
      ) : (
        <>
          <div className="card task-filters">
            <form className="search-bar" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search tasks..."
              />
              <button type="submit" className="btn btn-primary btn-sm">
                <SearchIcon /> Search
              </button>
            </form>

            <div className="task-filters-row">
              <label className="task-filter-field">
                Status
                <select
                  value={filters.status}
                  onChange={(event) => handleFilterChange({ status: event.target.value })}
                >
                  <option value="">All</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label className="task-filter-field">
                Frequency
                <select
                  value={filters.frequencyId}
                  onChange={(event) => handleFilterChange({ frequencyId: event.target.value })}
                >
                  <option value="">All</option>
                  {frequencies.map((frequency) => (
                    <option key={frequency.id} value={frequency.id}>
                      {frequency.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="task-filter-field">
                Work Tag
                <select
                  value={filters.workTagId}
                  onChange={(event) => handleFilterChange({ workTagId: event.target.value })}
                >
                  <option value="">All</option>
                  {workTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {loading ? (
            <Spinner center />
          ) : error ? (
            <EmptyState
              icon={<ClipboardIcon />}
              title="Unable to load tasks."
              action={
                <button type="button" className="btn btn-primary btn-sm" onClick={retry}>
                  Try Again
                </button>
              }
            />
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={<ClipboardIcon />}
              title="No Tasks Assigned"
              description={`There are currently no tasks assigned to you for ${activeOrganization?.name}.`}
            />
          ) : (
            <>
              <div className="technician-task-list">
                {tasks.map((task) => (
                  <div key={task.id} className="card technician-task-card">
                    <div className="technician-task-card-header">
                      <h3>{task.name}</h3>
                      <Badge tone={STATUS_TONES[task.status]}>{STATUS_LABELS[task.status]}</Badge>
                    </div>

                    <p className="technician-task-card-description">{task.description}</p>

                    <div className="tag-pills">
                      {task.work_tags.map((tag) => (
                        <Badge key={tag.id} tone="neutral">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>

                    <dl className="technician-task-card-meta">
                      <dt>Frequency</dt>
                      <dd>{task.frequency?.name ?? '—'}</dd>
                      <dt>Subtasks</dt>
                      <dd>{task.subtasks_count}</dd>
                      <dt>Estimated Time</dt>
                      <dd>{formatTotalMinutes(task.total_estimated_minutes)}</dd>
                    </dl>

                    <div className="technician-task-card-footer">
                      <Link to={`/technician/tasks/${task.id}`} className="btn btn-primary btn-sm">
                        View Task →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {meta && meta.last_page > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={meta.current_page <= 1}
                    onClick={() => goToPage(meta.current_page - 1)}
                  >
                    Previous
                  </button>
                  <span className="muted">
                    Page {meta.current_page} of {meta.last_page}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => goToPage(meta.current_page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

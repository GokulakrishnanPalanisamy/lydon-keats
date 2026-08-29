import { useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import DashboardLayout from '../components/layout/DashboardLayout'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { SearchIcon, UsersIcon } from '../components/icons/Icons'
import { useToast } from '../context/ToastContext'
import type { Organization, Role } from '../types'

interface TechnicianSearchResult {
  id: number
  name: string
  email: string
  status: string
  role?: Role
  organizations?: Organization[]
}

export default function TechnicianSearchPage() {
  const { notify } = useToast()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TechnicianSearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pendingAssign, setPendingAssign] = useState<TechnicianSearchResult | null>(null)
  const [assigning, setAssigning] = useState(false)

  async function runSearch(term: string) {
    setLoading(true)

    try {
      const data = await api.get<{ technicians: TechnicianSearchResult[] }>(
        `/admin/technicians?search=${encodeURIComponent(term)}`,
      )
      setResults(data.technicians)
      setSearched(true)
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    runSearch(query)
  }

  async function confirmAssign() {
    if (!pendingAssign) {
      return
    }

    setAssigning(true)

    try {
      // The backend derives the organization from the authenticated admin
      // — it never accepts an organization id from here.
      const data = await api.post<{ message: string; technician: TechnicianSearchResult }>(
        `/admin/technicians/${pendingAssign.id}/assign`,
      )
      notify('success', data.message)
      setResults((current) => current.map((technician) => (technician.id === pendingAssign.id ? data.technician : technician)))
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'Something went wrong.')
    } finally {
      setAssigning(false)
      setPendingAssign(null)
    }
  }

  return (
    <DashboardLayout title="Technicians" breadcrumb={['Home', 'Technicians']}>
      <div className="card">
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Spinner size={16} /> : <SearchIcon />} Search
          </button>
        </form>

        {loading ? (
          <Spinner center />
        ) : !searched ? (
          <EmptyState
            icon={<UsersIcon />}
            title="Search for technicians"
            description="Search by name or email, or leave it blank to browse everyone — regardless of which organization they're already assigned to."
          />
        ) : results.length === 0 ? (
          <EmptyState icon={<UsersIcon />} title="No technicians found" description="Try a different name or email." />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Organizations</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {results.map((technician) => (
                  <tr key={technician.id}>
                    <td>{technician.name}</td>
                    <td>{technician.email}</td>
                    <td>
                      <Badge tone={technician.status === 'active' ? 'success' : 'neutral'}>{technician.status}</Badge>
                    </td>
                    <td>
                      {technician.organizations && technician.organizations.length > 0
                        ? technician.organizations.map((organization) => organization.name).join(', ')
                        : '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPendingAssign(technician)}
                      >
                        Assign to my organization
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingAssign !== null}
        title="Assign technician?"
        description={pendingAssign ? `Assign ${pendingAssign.name} to your organization?` : undefined}
        confirmLabel={assigning ? 'Assigning...' : 'Assign'}
        onConfirm={confirmAssign}
        onCancel={() => setPendingAssign(null)}
      />
    </DashboardLayout>
  )
}

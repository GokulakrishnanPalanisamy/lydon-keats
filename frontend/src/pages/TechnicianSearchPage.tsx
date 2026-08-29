import { useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
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
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TechnicianSearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSearch(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const data = await api.get<{ technicians: TechnicianSearchResult[] }>(
        `/admin/technicians?search=${encodeURIComponent(query)}`,
      )
      setResults(data.technicians)
      setSearched(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAssign(technicianId: number) {
    setError(null)
    setMessage(null)

    try {
      // The backend derives the organization from the authenticated admin
      // — it never accepts an organization id from here.
      const data = await api.post<{ message: string; technician: TechnicianSearchResult }>(
        `/admin/technicians/${technicianId}/assign`,
      )
      setMessage(data.message)
      setResults((current) =>
        current.map((technician) => (technician.id === technicianId ? data.technician : technician)),
      )
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    }
  }

  return (
    <div className="technician-search">
      <h1>Find Technicians</h1>

      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-message">{message}</p>}

      {searched && results.length === 0 && <p>No technicians found.</p>}

      <ul>
        {results.map((technician) => (
          <li key={technician.id} className="technician-result">
            <strong>{technician.name}</strong> — {technician.email}
            <div>
              Organizations:{' '}
              {technician.organizations && technician.organizations.length > 0
                ? technician.organizations.map((organization) => organization.name).join(', ')
                : 'None'}
            </div>
            <button type="button" onClick={() => handleAssign(technician.id)}>
              Assign to my organization
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

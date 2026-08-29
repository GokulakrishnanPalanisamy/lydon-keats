import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Organization } from '../types'

export default function TechnicianDashboardPage() {
  const { account, logout } = useAuth()
  const navigate = useNavigate()

  const [selected, setSelected] = useState<Organization | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  if (!account || account.type !== 'technician') {
    return null
  }

  async function handleSelect(organization: Organization) {
    setError(null)
    setLoading(true)

    try {
      // The backend re-verifies this assignment against
      // technician_organizations before switching — the id alone is never
      // trusted.
      await api.post(`/technician/organizations/${organization.id}/select`)
      setSelected(organization)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (account.organizations.length === 0) {
    return (
      <div className="dashboard">
        <h1>No organization found for you.</h1>

        <dl>
          <dt>Name</dt>
          <dd>{account.user.name}</dd>
          <dt>Email</dt>
          <dd>{account.user.email}</dd>
        </dl>

        <p>You have not been assigned to any organization yet.</p>

        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    )
  }

  if (selected) {
    return (
      <div className="dashboard">
        <h1>Working in: {selected.name}</h1>

        <button type="button" onClick={() => setSelected(null)}>
          Switch organization
        </button>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <h1>{account.user.name}</h1>
      <h2>Your Organizations</h2>

      {error && <p className="form-error">{error}</p>}

      <ul>
        {account.organizations.map((organization) => (
          <li key={organization.id}>
            {organization.name}{' '}
            <button type="button" disabled={loading} onClick={() => handleSelect(organization)}>
              Select
            </button>
          </li>
        ))}
      </ul>

      <button type="button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  )
}

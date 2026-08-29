import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user, organization, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.name}</h1>

      <dl>
        <dt>Organization</dt>
        <dd>{organization?.name}</dd>

        <dt>Email</dt>
        <dd>{user?.email}</dd>

        <dt>Role</dt>
        <dd>{user?.role?.name}</dd>
      </dl>

      <button type="button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { account, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  if (!account || account.type !== 'admin') {
    return null
  }

  return (
    <div className="dashboard">
      <h1>Welcome, {account.user.name}</h1>

      <dl>
        <dt>Organization</dt>
        <dd>{account.organization.name}</dd>

        <dt>Email</dt>
        <dd>{account.user.email}</dd>

        <dt>Role</dt>
        <dd>{account.user.role?.name}</dd>
      </dl>

      <p>
        <Link to="/admin/technicians">Manage Technicians</Link>
      </p>

      <button type="button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  )
}

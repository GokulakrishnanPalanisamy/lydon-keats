import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
  const { account } = useAuth()

  if (!account) {
    return null
  }

  return (
    <DashboardLayout title="Settings" breadcrumb={['Home', 'Settings']}>
      <div className="card">
        <div className="card-header">
          <h2>Account</h2>
        </div>

        <dl className="detail-list">
          <dt>Name</dt>
          <dd>{account.user.name}</dd>

          <dt>Email</dt>
          <dd>{account.user.email}</dd>

          <dt>Role</dt>
          <dd>{account.user.role?.name ?? (account.type === 'admin' ? 'Admin' : 'Technician')}</dd>

          {account.type === 'admin' && (
            <>
              <dt>Organization</dt>
              <dd>{account.organization.name}</dd>
            </>
          )}
        </dl>
      </div>
    </DashboardLayout>
  )
}

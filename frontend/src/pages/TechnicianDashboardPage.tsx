import DashboardLayout from '../components/layout/DashboardLayout'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import StatCard from '../components/ui/StatCard'
import { BuildingIcon, CheckCircleIcon } from '../components/icons/Icons'
import { useAuth } from '../context/AuthContext'

export default function TechnicianDashboardPage() {
  const { account, activeOrganization, switchingOrganization } = useAuth()

  if (!account || account.type !== 'technician') {
    return null
  }

  if (account.organizations.length === 0) {
    return (
      <DashboardLayout title="Dashboard" breadcrumb={['Home']}>
        <EmptyState
          icon={<BuildingIcon />}
          title="No organization found for you"
          description="You have not been assigned to any organization yet. An organization admin needs to assign you first."
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard" breadcrumb={['Home']}>
      {switchingOrganization ? (
        <Spinner center />
      ) : !activeOrganization ? (
        <EmptyState
          icon={<BuildingIcon />}
          title="Select an organization"
          description="Use the organization switcher in the top navigation bar to choose which organization to work in."
        />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Assigned Organizations" value={account.organizations.length} icon={<BuildingIcon />} />
            <StatCard label="Currently Working In" value={activeOrganization.name} icon={<CheckCircleIcon />} />
          </div>

          <div className="card">
            <div className="card-header">
              <h2>{activeOrganization.name}</h2>
              <Badge tone={activeOrganization.status === 'active' ? 'success' : 'neutral'}>
                {activeOrganization.status}
              </Badge>
            </div>
            <p className="muted">
              You're connected to this organization's workspace. Organization-specific tools (jobs, tasks, and
              reports) will appear here as they're added — switch organizations anytime from the top navigation
              bar.
            </p>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}

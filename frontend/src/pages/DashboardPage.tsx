import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import DashboardLayout from '../components/layout/DashboardLayout'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import StatCard from '../components/ui/StatCard'
import StatusDonut from '../components/ui/StatusDonut'
import { BuildingIcon, CheckCircleIcon, PlusIcon, UsersIcon } from '../components/icons/Icons'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import type { Organization, Role } from '../types'

interface TechnicianRow {
  id: number
  name: string
  email: string
  status: string
  role?: Role
  organizations?: Organization[]
}

export default function DashboardPage() {
  const { account } = useAuth()
  const { notify } = useToast()

  const [technicians, setTechnicians] = useState<TechnicianRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!account || account.type !== 'admin') {
      return
    }

    api
      .get<{ technicians: TechnicianRow[] }>('/admin/technicians?search=')
      .then((data) => {
        const assignedToMe = data.technicians.filter((technician) =>
          technician.organizations?.some((organization) => organization.id === account.organization.id),
        )
        setTechnicians(assignedToMe)
      })
      .catch((error) => {
        notify('error', error instanceof ApiError ? error.message : 'Could not load your technicians.')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.type])

  if (!account || account.type !== 'admin') {
    return null
  }

  const activeCount = technicians.filter((technician) => technician.status === 'active').length
  const inactiveCount = technicians.length - activeCount
  const recent = [...technicians].sort((a, b) => b.id - a.id).slice(0, 5)

  return (
    <DashboardLayout title="Dashboard" breadcrumb={['Home']}>
      <div className="stat-grid">
        <StatCard label="Your Technicians" value={technicians.length} icon={<UsersIcon />} />
        <StatCard label="Organization" value={account.organization.name} icon={<BuildingIcon />} />
        <StatCard
          label="Organization Status"
          value={
            <Badge tone={account.organization.status === 'active' ? 'success' : 'neutral'}>
              {account.organization.status}
            </Badge>
          }
          icon={<CheckCircleIcon />}
        />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2>Recent Technicians</h2>
            <Link to="/admin/technicians" className="btn btn-secondary btn-sm">
              <PlusIcon /> Find Technicians
            </Link>
          </div>

          {loading ? (
            <Spinner center />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<UsersIcon />}
              title="No technicians yet"
              description="You haven't assigned any technicians to your organization yet."
              action={
                <Link to="/admin/technicians" className="btn btn-primary btn-sm">
                  Find Technicians
                </Link>
              }
            />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((technician) => (
                    <tr key={technician.id}>
                      <td>{technician.name}</td>
                      <td>{technician.email}</td>
                      <td>
                        <Badge tone={technician.status === 'active' ? 'success' : 'neutral'}>
                          {technician.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Technician Status</h2>
          </div>

          {loading ? (
            <Spinner center />
          ) : technicians.length === 0 ? (
            <p className="muted">No technicians to show yet.</p>
          ) : (
            <StatusDonut active={activeCount} inactive={inactiveCount} />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

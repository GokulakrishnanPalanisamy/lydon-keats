import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({
  children,
  role,
}: {
  children: ReactNode
  role?: 'admin' | 'technician'
}) {
  const { account, loading } = useAuth()

  if (loading) {
    return <p className="page-loading">Loading...</p>
  }

  if (!account) {
    return <Navigate to="/login" replace />
  }

  if (role && account.type !== role) {
    return <Navigate to={account.type === 'admin' ? '/dashboard' : '/technician/dashboard'} replace />
  }

  return <>{children}</>
}

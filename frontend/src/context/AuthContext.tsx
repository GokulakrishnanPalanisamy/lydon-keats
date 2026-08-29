import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { AuthResponse, AuthState, MeResponse, Organization } from '../types'

const ACTIVE_ORG_KEY = 'activeOrganizationId'

interface RegisterAdminPayload {
  organization_name: string
  admin_name: string
  admin_email: string
  password: string
  password_confirmation: string
}

interface RegisterTechnicianPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

interface LoginPayload {
  email: string
  password: string
}

interface AuthContextValue {
  account: AuthState | null
  loading: boolean
  /** Technicians only — the organization whose tenant database API calls currently operate against. */
  activeOrganization: Organization | null
  switchingOrganization: boolean
  selectOrganization: (organization: Organization) => Promise<void>
  registerAdmin: (payload: RegisterAdminPayload) => Promise<AuthState>
  registerTechnician: (payload: RegisterTechnicianPayload) => Promise<AuthState>
  login: (payload: LoginPayload) => Promise<AuthState>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function toAuthState(data: AuthResponse): AuthState {
  if (data.type === 'admin') {
    return { type: 'admin', user: data.user, organization: data.organization }
  }

  return { type: 'technician', user: data.user, organizations: data.organizations }
}

/**
 * Restores the previously selected organization from localStorage — but
 * only if the technician is still actually assigned to it (per the
 * organizations list the backend just returned). A stale or
 * no-longer-valid id is cleared rather than trusted.
 */
function restoreActiveOrganization(organizations: Organization[]): Organization | null {
  const storedId = localStorage.getItem(ACTIVE_ORG_KEY)

  if (!storedId) {
    return null
  }

  const match = organizations.find((organization) => String(organization.id) === storedId)

  if (!match) {
    localStorage.removeItem(ACTIVE_ORG_KEY)
    return null
  }

  return match
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AuthState | null>(null)
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null)
  const [switchingOrganization, setSwitchingOrganization] = useState(false)
  // Only start "loading" if there's a token to verify — avoids a
  // synchronous setState() in the effect below for the no-token case.
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'))

  // On first load, if a token is already stored, restore the session
  // (and, for technicians, the previously active organization).
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      return
    }

    api
      .get<MeResponse>('/me')
      .then((data) => {
        setAccount(data)
        setActiveOrganization(data.type === 'technician' ? restoreActiveOrganization(data.organizations) : null)
      })
      .catch(() => {
        localStorage.removeItem('token')
      })
      .finally(() => setLoading(false))
  }, [])

  async function registerAdmin(payload: RegisterAdminPayload) {
    const data = await api.post<AuthResponse>('/register', payload)
    localStorage.setItem('token', data.token)
    const state = toAuthState(data)
    setAccount(state)
    setActiveOrganization(null)
    return state
  }

  async function registerTechnician(payload: RegisterTechnicianPayload) {
    const data = await api.post<AuthResponse>('/technician/register', payload)
    localStorage.setItem('token', data.token)
    const state = toAuthState(data)
    setAccount(state)
    setActiveOrganization(null)
    return state
  }

  async function login(payload: LoginPayload) {
    const data = await api.post<AuthResponse>('/login', payload)
    localStorage.setItem('token', data.token)
    const state = toAuthState(data)
    setAccount(state)
    setActiveOrganization(state.type === 'technician' ? restoreActiveOrganization(state.organizations) : null)
    return state
  }

  async function logout() {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem(ACTIVE_ORG_KEY)
      setAccount(null)
      setActiveOrganization(null)
    }
  }

  async function selectOrganization(organization: Organization) {
    setSwitchingOrganization(true)

    try {
      // Backend re-verifies technician_organizations before switching —
      // this call is what proves the selection is actually valid.
      await api.post(`/technician/organizations/${organization.id}/select`)
      setActiveOrganization(organization)
      localStorage.setItem(ACTIVE_ORG_KEY, String(organization.id))
    } finally {
      setSwitchingOrganization(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        account,
        loading,
        activeOrganization,
        switchingOrganization,
        selectOrganization,
        registerAdmin,
        registerTechnician,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

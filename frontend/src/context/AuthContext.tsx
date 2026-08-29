import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { AuthResponse, AuthState, MeResponse } from '../types'

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AuthState | null>(null)
  const [loading, setLoading] = useState(true)

  // On first load, if a token is already stored, restore the session.
  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      setLoading(false)
      return
    }

    api
      .get<MeResponse>('/me')
      .then((data) => setAccount(data))
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
    return state
  }

  async function registerTechnician(payload: RegisterTechnicianPayload) {
    const data = await api.post<AuthResponse>('/technician/register', payload)
    localStorage.setItem('token', data.token)
    const state = toAuthState(data)
    setAccount(state)
    return state
  }

  async function login(payload: LoginPayload) {
    const data = await api.post<AuthResponse>('/login', payload)
    localStorage.setItem('token', data.token)
    const state = toAuthState(data)
    setAccount(state)
    return state
  }

  async function logout() {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('token')
      setAccount(null)
    }
  }

  return (
    <AuthContext.Provider value={{ account, loading, registerAdmin, registerTechnician, login, logout }}>
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

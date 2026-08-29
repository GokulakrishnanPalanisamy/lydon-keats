import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { AuthResponse, MeResponse, Organization, User } from '../types'

interface RegisterPayload {
  organization_name: string
  admin_name: string
  admin_email: string
  password: string
  password_confirmation: string
}

interface LoginPayload {
  email: string
  password: string
}

interface AuthContextValue {
  user: User | null
  organization: Organization | null
  loading: boolean
  register: (payload: RegisterPayload) => Promise<void>
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
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
      .then((data) => {
        setUser(data.user)
        setOrganization(data.organization)
      })
      .catch(() => {
        localStorage.removeItem('token')
      })
      .finally(() => setLoading(false))
  }, [])

  async function register(payload: RegisterPayload) {
    const data = await api.post<AuthResponse>('/register', payload)
    localStorage.setItem('token', data.token)
    setUser(data.user)
    setOrganization(data.organization)
  }

  async function login(payload: LoginPayload) {
    const data = await api.post<AuthResponse>('/login', payload)
    localStorage.setItem('token', data.token)
    setUser(data.user)
    setOrganization(data.organization)
  }

  async function logout() {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('token')
      setUser(null)
      setOrganization(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, organization, loading, register, login, logout }}>
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

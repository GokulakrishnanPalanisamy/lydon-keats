export interface Role {
  id: number
  name: string
  slug: string
}

export interface Organization {
  id: number
  name: string
  status: string
}

export interface User {
  id: number
  organization_id: number
  name: string
  email: string
  role_id: number
  status: string
  role?: Role
}

export interface AuthResponse {
  user: User
  organization: Organization
  token: string
}

export interface MeResponse {
  user: User
  organization: Organization
}

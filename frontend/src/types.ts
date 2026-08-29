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

export interface AdminAccount {
  id: number
  organization_id: number
  name: string
  email: string
  role_id: number
  status: string
  role?: Role
}

export interface TechnicianAccount {
  id: number
  name: string
  email: string
  role_id: number
  status: string
  role?: Role
}

export type AuthState =
  | { type: 'admin'; user: AdminAccount; organization: Organization }
  | { type: 'technician'; user: TechnicianAccount; organizations: Organization[] }

export type AuthResponse = AuthState & { token: string }

export type MeResponse = AuthState

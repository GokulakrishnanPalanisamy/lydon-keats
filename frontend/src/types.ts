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

export interface WorkTag {
  id: number
  name: string
  created_at: string
}

export interface Frequency {
  id: number
  name: string
  description: string | null
  created_at: string
}

export type TimeUnit = 'minutes' | 'hours'

export interface Subtask {
  id: number
  name: string
  description: string | null
  estimated_time: number
  estimated_time_unit: TimeUnit
  sort_order: number
}

export interface Task {
  id: number
  name: string
  description: string
  work_tags: WorkTag[]
  frequency: Frequency | null
  subtasks: Subtask[]
  total_estimated_minutes: number
  created_at: string
}

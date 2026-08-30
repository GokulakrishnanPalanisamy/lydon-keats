import axios, { AxiosError } from 'axios'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

const client = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Tells the backend which organization's tenant database this request
  // should operate against (technicians only — see AuthContext). The
  // backend never trusts this on its own; it re-verifies the technician's
  // assignment to this organization on every request.
  const organizationId = localStorage.getItem('activeOrganizationId')

  if (organizationId) {
    config.headers['X-Organization-Id'] = organizationId
  }

  return config
})

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    const status = error.response?.status ?? 0
    const message = error.response?.data?.message ?? 'Something went wrong.'
    const errors = error.response?.data?.errors

    return Promise.reject(new ApiError(message, status, errors))
  },
)

export const api = {
  get: <T>(path: string) => client.get<T>(path).then((res) => res.data),
  post: <T>(path: string, body?: unknown) => client.post<T>(path, body).then((res) => res.data),
  put: <T>(path: string, body?: unknown) => client.put<T>(path, body).then((res) => res.data),
  delete: <T>(path: string) => client.delete<T>(path).then((res) => res.data),
}

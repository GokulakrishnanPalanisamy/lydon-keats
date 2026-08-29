import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { registerSchema, toFieldErrors } from '../validation/schemas'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [organizationName, setOrganizationName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    setFormError(null)

    const result = registerSchema.safeParse({
      organization_name: organizationName,
      admin_name: adminName,
      admin_email: adminEmail,
      password,
      password_confirmation: passwordConfirmation,
    })

    if (!result.success) {
      setErrors(toFieldErrors(result.error))
      return
    }

    setLoading(true)

    try {
      await register(result.data)
      navigate('/dashboard')
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setErrors(error.errors)
      } else if (error instanceof ApiError) {
        setFormError(error.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit}>
        <h1>Register your organization</h1>

        {formError && <p className="form-error">{formError}</p>}

        <label>
          Organization Name
          <input
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
          />
          {errors.organization_name && <span className="field-error">{errors.organization_name[0]}</span>}
        </label>

        <label>
          Admin Name
          <input value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
          {errors.admin_name && <span className="field-error">{errors.admin_name[0]}</span>}
        </label>

        <label>
          Admin Email
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            required
          />
          {errors.admin_email && <span className="field-error">{errors.admin_email[0]}</span>}
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {errors.password && <span className="field-error">{errors.password[0]}</span>}
        </label>

        <label>
          Confirm Password
          <input
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  )
}

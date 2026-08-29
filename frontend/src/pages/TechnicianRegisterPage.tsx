import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { technicianRegisterSchema, toFieldErrors } from '../validation/schemas'

export default function TechnicianRegisterPage() {
  const { registerTechnician } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    setFormError(null)

    const result = technicianRegisterSchema.safeParse({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    })

    if (!result.success) {
      setErrors(toFieldErrors(result.error))
      return
    }

    setLoading(true)

    try {
      await registerTechnician(result.data)
      navigate('/technician/dashboard')
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
        <h1>Register as a technician</h1>

        {formError && <p className="form-error">{formError}</p>}

        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
          {errors.name && <span className="field-error">{errors.name[0]}</span>}
        </label>

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {errors.email && <span className="field-error">{errors.email[0]}</span>}
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

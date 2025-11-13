'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import '../auth.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const timers = debounceTimers.current
    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer))
    }
  }, [])

  const validateField = async (fieldName: string, value: string) => {
    try {
      const { loginSchema } = await import('@/lib/validations')
      await loginSchema.shape[fieldName as keyof typeof loginSchema.shape].parseAsync(value)
      
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    } catch (err) {
      if (err && typeof err === 'object' && 'issues' in err) {
        const zodErrors = err as { issues: Array<{ message: string }> }
        setFieldErrors((prev) => ({
          ...prev,
          [fieldName]: zodErrors.issues[0]?.message || 'Invalid value'
        }))
      }
    }
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    if (fieldName === 'email') setEmail(value)
    if (fieldName === 'password') setPassword(value)
    
    if (touched[fieldName]) {
      if (debounceTimers.current[fieldName]) {
        clearTimeout(debounceTimers.current[fieldName])
      }
      
      debounceTimers.current[fieldName] = setTimeout(() => {
        validateField(fieldName, value)
      }, 300)
    }
  }

  const handleFieldBlur = (fieldName: string) => {
    setTouched({ ...touched, [fieldName]: true })
    const value = fieldName === 'email' ? email : password
    validateField(fieldName, value)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)

    try {
      const { loginSchema } = await import('@/lib/validations')
      const validatedData = loginSchema.parse({ email, password })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      })

      if (error) throw error

      if (data.session) {
        localStorage.setItem('access_token', data.session.access_token)
        router.push('/dashboard')
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'issues' in err) {
        const zodErrors = err as { issues: Array<{ path: (string | number)[]; message: string }> }
        const errors: Record<string, string> = {}
        zodErrors.issues.forEach((issue) => {
          const fieldName = issue.path[0]
          if (fieldName && typeof fieldName === 'string') {
            errors[fieldName] = issue.message
          }
        })
        setFieldErrors(errors)
        return
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <div className="auth-logo-container">
          <Image src="/vela_updated.png" alt="Vela" width={120} height={120} className="auth-logo" priority />
        </div>
        <h1 className="auth-title">
          Vela
        </h1>
        <p className="auth-slogan">Set your sails</p>
        <h2 className="auth-subtitle">
          Login
        </h2>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
              value={email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              onBlur={() => handleFieldBlur('email')}
              placeholder="your@email.com"
              aria-label="Email address"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
            {fieldErrors.email && (
              <span id="email-error" className="field-error" role="alert">
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
              value={password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              onBlur={() => handleFieldBlur('password')}
              placeholder="••••••••"
              aria-label="Password"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            />
            {fieldErrors.password && (
              <span id="password-error" className="field-error" role="alert">
                {fieldErrors.password}
              </span>
            )}
          </div>

          {error && <div className="error-message" role="alert">{error}</div>}

          <div className="auth-link-container" style={{ marginBottom: '24px', justifyContent: 'flex-end' }}>
            <Link href="/auth/forgot-password" className="link">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full-width"
            disabled={loading}
            aria-label={loading ? 'Logging in' : 'Login to your account'}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-link-container">
          <span className="auth-link-text">Don&apos;t have an account? </span>
          <Link href="/auth/register" className="link">
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}

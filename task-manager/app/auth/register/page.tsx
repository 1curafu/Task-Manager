'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import '../auth.css'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [validFields, setValidFields] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' })
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const timers = debounceTimers.current
    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer))
    }
  }, [])

  const calculatePasswordStrength = (pwd: string) => {
    let score = 0
    let label = ''
    let color = ''

    if (pwd.length === 0) {
      return { score: 0, label: '', color: '' }
    }

    if (pwd.length >= 6) score += 1
    if (pwd.length >= 10) score += 1
    if (pwd.length >= 14) score += 1

    if (/[a-z]/.test(pwd)) score += 1
    if (/[A-Z]/.test(pwd)) score += 1
    if (/[0-9]/.test(pwd)) score += 1
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1

    if (score <= 2) {
      label = 'Weak'
      color = '#ff3b30'
    } else if (score <= 4) {
      label = 'Fair'
      color = '#ff9f0a'
    } else if (score <= 5) {
      label = 'Good'
      color = '#32d74b'
    } else {
      label = 'Strong'
      color = '#30d158'
    }

    return { score: Math.min(score, 7), label, color }
  }

  const validateEmail = (email: string): string | null => {
    if (!email || email.trim() === '') {
      return 'Email address is required'
    }
    
    if (email.length < 5) {
      return 'Email is too short'
    }
    
    if (email.length > 254) {
      return 'Email is too long'
    }
    
    if (!email.includes('@')) {
      return 'Email must contain an @ symbol'
    }
    
    const parts = email.split('@')
    if (parts.length !== 2) {
      return 'Email must contain only one @ symbol'
    }
    
    const [localPart, domain] = parts
    
    if (!localPart || localPart.length === 0) {
      return 'Email must have a username before @'
    }
    
    if (!domain || domain.length === 0) {
      return 'Email must have a domain after @'
    }
    
    if (!domain.includes('.')) {
      return 'Domain must contain a dot (e.g., example.com)'
    }
    
    const domainParts = domain.split('.')
    const extension = domainParts[domainParts.length - 1]
    
    if (extension.length < 2) {
      return 'Domain extension must be at least 2 characters (e.g., .com, .org)'
    }
    
    if (!/^[a-zA-Z0-9._%+-]+$/.test(localPart)) {
      return 'Email username contains invalid characters'
    }
    
    if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
      return 'Email domain contains invalid characters'
    }
    
    if (email.startsWith('.') || email.endsWith('.')) {
      return 'Email cannot start or end with a dot'
    }
    
    if (email.includes('..')) {
      return 'Email cannot contain consecutive dots'
    }
    
    const commonDomains = [
      { correct: 'gmail.com', variations: ['gmai', 'gmial', 'gmaill', 'gnail', 'gmal'] },
      { correct: 'yahoo.com', variations: ['yaho', 'yahooo', 'yhoo', 'yahu'] },
      { correct: 'hotmail.com', variations: ['hotmial', 'hotmal', 'hotmaill', 'hotmil'] },
      { correct: 'outlook.com', variations: ['outlok', 'outloook', 'outluk'] },
      { correct: 'icloud.com', variations: ['iclod', 'iclooud', 'iclud', 'icoud'] },
      { correct: 'protonmail.com', variations: ['protonmal', 'protonmial'] },
      { correct: 'aol.com', variations: ['ao'] },
      { correct: 'live.com', variations: ['liv'] },
      { correct: 'msn.com', variations: [''] },
      { correct: 'me.com', variations: [''] },
      { correct: 'mac.com', variations: [''] },
    ]
    
    const domainLower = domain.toLowerCase()
    const domainName = domain.split('.')[0].toLowerCase()
    
    for (const provider of commonDomains) {
      if (provider.variations.includes(domainName)) {
        return `Did you mean @${provider.correct}?`
      }
    }
    
    for (const provider of commonDomains) {
      const correctName = provider.correct.split('.')[0]
      if (levenshteinDistance(domainName, correctName) === 1 && domainName.length >= 3) {
        return `Did you mean @${provider.correct}?`
      }
    }
    
    if (domainLower.endsWith('.con') || domainLower.endsWith('.cmo')) {
      return 'Did you mean .com?'
    }
    if (domainLower.endsWith('.bet') || domainLower.endsWith('.nte')) {
      return 'Did you mean .net?'
    }
    if (domainLower.endsWith('.ogr') || domainLower.endsWith('.rog')) {
      return 'Did you mean .org?'
    }
    
    return null
  }

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  const validateField = async (fieldName: string, value: string) => {
    try {
      if (fieldName === 'email') {
        const emailError = validateEmail(value)
        if (emailError) {
          setFieldErrors((prev) => ({ ...prev, email: emailError }))
          setValidFields((prev) => ({ ...prev, email: false }))
          return
        }
      }
      
      const { registerSchema } = await import('@/lib/validations')
      
      if (fieldName === 'confirmPassword') {
        await registerSchema.parseAsync({ email, password, confirmPassword: value })
      } else {
        await registerSchema.shape[fieldName as keyof typeof registerSchema.shape].parseAsync(value)
      }
      
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
      setValidFields((prev) => ({ ...prev, [fieldName]: true }))
    } catch (err) {
      setValidFields((prev) => ({ ...prev, [fieldName]: false }))
      
      if (err && typeof err === 'object' && 'issues' in err) {
        const zodErrors = err as { issues: Array<{ path: (string | number)[]; message: string }> }
        const relevantError = zodErrors.issues.find(issue => 
          issue.path.includes(fieldName)
        )
        if (relevantError) {
          setFieldErrors((prev) => ({
            ...prev,
            [fieldName]: relevantError.message
          }))
        }
      }
    }
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    if (fieldName === 'email') setEmail(value)
    if (fieldName === 'password') {
      setPassword(value)
      setPasswordStrength(calculatePasswordStrength(value))
    }
    if (fieldName === 'confirmPassword') setConfirmPassword(value)
    
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
    let value = ''
    if (fieldName === 'email') value = email
    if (fieldName === 'password') value = password
    if (fieldName === 'confirmPassword') value = confirmPassword
    validateField(fieldName, value)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)

    try {
      const { registerSchema } = await import('@/lib/validations')
      const validatedData = registerSchema.parse({ email, password, confirmPassword })

      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
      })

      if (error) throw error

      if (data.session) {
        localStorage.setItem('access_token', data.session.access_token)
        router.push('/dashboard')
      } else {
        setRegistrationSuccess(true)
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
      
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <h1 className="auth-title">
          Task Manager
        </h1>
        
        {!registrationSuccess ? (
          <>
            <h2 className="auth-subtitle">
              Register
            </h2>
            
            <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                className={`form-input ${fieldErrors.email ? 'input-error' : ''} ${validFields.email && !fieldErrors.email ? 'input-success input-with-icon' : ''}`}
                value={email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={() => handleFieldBlur('email')}
                placeholder="your@email.com"
                aria-label="Email address"
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {validFields.email && !fieldErrors.email && touched.email && (
                <span className="success-icon" aria-hidden="true">✓</span>
              )}
            </div>
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
            <div className="input-wrapper">
              <input
                id="password"
                type="password"
                className={`form-input ${fieldErrors.password ? 'input-error' : ''} ${validFields.password && !fieldErrors.password ? 'input-success input-with-icon' : ''}`}
                value={password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                onBlur={() => handleFieldBlur('password')}
                placeholder="••••••••"
                aria-label="Password"
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : password ? 'password-strength' : undefined}
              />
              {validFields.password && !fieldErrors.password && touched.password && (
                <span className="success-icon" aria-hidden="true">✓</span>
              )}
            </div>
            
            {password && (
              <div id="password-strength" className="password-strength-container" aria-live="polite">
                <div className="password-strength-header">
                  <span className="password-strength-text">
                    Password Strength
                  </span>
                  <span className="password-strength-label" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div 
                  className="password-strength-bar-container"
                  role="progressbar"
                  aria-valuenow={passwordStrength.score}
                  aria-valuemin={0}
                  aria-valuemax={7}
                  aria-label={`Password strength: ${passwordStrength.label}`}
                >
                  <div 
                    className="password-strength-bar"
                    style={{
                      width: `${(passwordStrength.score / 7) * 100}%`,
                      background: passwordStrength.color
                    }}
                  />
                </div>
              </div>
            )}
            
            {fieldErrors.password && (
              <span id="password-error" className="field-error" role="alert">
                {fieldErrors.password}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="input-wrapper">
              <input
                id="confirmPassword"
                type="password"
                className={`form-input ${fieldErrors.confirmPassword ? 'input-error' : ''} ${validFields.confirmPassword && !fieldErrors.confirmPassword ? 'input-success input-with-icon' : ''}`}
                value={confirmPassword}
                onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                onBlur={() => handleFieldBlur('confirmPassword')}
                placeholder="••••••••"
                aria-label="Confirm password"
                aria-invalid={!!fieldErrors.confirmPassword}
                aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
              {validFields.confirmPassword && !fieldErrors.confirmPassword && touched.confirmPassword && (
                <span className="success-icon" aria-hidden="true">✓</span>
              )}
            </div>
            {fieldErrors.confirmPassword && (
              <span id="confirmPassword-error" className="field-error" role="alert">
                {fieldErrors.confirmPassword}
              </span>
            )}
          </div>

          {error && <div className="error-message" role="alert">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-full-width"
            disabled={loading}
            aria-label={loading ? 'Creating account' : 'Create new account'}
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="auth-link-container">
          <span className="auth-link-text">Already have an account? </span>
          <Link href="/auth/login" className="link">
            Login
          </Link>
        </div>
          </>
        ) : (
          <div className="registration-success">
            <div className="success-icon-large">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="38" stroke="#34c759" strokeWidth="4" fill="none" />
                <path d="M25 40L35 50L55 30" stroke="#34c759" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            
            <h2 className="success-title">Check Your Email</h2>
            
            <p className="success-message">
              We&apos;ve sent a confirmation link to
            </p>
            
            <p className="success-email">{email}</p>
            
            <div className="success-instructions">
              <h3 className="instructions-title">Next Steps:</h3>
              <ol className="instructions-list">
                <li>Open your email inbox</li>
                <li>Look for an email from Task Manager</li>
                <li>Click the confirmation link</li>
                <li>Return here to log in</li>
              </ol>
            </div>
            
            <div className="success-note">
              <p>
                <strong>Didn&apos;t receive the email?</strong>
              </p>
              <p>
                Check your spam folder or 
                <button 
                  className="link-button"
                  onClick={() => setRegistrationSuccess(false)}
                >
                  try again with a different email
                </button>
              </p>
            </div>
            
            <Link href="/auth/login" className="btn btn-secondary btn-full-width">
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

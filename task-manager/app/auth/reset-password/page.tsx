'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import '../auth.css'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' })
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Invalid or expired reset link. Please request a new one.')
      }
    }
    checkSession()
  }, [supabase.auth])

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

    // Character variety checks
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

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordStrength(calculatePasswordStrength(value))
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords don\'t match')
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setResetSuccess(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (resetSuccess) {
    return (
      <div className="auth-overlay">
        <div className="auth-modal">
          <div className="success-content">
            <svg className="success-icon-large" viewBox="0 0 70 70" fill="none" style={{ width: '70px', height: '70px' }}>
              <circle cx="35" cy="35" r="31.5" fill="#30d158" opacity="0.1"/>
              <circle cx="35" cy="35" r="28" fill="#30d158" opacity="0.2"/>
              <path 
                d="M22 35L30 43L48 25" 
                stroke="#30d158" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>

            <h2 className="success-title">Password Reset Successful!</h2>
            
            <p className="success-instructions">
              Your password has been updated successfully. You can now login with your new password.
            </p>

            <Link href="/auth/login" className="btn btn-primary btn-full-width">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <h1 className="auth-title">Task Manager</h1>
        <h2 className="auth-subtitle">Create New Password</h2>

        <form onSubmit={handleResetPassword}>
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              New Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="••••••••"
              required
              autoFocus
            />

            {/* Password Strength Indicator */}
            {password && (
              <div className="password-strength-container">
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
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-full-width"
            disabled={loading}
          >
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-link-container">
          <span className="auth-link-text">Remember your password? </span>
          <Link href="/auth/login" className="link">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}

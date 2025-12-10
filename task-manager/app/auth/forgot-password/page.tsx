'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import '../auth.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address')
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setResetSent(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <div className="auth-logo-container">
          <Image src="/icon.svg" alt="Vela" width={64} height={64} className="mx-auto mb-4" priority />
        </div>
        <h1 className="auth-title">Vela</h1>
        <p className="auth-slogan">Set your sails</p>

        {!resetSent ? (
          <>
            <h2 className="auth-subtitle">Reset Password</h2>

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary btn-full-width"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="auth-link-container">
              <span className="auth-link-text">Remember your password? </span>
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
              We&apos;ve sent a password reset link to
            </p>

            <p className="success-email">{email}</p>

            <div className="success-instructions">
              <h3 className="instructions-title">Next Steps:</h3>
              <ol className="instructions-list">
                <li>Open your email inbox</li>
                <li>Look for an email from Vela</li>
                <li>Click the reset password link</li>
                <li>Create your new password</li>
              </ol>
            </div>

            <div className="success-note">
              <p>
                <strong>Didn&apos;t receive the email?</strong>
              </p>
              <p>
                Check your spam folder or{' '}
                <button
                  className="link-button"
                  onClick={() => setResetSent(false)}
                >
                  try again with a different email
                </button>
              </p>
            </div>

            <Link href="/auth/login" className="btn btn-secondary btn-full-width">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

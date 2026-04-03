'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import { checkPasswordLeak } from '@/lib/passwordSecurity'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Eye, EyeSlash, CheckCircle } from '@phosphor-icons/react'

function VelaLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M10.4341 20.1048C10.4341 20.1048 10.664 20.4977 10.8269 20.7409C10.9183 20.8772 11.0382 21.0406 11.1468 21.1844C11.3297 21.4268 11.5374 21.6491 11.76 21.8558C12.0601 22.1346 12.3879 22.382 12.7383 22.5943L12.8288 22.6492C13.2518 22.8731 13.6964 23.0537 14.1557 23.1881L14.232 23.2105C14.7672 23.31 15.3153 23.3602 15.8597 23.3602L16.0582 23.3408C16.4363 23.3039 16.8097 23.229 17.1727 23.1173C17.4569 23.0299 17.7337 22.9202 18.0006 22.7892L18.1124 22.7344C18.431 22.5781 18.7348 22.3935 19.0203 22.1828L19.0469 22.1632C19.2667 22.001 19.474 21.8226 19.6671 21.6294C19.9221 21.3745 20.1513 21.0949 20.3513 20.7949L20.3873 20.7409L20.7989 20.0861L20.836 20.0038C20.9414 19.7705 20.7707 19.5061 20.5146 19.5061C20.4921 19.5061 20.4697 19.5039 20.4476 19.4997L20.1771 19.4473C19.9933 19.4117 19.8129 19.3602 19.638 19.2933L19.5051 19.2425C19.3451 19.1813 19.1896 19.1089 19.0398 19.0256C18.8534 18.9221 18.6764 18.8022 18.5111 18.6675L18.2544 18.4584L18.2238 18.4262C17.9952 18.1861 17.7864 17.9278 17.5996 17.6539L17.188 16.9616L12.8288 9.73994L12.6417 9.49673L12.5295 9.36576L12.4172 9.2348L12.3867 9.20197C12.2451 9.04943 12.0927 8.90722 11.9308 8.77643C11.7691 8.64584 11.5938 8.5331 11.4079 8.44016L11.276 8.37418L10.9018 8.22451L10.5837 8.11225L10.464 8.07901C10.3196 8.0389 10.1718 8.01245 10.0225 8H9.79794L9.12442 8.05613L8.6754 8.14967L8.41347 8.22451L8.13283 8.33676L7.79607 8.52385C7.57207 8.66075 7.36153 8.81854 7.16728 8.99514L7.04771 9.10384L6.88623 9.28147C6.74477 9.43706 6.61903 9.60626 6.51084 9.78657C6.43231 9.91746 6.36326 10.0538 6.30423 10.1946L6.28986 10.2288C6.19662 10.4512 6.125 10.6834 6.07656 10.9196C6.02584 11.1668 6 11.42 6 11.6724V11.802C6 12.085 6.03616 12.3669 6.10759 12.6407C6.18516 12.938 6.30361 13.2232 6.45954 13.488L7.21609 14.7727L10.4341 20.1048Z" fill="url(#regGrad1)"/>
      <ellipse cx="22.2956" cy="11.7044" rx="3.7044" ry="3.7044" fill="url(#regGrad2)"/>
      <defs>
        <linearGradient id="regGrad1" x1="8.18896" y1="8.46773" x2="16.9822" y2="23.1731" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1AB7EA"/>
          <stop offset="0.5" stopColor="#2B91EB"/>
          <stop offset="1" stopColor="#0063DC"/>
        </linearGradient>
        <linearGradient id="regGrad2" x1="22.2956" y1="8" x2="22.2956" y2="15.4088" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1AB7EA"/>
          <stop offset="0.5" stopColor="#2B91EB"/>
          <stop offset="1" stopColor="#0063DC"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function passwordStrength(pwd: string) {
  if (!pwd) return { score: 0, label: '', color: '', bg: '' }
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 10) score++
  if (pwd.length >= 14) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^a-zA-Z0-9]/.test(pwd)) score++
  const s = Math.min(score, 7)
  if (s <= 2) return { score: s, label: 'Weak', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
  if (s <= 4) return { score: s, label: 'Fair', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }
  if (s <= 5) return { score: s, label: 'Good', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' }
  return { score: s, label: 'Strong', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' }
}

const ease = [0.22, 1, 0.36, 1] as const

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
}

const row = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
}

const inputStyle = (focused: boolean, dark: boolean, invalid?: boolean, valid?: boolean) => ({
  borderRadius: 12,
  background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(241,245,249,0.8)',
  border: invalid
    ? '1.5px solid rgba(239,68,68,0.7)'
    : valid
    ? '1.5px solid rgba(34,197,94,0.7)'
    : focused
    ? '1.5px solid rgba(59,130,246,0.7)'
    : dark ? '1.5px solid rgba(255,255,255,0.07)' : '1.5px solid rgba(226,232,240,0.8)',
  boxShadow: invalid
    ? '0 0 0 4px rgba(239,68,68,0.1)'
    : valid
    ? '0 0 0 4px rgba(34,197,94,0.1)'
    : focused
    ? '0 0 0 4px rgba(59,130,246,0.12), inset 0 1px 3px rgba(0,0,0,0.06)'
    : dark ? 'inset 0 1px 3px rgba(0,0,0,0.2)' : 'inset 0 1px 3px rgba(0,0,0,0.04)',
  transition: 'all 0.2s ease',
})

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()
  const prefersReduced = useReducedMotion()
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const strength = passwordStrength(password)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password || !confirmPassword) { setError('Please fill in all fields'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    try {
      const leaked = await checkPasswordLeak(password)
      if (leaked) {
        setError('This password appeared in a data breach. Please choose a different one.')
        setLoading(false)
        return
      }
    } catch { /* non-blocking */ }

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (authError) { setError(authError.message) }
    else { setSuccess(true) }
    setLoading(false)
  }

  const cardStyle = {
    borderRadius: 24,
    padding: '32px 32px 28px',
    background: dark
      ? 'linear-gradient(145deg, rgba(22,27,42,0.95), rgba(15,21,36,0.98))'
      : 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(248,251,255,0.98))',
    border: dark
      ? '1px solid rgba(255,255,255,0.08)'
      : '1px solid rgba(255,255,255,0.9)',
    boxShadow: dark
      ? '0 1px 0 rgba(255,255,255,0.05) inset, 0 24px 64px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.3)'
      : '0 1px 0 rgba(255,255,255,1) inset, 0 20px 60px rgba(37,99,235,0.12), 0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
    backdropFilter: 'blur(20px)',
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: dark
          ? 'linear-gradient(135deg, #0a0c12 0%, #0f1520 50%, #0a0e18 100%)'
          : 'linear-gradient(135deg, #dce8ff 0%, #eef3ff 40%, #f5f0ff 100%)',
      }}
    >
      {/* Bg orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute rounded-full" style={{
          width: 700, height: 700, top: '-20%', left: '-15%',
          background: dark
            ? 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(96,165,250,0.45) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }} />
        <div className="absolute rounded-full" style={{
          width: 500, height: 500, bottom: '-15%', right: '-10%',
          background: dark
            ? 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(167,139,250,0.35) 0%, transparent 65%)',
          filter: 'blur(50px)',
        }} />
      </div>


      <div className="relative z-10 w-full max-w-[400px]">

        {/* Logo */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={prefersReduced ? false : { opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          <motion.div
            initial={prefersReduced ? false : { scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.05 }}
            style={{
              marginBottom: 14, padding: 14, borderRadius: 20,
              background: dark
                ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(30,58,138,0.08))'
                : 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(219,234,254,0.6))',
              border: dark ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(147,197,253,0.5)',
              boxShadow: dark
                ? '0 4px 24px rgba(37,99,235,0.2), inset 0 1px 0 rgba(255,255,255,0.06)'
                : '0 4px 24px rgba(37,99,235,0.15), inset 0 1px 0 rgba(255,255,255,0.95)',
            }}
          >
            <VelaLogo size={36} />
          </motion.div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.6px', color: dark ? '#f1f5f9' : '#0f172a', lineHeight: 1, marginBottom: 5 }}>
            Vela
          </h1>
          <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', letterSpacing: '0.5px' }}>
            Set your sails
          </p>
        </motion.div>

        {/* Card - animated between form and success */}
        <AnimatePresence mode="wait" initial={false}>
          {success ? (
            <motion.div
              key="success"
              initial={prefersReduced ? false : { opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -16 }}
              transition={{ duration: 0.5, ease }}
              style={{ ...cardStyle, textAlign: 'center' }}
            >
              <motion.div
                initial={prefersReduced ? false : { scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.12, duration: 0.55, ease }}
                style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}
              >
                <div style={{
                  width: 68, height: 68, borderRadius: 20,
                  background: dark ? 'rgba(37,99,235,0.12)' : 'rgba(219,234,254,0.6)',
                  border: dark ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(147,197,253,0.5)',
                  boxShadow: '0 4px 20px rgba(37,99,235,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle size={36} weight="fill" color="#3b82f6" />
                </div>
              </motion.div>

              <motion.h2
                initial={prefersReduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.3px', color: dark ? '#f1f5f9' : '#0f172a', marginBottom: 10 }}
              >
                Check your inbox
              </motion.h2>

              <motion.p
                initial={prefersReduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.4 }}
                style={{ fontSize: 13, color: dark ? '#64748b' : '#94a3b8', lineHeight: 1.6, marginBottom: 28 }}
              >
                We sent a confirmation link to{' '}
                <strong style={{ color: dark ? '#cbd5e1' : '#475569', fontWeight: 600 }}>{email}</strong>.
                {' '}Click it to activate your account.
              </motion.p>

              <motion.button
                initial={prefersReduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                whileHover={prefersReduced ? undefined : { scale: 1.02, y: -1 }}
                whileTap={prefersReduced ? undefined : { scale: 0.97 }}
                onClick={() => router.push('/auth/login')}
                style={{
                  width: '100%', height: 48, borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb, #1d4ed8)',
                  color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                Back to Login
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={prefersReduced ? false : { opacity: 0, y: 28, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -16 }}
              transition={{ duration: 0.6, delay: 0.12, ease }}
              style={cardStyle}
            >
              {/* Card header */}
              <motion.div
                initial={prefersReduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}
              >
                <div style={{
                  width: 3, height: 16, borderRadius: 2,
                  background: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
                }} />
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  color: dark ? '#64748b' : '#94a3b8',
                }}>
                  Create your account
                </span>
              </motion.div>

              <motion.form
                onSubmit={(e) => void handleRegister(e)}
                variants={stagger}
                initial="hidden"
                animate="show"
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* Email */}
                <motion.div variants={row}>
                  <label style={{
                    display: 'block', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                    color: dark ? '#475569' : '#94a3b8', marginBottom: 8,
                  }}>
                    Email
                  </label>
                  <div style={inputStyle(focused === 'email', dark)}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      placeholder="your@email.com"
                      autoComplete="email"
                      style={{
                        width: '100%', background: 'transparent', border: 'none', outline: 'none',
                        fontSize: 13, padding: '11px 14px', color: dark ? '#e2e8f0' : '#1e293b',
                        borderRadius: 12,
                      }}
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div variants={row}>
                  <label style={{
                    display: 'block', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                    color: dark ? '#475569' : '#94a3b8', marginBottom: 8,
                  }}>
                    Password
                  </label>
                  <div style={{ ...inputStyle(focused === 'password', dark), position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      style={{
                        width: '100%', background: 'transparent', border: 'none', outline: 'none',
                        fontSize: 13, padding: '11px 42px 11px 14px', color: dark ? '#e2e8f0' : '#1e293b',
                        borderRadius: 12,
                      }}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: dark ? '#475569' : '#94a3b8', padding: 2, display: 'flex',
                      }}
                    >
                      {showPassword ? <EyeSlash size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Strength indicator */}
                  <AnimatePresence>
                    {password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', marginTop: 10 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Segmented bars */}
                          <div style={{ flex: 1, display: 'flex', gap: 3 }}>
                            {[1, 2, 3, 4].map((seg) => {
                              const threshold = (seg / 4) * 7
                              const filled = strength.score >= threshold
                              return (
                                <motion.div
                                  key={seg}
                                  style={{ flex: 1, height: 4, borderRadius: 2 }}
                                  animate={{
                                    backgroundColor: filled
                                      ? strength.color
                                      : dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                  }}
                                  transition={{ duration: 0.25 }}
                                />
                              )
                            })}
                          </div>
                          <motion.span
                            key={strength.label}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px',
                              borderRadius: 6, color: strength.color, background: strength.bg,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {strength.label}
                          </motion.span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Confirm Password */}
                <motion.div variants={row}>
                  <label style={{
                    display: 'block', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                    color: dark ? '#475569' : '#94a3b8', marginBottom: 8,
                  }}>
                    Confirm Password
                  </label>
                  <div style={{ ...inputStyle(focused === 'confirm', dark, passwordsMismatch, passwordsMatch), position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocused('confirm')}
                      onBlur={() => setFocused(null)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      style={{
                        width: '100%', background: 'transparent', border: 'none', outline: 'none',
                        fontSize: 13, padding: '11px 42px 11px 14px', color: dark ? '#e2e8f0' : '#1e293b',
                        borderRadius: 12,
                      }}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: dark ? '#475569' : '#94a3b8', padding: 2, display: 'flex',
                      }}
                    >
                      {showConfirm ? <EyeSlash size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </motion.div>

                {/* Error */}
                <AnimatePresence mode="wait" initial={false}>
                  {error && (
                    <motion.div
                      key={error}
                      role="alert"
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={prefersReduced
                        ? { opacity: 1, y: 0, height: 'auto' }
                        : { opacity: 1, y: 0, height: 'auto', x: [0, -6, 6, -3, 0] }
                      }
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        fontSize: 12, color: '#f87171', textAlign: 'center',
                        padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                      }}>
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.div variants={row}>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={prefersReduced ? undefined : { scale: 1.02, y: -1 }}
                    whileTap={prefersReduced ? undefined : { scale: 0.97 }}
                    style={{
                      width: '100%', height: 48, borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 60%, #1d4ed8 100%)',
                      color: 'white', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      boxShadow: '0 4px 20px rgba(37,99,235,0.45), 0 1px 4px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                      transition: 'box-shadow 0.2s ease, opacity 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {loading ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                          style={{
                            display: 'inline-block', width: 16, height: 16,
                            borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: 'white',
                          }}
                        />
                        Creating account…
                      </>
                    ) : 'Create account'}
                  </motion.button>
                </motion.div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.p
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          style={{ textAlign: 'center', fontSize: 12, marginTop: 20, color: dark ? '#475569' : '#94a3b8' }}
        >
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }} className="hover:text-blue-400 transition-colors">
            Sign in
          </Link>
        </motion.p>
      </div>
    </div>
  )
}
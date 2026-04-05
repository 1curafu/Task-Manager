'use client'

import { useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  TrashIcon,
  SignOutIcon,
  InfoIcon,
  ShieldWarningIcon,
  XIcon,
} from '@phosphor-icons/react'


export type ConfirmModalVariant =
  | 'danger'      
  | 'warning'     
  | 'info'       
  | 'destructive' 

export interface ConfirmModalProps {
  isOpen: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void

  title: string
  message: string
  confirmText?: string
  cancelText?: string

  variant?: ConfirmModalVariant
  icon?: React.ReactNode

  loading?: boolean
  confirmPhrase?: string
  consequences?: string[]
}


interface VariantConfig {
  iconEl: React.ReactNode
  iconBg: string
  iconBgDark: string
  iconBorder: string
  iconBorderDark: string
  iconGlow: string
  confirmBg: string
  confirmBgHover: string
  confirmShadow: string
  accentBar: string
}

function getVariantConfig(variant: ConfirmModalVariant): VariantConfig {
  switch (variant) {
    case 'danger':
      return {
        iconEl: <TrashIcon size={28} weight="fill" color="#ef4444" />,
        iconBg: 'rgba(239,68,68,0.1)',
        iconBgDark: 'rgba(239,68,68,0.12)',
        iconBorder: 'rgba(239,68,68,0.25)',
        iconBorderDark: 'rgba(239,68,68,0.2)',
        iconGlow: '0 8px 24px rgba(239,68,68,0.2)',
        confirmBg: 'linear-gradient(135deg, #ef4444, #dc2626)',
        confirmBgHover: 'linear-gradient(135deg, #f87171, #ef4444)',
        confirmShadow: '0 4px 20px rgba(220,38,38,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
        accentBar: 'linear-gradient(180deg, #ef4444, #dc2626)',
      }
    case 'warning':
      return {
        iconEl: <SignOutIcon size={28} weight="fill" color="#f59e0b" />,
        iconBg: 'rgba(245,158,11,0.1)',
        iconBgDark: 'rgba(245,158,11,0.12)',
        iconBorder: 'rgba(245,158,11,0.3)',
        iconBorderDark: 'rgba(245,158,11,0.2)',
        iconGlow: '0 8px 24px rgba(245,158,11,0.2)',
        confirmBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
        confirmBgHover: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        confirmShadow: '0 4px 20px rgba(217,119,6,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
        accentBar: 'linear-gradient(180deg, #f59e0b, #d97706)',
      }
    case 'destructive':
      return {
        iconEl: <ShieldWarningIcon size={28} weight="fill" color="#dc2626" />,
        iconBg: 'rgba(220,38,38,0.08)',
        iconBgDark: 'rgba(220,38,38,0.14)',
        iconBorder: 'rgba(220,38,38,0.3)',
        iconBorderDark: 'rgba(220,38,38,0.25)',
        iconGlow: '0 8px 24px rgba(220,38,38,0.25)',
        confirmBg: 'linear-gradient(135deg, #dc2626, #b91c1c)',
        confirmBgHover: 'linear-gradient(135deg, #ef4444, #dc2626)',
        confirmShadow: '0 4px 20px rgba(185,28,28,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
        accentBar: 'linear-gradient(180deg, #dc2626, #b91c1c)',
      }
    case 'info':
    default:
      return {
        iconEl: <InfoIcon size={28} weight="fill" color="#3b82f6" />,
        iconBg: 'rgba(59,130,246,0.1)',
        iconBgDark: 'rgba(59,130,246,0.12)',
        iconBorder: 'rgba(59,130,246,0.25)',
        iconBorderDark: 'rgba(59,130,246,0.2)',
        iconGlow: '0 8px 24px rgba(59,130,246,0.2)',
        confirmBg: 'linear-gradient(135deg, #3b82f6, #2563eb, #1d4ed8)',
        confirmBgHover: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
        confirmShadow: '0 4px 20px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
        accentBar: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
      }
  }
}


const ease = [0.22, 1, 0.36, 1] as const

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  icon,
  loading = false,
  confirmPhrase,
  consequences,
}: ConfirmModalProps) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const prefersReduced = useReducedMotion()
  const cfg = getVariantConfig(variant)

  const [phrase, setPhrase] = useState('')
  const [hovering, setHovering] = useState(false)

  const phraseMatches = confirmPhrase ? phrase === confirmPhrase : true
  const canConfirm = !loading && phraseMatches

  const handleCancel = useCallback(() => {
    setPhrase('')
    onCancel()
  }, [onCancel])

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) handleCancel()
    },
    [handleCancel, loading]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  const handleConfirm = async () => {
    if (!canConfirm) return
    await onConfirm()
    setPhrase('')
  }

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={loading ? undefined : handleCancel}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: dark
                ? 'rgba(0,0,0,0.75)'
                : 'rgba(15,23,42,0.45)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 51,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16, pointerEvents: 'none',
            }}
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-modal-title"
              aria-describedby="confirm-modal-desc"
              onClick={e => e.stopPropagation()}
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.38, ease }}
              style={{
                pointerEvents: 'auto',
                width: '100%', maxWidth: 420,
                borderRadius: 24,
                padding: '28px 28px 24px',
                background: dark
                  ? 'linear-gradient(145deg, rgba(22,27,42,0.98), rgba(15,21,36,1))'
                  : 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,251,255,1))',
                border: dark
                  ? '1px solid rgba(255,255,255,0.08)'
                  : '1px solid rgba(255,255,255,0.95)',
                boxShadow: dark
                  ? '0 1px 0 rgba(255,255,255,0.05) inset, 0 32px 80px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.4)'
                  : '0 1px 0 rgba(255,255,255,1) inset, 0 24px 64px rgba(15,23,42,0.18), 0 4px 16px rgba(0,0,0,0.07)',
              }}
            >

              <motion.button
                onClick={loading ? undefined : handleCancel}
                whileHover={prefersReduced ? undefined : { scale: 1.1 }}
                whileTap={prefersReduced ? undefined : { scale: 0.9 }}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  width: 28, height: 28, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
                  color: dark ? '#475569' : '#94a3b8',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.4 : 1,
                  transition: 'all 0.15s ease',
                }}
                aria-label="Close"
              >
                <XIcon size={13} weight="bold" />
              </motion.button>

              <motion.div
                initial={prefersReduced ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12, duration: 0.35, ease }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}
              >
                <div style={{
                  width: 3, height: 14, borderRadius: 2,
                  background: cfg.accentBar, flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: dark ? '#475569' : '#94a3b8',
                }}>
                  Confirmation required
                </span>
              </motion.div>

              <motion.div
                initial={prefersReduced ? false : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.45, ease }}
                style={{ marginBottom: 18 }}
              >
                <div style={{
                  width: 60, height: 60, borderRadius: 18,
                  background: dark ? cfg.iconBgDark : cfg.iconBg,
                  border: `1px solid ${dark ? cfg.iconBorderDark : cfg.iconBorder}`,
                  boxShadow: `${cfg.iconGlow}, inset 0 1px 0 rgba(255,255,255,0.07)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {icon ?? cfg.iconEl}
                </div>
              </motion.div>

              <motion.h2
                id="confirm-modal-title"
                initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.38, ease }}
                style={{
                  fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px',
                  color: dark ? '#f1f5f9' : '#0f172a',
                  marginBottom: 8, lineHeight: 1.25,
                }}
              >
                {title}
              </motion.h2>

              <motion.p
                id="confirm-modal-desc"
                initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.38, ease }}
                style={{
                  fontSize: 13, color: dark ? '#64748b' : '#64748b',
                  lineHeight: 1.65, marginBottom: consequences || confirmPhrase ? 16 : 28,
                }}
              >
                {message}
              </motion.p>

              {consequences && consequences.length > 0 && (
                <motion.div
                  initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24, duration: 0.38, ease }}
                  style={{
                    marginBottom: confirmPhrase ? 16 : 28,
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
                    border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <p style={{
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: dark ? '#475569' : '#94a3b8',
                    marginBottom: 8,
                  }}>
                    This will:
                  </p>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {consequences.map((c, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{
                          marginTop: 4, width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                          background: variant === 'info' ? '#3b82f6' : variant === 'warning' ? '#f59e0b' : '#ef4444',
                        }} />
                        <span style={{ fontSize: 12, color: dark ? '#64748b' : '#64748b', lineHeight: 1.5 }}>
                          {c}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {confirmPhrase && (
                <motion.div
                  initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.38, ease }}
                  style={{ marginBottom: 24 }}
                >
                  <label style={{
                    display: 'block', fontSize: 12, color: dark ? '#64748b' : '#64748b',
                    marginBottom: 8, lineHeight: 1.5,
                  }}>
                    Type{' '}
                    <code style={{
                      fontFamily: 'monospace', fontSize: 12,
                      padding: '1px 6px', borderRadius: 5,
                      background: dark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: '#ef4444',
                    }}>
                      {confirmPhrase}
                    </code>
                    {' '}to confirm
                  </label>
                  <div style={{
                    borderRadius: 11,
                    background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(241,245,249,0.8)',
                    border: phrase === confirmPhrase
                      ? '1.5px solid rgba(239,68,68,0.6)'
                      : dark ? '1.5px solid rgba(255,255,255,0.07)' : '1.5px solid rgba(226,232,240,0.8)',
                    boxShadow: phrase === confirmPhrase
                      ? '0 0 0 3px rgba(239,68,68,0.1)'
                      : dark ? 'inset 0 1px 3px rgba(0,0,0,0.2)' : 'inset 0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease',
                  }}>
                    <input
                      type="text"
                      value={phrase}
                      onChange={e => setPhrase(e.target.value)}
                      placeholder={confirmPhrase}
                      spellCheck={false}
                      autoComplete="off"
                      style={{
                        width: '100%', background: 'transparent', border: 'none', outline: 'none',
                        fontSize: 13, fontFamily: 'monospace',
                        padding: '10px 13px',
                        color: dark ? '#e2e8f0' : '#1e293b',
                        borderRadius: 11,
                      }}
                    />
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: confirmPhrase ? 0.32 : 0.26, duration: 0.38, ease }}
                style={{ display: 'flex', gap: 10 }}
              >
                <motion.button
                  onClick={loading ? undefined : handleCancel}
                  whileHover={prefersReduced ? undefined : { scale: 1.02 }}
                  whileTap={prefersReduced ? undefined : { scale: 0.97 }}
                  disabled={loading}
                  style={{
                    flex: 1, height: 44, borderRadius: 12,
                    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    color: dark ? '#94a3b8' : '#64748b',
                    fontSize: 13, fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    boxShadow: dark
                      ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 3px rgba(0,0,0,0.2)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.06)',
                    border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cancelText}
                </motion.button>

                <motion.button
                  onClick={handleConfirm}
                  onMouseEnter={() => setHovering(true)}
                  onMouseLeave={() => setHovering(false)}
                  whileHover={prefersReduced || !canConfirm ? undefined : { scale: 1.02, y: -1 }}
                  whileTap={prefersReduced || !canConfirm ? undefined : { scale: 0.97 }}
                  disabled={!canConfirm}
                  style={{
                    flex: 1, height: 44, borderRadius: 12, border: 'none',
                    background: canConfirm
                      ? (hovering ? cfg.confirmBgHover : cfg.confirmBg)
                      : dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    color: canConfirm ? 'white' : dark ? '#334155' : '#cbd5e1',
                    fontSize: 13, fontWeight: 700, letterSpacing: '0.01em',
                    cursor: canConfirm ? 'pointer' : 'not-allowed',
                    boxShadow: canConfirm ? cfg.confirmShadow : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {loading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                        style={{
                          display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
                        }}
                      />
                      Processing…
                    </>
                  ) : confirmText}
                </motion.button>
              </motion.div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

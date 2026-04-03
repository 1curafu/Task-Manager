'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import styles from '@/app/dashboard/dashboard.module.css'
import { Lock, Warning as AlertTriangle, Trash as Trash2, SignOut as LogOut } from '@phosphor-icons/react'

export function AccountSettings({ userEmail }: { userEmail: string, userId: string }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    if (password.length < 8) errors.push('At least 8 characters')
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter')
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter')
    if (!/[0-9]/.test(password)) errors.push('One number')
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('One special character')
    return errors
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' })
      setLoading(false)
      return
    }

    const errors = validatePassword(newPassword)
    if (errors.length > 0) {
      setMessage({ type: 'error', text: `Password too weak: ${errors.join(', ')}` })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password')
      }

      setMessage({ text: 'Password updated successfully!', type: 'success' })
      setNewPassword('')
      setConfirmPassword('')
      
      setTimeout(() => setMessage(null), 3000)

    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Failed to update password.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deleteAcknowledged) return

    try {
      setDeleting(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')
      
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete account'
      })
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div className={styles.card} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-slate-500)', marginBottom: '0.25rem' }}>Email Address</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>{userEmail}</div>
                </div>
                <button 
                    onClick={async () => { await supabase.auth.signOut(); router.push('/auth/login') }}
                    className={styles.btnSecondary}
                    style={{ color: '#ef4444', borderColor: 'var(--color-red-100)' }}
                >
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </div>

        <div className={styles.card} style={{ maxWidth: '600px' }}>
        <div className={styles.cardHeader}>
            <div className={styles.iconBox}><Lock /></div>
        </div>
        <h3 className={styles.cardTitle}>Security</h3>
        
        <form onSubmit={handlePasswordChange} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-slate-500)' }}>New Password</label>
                <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.formInput}
                    placeholder="Enter new password"
                    required
                />
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-slate-500)' }}>Confirm New Password</label>
                <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.formInput}
                    placeholder="Confirm new password"
                    required
                />
            </div>

            {message && message.text !== 'Failed to delete account' && (
                <div className={message.type === 'success' ? styles.statusSuccess : styles.statusError}>
                    {message.text}
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading || !newPassword || !confirmPassword}
                className={styles.btnPrimary}
            >
                {loading ? 'Updating...' : 'Update Password'}
            </button>
        </form>
        </div>

        <div className={styles.card} style={{ maxWidth: '600px', borderColor: 'var(--color-red-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: '#dc2626' }}>
            <AlertTriangle size={24} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Danger Zone</h3>
        </div>
        
        <p style={{ color: 'var(--color-slate-500)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Deleting your account is permanent and cannot be undone. All your tasks, notes, and data will be removed immediately.
        </p>

        {!showDeleteConfirm ? (
            <button 
                onClick={() => setShowDeleteConfirm(true)}
                className={styles.btnDanger}
            >
                <Trash2 size={18} />
                Delete Account
            </button>
        ) : (
            <div style={{ padding: '1.5rem', background: 'var(--color-red-50)', borderRadius: '0.75rem', border: '1px solid var(--color-red-100)' }}>
                <p style={{ fontWeight: 600, color: '#dc2626', marginBottom: '1rem' }}>Are you absolutely sure?</p>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
                    <input 
                        type="checkbox" 
                        checked={deleteAcknowledged}
                        onChange={(e) => setDeleteAcknowledged(e.target.checked)}
                        style={{ marginTop: '0.25rem' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-slate-600)', lineHeight: 1.4 }}>
                        I understand that this action is permanent and my data cannot be recovered. ({userEmail})
                    </span>
                </label>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={() => {
                            setShowDeleteConfirm(false)
                            setDeleteAcknowledged(false)
                        }}
                        className={styles.btnSecondary}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleDeleteAccount}
                        disabled={!deleteAcknowledged || deleting}
                        className={styles.btnPrimary}
                        style={{ 
                            background: '#dc2626',
                            opacity: (!deleteAcknowledged || deleting) ? 0.5 : 1,
                            cursor: (!deleteAcknowledged || deleting) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {deleting ? 'Deleting...' : 'Yes, delete my account'}
                    </button>
                </div>
            </div>
        )}
        </div>
    </div>
  )
}

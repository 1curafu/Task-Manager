'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import './DeleteAccountModal.css'

interface DeleteAccountModalProps {
  userId: string
  userEmail: string
  onClose: () => void
}

export default function DeleteAccountModal({ userId, userEmail, onClose }: DeleteAccountModalProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleDelete = async () => {
    if (!confirmed) return

    try {
      setDeleting(true)

      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      // Sign out after successful deletion
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (err) {
      console.error('Error deleting account:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="delete-account-modal-overlay" onClick={onClose}>
      <div className="delete-account-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Delete Account</h2>
        
        <div className="delete-account-modal-content">
          <div className="delete-account-warning">
            <p><strong>Warning: This action cannot be undone!</strong></p>
            <p>Deleting your account will:</p>
            <ul>
              <li>Permanently delete all your tasks</li>
              <li>Remove all your notes</li>
              <li>Delete all your notifications</li>
              <li>Remove you from all teams</li>
              <li>Transfer team ownership if you own any teams</li>
            </ul>
          </div>

          <p style={{ marginTop: '1rem', color: '#666' }}>
            Your email: <strong>{userEmail}</strong>
          </p>

          <div className="delete-account-confirmation">
            <label>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>I understand that this action is permanent and cannot be undone</span>
            </label>
          </div>
        </div>

        <div className="delete-account-actions">
          <button
            onClick={onClose}
            disabled={deleting}
            className="delete-account-cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!confirmed || deleting}
            className="delete-account-confirm-btn"
          >
            {deleting ? 'Deleting...' : 'Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

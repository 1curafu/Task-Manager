'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import './ProfileModal.css'

interface ProfileModalProps {
  userEmail: string
  onClose: () => void
}

interface ProfileData {
  email: string
  name: string
  avatar: string
}

/**
 * Profile settings modal component.
 * Allows users to update their profile information (name, avatar), change password, and delete their account.
 * 
 * @param userEmail - The current email of the user.
 * @param onClose - Callback to close the modal.
 */
export default function ProfileModal({ userEmail, onClose }: ProfileModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    email: userEmail,
    name: '',
    avatar: ''
  })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    if (password.length < 8) errors.push('At least 8 characters')
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter')
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter')
    if (!/[0-9]/.test(password)) errors.push('One number')
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('One special character')
    return errors
  }

  useEffect(() => {
    if (newPassword) {
      setPasswordErrors(validatePassword(newPassword))
    } else {
      setPasswordErrors([])
    }
  }, [newPassword])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        return
      }

      setProfile({
        email: user.email || '',
        name: user.user_metadata?.name || '',
        avatar: user.user_metadata?.avatar || ''
      })
    } catch {
      setMessage({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 2MB' })
      return
    }

    try {
      setUploading(true)
      setMessage(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setProfile({ ...profile, avatar: publicUrl })
      setMessage({ type: 'success', text: 'Avatar uploaded! Click Save Changes to apply.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload avatar' })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    try {
      setDeleting(true)
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }
      
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match' })
        return
      }
      const errors = validatePassword(newPassword)
      if (errors.length > 0) {
        setMessage({ type: 'error', text: 'Password does not meet requirements' })
        return
      }
    }

    try {
      setSaving(true)
      setMessage(null)

      const updates: {
        email?: string
        password?: string
        metadata?: { name?: string, avatar?: string }
      } = {}

      const { data: { user } } = await supabase.auth.getUser()
      if (profile.email !== user?.email) {
        updates.email = profile.email
      }

      if (newPassword) {
        updates.password = newPassword
      }

      if (profile.name !== user?.user_metadata?.name || profile.avatar !== user?.user_metadata?.avatar) {
        updates.metadata = {
          name: profile.name,
          avatar: profile.avatar
        }
      }

      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      // Also update Profile table for client-side access
      if (profile.name || profile.avatar) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('Profile')
            .upsert({
              userId: user.id,
              name: profile.name,
              avatar: profile.avatar,
              updatedAt: new Date().toISOString()
            }, {
              onConflict: 'userId'
            })
        }
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setNewPassword('')
      setConfirmPassword('')

      if (updates.email) {
        setMessage({ 
          type: 'success', 
          text: 'Profile updated! Please check your new email to confirm the change.' 
        })
      }
      
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to update profile' 
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>Profile Settings</h2>
          <button onClick={onClose} className="profile-modal-close">×</button>
        </div>

        {message && (
          <div className={`profile-modal-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="profile-modal-loading">Loading profile...</div>
        ) : (
          <form onSubmit={handleUpdateProfile} className="profile-modal-form">
            <div className="profile-modal-section">
              <h3>Account Information</h3>
              
              <div className="profile-modal-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  required
                />
                <small>Changing your email will require confirmation</small>
              </div>

              <div className="profile-modal-field">
                <label htmlFor="name">Display Name</label>
                <input
                  id="name"
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div className="profile-modal-field">
                <label htmlFor="avatar">Profile Picture</label>
                <div className="avatar-upload-container">
                  {profile.avatar && (
                    <Image src={profile.avatar} alt="Avatar" width={100} height={100} className="avatar-preview" style={{ objectFit: 'cover' }} />
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="upload-avatar-btn"
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </button>
                </div>
                <small>Max 2MB, JPG/PNG/GIF</small>
              </div>
            </div>

            <div className="profile-modal-section">
              <h3>Change Password</h3>
              
              <div className="profile-modal-field">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                />
                {newPassword && passwordErrors.length > 0 && (
                  <div className="password-requirements">
                    <small>Password must have:</small>
                    <ul>
                      {passwordErrors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="profile-modal-field">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                />
              </div>
            </div>

            <div className="profile-modal-section danger-zone">
              <h3>Danger Zone</h3>
              <p>Once you delete your account, there is no going back.</p>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="delete-account-btn"
                >
                  Delete Account
                </button>
              ) : (
                <div className="delete-confirm">
                  <p><strong>Are you sure?</strong> This will permanently delete your account and all your data.</p>
                  <div className="delete-confirm-actions">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="cancel-delete-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="confirm-delete-btn"
                    >
                      {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="profile-modal-actions">
              <button type="button" onClick={onClose} className="profile-modal-cancel">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || (newPassword.length > 0 && passwordErrors.length > 0)}
                className="profile-modal-save"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import styles from '@/app/dashboard/dashboard.module.css'
import { User, FloppyDisk as Save, Image as ImageIcon } from '@phosphor-icons/react'
import Image from 'next/image'

interface Profile {
  id: string
  name: string
  avatar?: string
}

interface ProfileFormProps {
  initialProfile: Profile | null
  userId: string
}

export function ProfileForm({ initialProfile, userId }: ProfileFormProps) {
  const [name, setName] = useState(initialProfile?.name || '')
  const [avatar, setAvatar] = useState(initialProfile?.avatar || '')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  const supabase = createClient()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('Profile')
        .upsert({ 
            userId: userId,
            name: name,
            avatar: avatar,
            updatedAt: new Date().toISOString()
        }, { onConflict: 'userId' })

      if (error) throw error

      setMessage({ text: 'Profile updated successfully!', type: 'success' })
      
      setTimeout(() => setMessage(null), 3000)

    } catch (error) {
      console.error('Error updating profile:', error)
      if (typeof error === 'object' && error !== null) {
          console.error('Error details:', JSON.stringify(error, null, 2))
      }
      setMessage({ text: 'Failed to update profile.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.card} style={{ maxWidth: '600px' }}>
      <div className={styles.cardHeader}>
        <div className={styles.iconBox}><User /></div>
      </div>
      <h3 className={styles.cardTitle}>Profile Settings</h3>
      
      <form onSubmit={handleUpdate} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                background: 'var(--color-brand-blue)', 
                color: 'white',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 600,
                overflow: 'hidden',
                position: 'relative'
            }}>
                {avatar ? (
                    <Image src={avatar} alt="Avatar" layout="fill" objectFit="cover" />
                ) : (
                    name ? name.substring(0, 2).toUpperCase() : 'ME'
                )}
            </div>
            <div>
                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Profile Picture</div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
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

                            const fileExt = file.name.split('.').pop()
                            const fileName = `${Date.now()}.${fileExt}`
                            const filePath = `${userId}/${fileName}`

                            const { error: uploadError } = await supabase.storage
                                .from('avatars')
                                .upload(filePath, file, { upsert: true })

                            if (uploadError) throw uploadError

                            const { data: { publicUrl } } = supabase.storage
                                .from('avatars')
                                .getPublicUrl(filePath)

                            setAvatar(publicUrl)
                            setMessage({ type: 'success', text: 'Avatar uploaded! Click Save Changes to apply.' })
                        } catch (err) {
                            console.error(err)
                            setMessage({ type: 'error', text: 'Failed to upload avatar' })
                        } finally {
                            setUploading(false)
                        }
                    }}
                    style={{ display: 'none' }}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ 
                        fontSize: '0.875rem', 
                        color: 'var(--color-brand-blue)', 
                        background: 'var(--color-brand-blue-light)', 
                        border: 'none', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '0.5rem', 
                        cursor: 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <ImageIcon size={16} />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
            </div>
        </div>

        <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-slate-500)' }}>Display Name</label>
            <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.formInput}
                placeholder="Enter your name"
            />
        </div>

        {message && (
            <div className={message.type === 'success' ? styles.statusSuccess : styles.statusError}>
                {message.text}
            </div>
        )}

        <button 
            type="submit" 
            disabled={loading}
            className={styles.btnPrimary}
            style={{ opacity: loading ? 0.7 : 1 }}
        >
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Changes'}
        </button>

      </form>
    </div>
  )
}

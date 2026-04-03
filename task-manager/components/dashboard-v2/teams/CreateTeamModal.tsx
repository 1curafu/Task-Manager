'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import styles from '@/app/dashboard/dashboard.module.css'

interface CreateTeamModalProps {
  userId: string
  userEmail: string
  onClose: () => void
  onUpdate: () => void
}

export function CreateTeamModal({ userId, userEmail, onClose, onUpdate }: CreateTeamModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!name.trim()) {
        setError('Team name is required')
        setLoading(false)
        return
      }

      const { data: teamData, error: teamError } = await supabase
        .from('Team')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          ownerId: userId,
        })
        .select()
        .single()

      if (teamError) throw teamError

      const { error: memberError } = await supabase
        .from('TeamMember')
        .insert({
          teamId: teamData.id,
          userId: userId,
          userEmail: userEmail,
          role: 'owner',
          status: 'accepted',
          invitedBy: userId,
        })

      if (memberError) {
        await supabase.from('Team').delete().eq('id', teamData.id)
        throw memberError
      }

      onUpdate()
      onClose()
    } catch (err) {
      console.error('Error creating team:', err)
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.modalOverlay}
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={styles.modalContent}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Create New Team</h2>
            <button onClick={onClose} className={styles.modalCloseBtn}>&times;</button>
        </div>

        <form onSubmit={handleCreate} className={styles.modalForm}>
           <div>
              <label className={styles.modalLabel}>Team Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className={styles.modalInput}
                placeholder="e.g. Marketing Team"
                autoFocus
              />
           </div>

           <div>
              <label className={styles.modalLabel}>Description (Optional)</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={styles.modalTextarea}
                placeholder="What is this team for?"
              />
           </div>

           {error && <div className={styles.statusError}>{error}</div>}

           <div className={styles.modalFooter}>
              <button 
                type="button" 
                onClick={onClose}
                className={styles.modalBtnCancel}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className={styles.modalBtnSubmit}
              >
                {loading ? 'Creating...' : 'Create Team'}
              </button>
           </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

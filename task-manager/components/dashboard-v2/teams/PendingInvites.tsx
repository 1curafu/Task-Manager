'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'
import styles from '@/app/dashboard/dashboard.module.css'
import { EnvelopeSimple as Mail, CheckCircle, XCircle } from '@phosphor-icons/react'

interface PendingInvite {
  id: string
  teamId: string
  userId: string | null
  userEmail: string
  role: string
  status: string
  invitedBy: string
  invitedAt: string
  team?: {
    name: string
    description: string | null
    ownerId: string
  }
}

export function PendingInvites({ userEmail, userId, onAction }: { userEmail: string, userId: string | null, onAction: () => void }) {
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = createClient()

  const loadInvites = useCallback(async () => {
    if (!userEmail) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('TeamMember')
        .select(`
          *,
          team:Team (
            name,
            description,
            ownerId
          )
        `)
        .eq('userEmail', userEmail)
        .eq('status', 'pending')

      if (error) throw error
      
      setInvites((data as unknown as PendingInvite[]) || [])
    } catch (err) {
      console.error('Failed to load invites:', err)
    } finally {
      setLoading(false)
    }
  }, [userEmail, supabase])

  useEffect(() => {
    void loadInvites()
  }, [loadInvites])

  const handleAccept = async (inviteId: string) => {
    if (!userId) return
    // Verify the invite belongs to the current user's email before accepting
    const invite = invites.find(i => i.id === inviteId)
    if (!invite || invite.userEmail !== userEmail) return

    try {
      setActionLoading(inviteId)
      
      const { error } = await supabase.rpc('accept_team_invite', {
        invite_id: inviteId,
        user_id: userId
      })

      if (error) throw error
      
      await loadInvites()
      onAction()
    } catch (err) {
      console.error('Error accepting invite:', err)
      alert('Failed to accept invitation.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecline = async (inviteId: string) => {
    if (!userId) return

    try {
      setActionLoading(inviteId)
      
      const { error } = await supabase.rpc('decline_team_invite', {
        invite_id: inviteId,
        user_id: userId
      })

      if (error) throw error
      
      await loadInvites()
    } catch (err) {
      console.error('Error declining invite:', err)
      alert('Failed to decline invitation.')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading || invites.length === 0) {
    return null
  }

  return (
    <div className={styles.invitesContainer}>
        <h3 className={styles.invitesHeader}>
            <Mail size={20} color="var(--color-brand-blue)" />
            Pending Invitations ({invites.length})
        </h3>
        
        <div className={styles.invitesList}>
            {invites.map(invite => (
                <div key={invite.id} className={`${styles.card} ${styles.inviteCard}`}>
                    
                    <div className={styles.inviteInfo}>
                        <div className={styles.inviteIcon}>
                            <Mail size={20} />
                        </div>
                        <div>
                            <div className={styles.inviteTeamName}>
                                {invite.team?.name || 'Unknown Team'}
                            </div>
                            <div className={styles.inviteRoleText}>
                                Invited to join as <strong className={styles.inviteRoleHighlight}>{invite.role}</strong>
                            </div>
                        </div>
                    </div>

                    <div className={styles.inviteActions}>
                        <button 
                            onClick={() => handleDecline(invite.id)}
                            disabled={actionLoading === invite.id}
                            className={styles.inviteBtnDecline}
                        >
                            <XCircle size={18} />
                            Decline
                        </button>
                        <button 
                            onClick={() => handleAccept(invite.id)}
                            disabled={actionLoading === invite.id}
                            className={styles.inviteBtnAccept}
                        >
                            <CheckCircle size={18} />
                            {actionLoading === invite.id ? 'Accepting...' : 'Accept'}
                        </button>
                    </div>

                </div>
            ))}
        </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import './TeamInviteModal.css'

interface TeamInviteModalProps {
  inviteId: string
  userId: string
  onClose: () => void
  onAccept: () => void
  onDecline: () => void
}

interface TeamInviteDetails {
  teamName: string
  ownerEmail: string
  role: string
}

export default function TeamInviteModal({ inviteId, userId, onClose, onAccept, onDecline }: TeamInviteModalProps) {
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState<TeamInviteDetails | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadInviteDetails = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .rpc('get_invite_details', { invite_id_param: inviteId })

      if (error) throw error

      if (data) {
        setDetails({
          teamName: data.team_name,
          ownerEmail: data.owner_email,
          role: data.invite_role
        })
      } else {
        alert('This invitation is no longer available')
        onClose()
      }
    } catch (err) {
      console.error('Error loading invite details:', err)
      alert('Failed to load invitation details')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInviteDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteId])

  const handleAccept = async () => {
    try {
      setAccepting(true)
      const { error } = await supabase.rpc('accept_team_invite', {
        invite_id: inviteId,
        user_id: userId
      })

      if (error) throw error
      onAccept()
    } catch (err) {
      console.error('Error accepting invite:', err)
      alert('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  const handleDecline = async () => {
    try {
      setDeclining(true)
      const { error } = await supabase.rpc('decline_team_invite', {
        invite_id: inviteId,
        user_id: userId
      })

      if (error) throw error
      onDecline()
    } catch (err) {
      console.error('Error declining invite:', err)
      alert('Failed to decline invitation')
    } finally {
      setDeclining(false)
    }
  }

  return (
    <motion.div 
      className="team-invite-overlay" 
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div 
        className="team-invite-modal" 
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {loading ? (
          <div className="team-invite-loading">Loading...</div>
        ) : details ? (
          <>
            <h2 className="team-invite-title">Team Invitation</h2>
            <div className="team-invite-content">
              <div className="team-invite-detail">
                <span className="team-invite-label">Team Name:</span>
                <span className="team-invite-value">{details.teamName}</span>
              </div>
              <div className="team-invite-detail">
                <span className="team-invite-label">Team Owner:</span>
                <span className="team-invite-value">{details.ownerEmail}</span>
              </div>
              <div className="team-invite-detail">
                <span className="team-invite-label">Your Role:</span>
                <span className="team-invite-value team-invite-role">{details.role}</span>
              </div>
            </div>
            <div className="team-invite-actions">
              <button
                onClick={handleDecline}
                disabled={declining || accepting}
                className="team-invite-btn team-invite-decline"
              >
                {declining ? 'Declining...' : 'Decline'}
              </button>
              <button
                onClick={handleAccept}
                disabled={accepting || declining}
                className="team-invite-btn team-invite-accept"
              >
                {accepting ? 'Accepting...' : 'Accept'}
              </button>
            </div>
          </>
        ) : (
          <div className="team-invite-error">Failed to load invitation details</div>
        )}
      </motion.div>
    </motion.div>
  )
}

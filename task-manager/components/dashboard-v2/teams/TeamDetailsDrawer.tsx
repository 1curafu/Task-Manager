'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { X, Crown, Star, Trash as Trash2, SignOut as LogOut, PaperPlaneRight as Send } from '@phosphor-icons/react'
import { CustomDropdown } from '@/components/dashboard-v2/CustomDropdown'
import { ConfirmDialog } from '@/components/dashboard-v2/ConfirmDialog'
import styles from '@/app/dashboard/dashboard.module.css'

interface Team {
  id: string
  name: string
  description: string | null
  ownerId: string
}

interface TeamMember {
  id: string
  userId: string | null
  userEmail: string
  name?: string | null
  avatar?: string | null
  role: 'owner' | 'admin' | 'member'
  status: 'pending' | 'accepted' | 'declined'
}

interface TeamDetailsDrawerProps {
  teamId: string
  userId: string
  onClose: () => void
  onUpdate: () => void
}

export function TeamDetailsDrawer({ teamId, userId, onClose, onUpdate }: TeamDetailsDrawerProps) {
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [isInviting, setIsInviting] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    isDestructive: boolean
    confirmLabel: string
    onConfirm: () => Promise<void>
  }>({
    isOpen: false,
    title: '',
    message: '',
    isDestructive: false,
    confirmLabel: 'Confirm',
    onConfirm: async () => {}
  })

  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
  
  const supabase = createClient()

  const loadTeamDetails = useCallback(async () => {
    try {
      const { data: teamDataArray, error: teamError } = await supabase
        .rpc('get_team_details', { 
          team_id_param: teamId,
          user_id_param: userId 
        })

      if (teamError) throw teamError
      setTeam(teamDataArray?.[0] || null)

      const { data: membersData, error: membersError } = await supabase
        .rpc('get_team_members', { 
          team_id_param: teamId,
          user_id_param: userId 
        })

      if (membersError) throw membersError
      
      const memberIds = (membersData || []).filter((m: TeamMember) => m.userId).map((m: TeamMember) => m.userId)
      
      if (memberIds.length > 0) {
        const { data: profiles } = await supabase
          .from('Profile')
          .select('userId, name, avatar')
          .in('userId', memberIds)
        
        const profileMap = new Map(profiles?.map(p => [p.userId, p]) || [])
        
        const enrichedMembers = (membersData || []).map((member: TeamMember) => {
          const profile = member.userId ? profileMap.get(member.userId) : null
          return {
            ...member,
            name: profile?.name || null,
            avatar: profile?.avatar ? `${profile.avatar}?t=${Date.now()}` : null
          }
        })
        
        setMembers(enrichedMembers)
      } else {
        setMembers(membersData || [])
      }
    } catch (err) {
      console.error('Error loading team details:', err)
    }
  }, [teamId, userId, supabase])

  useEffect(() => {
    void loadTeamDetails()
  }, [loadTeamDetails])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotification(null)

    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
        setNotification({ type: 'error', message: 'Please enter a valid email' })
        return
    }

    try {
      setIsInviting(true)
      const normalizedEmail = inviteEmail.trim().toLowerCase()

      const { data, error: inviteError } = await supabase
        .rpc('invite_team_member', {
          team_id_param: teamId,
          user_id_param: userId,
          invite_email_param: normalizedEmail,
          invite_role_param: inviteRole,
          invited_by_param: userId
        })

      if (inviteError) throw inviteError

      if (data && data.success === false) {
        setNotification({ type: 'error', message: data.error || 'Failed to send invite' })
      } else {
        setNotification({ type: 'success', message: 'Invitation sent successfully!' })
        setInviteEmail('')
        void loadTeamDetails()
      }
    } catch (err) {
        setNotification({ type: 'error', message: err instanceof Error ? err.message : 'Failed to send invite' })
    } finally {
        setIsInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
      setConfirmConfig({
          isOpen: true,
          title: 'Remove Member',
          message: 'Are you sure you want to remove this member from the team?',
          isDestructive: true,
          confirmLabel: 'Remove',
          onConfirm: async () => {
              setActionLoading(true)
              try {
                const { error } = await supabase
                    .rpc('remove_team_member', { 
                      member_id_param: memberId,
                      user_id_param: userId 
                    })
                
                if (error) throw error
                await loadTeamDetails()
                closeConfirm()
              } catch (err) {
                  alert('Failed to remove member')
                  console.error(err)
              } finally {
                  setActionLoading(false)
              }
          }
      })
  }

  const handleLeaveTeam = async () => {
      setConfirmConfig({
          isOpen: true,
          title: 'Leave Team',
          message: 'Are you sure you want to leave this team?',
          isDestructive: true,
          confirmLabel: 'Leave',
          onConfirm: async () => {
              setActionLoading(true)
              try {
                  const { error } = await supabase.rpc('leave_team', {
                      team_id_param: teamId
                  })
                  
                  if (error) throw error
                  onUpdate()
                  onClose()
              } catch (err) {
                  alert('Failed to leave team')
                  console.error(err)
              } finally {
                  setActionLoading(false)
              }
          }
      })
  }

  const handleDeleteTeam = async () => {
      setConfirmConfig({
          isOpen: true,
          title: 'Delete Team',
          message: 'Are you sure you want to DELETE this team? This action cannot be undone.',
          isDestructive: true,
          confirmLabel: 'Delete Team',
          onConfirm: async () => {
              setActionLoading(true)
              try {
                  const { error } = await supabase
                      .rpc('delete_team', { 
                        team_id_param: teamId,
                        user_id_param: userId 
                      })
                  
                  if (error) throw error
                  onUpdate()
                  onClose()
              } catch (err) {
                  alert('Failed to delete team')
                  console.error(err)
              } finally {
                  setActionLoading(false)
              }
          }
      })
  }

  if (!team) return null

  const currentUserMember = members.find(m => m.userId === userId)
  const userRole = currentUserMember?.role
  const isOwner = userRole === 'owner'
  const isAdmin = userRole === 'admin'
  const canManage = isOwner || isAdmin

  return (
    <>
      <motion.div 
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 890,
          background: 'rgba(15, 23, 42, 0.1)',
        }}
      />
      <motion.div 
        initial={{ x: '100%', opacity: 0.5 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0.5 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '400px',
          background: 'var(--color-white)',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
          zIndex: 900,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--color-slate-200)'
        }}
      >
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
         <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-slate-800)' }}>{team.name}</h2>
            {team.description && <p style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{team.description}</p>}
         </div>
         <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-slate-400)' }}>
            <X size={24} />
         </button>
      </div>

      {canManage && (
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-slate-100)', background: 'var(--color-slate-50)' }}>
             <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-slate-600)', marginBottom: '0.75rem' }}>Invite Member</h3>
             <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                        type="email" 
                        placeholder="Email address"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-slate-300)', fontSize: '0.875rem' }}
                    />
                    <div style={{ width: '120px' }}>
                        <CustomDropdown 
                            value={inviteRole}
                            onChange={(val) => setInviteRole(val as 'admin' | 'member')}
                            options={[
                                { label: 'Member', value: 'member' },
                                { label: 'Admin', value: 'admin' }
                            ]}
                            triggerStyle={{
                                padding: '0.5rem 0.75rem', 
                                borderRadius: '0.5rem', 
                                border: '1px solid var(--color-slate-300)', 
                                fontSize: '0.875rem',
                                height: '100%'
                            }}
                        />
                    </div>
                </div>
                <button 
                    type="submit" 
                    disabled={isInviting}
                    style={{ 
                        padding: '0.5rem', 
                        borderRadius: '0.375rem', 
                        border: 'none', 
                        background: 'var(--color-brand-blue)', 
                        color: 'white', 
                        cursor: 'pointer', 
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        opacity: isInviting ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {isInviting ? 'Sending...' : <><Send size={16} /> Send Invite</>}
                </button>
             </form>
             {notification && (
                 <div style={{ 
                     marginTop: '0.75rem', 
                     padding: '0.5rem', 
                     borderRadius: '0.375rem', 
                     fontSize: '0.75rem',
                     background: notification.type === 'success' ? '#dcfce7' : '#fee2e2',
                     color: notification.type === 'success' ? '#166534' : '#991b1b'
                 }}>
                     {notification.message}
                 </div>
             )}
          </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
         <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-slate-600)', marginBottom: '1rem' }}>Members ({members.length})</h3>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {members.map(member => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: 'var(--color-slate-200)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        overflow: 'hidden',
                        fontSize: '0.875rem',
                        color: 'var(--color-slate-600)'
                    }}>
                        {member.avatar ? (
                            <Image src={member.avatar} alt="Avatar" width={32} height={32} />
                        ) : (
                            member.name?.[0] || member.userEmail[0]
                        )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-slate-900)' }}>
                            {member.name || member.userEmail.split('@')[0]}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {member.userEmail}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {member.role === 'owner' && <Crown size={16} color="#eab308" />}
                        {member.role === 'admin' && <Star size={16} color="#64748b" />}
                        <span style={{ 
                            fontSize: '0.75rem', 
                            padding: '0.125rem 0.375rem', 
                            borderRadius: '99px', 
                            background: member.status === 'accepted' ? '#dcfce7' : '#fef9c3',
                            color: member.status === 'accepted' ? '#166534' : '#854d0e'
                        }}>
                            {member.status}
                        </span>
                        {canManage && member.role !== 'owner' && member.userId !== userId && (
                            <button 
                                onClick={() => handleRemoveMember(member.id)}
                                title="Remove Member"
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
         </div>
      </div>

      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-slate-100)', display: 'flex', gap: '1rem' }}>
         {isOwner ? (
             <button 
                onClick={handleDeleteTeam}
                className={styles.drawerDangerBtn}
             >
                <Trash2 size={18} /> Delete Team
             </button>
         ) : (
             <button 
                onClick={handleLeaveTeam}
                className={styles.drawerSecondaryBtn}
             >
                <LogOut size={18} /> Leave Team
             </button>
         )}
        </div>
      </motion.div>
      
      <ConfirmDialog 
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          isDestructive={confirmConfig.isDestructive}
          confirmLabel={confirmConfig.confirmLabel}
          onConfirm={confirmConfig.onConfirm}
          onCancel={closeConfirm}
          loading={actionLoading}
      />
    </>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'
import Image from 'next/image'
import ConfirmModal from './ConfirmModal'
import './TeamsPanel.css'

interface Team {
  id: string
  name: string
  description: string | null
  ownerId: string
  createdAt: string
}

interface TeamMember {
  id: string
  teamId: string
  userId: string | null
  userEmail: string
  name?: string | null
  avatar?: string | null
  role: 'owner' | 'admin' | 'member'
  status: 'pending' | 'accepted' | 'declined'
  invitedBy: string
  invitedAt: string
  respondedAt: string | null
}

export default function TeamsPanel({ 
  userId, 
  userEmail 
}: { 
  userId: string
  userEmail: string 
}) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showTeamsModal, setShowTeamsModal] = useState(false)
  const supabase = createClient()

  const loadTeams = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const { data: ownedTeams, error: ownedError } = await supabase
        .from('Team')
        .select('*')
        .eq('ownerId', userId)

      if (ownedError) {
        setTeams([])
        setLoading(false)
        return
      }

      const { data: memberTeams, error: memberError } = await supabase
        .rpc('get_user_member_teams', { user_id_param: userId })

      if (memberError) {
        setTeams(ownedTeams || [])
        setLoading(false)
        return
      }

      const allTeams = [...(ownedTeams || []), ...(memberTeams || [])]
      setTeams(allTeams)
    } catch (err) {
      console.error('Error loading teams:', err)
      setTeams([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  if (loading) {
    return (
      <div className="teams-panel">
        <div className="teams-header">
          <h3 className="teams-title">Teams</h3>
        </div>
        <div className="teams-loading">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <div className="teams-panel">
        <h3 className="teams-title">Teams</h3>
        
        <div className="teams-content">
          {teams.length === 0 ? (
            <p className="teams-preview-text">No teams yet</p>
          ) : (
            <div className="teams-preview-list">
              {teams.slice(0, 3).map((team) => (
                <div
                  key={team.id}
                  className="team-preview-item"
                  onClick={() => setShowTeamsModal(true)}
                >
                  <div className="team-info">
                    <h4 className="team-name">{team.name}</h4>
                  </div>
                </div>
              ))}
              {teams.length > 3 && (
                <button
                  className="teams-view-all"
                  onClick={() => setShowTeamsModal(true)}
                >
                  View all {teams.length} teams →
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowTeamsModal(true)}
          className="btn btn-primary teams-new-btn"
        >
          + New
        </button>
      </div>

      {showTeamsModal && (
        <TeamsModal
          userId={userId}
          userEmail={userEmail}
          teams={teams}
          onClose={() => setShowTeamsModal(false)}
          onUpdate={loadTeams}
        />
      )}
    </>
  )
}

function TeamsModal({ userId, userEmail, teams, onClose, onUpdate }: {
  userId: string
  userEmail: string
  teams: Team[]
  onClose: () => void
  onUpdate: () => void
}) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notes-modal-header">
          <h2 className="modal-title">Teams</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="notes-modal-body">
          <div className="notes-sidebar">
            <div className="notes-sidebar-header">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary btn-full-width"
              >
                + Create Team
              </button>
            </div>

            <div className="notes-list-container">
              {teams.length === 0 ? (
                <p className="notes-empty-text">No teams yet</p>
              ) : (
                <div className="notes-list-section">
                  <div className="notes-list-scroll">
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        className={`note-list-card ${selectedTeamId === team.id ? 'active' : ''}`}
                        onClick={() => setSelectedTeamId(team.id)}
                      >
                        <div className="team-list-header">
                          <span className="team-list-name">{team.name}</span>
                        </div>
                        {team.description && (
                          <div className="note-list-preview">
                            {team.description.substring(0, 60)}
                            {team.description.length > 60 && '...'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="notes-content">
            {!selectedTeamId ? (
              <div className="notes-empty-editor">
                <p>Select a team to view details</p>
              </div>
            ) : (
              <TeamDetailsContent
                teamId={selectedTeamId}
                userId={userId}
                onUpdate={onUpdate}
              />
            )}
          </div>
        </div>

        {showCreateModal && (
          <CreateTeamModal
            userId={userId}
            userEmail={userEmail}
            onClose={() => setShowCreateModal(false)}
            onUpdate={() => {
              setShowCreateModal(false)
              onUpdate()
            }}
          />
        )}
      </div>
    </div>
  )
}

function CreateTeamModal({ userId, userEmail, onClose, onUpdate }: {
  userId: string
  userEmail: string
  onClose: () => void
  onUpdate: () => void
}) {
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

      // Create team
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

      if (memberError) throw memberError

      onUpdate()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content team-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Team</h2>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        <form onSubmit={handleCreate} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="team-name">
              Team Name *
            </label>
            <input
              id="team-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Team"
              maxLength={50}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="team-description">
              Description (optional)
            </label>
            <textarea
              id="team-description"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this team for?"
              rows={3}
              maxLength={200}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TeamDetailsContent({ teamId, userId, onUpdate }: {
  teamId: string
  userId: string
  onUpdate: () => void
}) {
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDanger: false,
    onConfirm: () => {}
  })
  
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
      
      // Fetch profile data for members with userId
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
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId])

  useEffect(() => {
    loadTeamDetails()
  }, [loadTeamDetails])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
        setError('Please enter a valid email')
        return
      }

      const normalizedEmail = inviteEmail.trim().toLowerCase()

      const { data: currentUser } = await supabase.auth.getUser()
      if (currentUser?.user?.email?.toLowerCase() === normalizedEmail) {
        setError('You cannot invite yourself')
        return
      }

      const { data, error: inviteError } = await supabase
        .rpc('invite_team_member', {
          team_id_param: teamId,
          user_id_param: userId,
          invite_email_param: normalizedEmail,
          invite_role_param: inviteRole,
          invited_by_param: userId
        })

      console.log('Invite RPC Response:', { data, inviteError })

      if (inviteError) {
        throw inviteError
      }

      if (data && data.success === false) {
        setError(data.error || 'Failed to send invite')
        return
      }
      
      setInviteEmail('')
      setShowInviteForm(false)
      await loadTeamDetails()
      
      if (data?.action === 're-invited') {
        setSuccess('Re-invitation sent successfully!')
      } else {
        setSuccess('Invitation sent successfully!')
      }
    } catch (err) {
      console.error('Error inviting member:', err)
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    const memberToRemove = members.find(m => m.id === memberId)
    const memberName = memberToRemove?.userEmail || 'this member'
    
    setConfirmConfig({
      title: 'Remove Member',
      message: `Are you sure you want to remove ${memberName} from the team?`,
      confirmText: 'Remove',
      isDanger: true,
      onConfirm: async () => {
        setShowConfirmModal(false)
        setError('')
        setSuccess('')

        try {
          const { error } = await supabase
            .rpc('remove_team_member', { 
              member_id_param: memberId,
              user_id_param: userId 
            })

          if (error) {
            if (error.message.includes('Permission denied')) {
              setError('You do not have permission to remove members')
              return
            } else if (error.message.includes('Cannot remove the team owner')) {
              setError('Cannot remove the team owner')
              return
            } else if (error.message.includes('Member not found')) {
              setError('Member not found')
              return
            } else {
              throw error
            }
          }
          
          await loadTeamDetails()
          setSuccess(`${memberName} has been removed from the team`)
        } catch (err) {
          console.error('Error removing member:', err)
          setError(err instanceof Error ? err.message : 'Failed to remove member')
        }
      }
    })
    setShowConfirmModal(true)
  }

  const handleLeaveTeam = async () => {
    const myMembership = members.find(m => m.userId === userId)
    
    if (!myMembership) {
      setError('You are not a member of this team')
      return
    }

    if (myMembership.role === 'owner') {
      setError('Team owners cannot leave the team. Please delete the team or transfer ownership first.')
      return
    }

    setConfirmConfig({
      title: 'Leave Team',
      message: `Are you sure you want to leave "${team?.name}"?\n\nYou will need to be re-invited to rejoin.`,
      confirmText: 'Leave',
      isDanger: true,
      onConfirm: async () => {
        setShowConfirmModal(false)
        setError('')
        setSuccess('')

        try {
          const { error } = await supabase
            .from('TeamMember')
            .delete()
            .eq('id', myMembership.id)

          if (error) throw error
          
          onUpdate()
          setSuccess('You have successfully left the team')
          setTimeout(() => {
          }, 1000)
        } catch (err) {
          console.error('Error leaving team:', err)
          setError(err instanceof Error ? err.message : 'Failed to leave team. Please try again.')
        }
      }
    })
    setShowConfirmModal(true)
  }

  const handleDeleteTeam = async () => {
    const teamName = team?.name || 'this team'
    
    setConfirmConfig({
      title: 'Delete Team',
      message: `Are you sure you want to DELETE "${teamName}"?\n\nThis will permanently delete:\n• All team members\n• All team tasks\n• All team data\n\nThis action CANNOT be undone!`,
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: async () => {
        setShowConfirmModal(false)
        setError('')
        setSuccess('')

        try {
          const { error } = await supabase
            .rpc('delete_team', { 
              team_id_param: teamId,
              user_id_param: userId 
            })

          if (error) {
            if (error.message.includes('Permission denied')) {
              setError('Only the team owner can delete the team')
              return
            } else if (error.message.includes('Team not found')) {
              setError('Team not found')
              return
            } else {
              throw error
            }
          }

          onUpdate()
          setSuccess(`Team "${teamName}" has been deleted successfully`)
          setTimeout(() => {
          }, 1000)
        } catch (err) {
          console.error('Error deleting team:', err)
          setError(err instanceof Error ? err.message : 'Failed to delete team. Please try again.')
        }
      }
    })
    setShowConfirmModal(true)
  }

  const userRole = members.find(m => m.userId === userId)?.role
  const canInvite = userRole === 'owner' || userRole === 'admin'
  const canRemoveMembers = userRole === 'owner' || userRole === 'admin'
  const isOwner = userRole === 'owner'

  if (loading) {
    return (
      <div className="notes-editor">
        <div className="notes-empty-editor">Loading team...</div>
      </div>
    )
  }

  if (!team) return null

  return (
    <div className="notes-editor">
      {error && (
        <div className="form-error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="form-success" style={{ marginBottom: '20px' }}>
          {success}
        </div>
      )}
      
      <div className="team-details-header">
        <h2 className="modal-title">{team.name}</h2>
        {team.description && (
          <p className="team-subtitle">{team.description}</p>
        )}
        <div className="team-header-actions">
          {isOwner && (
            <button
              onClick={handleDeleteTeam}
              className="btn btn-small btn-danger"
              style={{ marginTop: '10px' }}
            >
              🗑️ Delete Team
            </button>
          )}
          {!isOwner && userRole && (
            <button
              onClick={handleLeaveTeam}
              className="btn btn-small btn-secondary"
              style={{ marginTop: '10px' }}
            >
              🚪 Leave Team
            </button>
          )}
        </div>
      </div>

      <div className="team-details-body">
        <div className="team-section">
          <div className="team-section-header">
            <h3 className="team-section-title">Members ({members.length})</h3>
            {canInvite && !showInviteForm && (
              <button
                onClick={() => setShowInviteForm(true)}
                className="btn btn-small btn-primary"
              >
                + Invite
              </button>
            )}
          </div>

          {showInviteForm && (
            <form onSubmit={handleInvite} className="invite-form">
              <div className="invite-form-row">
                <input
                  type="email"
                  className="form-input"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@example.com"
                  autoFocus
                />
                <select
                  className="form-select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn btn-small btn-primary">
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="btn btn-small btn-secondary"
                >
                  Cancel
                </button>
              </div>
              {error && <div className="form-error">{error}</div>}
            </form>
          )}

          <div className="members-list">
            {members.map((member) => (
              <div key={member.id} className="member-item">
                <div className="member-avatar">
                  {member.avatar ? (
                    <Image src={member.avatar} alt={member.name || member.userEmail || 'User'} width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    member.name ? member.name.charAt(0).toUpperCase() : (member.userEmail ? member.userEmail.charAt(0).toUpperCase() : '?')
                  )}
                </div>
                <div className="member-info">
                  <div className="member-email">
                    {member.name && <span style={{ fontWeight: 500 }}>{member.name}</span>}
                    {member.name && member.userEmail && <span style={{ color: '#8e8e93', fontSize: '0.9em', marginLeft: '8px' }}>({member.userEmail})</span>}
                    {!member.name && (member.userEmail || 'Pending...')}
                  </div>
                  <div className="member-meta">
                    <span className={`member-role ${member.role}`}>
                      {member.role === 'owner' && '👑 '}
                      {member.role === 'admin' && '⭐ '}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                    <span className={`member-status ${member.status}`}>
                      {member.status}
                    </span>
                  </div>
                </div>
                {canRemoveMembers && member.role !== 'owner' && member.userId !== userId && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="btn btn-small btn-danger"
                    style={{ marginLeft: 'auto' }}
                    title="Remove member"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={showConfirmModal}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        isDanger={confirmConfig.isDanger}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  )
}

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { Footer } from '@/components/dashboard-v2/Footer'
import { CreateTeamModal } from '@/components/dashboard-v2/teams/CreateTeamModal'
import { TeamDetailsDrawer } from '@/components/dashboard-v2/teams/TeamDetailsDrawer'
import { PendingInvites } from '@/components/dashboard-v2/teams/PendingInvites'
import { UsersThree, Plus, Trophy } from '@phosphor-icons/react'
import styles from '../dashboard.module.css'

interface Team {
  id: string
  name: string
  description: string | null
  ownerId: string
  role?: string
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  
  const supabase = createClient()

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUserId(session.user.id)
        setUserEmail(session.user.email || '')
      }
    }
    void initSession()

    const handleCloseDrawer = () => setSelectedTeamId(null)
    window.addEventListener('close-team-drawer', handleCloseDrawer)
    return () => window.removeEventListener('close-team-drawer', handleCloseDrawer)
  }, [supabase])

  const loadTeams = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      
      const { data: ownedTeams } = await supabase
        .from('Team')
        .select('*')
        .eq('ownerId', userId)

      const { data: memberTeams } = await supabase
        .rpc('get_user_member_teams', { user_id_param: userId })

      const allTeams = [
          ...(ownedTeams || []).map(t => ({ ...t, role: 'owner' })),
          ...(memberTeams || []).filter((mt: Team) => !ownedTeams?.find(ot => ot.id === mt.id))
      ]
      
      const uniqueTeams = Array.from(new Map(allTeams.map(item => [item.id, item])).values())

      setTeams(uniqueTeams)
    } catch (err) {
      console.error('Failed to load teams', err)
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    void loadTeams()
  }, [loadTeams])

  return (
    <>
      <div className={styles.pageHeaderContainerFlex}>
        <div>
            <h2 className={styles.pageTitle}>Teams</h2>
            <p className={styles.pageSubtitle}>Collaborate with your team members.</p>
        </div>
        <button 
            onClick={() => setShowCreateModal(true)}
            className={styles.btnPrimary}
        >
            <Plus size={18} weight="bold" /> New Team
        </button>
      </div>

      <PendingInvites userId={userId} userEmail={userEmail} onAction={loadTeams} />

      <div style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
        {loading ? (
             <div className={styles.emptyStateMessage}>Loading teams...</div>
        ) : teams.length === 0 ? (
             <div className={styles.emptyStateContainer}>
                 <UsersThree size={48} color="var(--color-slate-300)" weight="duotone" style={{ marginBottom: '1rem' }} />
                 <h3 className={styles.emptyStateTitle}>No teams yet</h3>
                 <p className={styles.emptyStateDesc}>Create a team to start collaborating on tasks.</p>
                 <button 
                    onClick={() => setShowCreateModal(true)}
                    className={styles.emptyStateAction}
                 >
                    Create your first team &rarr;
                 </button>
             </div>
        ) : (
            <motion.div 
                className={styles.pageContentGrid}
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                }}
                initial="hidden"
                animate="show"
            >
                {teams.map(team => (
                    <motion.div 
                        key={team.id} 
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
                        }}
                        onClick={() => {
                            setSelectedTeamId(team.id)
                            window.dispatchEvent(new Event('close-notes'))
                        }}
                        className={styles.teamCard}
                    >
                        <div className={styles.teamCardHeader}>
                            <div className={styles.teamCardIcon}>
                                <Trophy size={24} weight="duotone" />
                            </div>
                            <h3 className={styles.teamCardTitle}>{team.name}</h3>
                        </div>
                        <p className={styles.teamCardDescription}>
                            {team.description || 'No description provided.'}
                        </p>
                        
                        {team.role === 'owner' && (
                            <span className={styles.teamRoleBadge}>
                                Owner
                            </span>
                        )}
                    </motion.div>
                ))}
            </motion.div>
        )}
      </div>

      <Footer />

      <AnimatePresence>
        {showCreateModal && userId && (
            <CreateTeamModal 
              userId={userId} 
              userEmail={userEmail}
              onClose={() => setShowCreateModal(false)}
              onUpdate={loadTeams}
            />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTeamId && userId && (
            <TeamDetailsDrawer 
              teamId={selectedTeamId}
              userId={userId}
              onClose={() => setSelectedTeamId(null)}
              onUpdate={loadTeams}
            />
        )}
      </AnimatePresence>
    </>
  )
}

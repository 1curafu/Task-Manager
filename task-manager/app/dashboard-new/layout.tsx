'use client'

import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import styles from './dashboard.module.css'
import { Sidebar } from '@/components/dashboard-v2/Sidebar'
import { Header } from '@/components/dashboard-v2/Header'

import { TaskActionModal } from '@/components/dashboard-v2/TaskActionModal'
import NotesPanel from '@/components/NotesPanel'
import { useRealtimeInvites } from '@/hooks/useRealtimeInvites'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        if (!pathname?.includes('/auth')) {
             router.push('/auth/login')
        }
        return
      }

      const userId = session.user.id
      
      const { data: profile } = await supabase
        .from('Profile')
        .select('name, avatar')
        .eq('userId', userId)
        .single()

      setUserProfile({
        id: userId,
        name: profile?.name || '',
        email: session.user.email || '',
        avatar: profile?.avatar || ''
      })
      setLoading(false)
    }

    init()

    const handleCloseNotes = () => setShowNotes(false)
    window.addEventListener('close-notes', handleCloseNotes)
    return () => window.removeEventListener('close-notes', handleCloseNotes)
  }, [router, supabase, pathname])

  const checkPendingInvites = async () => {
    if (!userProfile?.email || !userProfile?.id) return

    try {
      const { data: pendingInvites } = await supabase
        .from('TeamMember')
        .select('id, teamId, role')
        .eq('userEmail', userProfile.email)
        .eq('status', 'pending')

      if (pendingInvites && pendingInvites.length > 0) {
        for (const invite of pendingInvites) {
          const { data: existingNotif } = await supabase
            .from('Notification')
            .select('id')
            .eq('userId', userProfile.id)
            .eq('type', 'team_invite')
            .eq('link', `/dashboard?acceptInvite=${invite.id}`)
            .maybeSingle()

          if (!existingNotif) {
            const { data: team } = await supabase
              .from('Team')
              .select('name')
              .eq('id', invite.teamId)
              .maybeSingle()

            const teamName = team?.name || 'a team'

            await supabase
              .from('Notification')
              .insert({
                userId: userProfile.id,
                type: 'team_invite',
                title: 'Team Invitation',
                message: `You've been invited to join ${teamName} as ${invite.role}. Click to accept or decline.`,
                link: `/dashboard?acceptInvite=${invite.id}`, // Maintain V1 link for now, or update to V2 teams page?
              })
          }
        }
      }
    } catch (e) {
      console.error('Error checking invites:', e)
    }
  }

  useRealtimeInvites(userProfile?.email, () => {
    void checkPendingInvites()
  })

  if (loading) {
     return (
         <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             Loading...
         </div>
     )
  }
  return (
    <div className={styles.container}>
      <div className={styles.mainLayout}>
        <Sidebar onNotesClick={() => {
            setShowNotes(true)
            window.dispatchEvent(new Event('close-team-drawer'))
        }} />
        
        <main className={styles.content}>
          <Header user={userProfile} onAddTask={() => setShowTaskModal(true)} />
          {children}
        </main>
      </div>
      
      <AnimatePresence>
        {showTaskModal && userProfile && (
          <TaskActionModal 
            task={null} 
            userId={userProfile.id} 
            onClose={() => setShowTaskModal(false)}
            onSave={() => {
              setShowTaskModal(false)
              router.refresh()
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNotes && userProfile && (
           <React.Fragment key="notes-container">
             <motion.div 
                key="notes-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setShowNotes(false)}
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40, background: 'rgba(15, 23, 42, 0.1)' }}
             />
             <motion.div 
                key="notes-panel"
                initial={{ x: '100%', opacity: 0.5 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0.5 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50, width: '400px', background: 'var(--color-white)', boxShadow: '-5px 0 25px rgba(0,0,0,0.15)', borderLeft: '1px solid var(--color-slate-200)' }}
             >
                <NotesPanel userId={userProfile.id} onClose={() => setShowNotes(false)} />
             </motion.div>
           </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  )
}

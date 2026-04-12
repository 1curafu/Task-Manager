'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Toaster } from 'sonner'
import styles from './dashboard.module.css'
import { Sidebar } from '@/components/dashboard-v2/Sidebar'
import { Header, TemplateTask } from '@/components/dashboard-v2/Header'
import { MobileNav } from '@/components/dashboard-v2/MobileNav'
import { PageSkeleton } from '@/components/dashboard-v2/PageSkeleton'

import { TaskActionModal } from '@/components/dashboard-v2/TaskActionModal'
import { OnboardingModal } from '@/components/dashboard-v2/OnboardingModal'
import { useRealtimeInvites } from '@/hooks/useRealtimeInvites'
import { useDueReminders } from '@/hooks/useDueReminders'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ShortcutCheatSheet } from '@/components/dashboard-v2/ShortcutCheatSheet'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string
  hasCompletedOnboarding?: boolean
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [templateTask, setTemplateTask] = useState<TemplateTask | null>(null)
  const focusSearchRef = useRef<(() => void) | null>(null)
  const [showCheatSheet, setShowCheatSheet] = useState(false)
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
        setLoading(false)
        return
      }

      const userId = session.user.id
      
      const { data: profile } = await supabase
        .from('Profile')
        .select('name, avatar, hasCompletedOnboarding')
        .eq('userId', userId)
        .single()

      setUserProfile({
        id: userId,
        name: profile?.name || '',
        email: session.user.email || '',
        avatar: profile?.avatar || '',
        hasCompletedOnboarding: profile?.hasCompletedOnboarding ?? false
      })
      setLoading(false)
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkPendingInvites = useCallback(async () => {
    if (!userProfile?.email || !userProfile?.id) return

    try {
      const { data: pendingInvites } = await supabase
        .from('TeamMember')
        .select('id, teamId, role, userEmail')
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
                link: `/dashboard?acceptInvite=${invite.id}`,
              })
          }
        }
      }
    } catch (e) {
      console.error('Error checking invites:', e)
    }
  }, [supabase, userProfile?.email, userProfile?.id])

  useRealtimeInvites(userProfile?.email, () => {
    void checkPendingInvites()
  })

  useDueReminders(userProfile?.id)

  const handleEscape = useCallback(() => {
    if (showCheatSheet) { setShowCheatSheet(false); return }
    if (showTaskModal) { setShowTaskModal(false); setTemplateTask(null) }
  }, [showCheatSheet, showTaskModal])

  const handleNewTask = useCallback(() => { if (!loading) { setTemplateTask(null); setShowTaskModal(true) } }, [loading])
  const handleFocusSearch = useCallback(() => { focusSearchRef.current?.() }, [])
  const handleKanban = useCallback(() => { if (!loading) router.push('/dashboard/kanban') }, [loading, router])
  const handleToggleCheatSheet = useCallback(() => { if (!loading) setShowCheatSheet(prev => !prev) }, [loading])

  useKeyboardShortcuts({
    onNewTask: handleNewTask,
    onFocusSearch: handleFocusSearch,
    onKanban: handleKanban,
    onEscape: handleEscape,
    onToggleCheatSheet: handleToggleCheatSheet,
  })

  useEffect(() => {
    const handler = () => setShowTaskModal(true)
    window.addEventListener('open-task-modal', handler)
    return () => window.removeEventListener('open-task-modal', handler)
  }, [])

  if (loading) {
     return (
         <div className={styles.container} style={{ padding: '2rem' }}>
             <PageSkeleton />
         </div>
     )
  }
  return (
    <div className={styles.container}>
      <div className={styles.mainLayout}>
        <Sidebar />
        
        <main className={styles.content}>
          <Header
             focusSearchRef={focusSearchRef}
          />
          {children}
          <div className={styles.mobileNavSpacer} />
        </main>
      </div>

      <MobileNav />

      <AnimatePresence>
        {userProfile && userProfile.hasCompletedOnboarding === false && (
          <OnboardingModal
            userProfile={userProfile}
            onComplete={() => setUserProfile({ ...userProfile, hasCompletedOnboarding: true })}
          />
        )}
        {showCheatSheet && (
          <ShortcutCheatSheet onClose={() => setShowCheatSheet(false)} />
        )}
        {showTaskModal && userProfile && (
          <TaskActionModal
            task={null}
            templateTask={templateTask}
            userId={userProfile.id}
            onClose={() => {
              setShowTaskModal(false)
              setTemplateTask(null)
            }}
            onSave={() => {
              setShowTaskModal(false)
              setTemplateTask(null)
              router.refresh()
            }}
          />
        )}
      </AnimatePresence>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}

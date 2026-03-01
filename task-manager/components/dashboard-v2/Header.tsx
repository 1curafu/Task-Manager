'use client'

import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import styles from '@/app/dashboard-new/dashboard.module.css'
import { Bell } from '@phosphor-icons/react'
import Image from 'next/image'
import InboxPanel from '@/components/InboxPanel'
import { GlobalSearch } from '@/components/dashboard-v2/GlobalSearch'
import { createClient } from '@/lib/supabaseClient'

interface HeaderProps {
  user?: {
    id: string
    name?: string
    email?: string
    avatar?: string
  }
  onAddTask?: () => void
}

export function Header({ user, onAddTask }: HeaderProps) {
  const [showInbox, setShowInbox] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [greeting, setGreeting] = useState('Good day')
  const supabase = createClient()

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })


  useEffect(() => {
    const timer = setTimeout(() => {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 12) setGreeting('Good morning')
      else if (hour >= 12 && hour < 17) setGreeting('Good afternoon')
      else setGreeting('Good evening')
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!user?.id) return

    const fetchCount = async () => {
      const { count } = await supabase
        .from('Notification')
        .select('*', { count: 'exact', head: true })
        .eq('userId', user.id)
        .eq('isRead', false)
      setUnreadCount(count || 0)
    }

    void fetchCount()


    const channel = supabase
      .channel('header-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Notification',
          filter: `userId=eq.${user.id}`
        },
        () => {
          void fetchCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, supabase])

  return (
    <>
      <header className={styles.header}>
        <div className={styles.greeting}>
          <h1>{greeting}, {user?.name?.split(' ')[0] || 'User'}</h1>
          <div className={styles.date}>{today}</div>
        </div>

        <div className={styles.actions}>
          <button 
            onClick={onAddTask}
            className={styles.headerAddBtn}
            title="Create New Task"
          >
            +
          </button>
          <GlobalSearch userId={user?.id || null} />
          
          <button 
            onClick={() => setShowInbox(true)}
            className={styles.headerIconBtn}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <div className={styles.notificationBadge}></div>
            )}
          </button>
          
          <div className={styles.headerAvatar}>
             {user?.avatar ? (
               <Image src={user.avatar} alt="Profile" width={40} height={40} />
             ) : (
               <div className={styles.headerAvatarFallback}>
                 {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
               </div>
             )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showInbox && user?.id && (
          <InboxPanel 
            userId={user.id} 
            onClose={() => {
              setShowInbox(false)
            }} 
          />
        )}
      </AnimatePresence>
    </>
  )
}

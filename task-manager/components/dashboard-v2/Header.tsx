'use client'

import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import styles from '@/app/dashboard/dashboard.module.css'
import { Bell } from '@phosphor-icons/react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import InboxPanel from '@/components/dashboard-v2/InboxPanel'
import { GlobalSearch } from '@/components/dashboard-v2/GlobalSearch'
import { TaskPriority } from '@/types/task'

export interface TemplateTask {
  id: string
  name: string
  dueDate: string
  category?: string | null
  priority?: TaskPriority | null
}

interface HeaderProps {
  focusSearchRef?: React.MutableRefObject<(() => void) | null>
  // Legacy props accepted but unused (layout still passes them)
  user?: unknown
  onAddTask?: () => void
  onSpawnTemplate?: (template: TemplateTask) => void
}

const PAGE_NAMES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/tasks': 'Tasks',
  '/dashboard/kanban': 'Kanban',
  '/dashboard/calendar': 'Calendar',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/notes': 'Notes',
  '/dashboard/teams': 'Teams',
  '/dashboard/settings': 'Settings',
}

export function Header({ focusSearchRef }: HeaderProps) {
  const pathname = usePathname()
  const [showInbox, setShowInbox] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null)
    })
  }, [supabase])

  const pageName = React.useMemo(() => {
    if (!pathname) return 'Dashboard'
    if (PAGE_NAMES[pathname]) return PAGE_NAMES[pathname]
    // Match prefix for nested routes (e.g. /dashboard/tasks/[id])
    const match = Object.keys(PAGE_NAMES)
      .filter(k => k !== '/dashboard')
      .find(k => pathname.startsWith(k + '/'))
    return match ? PAGE_NAMES[match] : 'Dashboard'
  }, [pathname])

  return (
    <header className={styles.header}>
      <div className={styles.headerBreadcrumb}>
        <span className={styles.breadcrumbRoot}>Vela</span>
        <span className={styles.breadcrumbSep}>{' › '}</span>
        <span className={styles.breadcrumbPage}>{pageName}</span>
      </div>
      <div className={styles.headerRight}>
        <GlobalSearch userId={userId} focusRef={focusSearchRef} />
        <button
          className={styles.headerIconBtn}
          onClick={() => setShowInbox(s => !s)}
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>
        <AnimatePresence>
          {showInbox && userId && (
            <InboxPanel
              userId={userId}
              onClose={() => setShowInbox(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

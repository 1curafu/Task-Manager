'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import styles from '@/app/dashboard-new/dashboard.module.css'
import { 
  SquaresFour,
  CalendarCheck, 
  UsersThree,
  Gear,
  SignOut,
  Notebook
} from '@phosphor-icons/react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Clock } from './Clock'

interface SidebarProps {
  onNotesClick?: () => void
}

export function Sidebar({ onNotesClick }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className={styles.sidebar}>
      <Link href="/dashboard-new" className={styles.logoArea}>
        {/* <div style={{ width: 24, height: 24, background: 'var(--color-brand-blue)', borderRadius: 6 }}></div> */}
        <Image src="/favicon.svg" alt="Vela Logo" width={24} height={24} className={styles.sidebarLogo} />
        Vela
      </Link>

      <div className={styles.sidebarSectionNav}>
        <Clock />
      </div>

      <nav className={styles.sidebarSection}>
        <div className={styles.sidebarTitle}>Main</div>
        <Link href="/dashboard-new" className={`${styles.navItem} ${pathname === '/dashboard-new' ? styles.navItemActive : ''}`}>
          <SquaresFour size={20} weight={pathname === '/dashboard-new' ? 'fill' : 'regular'} />
          Dashboard
        </Link>
        <Link href="/dashboard-new/tasks" className={`${styles.navItem} ${pathname?.startsWith('/dashboard-new/tasks') ? styles.navItemActive : ''}`}>
          <CalendarCheck size={20} weight={pathname?.startsWith('/dashboard-new/tasks') ? 'fill' : 'regular'} />
          My Tasks
        </Link>
        <Link href="/dashboard-new/teams" className={`${styles.navItem} ${pathname?.startsWith('/dashboard-new/teams') ? styles.navItemActive : ''}`}>
          <UsersThree size={20} weight={pathname?.startsWith('/dashboard-new/teams') ? 'fill' : 'regular'} />
          Teams
        </Link>
        <Link href="/dashboard-new/calendar" className={`${styles.navItem} ${pathname?.startsWith('/dashboard-new/calendar') ? styles.navItemActive : ''}`}>
           <Notebook size={20} weight={pathname?.startsWith('/dashboard-new/calendar') ? 'fill' : 'regular'} />
           Calendar
        </Link>
      </nav>

      <nav className={styles.sidebarSection}>
        <div className={styles.sidebarTitle}>Tools</div>
        <button className={`${styles.navItem} ${styles.sidebarNavInvisibleBtn}`} onClick={onNotesClick}>
          <Notebook size={20} />
          Notes
        </button>
      </nav>

      <div className={`${styles.sidebarSection} ${styles.sidebarFooter}`}>
         <Link href="/dashboard-new/settings" className={styles.navItem}>
          <Gear size={20} />
          Settings
        </Link>
        <button onClick={handleLogout} className={`${styles.navItem} ${styles.sidebarNavInvisibleBtn} ${styles.sidebarDangerBtn}`}>
          <SignOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  )
}

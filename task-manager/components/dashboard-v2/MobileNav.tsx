'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, CheckSquare, SquaresFour, Plus, DotsThreeOutline } from '@phosphor-icons/react'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import styles from './MobileNav.module.css'

const NAV = [
  { href: '/dashboard', label: 'Home',   icon: House },
  { href: '/dashboard/tasks', label: 'Tasks',  icon: CheckSquare },
  { href: '/dashboard/kanban', label: 'Board',  icon: SquaresFour },
]

export function MobileNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname?.startsWith(href)

  const openTask = () => {
    window.dispatchEvent(new CustomEvent('open-task-modal'))
  }

  return (
    <>
      <nav className={styles.bar}>
        {NAV.slice(0, 2).map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`${styles.tab} ${isActive(href) ? styles.tabActive : ''}`}>
            <div className={styles.tabIconWrap}>
              <Icon size={22} weight={isActive(href) ? 'fill' : 'regular'} />
              {isActive(href) && <span className={styles.tabDot} />}
            </div>
            <span className={styles.tabLabel}>{label}</span>
          </Link>
        ))}

        <button className={styles.fab} onClick={openTask} aria-label="Create task">
          <Plus size={22} weight="bold" />
        </button>

        {NAV.slice(2).map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`${styles.tab} ${isActive(href) ? styles.tabActive : ''}`}>
            <div className={styles.tabIconWrap}>
              <Icon size={22} weight={isActive(href) ? 'fill' : 'regular'} />
              {isActive(href) && <span className={styles.tabDot} />}
            </div>
            <span className={styles.tabLabel}>{label}</span>
          </Link>
        ))}

        <button
          className={`${styles.tab} ${moreOpen ? styles.tabActive : ''}`}
          onClick={() => setMoreOpen(o => !o)}
          aria-label="More"
        >
          <div className={styles.tabIconWrap}>
            <DotsThreeOutline size={22} weight={moreOpen ? 'fill' : 'regular'} />
          </div>
          <span className={styles.tabLabel}>More</span>
        </button>
      </nav>

      {moreOpen && (
        <>
          <div className={styles.moreBackdrop} onClick={() => setMoreOpen(false)} />
          <div className={styles.moreDrawer}>
            <div className={styles.moreHandle} />
            <p className={styles.moreLabel}>Navigation</p>
            {[
              { href: '/dashboard/calendar', label: 'Calendar' },
              { href: '/dashboard/analytics', label: 'Analytics' },
              { href: '/dashboard/notes', label: 'Notes' },
              { href: '/dashboard/teams', label: 'Teams' },
              { href: '/dashboard/settings', label: 'Settings' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`${styles.moreItem} ${isActive(href) ? styles.moreItemActive : ''}`}
                onClick={() => setMoreOpen(false)}
              >
                <span className={styles.moreItemLabel}>{label}</span>
                {isActive(href) && <span className={styles.moreItemCheck}>✓</span>}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  )
}

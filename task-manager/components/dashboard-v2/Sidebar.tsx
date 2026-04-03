'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import styles from '@/app/dashboard/dashboard.module.css'
import {
  House, CheckSquare, SquaresFour, Calendar, ChartBar, FileText,
  Users, Gear, SignOut, Sun, Moon, Plus, X, Star
} from '@phosphor-icons/react'
import { createClient } from '@/lib/supabaseClient'
import { useTheme } from 'next-themes'

interface Favourite { label: string; href: string }

const FAVOURITES_KEY = 'vela_sidebar_favourites'
const MAX_FAVOURITES = 10

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarGradient(name: string): string {
  const colors = [
    ['#4f8ef7', '#2e5ce6'],
    ['#7c5ef7', '#5534d6'],
    ['#f75e8e', '#c9395e'],
    ['#f7a45e', '#d4782f'],
    ['#5ef7a4', '#2fd46d'],
  ]
  const idx = name.charCodeAt(0) % colors.length
  return `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})`
}

const NAV_MAIN = [
  { href: '/dashboard', label: 'Dashboard', icon: House },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/kanban', label: 'Kanban', icon: SquaresFour },
]

const NAV_TOOLS = [
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/analytics', label: 'Analytics', icon: ChartBar },
  { href: '/dashboard/notes', label: 'Notes', icon: FileText },
  { href: '/dashboard/teams', label: 'Teams', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Gear },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [favourites, setFavourites] = useState<Favourite[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(FAVOURITES_KEY)
      return stored ? (JSON.parse(stored) as Favourite[]) : []
    } catch { return [] }
  })
  const [favOpen, setFavOpen] = useState(false)
  const [addingFav, setAddingFav] = useState(false)
  const [newFavLabel, setNewFavLabel] = useState('')
  const [newFavHref, setNewFavHref] = useState('/dashboard')

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      const name = session?.user?.user_metadata?.name as string | undefined
      setUserName(name ?? session?.user?.email?.split('@')[0] ?? 'User')
      setUserEmail(session?.user?.email ?? '')
    })
  }, [supabase])

  const saveFavourites = (favs: Favourite[]) => {
    setFavourites(favs)
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favs))
  }

  const addFavourite = () => {
    if (!newFavLabel.trim() || favourites.length >= MAX_FAVOURITES) return
    saveFavourites([...favourites, { label: newFavLabel.trim(), href: newFavHref }])
    setNewFavLabel('')
    setAddingFav(false)
  }

  const removeFavourite = (idx: number) => {
    saveFavourites(favourites.filter((_, i) => i !== idx))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname?.startsWith(href) ?? false

  const ALL_ROUTES = [...NAV_MAIN, ...NAV_TOOLS]

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1.5rem', paddingBottom: '0.5rem' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
           <Image src="/icon.svg" alt="Vela" width={28} height={28} />
           <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Vela</span>
        </Link>
      </div>

      {/* User profile */}
      <div className={styles.sidebarProfile}>
        <div
          className={styles.sidebarAvatar}
          style={{ background: getAvatarGradient(userName || 'U') }}
        >
          {getInitials(userName || 'User')}
        </div>
        <div className={styles.sidebarUserInfo}>
          <span className={styles.sidebarUserName}>{userName}</span>
          <span className={styles.sidebarUserEmail}>{userEmail}</span>
        </div>
      </div>

      {/* Create Task */}
      <button
        className={styles.sidebarCreateBtn}
        onClick={() => window.dispatchEvent(new CustomEvent('open-task-modal'))}
      >
        <Plus weight="bold" size={16} />
        Create Task
      </button>

      {/* Main nav */}
      <nav className={styles.sidebarNav}>
        <span className={styles.sidebarNavLabel}>Main</span>
        {NAV_MAIN.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.sidebarLink} ${isActive(href) ? styles.sidebarLinkActive : ''}`}
          >
            <Icon size={18} weight={isActive(href) ? 'fill' : 'regular'} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Tools nav */}
      <nav className={styles.sidebarNav}>
        <span className={styles.sidebarNavLabel}>Tools</span>
        {NAV_TOOLS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.sidebarLink} ${isActive(href) ? styles.sidebarLinkActive : ''}`}
          >
            <Icon size={18} weight={isActive(href) ? 'fill' : 'regular'} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Favourites */}
      <div className={styles.sidebarSection}>
        <div className={styles.sidebarFavHeader}>
          <button
            className={styles.sidebarNavLabel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
            onClick={() => setFavOpen(o => !o)}
          >
            <Star size={12} />
            Favourites
          </button>
          {favourites.length < MAX_FAVOURITES && (
            <button className={styles.sidebarIconBtn} onClick={() => setAddingFav(a => !a)} title="Add favourite">
              <Plus size={12} weight="bold" />
            </button>
          )}
        </div>
        {favOpen && (
          <>
            {favourites.map((fav, i) => (
              <div key={i} className={styles.sidebarFavItem}>
                <Link href={fav.href} className={styles.sidebarLink} style={{ flex: 1 }}>{fav.label}</Link>
                <button className={styles.sidebarIconBtn} onClick={() => removeFavourite(i)} title="Remove">
                  <X size={12} />
                </button>
              </div>
            ))}
            {addingFav && (
              <div className={styles.sidebarFavForm}>
                <input
                  className={styles.sidebarFavInput}
                  placeholder="Label"
                  value={newFavLabel}
                  onChange={e => setNewFavLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addFavourite() }}
                />
                <select
                  className={styles.sidebarFavInput}
                  value={newFavHref}
                  onChange={e => setNewFavHref(e.target.value)}
                >
                  {ALL_ROUTES.map(r => (
                    <option key={r.href} value={r.href}>{r.label}</option>
                  ))}
                </select>
                <button className={styles.sidebarCreateBtn} onClick={addFavourite} style={{ margin: 0, padding: '6px 12px' }}>Add</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom: theme toggle + logout */}
      <div className={styles.sidebarBottom}>
        <button
          className={styles.sidebarLink}
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          className={`${styles.sidebarLink} ${styles.sidebarLogout}`}
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          onClick={() => void handleLogout()}
        >
          <SignOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  )
}

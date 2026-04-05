'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import TeamInviteModal from '@/components/dashboard-v2/teams/TeamInviteModal'
import ConfirmModal from '@/components/dashboard-v2/ConfirmModal'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  XIcon, BellIcon, CheckIcon, CheckCircleIcon, TrashIcon,
  UsersIcon, ClockIcon, ClipboardIcon, ArrowRightIcon,
  BellSlashIcon, DotsThreeIcon,
} from '@phosphor-icons/react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: string
}

interface InboxPanelProps {
  userId: string
  onClose: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

type NotifVariant = {
  icon: React.ReactNode
  iconBg: string
  iconBgDark: string
  iconColor: string
  accentColor: string
}

function getVariant(type: string, dark: boolean): NotifVariant {
  switch (type) {
    case 'team_invite':
      return {
        icon: <UsersIcon size={15} weight="fill" />,
        iconBg: 'rgba(139,92,246,0.12)',
        iconBgDark: 'rgba(139,92,246,0.18)',
        iconColor: '#8b5cf6',
        accentColor: '#8b5cf6',
      }
    case 'task_assigned':
      return {
        icon: <ClipboardIcon size={15} weight="fill" />,
        iconBg: 'rgba(59,130,246,0.12)',
        iconBgDark: 'rgba(59,130,246,0.18)',
        iconColor: '#3b82f6',
        accentColor: '#3b82f6',
      }
    case 'task_reminder':
    case 'due_reminder':
      return {
        icon: <ClockIcon size={15} weight="fill" />,
        iconBg: 'rgba(245,158,11,0.12)',
        iconBgDark: 'rgba(245,158,11,0.18)',
        iconColor: '#f59e0b',
        accentColor: '#f59e0b',
      }
    default:
      return {
        icon: <BellIcon size={15} weight="fill" />,
        iconBg: 'rgba(16,185,129,0.12)',
        iconBgDark: 'rgba(16,185,129,0.18)',
        iconColor: '#10b981',
        accentColor: '#10b981',
      }
  }
}

const ease = [0.22, 1, 0.36, 1] as const

// ─── Notification Card ────────────────────────────────────────────────────────

function NotifCard({
  notif,
  dark,
  prefersReduced,
  onRead,
  onDelete,
  onInviteClick,
}: {
  notif: Notification
  dark: boolean
  prefersReduced: boolean | null
  onRead: (id: string) => void
  onDelete: (id: string) => void
  onInviteClick: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const v = getVariant(notif.type, dark)
  const isInvite = notif.type === 'team_invite'

  // Extract invite ID from link
  const inviteId = notif.link
    ? new URL(notif.link, 'http://x').searchParams.get('acceptInvite')
    : null

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <motion.div
      layout
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 40, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, ease }}
      style={{
        position: 'relative',
        borderRadius: 16,
        padding: '14px 14px 13px',
        marginBottom: 8,
        background: dark
          ? notif.isRead
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(255,255,255,0.06)'
          : notif.isRead
            ? 'rgba(248,250,252,0.8)'
            : 'rgba(255,255,255,0.95)',
        border: dark
          ? notif.isRead
            ? '1px solid rgba(255,255,255,0.05)'
            : '1px solid rgba(255,255,255,0.09)'
          : notif.isRead
            ? '1px solid rgba(226,232,240,0.6)'
            : '1px solid rgba(226,232,240,1)',
        boxShadow: notif.isRead
          ? 'none'
          : dark
            ? '0 2px 12px rgba(0,0,0,0.25)'
            : '0 2px 12px rgba(15,23,42,0.06)',
        cursor: isInvite ? 'pointer' : 'default',
        overflow: 'hidden',
        transition: 'background 0.2s, border 0.2s',
      }}
      onClick={() => {
        if (isInvite && inviteId) onInviteClick(inviteId)
      }}
    >
      {/* Unread indicator bar */}
      {!notif.isRead && (
        <div style={{
          position: 'absolute', left: 0, top: '20%', bottom: '20%',
          width: 3, borderRadius: '0 2px 2px 0',
          background: v.accentColor,
        }} />
      )}

      <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
        {/* Icon tile */}
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: dark ? v.iconBgDark : v.iconBg,
          border: `1px solid ${v.iconColor}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: v.iconColor,
          boxShadow: `0 2px 8px ${v.iconColor}20`,
          marginTop: 1,
        }}>
          {v.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
            <span style={{
              fontSize: 13, fontWeight: notif.isRead ? 500 : 700,
              color: dark ? (notif.isRead ? '#64748b' : '#e2e8f0') : (notif.isRead ? '#94a3b8' : '#0f172a'),
              lineHeight: 1.35, flex: 1,
            }}>
              {notif.title}
            </span>
            <span style={{
              fontSize: 11, color: dark ? '#334155' : '#cbd5e1',
              flexShrink: 0, marginTop: 1,
              fontWeight: 500,
            }}>
              {formatDate(notif.createdAt)}
            </span>
          </div>

          <p style={{
            fontSize: 12, color: dark ? '#475569' : '#64748b',
            lineHeight: 1.55, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {notif.message}
          </p>

          {/* Invite CTA */}
          {isInvite && inviteId && (
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                marginTop: 9, fontSize: 11, fontWeight: 700,
                color: v.iconColor, letterSpacing: '0.03em',
              }}
            >
              View invite <ArrowRightIcon size={11} weight="bold" />
            </div>
          )}
        </div>

        {/* Context menu */}
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o) }}
            style={{
              width: 26, height: 26, borderRadius: 7,
              background: menuOpen
                ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)')
                : 'transparent',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: dark ? '#334155' : '#cbd5e1',
              transition: 'all 0.15s',
            }}
            className="notif-menu-btn"
          >
            <DotsThreeIcon size={16} weight="bold" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                transition={{ duration: 0.15, ease }}
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute', right: 0, top: 30, zIndex: 10,
                  borderRadius: 12, overflow: 'hidden', minWidth: 148,
                  background: dark
                    ? 'linear-gradient(145deg, rgba(30,37,54,0.98), rgba(20,26,40,1))'
                    : 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,251,255,1))',
                  border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(226,232,240,0.9)',
                  boxShadow: dark
                    ? '0 8px 32px rgba(0,0,0,0.5)'
                    : '0 8px 32px rgba(15,23,42,0.12)',
                  padding: 5,
                }}
              >
                {!notif.isRead && (
                  <button
                    onClick={() => { onRead(notif.id); setMenuOpen(false) }}
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: 8,
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 12, fontWeight: 600,
                      color: dark ? '#94a3b8' : '#64748b',
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    className="notif-menu-item"
                  >
                    <CheckCircleIcon size={13} weight="fill" color="#10b981" />
                    Mark as read
                  </button>
                )}
                <button
                  onClick={() => { onDelete(notif.id); setMenuOpen(false) }}
                  style={{
                    width: '100%', padding: '7px 10px', borderRadius: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 12, fontWeight: 600,
                    color: '#ef4444',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  className="notif-menu-item"
                >
                  <TrashIcon size={13} weight="fill" />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function InboxPanel({ userId, onClose }: InboxPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null)
  const [deleteAllMode, setDeleteAllMode] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const supabase = createClient()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const prefersReduced = useReducedMotion()

  const loadNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('Notification')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
      if (error) throw error
      setNotifications(data || [])
    } catch (err) {
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    void loadNotifications()
    const channel = supabase
      .channel('inbox-notifications')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'Notification',
        filter: `userId=eq.${userId}`,
      }, () => { void loadNotifications() })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [loadNotifications, supabase, userId])

  const markAsRead = async (id: string) => {
    await supabase.from('Notification').update({ isRead: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const markAllAsRead = async () => {
    setMarkingAll(true)
    await supabase.from('Notification').update({ isRead: true }).eq('userId', userId).eq('isRead', false)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setMarkingAll(false)
  }

  const deleteNotification = async (id: string) => {
    await supabase.from('Notification').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const deleteAllNotifications = async () => {
    await supabase.from('Notification').delete().eq('userId', userId)
    setNotifications([])
  }

  const confirmDelete = async () => {
    if (deleteAllMode) await deleteAllNotifications()
    else if (notificationToDelete) await deleteNotification(notificationToDelete)
    setShowConfirmModal(false)
    setNotificationToDelete(null)
    setDeleteAllMode(false)
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Group: unread first, then read
  const unread = notifications.filter(n => !n.isRead)
  const read = notifications.filter(n => n.isRead)

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: dark ? 'rgba(0,0,0,0.5)' : 'rgba(15,23,42,0.3)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={prefersReduced ? { opacity: 0 } : { x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.9 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 41,
          width: '100%', maxWidth: 380,
          display: 'flex', flexDirection: 'column',
          background: dark
            ? 'linear-gradient(160deg, rgba(14,19,32,0.99), rgba(10,14,24,1))'
            : 'linear-gradient(160deg, rgba(250,252,255,0.99), rgba(244,248,255,1))',
          borderLeft: dark
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(226,232,240,0.8)',
          boxShadow: dark
            ? '-24px 0 80px rgba(0,0,0,0.5)'
            : '-24px 0 80px rgba(15,23,42,0.1)',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: dark
            ? '1px solid rgba(255,255,255,0.06)'
            : '1px solid rgba(226,232,240,0.7)',
          flexShrink: 0,
        }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Bell icon tile */}
              <div style={{
                width: 36, height: 36, borderRadius: 11,
                background: dark ? 'rgba(59,130,246,0.12)' : 'rgba(219,234,254,0.6)',
                border: dark ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(147,197,253,0.5)',
                boxShadow: '0 2px 10px rgba(59,130,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#3b82f6',
              }}>
                <BellIcon size={17} weight="fill" />
              </div>
              <div>
                <h2 style={{
                  fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px',
                  color: dark ? '#f1f5f9' : '#0f172a', margin: 0, lineHeight: 1,
                }}>
                  Inbox
                </h2>
                {unreadCount > 0 ? (
                  <p style={{ fontSize: 11, color: dark ? '#475569' : '#94a3b8', margin: '3px 0 0', fontWeight: 500 }}>
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                ) : (
                  <p style={{ fontSize: 11, color: dark ? '#334155' : '#cbd5e1', margin: '3px 0 0', fontWeight: 500 }}>
                    All caught up
                  </p>
                )}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 9,
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: dark ? '#475569' : '#94a3b8', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              aria-label="Close inbox"
            >
              <XIcon size={14} weight="bold" />
            </button>
          </div>

          {/* Action row */}
          {notifications.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  onClick={() => void markAllAsRead()}
                  disabled={markingAll}
                  style={{
                    flex: 1, height: 32, borderRadius: 9,
                    background: dark ? 'rgba(59,130,246,0.1)' : 'rgba(219,234,254,0.5)',
                    border: dark ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(147,197,253,0.4)',
                    color: '#3b82f6', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    transition: 'all 0.15s',
                    opacity: markingAll ? 0.6 : 1,
                  }}
                >
                  <CheckIcon size={12} weight="bold" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => { setDeleteAllMode(true); setShowConfirmModal(true) }}
                style={{
                  flex: unreadCount > 0 ? 'unset' : 1,
                  height: 32, borderRadius: 9, padding: '0 12px',
                  background: dark ? 'rgba(239,68,68,0.08)' : 'rgba(254,242,242,0.8)',
                  border: dark ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(254,202,202,0.8)',
                  color: '#ef4444', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  transition: 'all 0.15s',
                }}
              >
                <TrashIcon size={12} weight="fill" />
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Notification list ── */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '12px 12px 24px',
          scrollbarWidth: 'none',
        }}>
          {loading ? (
            /* Skeleton */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  borderRadius: 16, padding: '14px',
                  background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(241,245,249,0.6)',
                  border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(226,232,240,0.6)',
                  display: 'flex', gap: 11, alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(226,232,240,0.8)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <div style={{
                      height: 13, borderRadius: 6, width: '65%',
                      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(226,232,240,0.8)',
                    }} />
                    <div style={{
                      height: 11, borderRadius: 6, width: '90%',
                      background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(241,245,249,0.9)',
                    }} />
                  </div>
                </div>
              ))}
              <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
            </div>

          ) : notifications.length === 0 ? (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', minHeight: 280,
                textAlign: 'center', padding: '0 24px',
              }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: 20, marginBottom: 18,
                background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(241,245,249,0.8)',
                border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(226,232,240,0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: dark ? '#334155' : '#cbd5e1',
              }}>
                <BellSlashIcon size={28} weight="fill" />
              </div>
              <p style={{
                fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px',
                color: dark ? '#475569' : '#94a3b8', marginBottom: 6,
              }}>
                All clear
              </p>
              <p style={{ fontSize: 12, color: dark ? '#334155' : '#cbd5e1', lineHeight: 1.6 }}>
                No notifications yet. We&apos;ll let you know when something happens.
              </p>
            </motion.div>

          ) : (
            <AnimatePresence mode="popLayout">
              {/* Unread section */}
              {unread.length > 0 && (
                <motion.div key="unread-section" layout>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '4px 2px',
                  }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: dark ? '#334155' : '#cbd5e1',
                    }}>
                      New
                    </span>
                    <div style={{
                      height: 5, width: 5, borderRadius: '50%', background: '#3b82f6',
                      boxShadow: '0 0 6px rgba(59,130,246,0.6)',
                    }} />
                  </div>
                  {unread.map(n => (
                    <NotifCard
                      key={n.id} notif={n} dark={dark}
                      prefersReduced={prefersReduced}
                      onRead={markAsRead}
                      onDelete={id => { setNotificationToDelete(id); setDeleteAllMode(false); setShowConfirmModal(true) }}
                      onInviteClick={id => setSelectedInviteId(id)}
                    />
                  ))}
                </motion.div>
              )}

              {/* Read section */}
              {read.length > 0 && (
                <motion.div key="read-section" layout>
                  {unread.length > 0 && (
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: dark ? '#1e293b' : '#e2e8f0',
                      padding: '12px 2px 8px',
                    }}>
                      Earlier
                    </div>
                  )}
                  {read.map(n => (
                    <NotifCard
                      key={n.id} notif={n} dark={dark}
                      prefersReduced={prefersReduced}
                      onRead={markAsRead}
                      onDelete={id => { setNotificationToDelete(id); setDeleteAllMode(false); setShowConfirmModal(true) }}
                      onInviteClick={id => setSelectedInviteId(id)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Team invite modal */}
      <AnimatePresence>
        {selectedInviteId && (
          <TeamInviteModal
            key="team-invite"
            inviteId={selectedInviteId}
            userId={userId}
            onClose={() => setSelectedInviteId(null)}
            onAccept={async () => { await loadNotifications(); setSelectedInviteId(null); window.location.reload() }}
            onDecline={async () => { await loadNotifications(); setSelectedInviteId(null) }}
          />
        )}
      </AnimatePresence>

      {/* Confirm delete modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        variant="danger"
        title={deleteAllMode ? 'Clear all notifications' : 'Delete notification'}
        message={
          deleteAllMode
            ? `This will permanently remove all ${notifications.length} notification${notifications.length === 1 ? '' : 's'}.`
            : 'This notification will be permanently removed.'
        }
        confirmText={deleteAllMode ? 'Clear all' : 'Delete'}
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => { setShowConfirmModal(false); setNotificationToDelete(null); setDeleteAllMode(false) }}
      />

      {/* Hover styles injected once */}
      <style>{`
        .notif-menu-btn:hover { background: ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} !important; color: ${dark ? '#94a3b8' : '#64748b'} !important; }
        .notif-menu-item:hover { background: ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} !important; }
      `}</style>
    </>
  )
}

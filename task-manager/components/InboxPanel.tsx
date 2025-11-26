'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'
import TeamInviteModal from './TeamInviteModal'
import ConfirmModal from './ConfirmModal'
import './InboxPanel.css'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: string
}

export default function InboxPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null)
  const [deleteAllMode, setDeleteAllMode] = useState(false)
  const supabase = createClient()

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
    loadNotifications()

    const channel = supabase
      .channel('inbox-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Notification',
          filter: `userId=eq.${userId}`
        },
        () => {
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadNotifications, supabase, userId])

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('Notification')
        .update({ isRead: true })
        .eq('id', notificationId)

      if (error) throw error
      await loadNotifications()
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('Notification')
        .update({ isRead: true })
        .eq('userId', userId)
        .eq('isRead', false)

      if (error) throw error
      await loadNotifications()
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error} = await supabase
        .from('Notification')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
      await loadNotifications()
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const deleteAllNotifications = async () => {
    try {
      const { error } = await supabase
        .from('Notification')
        .delete()
        .eq('userId', userId)

      if (error) throw error
      await loadNotifications()
    } catch (err) {
      console.error('Error deleting all notifications:', err)
    }
  }

  const handleDeleteClick = (notificationId: string) => {
    setNotificationToDelete(notificationId)
    setDeleteAllMode(false)
    setShowConfirmModal(true)
  }

  const handleDeleteAllClick = () => {
    setDeleteAllMode(true)
    setShowConfirmModal(true)
  }

  const confirmDelete = async () => {
    if (deleteAllMode) {
      await deleteAllNotifications()
    } else if (notificationToDelete) {
      await deleteNotification(notificationToDelete)
    }
    setShowConfirmModal(false)
    setNotificationToDelete(null)
    setDeleteAllMode(false)
  }

  const cancelDelete = () => {
    setShowConfirmModal(false)
    setNotificationToDelete(null)
    setDeleteAllMode(false)
  }

  const handleInviteAccept = async () => {
    await loadNotifications()
    setSelectedInviteId(null)
    window.location.reload()
  }

  const handleInviteDecline = async () => {
    await loadNotifications()
    setSelectedInviteId(null)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'team_invite':
        return '👥'
      case 'task_assigned':
        return '📋'
      case 'task_reminder':
        return '⏰'
      case 'system':
        return '🔔'
      default:
        return '📬'
    }
  }

  const formatDate = (dateString: string) => {
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
    
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    })
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="inbox-overlay" onClick={onClose}>
      <div className="inbox-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inbox-header">
          <div>
            <h2 className="inbox-title">Inbox</h2>
            {unreadCount > 0 && (
              <span className="inbox-unread-count">{unreadCount} unread</span>
            )}
          </div>
          <div className="inbox-header-actions">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="inbox-mark-all-read">
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={handleDeleteAllClick} className="inbox-delete-all">
                Delete All
              </button>
            )}
            <button onClick={onClose} className="inbox-close-btn">
              ✕
            </button>
          </div>
        </div>

        <div className="inbox-content">
          {loading ? (
            <div className="inbox-loading">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="inbox-empty">
              <div className="inbox-empty-icon">📭</div>
              <p className="inbox-empty-title">No notifications</p>
              <p className="inbox-empty-text">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="inbox-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`inbox-item ${!notification.isRead ? 'inbox-item-unread' : ''}`}
                  onClick={() => {
                    if (notification.type === 'team_invite' && notification.link) {
                      const url = new URL(notification.link, window.location.origin)
                      const inviteId = url.searchParams.get('acceptInvite')
                      if (inviteId) {
                        setSelectedInviteId(inviteId)
                      }
                    }
                  }}
                  style={{ cursor: notification.type === 'team_invite' ? 'pointer' : 'default' }}
                >
                  <div className="inbox-item-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="inbox-item-content">
                    <div className="inbox-item-header">
                      <h3 className="inbox-item-title">{notification.title}</h3>
                      <span className="inbox-item-time">{formatDate(notification.createdAt)}</span>
                    </div>
                    <p className="inbox-item-message">{notification.message}</p>
                    <div className="inbox-item-actions" onClick={(e) => e.stopPropagation()}>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="inbox-action-btn inbox-action-read"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(notification.id)}
                        className="inbox-action-btn inbox-action-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedInviteId && (
        <TeamInviteModal
          inviteId={selectedInviteId}
          userId={userId}
          onClose={() => setSelectedInviteId(null)}
          onAccept={handleInviteAccept}
          onDecline={handleInviteDecline}
        />
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        title={deleteAllMode ? "Delete All Notifications" : "Delete Notification"}
        message={
          deleteAllMode
            ? `Are you sure you want to delete all ${notifications.length} notification${notifications.length === 1 ? '' : 's'}? This action cannot be undone.`
            : "Are you sure you want to delete this notification? This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}

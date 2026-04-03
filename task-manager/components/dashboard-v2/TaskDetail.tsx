'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TaskWithRelations, normalizeStatus } from '@/types/task'
import { AttachmentPanel } from './AttachmentPanel'
import styles from './TaskDetail.module.css'
import {
  ArrowLeft,
  CalendarBlank,
  User,
  Tag,
  Flag,
  Image as ImageIcon,
  DotsSixVertical,
  Clock,
} from '@phosphor-icons/react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabaseClient'

interface Comment {
  id: string
  content: string
  userId: string
  createdAt: string
  user?: { name?: string }
}

interface TaskDetailProps {
  task: TaskWithRelations
  currentUserId: string
  onUpdate: () => void
  onEditTask?: () => void
}

type TabId = 'subtasks' | 'comments' | 'activity'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  todo:        { label: 'To-do',       color: '#c7c7cc' },
  in_progress: { label: 'On Progress', color: 'var(--primary-color)' },
  in_review:   { label: 'In Review',   color: 'var(--status-in-review, #6e40c9)' },
  done:        { label: 'Completed',   color: 'var(--success-color, #30d158)' },
}

const PRIORITY_STYLE: Record<string, React.CSSProperties> = {
  high:   { background: 'rgba(255,91,91,0.12)',   color: '#ff5b5b' },
  medium: { background: 'rgba(255,170,51,0.12)',  color: '#ffaa33' },
  low:    { background: 'rgba(79,209,197,0.12)',  color: '#4fd1c5' },
}

export function TaskDetail({ task, currentUserId, onUpdate, onEditTask }: TaskDetailProps) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [activeTab, setActiveTab] = useState<TabId>('subtasks')
  const [newSubtask, setNewSubtask] = useState('')
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [assigneeName, setAssigneeName] = useState<string | null>(null)

  useEffect(() => {
    if (task.assignedToId) {
       supabase.from('Profile').select('name').eq('userId', task.assignedToId).single().then(({data}) => {
          if (data) setAssigneeName(data.name)
       })
    }
  }, [task.assignedToId, supabase])

  const status = normalizeStatus(task.status)
  const statusInfo = STATUS_MAP[status] ?? STATUS_MAP.todo

  const totalSubtasks = (task.subtasks ?? []).length
  const doneSubtasks  = (task.subtasks ?? []).filter(s => s.completed).length
  const progress = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('TaskComment')
      .select('*, user:Profile(name)')
      .eq('taskId', task.id)
      .order('createdAt', { ascending: true })
    setComments((data ?? []) as Comment[])
  }, [task.id, supabase])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchComments() }, [fetchComments])

  const addSubtask = async () => {
    if (!newSubtask.trim()) return
    await supabase.from('Subtask').insert({ taskId: task.id, content: newSubtask.trim(), completed: false })
    setNewSubtask('')
    onUpdate()
  }

  const toggleSubtask = async (id: string, completed: boolean) => {
    await supabase.from('Subtask').update({ completed: !completed }).eq('id', id)
    onUpdate()
  }

  const postComment = async () => {
    if (!comment.trim()) return
    await supabase.from('TaskComment').insert({ taskId: task.id, userId: currentUserId, content: comment.trim() })
    setComment('')
    void fetchComments()
  }

  return (
    <div className={styles.page}>
      {/* Top breadcrumb bar */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard/tasks')}>
          <ArrowLeft size={16} weight="bold" /> Tasks
        </button>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{task.name}</span>

        <div className={styles.topBarRight}>
          {onEditTask && (
            <button className={styles.actionBtn} onClick={onEditTask}>
               Edit Task
            </button>
          )}
          <span className={styles.lastUpdated}>
            <Clock size={13} />
            {formatDistanceToNow(parseISO(task.lastUpdated ?? task.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>

      <div className={styles.body}>
        {/* Icon block */}
        <div className={styles.iconBlock}>
          <ImageIcon size={32} weight="thin" />
        </div>

        {/* Title + priority badge */}
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{task.name}</h1>
          {task.priority && (
            <span className={styles.priorityBadge} style={PRIORITY_STYLE[task.priority] ?? {}}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          )}
        </div>

        {/* Field table */}
        <div className={styles.fields}>
          {/* Status */}
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>
              <span className={styles.fieldIcon}>☉</span> Status
            </span>
            <span className={styles.fieldValue}>
              <span className={styles.statusDot} style={{ borderColor: statusInfo.color }} />
              <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>
            </span>
          </div>

          {/* Due date */}
          {task.dueDate && (
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>
                <CalendarBlank size={14} /> Due date
              </span>
              <span className={styles.fieldValue}>
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
              </span>
            </div>
          )}

          {/* Assignee */}
          {task.assignedToId && (
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>
                <User size={14} /> Assignee
              </span>
              <div className={styles.fieldValue}>
                <span className={styles.assigneeChip}>{assigneeName || task.assignedToId.slice(0, 8)}</span>
              </div>
            </div>
          )}

          {/* Labels / Tags */}
          {(task.labels ?? []).length > 0 && (
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>
                <Tag size={14} /> Tags
              </span>
              <div className={styles.fieldValue}>
                {(task.labels ?? []).map(({ label }) => (
                  <span
                    key={label.id}
                    className={styles.tagChip}
                    style={{ background: `${label.color ?? '#888'}18`, color: label.color ?? 'var(--text-primary)', borderColor: `${label.color ?? '#888'}33` }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Priority */}
          {task.priority && (
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>
                <Flag size={14} /> Priority
              </span>
              <div className={styles.fieldValue}>
                <span className={styles.priorityBadge} style={PRIORITY_STYLE[task.priority] ?? {}}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </div>
            </div>
          )}

          {/* Description */}
          {task.notes && (
            <div className={`${styles.fieldRow} ${styles.fieldRowTop}`}>
              <span className={styles.fieldLabel} style={{ paddingTop: '0.75rem' }}>
                <span className={styles.fieldIcon}>≡</span> Description
              </span>
              <div className={`${styles.fieldValue} ${styles.descriptionBox}`}>
                {task.notes}
              </div>
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className={styles.attachmentSection}>
          <div className={styles.attachmentHeader}>
            <span className={styles.attachmentTitle}>
              Attachment {(task.attachments ?? []).length > 0 ? `(${task.attachments!.length})` : ''}
            </span>
            <button className={styles.downloadAll}>Download All</button>
          </div>
          <AttachmentPanel taskId={task.id} currentUserId={currentUserId} />
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {(['subtasks', 'comments', 'activity'] as TabId[]).map(t => (
            <button
              key={t}
              className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t === 'subtasks' ? 'Subtasks' : t === 'comments' ? (
                <>Comments {comments.length > 0 && <span className={styles.tabBadge}>{comments.length}</span>}</>
              ) : 'Activities'}
            </button>
          ))}
        </div>

        {/* ── Subtasks ── */}
        {activeTab === 'subtasks' && (
          <div className={styles.tabContent}>
            {totalSubtasks > 0 && (
              <div className={styles.subtaskHeader}>
                <h3 className={styles.subtaskSectionName}>Our Tasks</h3>
                <div className={styles.progressRow}>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                  </div>
                  <span className={styles.progressLabel}>Progress : {progress}%</span>
                </div>
              </div>
            )}

            <div className={styles.subtaskList}>
              {(task.subtasks ?? []).map(s => (
                <div key={s.id} className={styles.subtaskItem}>
                  <span className={styles.subtaskDragHandle}><DotsSixVertical size={14} /></span>
                  <input
                    type="checkbox"
                    className={styles.subtaskCheck}
                    checked={s.completed}
                    onChange={() => void toggleSubtask(s.id, s.completed)}
                  />
                  <div className={styles.subtaskContent}>
                    <span className={s.completed ? styles.subtaskTextDone : styles.subtaskText}>
                      {s.content}
                    </span>
                    {s.notes && <p className={styles.subtaskNote}>{s.notes}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.subtaskAdd}>
              <input
                className={styles.subtaskInput}
                placeholder="Add a subtask…"
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && void addSubtask()}
              />
              <button 
                className={styles.addBtn} 
                onClick={() => void addSubtask()}
                disabled={!newSubtask.trim()}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* ── Comments ── */}
        {activeTab === 'comments' && (
          <div className={styles.tabContent}>
            {comments.length === 0 && (
              <p className={styles.emptyState}>No comments yet. Be the first!</p>
            )}
            {comments.map(c => (
              <div key={c.id} className={styles.commentItem}>
                <div className={styles.commentMeta}>
                  <span className={styles.commentAvatar}>{(c.user?.name ?? 'U')[0].toUpperCase()}</span>
                  <span className={styles.commentAuthor}>{c.user?.name ?? 'User'}</span>
                  <span className={styles.commentTime}>{formatDistanceToNow(parseISO(c.createdAt), { addSuffix: true })}</span>
                </div>
                <p className={styles.commentBody}>{c.content}</p>
              </div>
            ))}
            <textarea
              className={styles.commentInput}
              placeholder="Write a comment…"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
            />
            <button className={styles.postBtn} onClick={() => void postComment()}>Post</button>
          </div>
        )}

        {/* ── Activity ── */}
        {activeTab === 'activity' && (
          <div className={styles.tabContent}>
            <div className={styles.activityItem}>
              <span className={styles.activityDot} />
              <span className={styles.activityText}>
                Task created {formatDistanceToNow(parseISO(task.createdAt), { addSuffix: true })}
              </span>
            </div>
            {task.lastUpdated && task.lastUpdated !== task.createdAt && (
              <div className={styles.activityItem}>
                <span className={styles.activityDot} />
                <span className={styles.activityText}>
                  Last updated {formatDistanceToNow(parseISO(task.lastUpdated), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  PencilSimple as Edit2,
  Trash as Trash2,
  Calendar,
  Tag,
  DotsSixVertical as GripVertical,
  Users,
  User,
  CalendarBlank,
  ChatCircle,
  ChartBar,
  Paperclip,
} from '@phosphor-icons/react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Label } from '@/components/dashboard-v2/LabelSelector'
import styles from '@/app/dashboard/dashboard.module.css'
import { Task as BaseTask, normalizeStatus } from '@/types/task'

// Enrichment fields used in Kanban cards
interface TaskEnrichment {
  labels?: Label[]
  subtasks?: { id: string; completed: boolean }[]
  commentCount?: number
  assignee?: { id: string; name: string; avatarUrl?: string | null } | null
  creator?: { id: string; name: string; avatarUrl?: string | null } | null
}

type Task = BaseTask & TaskEnrichment

// ── Kanban card constants ─────────────────────────────────────────────────────
const STATUS_BORDER: Record<string, string> = {
  todo: '#c7c7cc',
  in_progress: 'var(--primary-color)',
  in_review: 'var(--status-in-review)',
  done: 'var(--success-color, #30d158)',
}

const PRIORITY_COLOR: Record<string, string> = {
  high: '#ff5b5b',
  medium: '#ffaa33',
  low: '#4fd1c5',
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function getPriorityClass(priority?: string | null): string {
  switch (priority) {
    case 'high': return styles.taskPriorityHigh
    case 'medium': return styles.taskPriorityMedium
    case 'low': return styles.taskPriorityLow
    default: return ''
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface SortableTaskItemProps {
  task: Task
  // Called on card click — receives task (legacy list mode uses it; Kanban ignores it)
  onClick?: (task: Task) => void
  // List mode legacy props (tasks/page.tsx)
  index?: number
  isDraggable?: boolean
  onToggleComplete?: (task: Task) => void
  onEdit?: (task: Task, e: React.MouseEvent) => void
  onDelete?: (taskId: string, e: React.MouseEvent) => void
  isKanban?: boolean
}

// ── Kanban card inner ─────────────────────────────────────────────────────────
function KanbanCardInner({
  task,
  isDraggable,
  attributes,
  listeners,
}: {
  task: Task
  isDraggable: boolean
  attributes: React.HTMLAttributes<HTMLElement>
  listeners: Record<string, unknown> | undefined
}) {
  const totalSubtasks = task.subtasks?.length ?? 0
  const doneSubtasks = task.subtasks?.filter(s => s.completed).length ?? 0
  const progress = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0
  const avatars = [task.creator, task.assignee].filter((a): a is NonNullable<typeof a> => Boolean(a)).slice(0, 2)

  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  return (
    <div className={styles.kanbanCard}>
      {isDraggable && (
        <div
          className={styles.dragHandle}
          {...attributes}
          {...(listeners as React.HTMLAttributes<HTMLDivElement>)}
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </div>
      )}

      {/* Task name */}
      <p className={styles.kanbanCardName}>{task.name}</p>

      {/* Date row */}
      {formattedDate && (
        <div className={styles.kanbanDateRow}>
          <ChartBar size={13} style={{ color: PRIORITY_COLOR[task.priority ?? 'medium'] ?? '#ffaa33' }} />
          <span className={styles.kanbanDateText}>{formattedDate}</span>
        </div>
      )}

      {/* Description snippet */}
      {task.notes && <p className={styles.kanbanCardDesc}>{task.notes}</p>}

      {/* Progress bar */}
      {totalSubtasks > 0 && (
        <>
          <div className={styles.kanbanProgressBar}>
            <div className={styles.kanbanProgressFill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.kanbanProgressLabel}>Progress : {progress}%</span>
        </>
      )}

      {/* Footer */}
      <div className={styles.kanbanCardFooter}>
        <div className={styles.kanbanAvatarStack}>
          {avatars.map((a, i) => (
            <div key={i} className={styles.kanbanAvatar} title={a.name}>
              {getInitials(a.name)}
            </div>
          ))}
        </div>
        <div className={styles.kanbanCardMeta}>
          {(task.commentCount ?? 0) > 0 && (
            <span className={styles.kanbanMetaItem}>
              <ChatCircle size={12} /> {task.commentCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── List item inner (legacy) ──────────────────────────────────────────────────
function ListItemInner({
  task,
  isDraggable,
  onToggleComplete,
  onEdit,
  onDelete,
  attributes,
  listeners,
}: {
  task: Task
  isDraggable: boolean
  onToggleComplete?: (task: Task) => void
  onEdit?: (task: Task, e: React.MouseEvent) => void
  onDelete?: (taskId: string, e: React.MouseEvent) => void
  attributes: React.HTMLAttributes<HTMLElement>
  listeners: Record<string, unknown> | undefined
}) {
  return (
    <>
      {isDraggable && (
        <div
          className={styles.dragHandle}
          style={{ cursor: 'grab', padding: '0 0.5rem', display: 'flex', alignItems: 'center', color: 'var(--color-slate-400)' }}
          {...attributes}
          {...(listeners as React.HTMLAttributes<HTMLDivElement>)}
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={20} />
        </div>
      )}

      <div className={styles.taskListItemCheckboxContainer} onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={!!task.completed}
          onChange={() => onToggleComplete?.(task)}
          className={styles.taskListItemCheckbox}
        />
      </div>

      <div className={styles.taskListItemContent}>
        <div
          className={task.completed ? styles.taskListItemNameCompleted : styles.taskListItemNamePending}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          {task.priority && (
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, display: 'inline-block',
              backgroundColor: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#3b82f6',
            }} />
          )}
          {task.name}
        </div>

        <div className={styles.taskListItemMeta}>
          {task.dueDate && (
            <div className={styles.taskListItemMetaDate}>
              <Calendar size={14} />
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
          {task.labels && task.labels.length > 0 ? (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {task.labels.map((l: Label, i: number) => (
                <div key={i} className={styles.taskListItemCategoryTag} style={{ backgroundColor: `${l.color}20`, color: l.color, borderColor: `${l.color}40` }}>
                  <span>{l.name}</span>
                </div>
              ))}
            </div>
          ) : task.category ? (
            <div className={`${styles.taskListItemCategoryTag} ${styles.tagDefault}`}>
              <Tag size={12} />
              <span>{task.category}</span>
            </div>
          ) : null}
          {task.teamId && (
            <div className={`${styles.taskListItemCategoryTag} ${styles.tagDefault}`} title="Team Shared Task">
              <Users size={12} />
              <span>Team</span>
            </div>
          )}
          {task.assignedToId && task.assignedToId !== task.userId && (
            <div className={`${styles.taskListItemCategoryTag} ${styles.tagPurple}`} title="Assigned to someone else">
              <User size={12} />
              <span>Assigned</span>
            </div>
          )}
          {task.assignedToId && task.assignedToId === task.userId && task.teamId && (
            <div className={`${styles.taskListItemCategoryTag} ${styles.tagGreen}`} title="Assigned to you">
              <User size={12} />
              <span>Me</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.taskListItemActions}>
        <button onClick={e => onEdit?.(task, e)} className={styles.taskListItemBtn} title="Edit">
          <Edit2 size={16} />
        </button>
        <button onClick={e => onDelete?.(task.id, e)} className={styles.taskListItemBtn} title="Delete">
          <Trash2 size={16} />
        </button>
      </div>
    </>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function SortableTaskItem({
  task,
  onClick,
  index = 0,
  isDraggable = false,
  onToggleComplete,
  onEdit,
  onDelete,
  isKanban = false,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !isDraggable,
    data: { type: 'Task', task },
  })

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    boxShadow: isDragging ? '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' : '',
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  }

  const handleClick = () => {
    if (onClick) onClick(task)
  }

  if (isDraggable) {
    return (
      <div
        ref={setNodeRef}
        style={dragStyle}
        className={isKanban ? '' : `${styles.taskListItem} ${getPriorityClass(task.priority)}`}
        onClick={handleClick}
      >
        {isKanban ? (
          <KanbanCardInner task={task} isDraggable={isDraggable} attributes={attributes} listeners={listeners as Record<string, unknown>} />
        ) : (
          <ListItemInner task={task} isDraggable={isDraggable} onToggleComplete={onToggleComplete} onEdit={onEdit} onDelete={onDelete} attributes={attributes} listeners={listeners as Record<string, unknown>} />
        )}
      </div>
    )
  }

  return (
    <motion.div
      className={isKanban ? '' : `${styles.taskListItem} ${getPriorityClass(task.priority)}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      onClick={handleClick}
    >
      {isKanban ? (
        <KanbanCardInner task={task} isDraggable={false} attributes={attributes} listeners={listeners as Record<string, unknown>} />
      ) : (
        <ListItemInner task={task} isDraggable={false} onToggleComplete={onToggleComplete} onEdit={onEdit} onDelete={onDelete} attributes={attributes} listeners={listeners as Record<string, unknown>} />
      )}
    </motion.div>
  )
}

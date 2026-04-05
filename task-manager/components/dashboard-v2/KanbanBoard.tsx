'use client'

import React, { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Task, TaskStatus, normalizeStatus } from '@/types/task'
import { Label } from '@/components/dashboard-v2/LabelSelector'
import { SortableTaskItem } from './SortableTaskItem'
import ConfirmModal from './ConfirmModal'
import { AnimatePresence } from 'framer-motion'
import {
  DndContext,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  defaultDropAnimationSideEffects,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

// Enriched task accepted by KanbanBoard (labels optional for recurrence copy)
type KanbanTask = Task & { labels?: Label[] }

type ColumnId = 'todo' | 'in_progress' | 'in_review' | 'done'

interface Column {
  id: ColumnId
  label: string
  color: string
}

const COLUMNS: Column[] = [
  { id: 'todo',        label: 'To-do',      color: '#c7c7cc' },
  { id: 'in_progress', label: 'In Progress', color: 'var(--primary-color)' },
  { id: 'in_review',   label: 'In Review',   color: 'var(--status-in-review, #6e40c9)' },
  { id: 'done',        label: 'Completed',   color: 'var(--success-color, #30d158)' },
]

interface KanbanBoardProps {
  tasks: KanbanTask[]
  onTaskUpdate: () => void
  userId: string
}

// ── DroppableColumn ────────────────────────────────────────────────────────────
// Uses useDroppable (NOT useSortable) so the column area registers as a drop zone.
function DroppableColumn({
  id,
  label,
  color,
  tasks,
  onToggleComplete,
  onTaskClick,
  onDeleteRequest,
  isOver,
}: {
  id: ColumnId
  label: string
  color: string
  tasks: KanbanTask[]
  onToggleComplete: (task: Task) => void
  onTaskClick: (taskId: string) => void
  onDeleteRequest: (taskId: string) => void
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id, data: { type: 'Column', columnId: id } })

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minWidth: '260px',
        maxWidth: '340px',
        backgroundColor: isOver ? 'var(--background)' : 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        border: isOver ? '2px solid var(--primary-color)' : '1px solid var(--border)',
        overflow: 'hidden',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {/* Colored top bar */}
      <div style={{ height: '3px', background: color }} />

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', background: 'var(--border)', padding: '1px 7px', borderRadius: '99px' }}>
            {tasks.length}
          </span>
        </div>

        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '60px' }}>
            {tasks.map((task, idx) => (
              <div key={task.id} style={{ opacity: id === 'done' ? 0.65 : 1, transition: 'opacity 0.2s' }}>
                <SortableTaskItem
                  task={task}
                  index={idx}
                  isDraggable={true}
                  isKanban={true}
                  onClick={() => onTaskClick(task.id)}
                  onToggleComplete={onToggleComplete}
                  onEdit={() => onTaskClick(task.id)}
                  onDelete={(taskId, e) => { e.stopPropagation(); onDeleteRequest(taskId) }}
                />
              </div>
            ))}
            {tasks.length === 0 && (
              <div style={{
                padding: '24px 12px', textAlign: 'center', color: 'var(--text-tertiary)',
                fontSize: '12px', border: '2px dashed var(--border)', borderRadius: '8px',
                transition: 'border-color 0.15s',
              }}>
                Drop tasks here
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

// ── KanbanBoard ───────────────────────────────────────────────────────────────
export function KanbanBoard({ tasks: initialTasks, onTaskUpdate, userId }: KanbanBoardProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [overColumnId, setOverColumnId] = useState<ColumnId | null>(null)
  // Track the dragged task's current column in a ref (avoids stale closure reads)
  const activeColRef = useRef<ColumnId | null>(null)

  // Stable supabase client
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  React.useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  // ── Toggle complete ─────────────────────────────────────────────────────────
  const handleToggleComplete = async (task: Task) => {
    const isNowComplete = !task.completed
    const newStatus: TaskStatus = isNowComplete ? 'done' : 'in_progress'

    setTasks(prev => prev.map(t => t.id === task.id
      ? { ...t, completed: isNowComplete, status: newStatus }
      : t
    ))

    await supabase.from('Task').update({ completed: isNowComplete, status: newStatus }).eq('id', task.id)

    if (isNowComplete && task.recurrence) {
      const currentDue = new Date(task.dueDate)
      const newDue = task.nextRecurrenceDate ? new Date(task.nextRecurrenceDate) : new Date(currentDue)

      if (!task.nextRecurrenceDate) {
        if (task.recurrence === 'daily') newDue.setDate(currentDue.getDate() + 1)
        else if (task.recurrence === 'weekly') newDue.setDate(currentDue.getDate() + 7)
        else if (task.recurrence === 'monthly') newDue.setMonth(currentDue.getMonth() + 1)
      }

      const nextNextDue = new Date(newDue)
      if (task.recurrence === 'daily') nextNextDue.setDate(newDue.getDate() + 1)
      else if (task.recurrence === 'weekly') nextNextDue.setDate(newDue.getDate() + 7)
      else if (task.recurrence === 'monthly') nextNextDue.setMonth(newDue.getMonth() + 1)

      const { data: newTask } = await supabase.from('Task').insert({
        name: task.name,
        dueDate: newDue.toISOString(),
        category: task.category,
        notes: task.notes,
        links: task.links,
        priority: task.priority ?? 'medium',
        userId: task.userId ?? userId,
        teamId: task.teamId,
        assignedToId: task.assignedToId,
        createdById: task.createdById,
        recurrence: task.recurrence,
        nextRecurrenceDate: nextNextDue.toISOString(),
        status: 'todo',
        orderIndex: 0,
      }).select('id').single()

      const enriched = task as KanbanTask
      if (newTask && enriched.labels && enriched.labels.length > 0) {
        await supabase.from('TaskLabel').insert(enriched.labels.map(l => ({ taskId: newTask.id, labelId: l.id })))
      }
      await supabase.from('Task').update({ recurrence: null, nextRecurrenceDate: null }).eq('id', task.id)
    }

    onTaskUpdate()
  }

  // ── DnD sensors ────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const columnTasks = useMemo(() => {
    return COLUMNS.reduce((acc, col) => {
      acc[col.id] = tasks
        .filter(t => normalizeStatus(t.status) === col.id)
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      return acc
    }, {} as Record<ColumnId, KanbanTask[]>)
  }, [tasks])

  // ── Custom collision detection ───────────────────────────────────────────────
  // pointerWithin: pointer must be physically inside a droppable rect — correct
  // for side-by-side columns where closestCorners always picks the outer cols.
  // Fall back to rectIntersection when pointer isn't inside anything (e.g. gaps).
  const collisionDetection = (args: Parameters<typeof pointerWithin>[0]) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) return pointerCollisions
    return rectIntersection(args)
  }

  // ── Resolve column from a column-id or task-id string ──────────────────────
  // NOTE: always call with a fresh tasks snapshot to avoid stale closures
  const resolveColumnId = (id: string, snapshot: KanbanTask[]): ColumnId | null => {
    if (COLUMNS.some(c => c.id === id)) return id as ColumnId
    const task = snapshot.find(t => t.id === id)
    return task ? normalizeStatus(task.status) as ColumnId : null
  }

  // ── onDragStart ─────────────────────────────────────────────────────────────
  const onDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) {
      setActiveTask(task)
      activeColRef.current = normalizeStatus(task.status) as ColumnId
    }
  }

  // ── onDragOver: optimistic UI – move task between columns immediately ────────
  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) { setOverColumnId(null); return }

    const activeId = String(active.id)
    const overId = String(over.id)

    // Resolve target column using a functional updater so we always have fresh state
    setTasks(prev => {
      const targetColId = resolveColumnId(overId, prev)
      setOverColumnId(targetColId)

      if (!targetColId || activeId === overId) return prev

      // Use the ref (not stale closure) for the active task's current column
      const currentColId = activeColRef.current
      if (!currentColId || currentColId === targetColId) return prev

      const idx = prev.findIndex(t => t.id === activeId)
      if (idx === -1) return prev

      // Update the ref immediately so the next onDragOver call sees the new column
      activeColRef.current = targetColId

      const updated = [...prev]
      updated[idx] = { ...updated[idx], status: targetColId, completed: targetColId === 'done' }
      return updated
    })
  }

  // ── onDragEnd: persist to DB ─────────────────────────────────────────────────
  const onDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)
    setOverColumnId(null)
    activeColRef.current = null

    const { active, over } = event
    const activeId = String(active.id)
    const overId = over ? String(over.id) : null

    // Use functional updater to get the latest tasks snapshot after all onDragOver mutations
    let finalStatus: ColumnId = 'todo'
    let colItemsSnapshot: KanbanTask[] = []

    setTasks(prev => {
      const movedTask = prev.find(t => t.id === activeId)
      if (!movedTask) return prev

      finalStatus = normalizeStatus(movedTask.status) as ColumnId
      const isNowComplete = finalStatus === 'done'

      // Reorder within same column when dropped on a sibling task
      if (overId && overId !== activeId) {
        const targetColId = resolveColumnId(overId, prev)
        if (targetColId === finalStatus) {
          const colItems = prev.filter(t => normalizeStatus(t.status) === finalStatus)
          const activeIdx = colItems.findIndex(t => t.id === activeId)
          const overIdx = colItems.findIndex(t => t.id === overId)
          if (activeIdx !== -1 && overIdx !== -1) {
            const reordered = arrayMove(colItems, activeIdx, overIdx)
            const rest = prev.filter(t => normalizeStatus(t.status) !== finalStatus)
            colItemsSnapshot = reordered
            // Persist after render
            void supabase.from('Task').update({ status: finalStatus, completed: isNowComplete }).eq('id', activeId)
            void supabase.from('Task').upsert(
              reordered.map((t, i) => ({ id: t.id, orderIndex: i, status: finalStatus }))
            )
            return [...rest, ...reordered]
          }
        }
      }

      colItemsSnapshot = prev.filter(t => normalizeStatus(t.status) === finalStatus)
      void supabase.from('Task').update({ status: finalStatus, completed: isNowComplete }).eq('id', activeId)
      void supabase.from('Task').upsert(
        colItemsSnapshot.map((t, i) => ({ id: t.id, orderIndex: i, status: finalStatus }))
      )
      return prev
    })
  }

  const handleDeleteTask = async (id: string) => {
    await supabase.from('Task').delete().eq('id', id)
    onTaskUpdate()
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
          {COLUMNS.map(col => (
            <DroppableColumn
              key={col.id}
              id={col.id}
              label={col.label}
              color={col.color}
              tasks={columnTasks[col.id] ?? []}
              onToggleComplete={handleToggleComplete}
              onTaskClick={(taskId) => router.push(`/dashboard/tasks/${taskId}`)}
              onDeleteRequest={(taskId) => setTaskToDelete(taskId)}
              isOver={overColumnId === col.id}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
        }}>
          {activeTask ? (
            <div style={{ transform: 'rotate(2deg)', boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius-sm)' }}>
              <SortableTaskItem
                task={activeTask}
                isDraggable={false}
                isKanban={true}
                onClick={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AnimatePresence>
        {taskToDelete && (
          <ConfirmModal
            isOpen={true}
            title="Delete Task"
            message="Are you sure you want to delete this task? This cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
            onConfirm={async () => {
              await handleDeleteTask(taskToDelete)
              setTaskToDelete(null)
            }}
            onCancel={() => setTaskToDelete(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

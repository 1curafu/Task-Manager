'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabaseClient'
import { Footer } from '@/components/dashboard-v2/Footer'
import styles from '@/app/dashboard/dashboard.module.css'
import { TaskActionModal } from '@/components/dashboard-v2/TaskActionModal'
import ConfirmModal from '@/components/dashboard-v2/ConfirmModal'
import { CustomDropdown } from '@/components/dashboard-v2/CustomDropdown'
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks'
import { SortableTaskItem } from '@/components/dashboard-v2/SortableTaskItem'
import { Label } from '@/components/dashboard-v2/LabelSelector'
import { PageSkeleton } from '@/components/dashboard-v2/PageSkeleton'
import { SortAscending as ArrowUpAZ } from '@phosphor-icons/react'
import { AnimatePresence } from 'framer-motion'
import { Task as BaseTask, TaskStatus, normalizeStatus } from '@/types/task'

// Extend the canonical Task with the labels field used in list views
interface Task extends BaseTask {
  labels?: Label[]
}

function TasksPageContent() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'dueDate' | 'name'>('dueDate')
  const [filter, setFilter] = useState<'all' | TaskStatus>('all')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUserId(session.user.id)
      }
    }
    void initSession()
  }, [supabase])

  const fetchTasks = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const { data: memberTeams } = await supabase.rpc('get_user_member_teams', { user_id_param: userId })
    const { data: ownedTeams } = await supabase.from('Team').select('id').eq('ownerId', userId)
    const teamIds = [...(ownedTeams?.map(t => t.id) || []), ...(memberTeams?.map((t: { id: string }) => t.id) || [])]

    const query = supabase
      .from('Task')
      .select(`
          *,
          labels:TaskLabel(labelId, label:Label(*))
      `)
      .eq('isTemplate', false)
      .or(`userId.eq.${userId},assignedToId.eq.${userId}${teamIds.length > 0 ? `,teamId.in.(${teamIds.join(',')})` : ''}`)
      .order(sortBy, { ascending: true })

    const { data } = await query

    const tasksWithLabels = data?.map(task => ({
       ...task,
       labels: (task.labels?.map((tl: { label?: Label }) => tl.label).filter(Boolean) as Label[]) || []
    }))

    const finalSorted = (tasksWithLabels || []).sort((a, b) => {
        if (a.completed === b.completed) return 0
        return a.completed ? 1 : -1
    })

    setTasks(finalSorted)
    setLoading(false)
  }, [supabase, userId, refreshTrigger, sortBy])

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  const loadTasks = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  useRealtimeTasks(loadTasks)

  const handleDelete = async (id: string) => {
    await supabase.from('Task').delete().eq('id', id)
    toast.success('Task deleted')
    loadTasks()
  }

  const toggleComplete = async (task: Task) => {
    const isNowComplete = !task.completed
    const newStatus = isNowComplete ? 'done' : (task.status === 'done' ? 'todo' : task.status)
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
            priority: task.priority || 'medium',
            userId: task.userId || userId,
            teamId: task.teamId,
            assignedToId: task.assignedToId,
            createdById: task.createdById,
            recurrence: task.recurrence,
            nextRecurrenceDate: nextNextDue.toISOString(),
            status: 'todo',
            orderIndex: 0
        }).select('id').single()

        if (newTask && task.labels && task.labels.length > 0) {
            const newMappings = task.labels.map(l => ({ taskId: newTask.id, labelId: l.id }))
            await supabase.from('TaskLabel').insert(newMappings)
        }

        // Remove recurrence from the old completed task
        await supabase.from('Task').update({ recurrence: null, nextRecurrenceDate: null }).eq('id', task.id)
    }

    if (isNowComplete) {
      toast.success('Task completed!')
    } else {
      toast('Task reopened')
    }

    loadTasks()
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    const ns = normalizeStatus(task.status)
    if (filter === 'todo') return ns === 'todo' && !task.completed
    if (filter === 'in_progress') return ns === 'in_progress'
    if (filter === 'in_review') return ns === 'in_review'
    if (filter === 'done') return ns === 'done' || task.completed
    return true
  })

  const countAll = tasks.length
  const countTodo = tasks.filter(task => normalizeStatus(task.status) === 'todo' && !task.completed).length
  const countInProgress = tasks.filter(task => normalizeStatus(task.status) === 'in_progress').length
  const countDone = tasks.filter(task => normalizeStatus(task.status) === 'done' || task.completed).length

  return (
    <>
      <div className={styles.pageHeaderContainerFlex}>
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 className={styles.pageTitle} style={{ margin: 0 }}>My Tasks</h2>
                <span className={styles.taskCountBadge}>{tasks.length} tasks</span>
            </div>
            <p className={styles.pageSubtitle}>Manage all your tasks in one place.</p>
        </div>

        <div className={styles.sortContainer}>
            <ArrowUpAZ size={18} color="var(--color-slate-500)" className={styles.sortIcon} />
            <CustomDropdown
               value={sortBy}
               onChange={(val) => setSortBy(val as 'dueDate' | 'name')}
               options={[
                  { label: 'Due Date', value: 'dueDate' },
                  { label: 'Name', value: 'name' },
               ]}
               triggerStyle={{ border: 'none', background: 'transparent', padding: '0.5rem', height: '100%', width: '100%' }}
               align="right"
            />
        </div>
      </div>

      {/* Filter Pills */}
      <div className={styles.filterPills} style={{ marginBottom: '1rem', marginTop: '-0.5rem' }}>
        {[
          { id: 'all', label: `All ${countAll}` },
          { id: 'todo', label: `Todo ${countTodo}` },
          { id: 'in_progress', label: `In Progress ${countInProgress}` },
          { id: 'done', label: `Done ${countDone}` }
        ].map(f => (
          <button
            key={f.id}
            className={`${styles.filterPill} ${filter === f.id ? styles.filterPillActive : ''}`}
            onClick={() => setFilter(f.id as 'all' | TaskStatus)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <PageSkeleton />
      ) : filteredTasks.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          No tasks found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <AnimatePresence>
            {filteredTasks.map((task, index) => (
              <SortableTaskItem
                key={task.id} task={task} index={index} isDraggable={false}
                onClick={(t) => router.push(`/dashboard/tasks/${t.id}`)}
                onToggleComplete={toggleComplete}
                onEdit={(t, e) => { e.stopPropagation(); setEditingTask(t); setIsModalOpen(true) }}
                onDelete={(id, e) => { e.stopPropagation(); setTaskToDelete(id) }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {editingTask && userId && (
          <TaskActionModal
            task={editingTask}
            userId={userId}
            viewMode={isModalOpen}
            onClose={() => setEditingTask(null)}
            onSave={() => {
              setEditingTask(null)
              toast.success('Task saved')
              loadTasks()
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!taskToDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={async () => {
          if (taskToDelete) await handleDelete(taskToDelete)
          setTaskToDelete(null)
        }}
        onCancel={() => setTaskToDelete(null)}
      />

      <Footer />
    </>
  )
}

export default function TasksPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TasksPageContent />
    </Suspense>
  )
}

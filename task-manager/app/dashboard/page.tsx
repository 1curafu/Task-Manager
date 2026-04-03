'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { TaskGrid } from '@/components/dashboard-v2/TaskGrid'
import { PageSkeleton } from '@/components/dashboard-v2/PageSkeleton'
import { TaskActionModal } from '@/components/dashboard-v2/TaskActionModal'
import { Footer } from '@/components/dashboard-v2/Footer'
import styles from '@/app/dashboard/dashboard.module.css'
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle, Plus, SquaresFour as LayoutDashboard, ChartBar as BarChart2, PencilSimple as Edit2, Clock } from '@phosphor-icons/react'
import { formatDistanceToNow, parseISO, isPast, isToday } from 'date-fns'

interface Task {
  id: string
  name: string
  dueDate: string
  category?: string | null
  notes?: string | null
  links?: string | null
  userId: string
  lastUpdated: string
  createdAt: string
  teamId?: string | null
  assignedToId?: string | null
  createdById?: string | null
  completed?: boolean
  priority?: 'high' | 'medium' | 'low' | null
  status?: 'todo' | 'in_progress' | 'done' | null
  recurrence?: 'daily' | 'weekly' | 'monthly' | null
  nextRecurrenceDate?: string | null
  orderIndex?: number | null
}

interface ActivityItem {
  id: string
  name: string
  type: 'completed' | 'created' | 'updated'
  time: string
}

export default function DashboardNew() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const router = useRouter()
  const supabase = createClient()

  const fetchTasks = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session || !session.user) {
        router.push('/auth/login')
        return
      }

      setUserId(session.user.id)

      const { data: taskData, error: taskError } = await supabase
        .from('Task')
        .select('*')
        .eq('isTemplate', false)
        .or(`userId.eq.${session.user.id},assignedToId.eq.${session.user.id}`)
        .order('dueDate', { ascending: true })

      if (taskError) throw taskError

      const allTasks = taskData || []
      setTasks(allTasks)

      // Build recent activity from task data
      const activity: ActivityItem[] = []
      const completedTasks = allTasks
        .filter(t => t.completed)
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        .slice(0, 3)

      completedTasks.forEach(t => {
        activity.push({ id: t.id + '-c', name: t.name, type: 'completed', time: t.lastUpdated })
      })

      const recentlyCreated = allTasks
        .filter(t => !t.completed)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2)

      recentlyCreated.forEach(t => {
        activity.push({ id: t.id + '-n', name: t.name, type: 'created', time: t.createdAt })
      })

      activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      setRecentActivity(activity.slice(0, 5))
      setLoading(false)
    } catch {
      setError('Failed to load tasks. Please refresh.')
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    const loadData = async () => {
      await fetchTasks()
    }
    loadData()
  }, [fetchTasks])

  useRealtimeTasks(() => {
    const refreshData = async () => {
      await fetchTasks()
    }
    refreshData()
  })

  if (loading) {
    return <PageSkeleton />
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>{error}</p>
        <button onClick={() => { setError(null); setLoading(true); void fetchTasks() }} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completed': return <CheckCircle size={14} />
      case 'created': return <Plus size={14} />
      default: return <Edit2 size={14} />
    }
  }

  const getActivityIconClass = (type: string) => {
    switch (type) {
      case 'completed': return styles.activityIconGreen
      case 'created': return styles.activityIconBlue
      default: return styles.activityIconOrange
    }
  }

  const getActivityLabel = (item: ActivityItem) => {
    switch (item.type) {
      case 'completed': return item.name
      case 'created': return item.name
      default: return item.name
    }
  }

  const getActivityTypeLabel = (item: ActivityItem) => {
    switch (item.type) {
      case 'completed': return 'Completed'
      case 'created': return 'Created'
      default: return 'Updated'
    }
  }

  const activeTasksCount = tasks.filter(t => !t.completed).length
  const completedTasks = tasks.filter(t => t.completed).length
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const overdueCount = tasks.filter(t => !t.completed && t.dueDate && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate))).length
  const dueTodayCount = tasks.filter(t => !t.completed && t.dueDate && isToday(parseISO(t.dueDate))).length

  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (completionRate / 100) * circumference

  return (
    <>
      <div className={styles.statPillsContainer}>
        <div className={styles.statPill}>
          <div className={styles.statPillDot} style={{ background: '#a855f7' }}></div>
          <strong>{activeTasksCount}</strong> active tasks
        </div>
        <div className={styles.statPill}>
          <div className={styles.statPillDot} style={{ background: '#06b6d4' }}></div>
          <strong>{completionRate}%</strong> completion rate
        </div>
        <div className={styles.statPill}>
          <div className={styles.statPillDot} style={{ background: '#ef4444' }}></div>
          <strong>{overdueCount}</strong> overdue
        </div>
        <div className={styles.statPill}>
          <div className={styles.statPillDot} style={{ background: '#f59e0b' }}></div>
          <strong>{dueTodayCount}</strong> due today
        </div>
      </div>

      <TaskGrid tasks={tasks} onTaskClick={(task) => setEditingTask(task as unknown as Task)} />

      {/* Recent Activity + Right Column */}
      <div className={styles.dashboardBottomLayout}>
        <motion.div 
          className={styles.recentActivityCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 24 }}
        >
          <div>
            <h3 className={styles.recentActivityTitle}>Recent Activity</h3>
            <p className={styles.recentActivitySubtitle}>Your latest updates</p>
          </div>
          <div className={styles.activityList}>
            {recentActivity.length > 0 ? (
              recentActivity.map(item => (
                <div key={item.id} className={styles.activityItemNeo}>
                  <div className={`${styles.activityIconNeo} ${getActivityIconClass(item.type)}`}>
                    {getActivityIcon(item.type)}
                  </div>
                  <div className={styles.activityContentNeo}>
                    <div className={styles.activityTextNeo}>{getActivityLabel(item)}</div>
                    <div className={styles.activityTimeNeo}>
                      {getActivityTypeLabel(item)} · {formatDistanceToNow(parseISO(item.time), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.activityEmptyMessage}>No recent activity yet.</div>
            )}
          </div>
        </motion.div>

        <div className={styles.dashboardRightColumn}>
          {/* Weekly Progress Card */}
          <motion.div 
            className={styles.weeklyProgressCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <div>
              <h3 className={styles.recentActivityTitle}>Weekly Progress</h3>
              <p className={styles.recentActivitySubtitle}>Task completion this week</p>
            </div>
            <div className={styles.weeklyProgressBody}>
              <div className={styles.progressCircleContainer}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-slate-200)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#06b6d4" strokeWidth="8" 
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" 
                    transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                </svg>
                <div className={styles.progressCircleText}>
                  {completionRate}%
                </div>
              </div>
              <div className={styles.progressDetails}>
                <div className={styles.progressDetailsTitle}>{completionRate}% Complete</div>
                <div className={styles.progressDetailsSub}>{completedTasks} of {totalTasks} tasks done</div>
                <div className={styles.progressBarBg}>
                  <div className={styles.progressBarFill} style={{ width: `${completionRate}%` }}></div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className={styles.quickActionsCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <h3 className={styles.recentActivityTitle}>Quick Actions</h3>
            <div className={styles.quickActionsList}>
              <Link href="/dashboard/kanban" className={styles.quickActionBtnNeo}>
                <div className={styles.quickActionBtnIcon} style={{ background: 'var(--color-purple-50)', color: 'var(--color-brand-blue)' }}>
                  <LayoutDashboard size={16} />
                </div>
                <div>
                  <div className={styles.quickActionBtnTitle}>Kanban Board</div>
                  <div className={styles.quickActionBtnSub}>Drag & drop tasks</div>
                </div>
              </Link>
              <Link href="/dashboard/calendar" className={styles.quickActionBtnNeo}>
                <div className={styles.quickActionBtnIcon} style={{ background: 'var(--color-green-50)', color: '#10b981' }}>
                  <Clock size={16} />
                </div>
                <div>
                  <div className={styles.quickActionBtnTitle}>Calendar</div>
                  <div className={styles.quickActionBtnSub}>See your schedule</div>
                </div>
              </Link>
              <Link href="/dashboard/analytics" className={styles.quickActionBtnNeo}>
                <div className={styles.quickActionBtnIcon} style={{ background: 'var(--color-orange-50)', color: '#f59e0b' }}>
                  <BarChart2 size={16} />
                </div>
                <div>
                  <div className={styles.quickActionBtnTitle}>Analytics</div>
                  <div className={styles.quickActionBtnSub}>Track progress</div>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />

      <AnimatePresence>
        {editingTask && userId && (
          <TaskActionModal
            task={editingTask}
            userId={userId}
            viewMode={true}
            onClose={() => setEditingTask(null)}
            onSave={() => {
              setEditingTask(null)
              fetchTasks()
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { TaskGrid } from '@/components/dashboard-v2/TaskGrid'
import { TaskActionModal } from '@/components/dashboard-v2/TaskActionModal'
import { Footer } from '@/components/dashboard-v2/Footer'
import styles from '@/app/dashboard-new/dashboard.module.css'
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks'
import { AnimatePresence } from 'framer-motion'

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
}



export default function DashboardNew() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const fetchTasks = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session || !session.user) {
      router.push('/auth/login')
      return
    }
    
    setUserId(session.user.id)

    const { data: taskData } = await supabase
      .from('Task')
      .select('*')
      .or(`userId.eq.${session.user.id},assignedToId.eq.${session.user.id}`)
      .order('dueDate', { ascending: true })

    setTasks(taskData || [])
    setLoading(false)
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
    return (
      <div className={styles.pageLoadingContainer}>
        Loading dashboard data...
      </div>
    )
  }

  return (
    <>
      <div className={styles.pageHeaderContainer}>
        <h2 className={styles.pageTitle}>Dashboard</h2>
        <p className={styles.pageSubtitle}>Welcome back! Here&apos;s your overview.</p>
      </div>

      <TaskGrid tasks={tasks} onTaskClick={(task) => setEditingTask(task as unknown as Task)} />
      
      {/* Temporary note */}
      <div className={styles.pageCallout}>
          <strong>Feature Migration in Progress</strong><br/>
          We are moving features to separate pages. Access &quot;My Tasks&quot;, &quot;Teams&quot;, etc. from the sidebar soon.
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

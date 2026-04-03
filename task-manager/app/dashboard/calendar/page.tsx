'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { AnimatePresence } from 'framer-motion'
import styles from '../dashboard.module.css'
import { Footer } from '@/components/dashboard-v2/Footer'
import Calendar from '@/components/dashboard-v2/Calendar'
import { TaskActionModal } from '@/components/dashboard-v2/TaskActionModal'
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks'
import { PageSkeleton } from '@/components/dashboard-v2/PageSkeleton'
import { Task } from '@/types/task'

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const supabase = createClient()

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUserId(session.user.id)
      }
    }
    void initSession()
  }, [supabase])

  useEffect(() => {
    if (!userId) return

    const fetchTasks = async () => {
      setLoading(true)
      try {
        const { data, error: fetchError } = await supabase
          .from('Task')
          .select(`
            id, name, dueDate, completed, category, priority, status,
            labels:TaskLabel(labelId, label:Label(*))
          `)
          .eq('isTemplate', false)
          .or(`userId.eq.${userId},assignedToId.eq.${userId}`)

        if (fetchError) throw fetchError

        if (data) {
          setTasks(data as unknown as Task[])
        }
        setLoading(false)
      } catch {
        setError('Failed to load tasks. Please refresh.')
        setLoading(false)
      }
    }

    void fetchTasks()
  }, [supabase, userId, refreshTrigger])

  const handleTaskUpdate = () => {
    setEditingTask(null)
    setRefreshTrigger(prev => prev + 1)
  }

  useRealtimeTasks(() => {
    setRefreshTrigger(prev => prev + 1)
  })

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>{error}</p>
        <button onClick={() => { setError(null); setLoading(true); setRefreshTrigger(prev => prev + 1) }} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <div className={styles.pageHeaderContainer}>
        <h2 className={styles.pageTitle}>Calendar</h2>
        <p className={styles.pageSubtitle}>View and manage your schedule.</p>
      </div>

      <div className={styles.pageHeaderContainer}>
         {loading ? (
             <PageSkeleton />
         ) : (
             <Calendar 
                tasks={tasks} 
                onEditTask={(task) => setEditingTask(task)} 
             />
         )}
      </div>

      <AnimatePresence>
        {editingTask && userId && (
          <TaskActionModal 
              task={editingTask}
              userId={userId}
              viewMode={true}
              onClose={() => setEditingTask(null)}
              onSave={handleTaskUpdate}
          />
        )}
      </AnimatePresence>

      <Footer />
    </>
  )
}

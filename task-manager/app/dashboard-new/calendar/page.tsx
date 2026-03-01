'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { AnimatePresence } from 'framer-motion'
import styles from '../dashboard.module.css'
import { Footer } from '@/components/dashboard-v2/Footer'
import Calendar from '@/components/dashboard-v2/Calendar'
import { TaskActionModal } from '@/components/dashboard-v2/TaskActionModal'
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks'

interface Task {
  id: string
  name: string
  dueDate: string
  category?: string | null
  notes?: string | null
  links?: string | null
  teamId?: string | null
  assignedToId?: string | null
  createdById?: string | null
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
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
      const { data } = await supabase
        .from('Task')
        .select('*')
        .or(`userId.eq.${userId},assignedToId.eq.${userId}`)
      
      if (data) {
        setTasks(data as unknown as Task[])
      }
      setLoading(false)
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

  return (
    <>
      <div className={styles.pageHeaderContainer}>
        <h2 className={styles.pageTitle}>Calendar</h2>
        <p className={styles.pageSubtitle}>View and manage your schedule.</p>
      </div>

      <div className={styles.pageHeaderContainer}>
         {loading ? (
             <div className={`${styles.card} ${styles.emptyStateMessage}`}>
                 Loading calendar...
             </div>
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

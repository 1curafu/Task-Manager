'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Footer } from '@/components/dashboard-v2/Footer'
import styles from '@/app/dashboard-new/dashboard.module.css'
import { TaskActionModal } from '@/components/dashboard-v2/TaskActionModal'
import { ConfirmDialog } from '@/components/dashboard-v2/ConfirmDialog'
import { CustomDropdown } from '@/components/dashboard-v2/CustomDropdown'
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks'
import { PencilSimple, Trash, SortAscending, CalendarBlank, Tag } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

interface Task {
  id: string
  name: string
  dueDate: string
  category?: string | null
  completed?: boolean
  notes?: string | null
  links?: string | null
  teamId?: string | null
  assignedToId?: string | null
  createdById?: string | null
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isViewingModal, setIsViewingModal] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'dueDate' | 'name'>('dueDate')
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
        .order(sortBy, { ascending: true })

      setTasks(data || [])
      setLoading(false)
    }

    void fetchTasks()
  }, [supabase, userId, refreshTrigger, sortBy])

  const loadTasks = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  useRealtimeTasks(loadTasks)

  const handleDelete = async (id: string) => {
    await supabase.from('Task').delete().eq('id', id)
    loadTasks()
  }

  const toggleComplete = async (task: Task) => {
    await supabase.from('Task').update({ completed: !task.completed }).eq('id', task.id)
    loadTasks()
  }

  return (
    <>
      <div className={styles.pageHeaderContainerFlex}>
        <div>
            <h2 className={styles.pageTitle}>My Tasks</h2>
            <p className={styles.pageSubtitle}>Manage all your tasks in one place.</p>
        </div>
        
        <div className={styles.sortContainer}>
            <SortAscending size={18} color="var(--color-slate-500)" className={styles.sortIcon} />
            <CustomDropdown
               value={sortBy}
               onChange={(val) => setSortBy(val as 'dueDate' | 'name')}
               options={[
                  { label: 'Due Date', value: 'dueDate' },
                  { label: 'Name', value: 'name' }
               ]}
               triggerStyle={{ border: 'none', background: 'transparent', padding: '0.5rem', height: '100%', width: '100%' }}
               align="right"
            />
        </div>
      </div>

      <div className={styles.whiteCard}>
        {loading ? (
           <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-slate-500)' }}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
           <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-slate-500)' }}>No tasks found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
             <AnimatePresence>
             {tasks.map((task, index) => (
                <motion.div 
                   key={task.id} 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   transition={{ duration: 0.2, delay: index * 0.05 }}
                   className={styles.taskListItem}
                   onClick={() => {
                       setIsViewingModal(true)
                       setEditingTask(task)
                   }}
                >
                   <div 
                      className={styles.taskListItemCheckboxContainer}
                      onClick={(e) => e.stopPropagation()}
                   >
                     <input 
                        type="checkbox" 
                        checked={!!task.completed} 
                        onChange={() => toggleComplete(task)}
                        className={styles.taskListItemCheckbox}
                     />
                   </div>
                   
                   <div className={styles.taskListItemContent}>
                      <div className={task.completed ? styles.taskListItemNameCompleted : styles.taskListItemNamePending}>
                         {task.name}
                      </div>
                      
                      {/* Metadata Row */}
                      <div className={styles.taskListItemMeta}>
                         {task.dueDate && (
                           <div className={styles.taskListItemMetaDate}>
                             <CalendarBlank size={14} />
                             <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                           </div>
                         )}
                         {task.category && (
                           <div className={styles.taskListItemCategoryTag}>
                             <Tag size={12} weight="fill" />
                             <span>{task.category}</span>
                           </div>
                         )}
                      </div>
                   </div>

                   <div className={styles.taskListItemActions}>
                      <button 
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsViewingModal(false)
                            setEditingTask(task)
                        }}
                        className={styles.taskListItemBtn}
                        title="Edit"
                      >
                         <PencilSimple size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                           e.stopPropagation()
                           setTaskToDelete(task.id)
                        }}
                        className={styles.taskListItemBtn}
                        title="Delete"
                      >
                         <Trash size={18} />
                      </button>
                   </div>
                </motion.div>
             ))}
             </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingTask && userId && (
          <TaskActionModal
            task={editingTask}
            userId={userId}
            viewMode={isViewingModal}
            onClose={() => setEditingTask(null)}
            onSave={() => {
              setEditingTask(null)
              loadTasks()
            }}
          />
        )}
      </AnimatePresence>

      {taskToDelete && (
          <ConfirmDialog
            isOpen={!!taskToDelete}
            title="Delete Task"
            message="Are you sure you want to delete this task? This action cannot be undone."
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={async () => {
                await handleDelete(taskToDelete)
                setTaskToDelete(null)
            }}
            onCancel={() => setTaskToDelete(null)}
          />
      )}

      <Footer />
    </>
  )
}

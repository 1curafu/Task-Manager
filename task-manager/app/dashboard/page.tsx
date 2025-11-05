'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { isToday, isTomorrow } from 'date-fns'
import Clock from '@/components/Clock'
import NotesPanel from '@/components/NotesPanel'
import TaskCard from '@/components/TaskCard'
import TaskList from '@/components/TaskList'
import CalendarView from '@/components/CalendarView'
import './dashboard.css'

interface Task {
  id: string
  name: string
  dueDate: string
  responsible?: string | null
  category?: string | null
  notes?: string | null
  links?: string | null
  userId: string
  lastUpdated: string
  createdAt: string
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('Task')
        .select('*')
        .eq('userId', userId)
        .order('dueDate', { ascending: true })

      if (error) throw error
      setTasks(data || [])
    } catch (err) {
      console.error('Error loading tasks:', err)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      setUserId(session.user.id)
      setUserEmail(session.user.email || '')
      setLoading(false)
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (userId) {
      loadTasks()
    }
  }, [userId])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('access_token')
    router.push('/auth/login')
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const { error } = await supabase
        .from('Task')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadTasks()
    } catch (err) {
      console.error('Error deleting task:', err)
      alert('Failed to delete task')
    }
  }

  const todayTasks = tasks.filter(task => isToday(new Date(task.dueDate)))
  const tomorrowTasks = tasks.filter(task => isTomorrow(new Date(task.dueDate)))

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <>
      <div className="dashboard">
        <aside className="sidebar">
          <Clock />
          <NotesPanel userId={userId} />
        </aside>

        <main className="main-content">
          <div className="dashboard-header">
            <h1 className="dashboard-title">Task Manager</h1>
            <div className="user-menu">
              <span className="user-email">{userEmail}</span>
              <button onClick={handleLogout} className="btn btn-secondary btn-small">
                Logout
              </button>
            </div>
          </div>

          <div className="task-cards-grid">
            <TaskCard
              title="Due Today"
              tasks={todayTasks}
              onAddTask={() => {
                setEditingTask(null)
                setShowTaskModal(true)
              }}
            />
            <TaskCard
              title="Due Tomorrow"
              tasks={tomorrowTasks}
              onAddTask={() => {
                setEditingTask(null)
                setShowTaskModal(true)
              }}
            />
          </div>

          <TaskList
            tasks={tasks}
            onEdit={(task) => {
              setEditingTask(task)
              setShowTaskModal(true)
            }}
            onDelete={handleDeleteTask}
          />

          <CalendarView tasks={tasks} />
        </main>
      </div>

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          userId={userId}
          onClose={() => {
            setShowTaskModal(false)
            setEditingTask(null)
          }}
          onSave={() => {
            loadTasks()
            setShowTaskModal(false)
            setEditingTask(null)
          }}
        />
      )}
    </>
  )
}

function TaskModal({ task, userId, onClose, onSave }: {
  task: Task | null
  userId: string
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    name: task?.name || '',
    dueDate: task?.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    responsible: task?.responsible || '',
    category: task?.category || '',
    notes: task?.notes || '',
    links: task?.links || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})
  const supabase = createClient()

  useEffect(() => {
    const timers = debounceTimers.current
    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer))
    }
  }, [])

  const validateField = async (fieldName: string, value: string) => {
    try {
      const { taskSchema } = await import('@/lib/validations')
      await taskSchema.shape[fieldName as keyof typeof taskSchema.shape].parseAsync(value)
      
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    } catch (err) {
      if (err && typeof err === 'object' && 'issues' in err) {
        const zodErrors = err as { issues: Array<{ message: string }> }
        setErrors((prev) => ({
          ...prev,
          [fieldName]: zodErrors.issues[0]?.message || 'Invalid value'
        }))
      }
    }
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData({ ...formData, [fieldName]: value })
    
    if (touched[fieldName]) {
      if (debounceTimers.current[fieldName]) {
        clearTimeout(debounceTimers.current[fieldName])
      }
      
      debounceTimers.current[fieldName] = setTimeout(() => {
        validateField(fieldName, value)
      }, 300)
    }
  }

  const handleFieldBlur = (fieldName: string) => {
    setTouched({ ...touched, [fieldName]: true })
    validateField(fieldName, formData[fieldName as keyof typeof formData])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const { taskSchema } = await import('@/lib/validations')
      const validatedData = taskSchema.parse(formData)

      const now = new Date().toISOString()
      const taskData = {
        ...validatedData,
        dueDate: new Date(validatedData.dueDate).toISOString(),
        userId,
        lastUpdated: now,
      }

      if (task) {
        const { error } = await supabase
          .from('Task')
          .update(taskData)
          .eq('id', task.id)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('Task')
          .insert({
            ...taskData,
            createdAt: now,
          })
          .select()

        if (error) {
          console.error('Supabase error details:', error)
          throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`)
        }
        
        console.log('Task created successfully:', data)
      }

      onSave()
    } catch (err) {
      console.error('Error saving task:', err)
      
      if (err && typeof err === 'object' && 'issues' in err) {
        const zodErrors = err as { issues: Array<{ path: (string | number)[]; message: string }> }
        const fieldErrors: Record<string, string> = {}
        zodErrors.issues.forEach((issue) => {
          const fieldName = issue.path[0]
          if (fieldName && typeof fieldName === 'string') {
            fieldErrors[fieldName] = issue.message
          }
        })
        setErrors(fieldErrors)
        return
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to save task. Please check if RLS policies are enabled.'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">
          {task ? 'Edit Task' : 'New Task'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="task-name">Task Name *</label>
            <input
              id="task-name"
              type="text"
              className={`form-input ${errors.name ? 'form-input-error' : ''}`}
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={() => handleFieldBlur('name')}
              aria-label="Task name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              aria-required="true"
            />
            {errors.name && (
              <span id="name-error" className="form-error-text" role="alert">
                {errors.name}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-dueDate">Due Date *</label>
            <input
              id="task-dueDate"
              type="date"
              className={`form-input ${errors.dueDate ? 'form-input-error' : ''}`}
              value={formData.dueDate}
              onChange={(e) => handleFieldChange('dueDate', e.target.value)}
              onBlur={() => handleFieldBlur('dueDate')}
              aria-label="Due date"
              aria-invalid={!!errors.dueDate}
              aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
              aria-required="true"
            />
            {errors.dueDate && (
              <span id="dueDate-error" className="form-error-text" role="alert">
                {errors.dueDate}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-responsible">Responsible Person</label>
            <input
              id="task-responsible"
              type="text"
              className={`form-input ${errors.responsible ? 'form-input-error' : ''}`}
              value={formData.responsible}
              onChange={(e) => handleFieldChange('responsible', e.target.value)}
              onBlur={() => handleFieldBlur('responsible')}
              placeholder="Person's name"
              aria-label="Responsible person"
              aria-invalid={!!errors.responsible}
              aria-describedby={errors.responsible ? 'responsible-error' : undefined}
            />
            {errors.responsible && (
              <span id="responsible-error" className="form-error-text" role="alert">
                {errors.responsible}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-category">Category</label>
            <select
              id="task-category"
              className={`form-input ${errors.category ? 'form-input-error' : ''}`}
              value={formData.category}
              onChange={(e) => handleFieldChange('category', e.target.value)}
              onBlur={() => handleFieldBlur('category')}
              aria-label="Task category"
              aria-invalid={!!errors.category}
              aria-describedby={errors.category ? 'category-error' : undefined}
            >
              <option value="">Select category</option>
              <option value="company">Company</option>
              <option value="clients">Clients</option>
              <option value="admin">Admin</option>
            </select>
            {errors.category && (
              <span id="category-error" className="form-error-text" role="alert">
                {errors.category}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-notes">Notes</label>
            <textarea
              id="task-notes"
              className={`form-input ${errors.notes ? 'form-input-error' : ''}`}
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              onBlur={() => handleFieldBlur('notes')}
              rows={3}
              placeholder="Additional notes..."
              aria-label="Additional notes"
              aria-invalid={!!errors.notes}
              aria-describedby={errors.notes ? 'notes-error' : undefined}
            />
            {errors.notes && (
              <span id="notes-error" className="form-error-text" role="alert">
                {errors.notes}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-links">Links</label>
            <input
              id="task-links"
              type="text"
              className={`form-input ${errors.links ? 'form-input-error' : ''}`}
              value={formData.links}
              onChange={(e) => handleFieldChange('links', e.target.value)}
              onBlur={() => handleFieldBlur('links')}
              placeholder="https://example.com"
              aria-label="Related links"
              aria-invalid={!!errors.links}
              aria-describedby={errors.links ? 'links-error' : undefined}
            />
            {errors.links && (
              <span id="links-error" className="form-error-text" role="alert">
                {errors.links}
              </span>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="submit"
              className="btn btn-primary modal-btn-full"
              disabled={loading}
              aria-label={loading ? 'Saving task' : task ? 'Save changes to task' : 'Create new task'}
            >
              {loading ? 'Saving...' : 'Save Task'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary modal-btn-full"
              aria-label="Cancel and close modal"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

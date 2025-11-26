'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { isToday, isTomorrow } from 'date-fns'
import Image from 'next/image'
import Clock from '@/components/Clock'
import NotesPanel from '@/components/NotesPanel'
import InboxPanel from '@/components/InboxPanel'
import TeamsPanel from '@/components/TeamsPanel'
import TaskCard from '@/components/TaskCard'
import TaskList from '@/components/TaskList'
import CalendarView from '@/components/CalendarView'
import ConfirmModal from '@/components/ConfirmModal'
import ProfileModal from '@/components/ProfileModal'
import { ThemeToggle } from '@/components/ThemeToggle'
import './dashboard.css'

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

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [userAvatar, setUserAvatar] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showInbox, setShowInbox] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('Task')
        .select('*')
        .or(`userId.eq.${userId},assignedToId.eq.${userId}`)
        .order('dueDate', { ascending: true })

      if (error) {
        setTasks([])
        return
      }
      setTasks(data || [])
    } catch {
      setTasks([])
    }
  }

  const loadUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('Notification')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId)
        .eq('isRead', false)

      if (error) throw error
      setUnreadCount(count || 0)
    } catch {
      // Silent error handling
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
      setIsAdmin(session.user.user_metadata?.isAdmin === true)

      // Fetch profile data
      const { data: profile } = await supabase
        .from('Profile')
        .select('name, avatar')
        .eq('userId', session.user.id)
        .single()

      if (profile) {
        setUserName(profile.name || '')
        setUserAvatar(profile.avatar || '')
      }

      setLoading(false)
    }

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (userId) {
      loadTasks()
      loadUnreadCount()
      checkPendingInvites()

      const channel = supabase
        .channel('realtime-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Notification',
            filter: `userId=eq.${userId}`
          },
          (payload) => {
            console.log('🔔 NOTIFICATION EVENT RECEIVED:', payload)
            loadUnreadCount()
          }
        )
        .subscribe((status) => {
          console.log('Realtime Notifications Status:', status)
        })

      const taskChannel = supabase
        .channel('realtime-tasks')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Task'
          },
          async (payload) => {
            console.log('📋 TASK EVENT RECEIVED:', payload)
            loadTasks()

            if (payload.eventType === 'INSERT' && payload.new) {
              const newTask = payload.new as Task
              if (newTask.assignedToId === userId && newTask.createdById !== userId) {
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime Tasks Status:', status)
        })

      const inviteChannel = supabase
        .channel('realtime-invites')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'TeamMember',
            filter: `userEmail=eq.${userEmail}`
          },
          (payload) => {
            console.log('👥 INVITE EVENT RECEIVED:', payload)
            checkPendingInvites()
          }
        )
        .subscribe((status) => {
          console.log('Realtime Invites Status:', status)
        })

      return () => {
        supabase.removeChannel(channel)
        supabase.removeChannel(taskChannel)
        supabase.removeChannel(inviteChannel)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userEmail])

  const checkPendingInvites = async () => {
    if (!userId || !userEmail) {
      return
    }

    try {
      const { data: pendingInvites, error } = await supabase
        .from('TeamMember')
        .select('id, teamId, role')
        .eq('userEmail', userEmail)
        .eq('status', 'pending')

      if (error) {
        return
      }

      if (pendingInvites && pendingInvites.length > 0) {
        for (const invite of pendingInvites) {
          const { data: existingNotif } = await supabase
            .from('Notification')
            .select('id')
            .eq('userId', userId)
            .eq('type', 'team_invite')
            .eq('link', `/dashboard?acceptInvite=${invite.id}`)
            .maybeSingle()

          if (!existingNotif) {
            const { data: team } = await supabase
              .from('Team')
              .select('name')
              .eq('id', invite.teamId)
              .maybeSingle()

            const teamName = team?.name || 'a team'

            await supabase
              .from('Notification')
              .insert({
                userId: userId,
                type: 'team_invite',
                title: 'Team Invitation',
                message: `You've been invited to join ${teamName} as ${invite.role}. Click to accept or decline.`,
                link: `/dashboard?acceptInvite=${invite.id}`,
              })
              .select()
          }
        }

        await loadUnreadCount()
      }
    } catch {
      // Silent error handling
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.profile-menu')) {
        setShowProfileDropdown(false)
      }
    }

    if (showProfileDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showProfileDropdown])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('access_token')
    router.push('/auth/login')
  }

  const getUserInitials = (email: string) => {
    if (!email) return '?'
    const name = email.split('@')[0]
    return name.charAt(0).toUpperCase()
  }

  const handleDeleteTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const canDelete = task.createdById === userId || (task.userId === userId && !task.createdById)

    if (!canDelete) {
      alert('You can only delete tasks you created. Tasks assigned by team owner/admin cannot be deleted.')
      return
    }

    setTaskToDelete(id)
    setShowConfirmModal(true)
  }

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return

    setShowConfirmModal(false)

    try {
      const { error } = await supabase
        .from('Task')
        .delete()
        .eq('id', taskToDelete)

      if (error) throw error
      await loadTasks()
    } catch {
      alert('Failed to delete task')
    } finally {
      setTaskToDelete(null)
    }
  }

  const handleToggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('Task')
        .update({
          completed: !currentStatus,
          lastUpdated: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error
      await loadTasks()
    } catch {
      alert('Failed to update task status')
    }
  }

  const handleShowTaskDetails = (task: Task) => {
    setSelectedTask(task)
    setShowTaskDetails(true)
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
      <nav className="top-navbar">
        <div className="navbar-branding">
          <Image src="/favicon.ico" alt="Vela" width={36} height={36} className="navbar-logo" />
          <h1 className="navbar-title">Vela</h1>
        </div>
        <div className="navbar-menu">
          <button
            className="inbox-button"
            onClick={() => setShowInbox(true)}
            aria-label="Inbox"
          >
            <svg className="inbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {unreadCount > 0 && (
              <span className="inbox-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>
          <ThemeToggle />
          <div className="profile-menu">
            <button
              className="avatar-button"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              aria-label="User menu"
            >
              <div className="avatar">
                {userAvatar ? (
                  <Image src={userAvatar} alt={userName || userEmail} width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  getUserInitials(userName || userEmail)
                )}
              </div>
            </button>

            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    {userAvatar ? (
                      <Image src={userAvatar} alt={userName || userEmail} width={48} height={48} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      getUserInitials(userName || userEmail)
                    )}
                  </div>
                  <div className="dropdown-user-info">
                    {userName && <span className="dropdown-name">{userName}</span>}
                    <span className="dropdown-email">{userEmail}</span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={() => {
                  setShowProfileDropdown(false)
                  setShowProfileModal(true)
                }}>
                  <span>Profile</span>
                </button>
                {isAdmin && (
                  <button className="dropdown-item" onClick={() => router.push('/admin')}>
                    <span>Admin Dashboard</span>
                  </button>
                )}
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="dashboard">
        <aside className="sidebar">
          <Clock />
          <NotesPanel userId={userId} />
        </aside>

        <main className="main-content">
          <div className="dashboard-header">
            <TeamsPanel userId={userId} userEmail={userEmail} />
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
            onToggleComplete={handleToggleTaskCompletion}
            onShowDetails={handleShowTaskDetails}
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

      {showInbox && (
        <InboxPanel
          userId={userId}
          onClose={() => {
            setShowInbox(false)
            loadUnreadCount()
          }}
        />
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        isDanger={true}
        onConfirm={confirmDeleteTask}
        onCancel={() => {
          setShowConfirmModal(false)
          setTaskToDelete(null)
        }}
      />

      {showProfileModal && (
        <ProfileModal
          userEmail={userEmail}
          onClose={async () => {
            setShowProfileModal(false)
            // Reload profile data with a small delay to ensure DB is updated
            await new Promise(resolve => setTimeout(resolve, 500))
            const { data: profile } = await supabase
              .from('Profile')
              .select('name, avatar')
              .eq('userId', userId)
              .single()
            if (profile) {
              setUserName(profile.name || '')
              // Add timestamp to force image refresh (bypass Next.js cache)
              setUserAvatar(profile.avatar ? `${profile.avatar}?t=${Date.now()}` : '')
            }
          }}
        />
      )}

      {showTaskDetails && selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          userId={userId}
          onClose={() => {
            setShowTaskDetails(false)
            setSelectedTask(null)
          }}
          onEdit={() => {
            setEditingTask(selectedTask)
            setShowTaskModal(true)
            setShowTaskDetails(false)
          }}
          onDelete={() => {
            setShowTaskDetails(false)
            handleDeleteTask(selectedTask.id)
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
    category: task?.category || '',
    notes: task?.notes || '',
    links: task?.links || '',
    teamId: task?.teamId || '',
    assignedToId: task?.assignedToId || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [teams, setTeams] = useState<Array<{ id: string; name: string; role: string }>>([])
  const [teamMembers, setTeamMembers] = useState<Array<{ userId: string; userEmail: string; name?: string; avatar?: string }>>([])
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})
  const supabase = createClient()

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const { data: ownedTeams, error: ownedError } = await supabase
          .from('Team')
          .select('id, name')
          .eq('ownerId', userId)

        if (ownedError) throw ownedError

        const { data: memberTeams, error: memberError } = await supabase
          .from('TeamMember')
          .select('teamId, role')
          .eq('userId', userId)
          .in('role', ['owner', 'admin'])
          .eq('status', 'accepted')

        if (memberError) throw memberError

        const teamIds = memberTeams?.map(m => m.teamId) || []

        let memberTeamDetails: Array<{ id: string; name: string }> = []
        if (teamIds.length > 0) {
          const { data, error: detailsError } = await supabase
            .from('Team')
            .select('id, name')
            .in('id', teamIds)

          if (detailsError) throw detailsError

          memberTeamDetails = data || []
        }

        const allTeams = [
          ...(ownedTeams || []).map(t => ({ ...t, role: 'owner' })),
          ...(memberTeamDetails || []).map(t => ({
            ...t,
            role: memberTeams?.find(m => m.teamId === t.id)?.role || 'admin'
          }))
        ]

        const uniqueTeams = allTeams.filter((team, index, self) =>
          index === self.findIndex(t => t.id === team.id)
        )

        setTeams(uniqueTeams)
      } catch {
        setTeams([])
      }
    }

    loadTeams()
  }, [userId, supabase])

  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!formData.teamId) {
        setTeamMembers([])
        return
      }

      try {
        const { data: teamMemberData, error } = await supabase
          .from('TeamMember')
          .select('userId, userEmail')
          .eq('teamId', formData.teamId)
          .eq('status', 'accepted')
          .not('userId', 'is', null)

        if (error) throw error

        const members = (teamMemberData || []).map((member: { userId: string; userEmail: string }) => ({
          userId: member.userId,
          userEmail: member.userEmail,
          name: undefined,
          avatar: undefined
        }))

        setTeamMembers(members)
      } catch {
        setTeamMembers([])
      }
    }

    loadTeamMembers()
  }, [formData.teamId, supabase])

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

    if (fieldName === 'teamId' && !value) {
      setFormData({ ...formData, teamId: '', assignedToId: '' })
    }

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
      const validatedData = taskSchema.parse({
        name: formData.name,
        dueDate: formData.dueDate,
        responsible: '',
        category: formData.category,
        notes: formData.notes,
        links: formData.links,
      })

      const now = new Date().toISOString()
      const taskData = {
        ...validatedData,
        dueDate: new Date(validatedData.dueDate).toISOString(),
        userId: formData.assignedToId || userId,
        lastUpdated: now,
        teamId: formData.teamId || null,
        assignedToId: formData.assignedToId || null,
        createdById: task?.createdById || userId,
      }

      if (task) {
        const { error } = await supabase
          .from('Task')
          .update(taskData)
          .eq('id', task.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('Task')
          .insert({
            ...taskData,
            createdAt: now,
          })
          .select()

        if (error) {
          throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`)
        }
      }

      onSave()
    } catch (err) {

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

          {teams.length > 0 && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="task-team">Assign to Team (Optional)</label>
                <select
                  id="task-team"
                  className="form-input"
                  value={formData.teamId}
                  onChange={(e) => handleFieldChange('teamId', e.target.value)}
                  aria-label="Select team"
                >
                  <option value="">Personal Task</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.role})
                    </option>
                  ))}
                </select>
              </div>

              {formData.teamId && teamMembers.length > 0 && (
                <div className="form-group">
                  <label className="form-label" htmlFor="task-assignee">Assign to Member</label>
                  <select
                    id="task-assignee"
                    className="form-input"
                    value={formData.assignedToId}
                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                    aria-label="Assign to team member"
                  >
                    <option value="">Select member...</option>
                    {teamMembers.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.name ? `${member.name} (${member.userEmail})` : member.userEmail}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

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

function TaskDetailsModal({ task, userId, onClose, onEdit, onDelete }: {
  task: Task
  userId: string
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const canDeleteTask = (task: Task) => {
    if (task.createdById === userId) return true
    if (task.userId === userId && !task.createdById) return true
    return false
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="task-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Task Details</h2>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        <div className="task-details-content">
          <div className="task-detail-section">
            <label className="task-detail-label">Task Name</label>
            <p className="task-detail-value">{task.name}</p>
          </div>

          <div className="task-detail-row">
            <div className="task-detail-section">
              <label className="task-detail-label">Due Date</label>
              <p className="task-detail-value">
                {new Date(task.dueDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>

            <div className="task-detail-section">
              <label className="task-detail-label">Status</label>
              <p className="task-detail-value">
                <span className={`status-badge ${task.completed ? 'status-completed' : 'status-pending'}`}>
                  {task.completed ? '✓ Completed' : '○ Pending'}
                </span>
              </p>
            </div>
          </div>

          {task.category && (
            <div className="task-detail-section">
              <label className="task-detail-label">Category</label>
              <p className="task-detail-value">
                <span className="category-badge">{task.category}</span>
              </p>
            </div>
          )}

          {task.notes && (
            <div className="task-detail-section">
              <label className="task-detail-label">Notes</label>
              <p className="task-detail-value task-detail-notes">{task.notes}</p>
            </div>
          )}

          {task.links && (
            <div className="task-detail-section">
              <label className="task-detail-label">Links</label>
              <p className="task-detail-value task-detail-links">
                {task.links.split(',').map((link, index) => (
                  <span key={index}>
                    <a href={link.trim()} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                      {link.trim()}
                    </a>
                    {index < task.links!.split(',').length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
          )}

          {task.teamId && (
            <div className="task-detail-section">
              <label className="task-detail-label">Team Assignment</label>
              <p className="task-detail-value">
                <span className="category-badge">Team Task</span>
              </p>
            </div>
          )}

          <div className="task-detail-row">
            <div className="task-detail-section">
              <label className="task-detail-label">Created</label>
              <p className="task-detail-value task-detail-date">
                {new Date(task.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div className="task-detail-section">
              <label className="task-detail-label">Last Updated</label>
              <p className="task-detail-value task-detail-date">
                {new Date(task.lastUpdated).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="modal-actions task-details-actions">
          <button onClick={onEdit} className="btn btn-primary">
            Edit Task
          </button>
          {canDeleteTask(task) && (
            <button onClick={onDelete} className="btn btn-danger">
              Delete Task
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

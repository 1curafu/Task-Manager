'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import './admin.css'

interface User {
  id: string
  email: string
  user_metadata: {
    isAdmin?: boolean
    name?: string
  }
  created_at: string
}

interface Team {
  id: string
  name: string
  description: string
  ownerId: string
  createdAt: string
  members: Array<{
    id: string
    role: string
    status: string
  }>
}

interface Task {
  id: string
  name: string
  dueDate: string
  category: string | null
  notes: string | null
  links: string | null
  userId: string
  teamId: string | null
  assignedToId: string | null
  completed: boolean
  createdAt: string
  lastUpdated: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'tasks'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    checkAdminStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAdmin])

  const checkAdminStatus = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/auth/login')
        return
      }

      if (!user.user_metadata?.isAdmin) {
        alert('Access denied. Admin privileges required.')
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
    } catch (err) {
      console.error('Error checking admin status:', err)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)

      if (activeTab === 'users') {
        const response = await fetch('/api/admin/users')
        const data = await response.json()
        if (response.ok) {
          setUsers(data.users || [])
        }
      } else if (activeTab === 'teams') {
        const response = await fetch('/api/admin/teams')
        const data = await response.json()
        if (response.ok) {
          setTeams(data.teams || [])
        }
      } else if (activeTab === 'tasks') {
        const response = await fetch('/api/admin/tasks')
        const data = await response.json()
        if (response.ok) {
          setTasks(data.tasks || [])
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        alert('User deleted successfully')
        loadData()
      } else {
        const data = await response.json()
        alert('Error: ' + data.error)
      }
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Failed to delete user')
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/teams', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      })

      if (response.ok) {
        alert('Team deleted successfully')
        loadData()
      } else {
        const data = await response.json()
        alert('Error: ' + data.error)
      }
    } catch (err) {
      console.error('Error deleting team:', err)
      alert('Failed to delete team')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      })

      if (response.ok) {
        alert('Task deleted successfully')
        loadData()
      } else {
        const data = await response.json()
        alert('Error: ' + data.error)
      }
    } catch (err) {
      console.error('Error deleting task:', err)
      alert('Failed to delete task')
    }
  }

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          role: currentIsAdmin ? 'user' : 'admin' 
        })
      })

      if (response.ok) {
        alert(`User ${currentIsAdmin ? 'removed from' : 'promoted to'} admin`)
        loadData()
      } else {
        const data = await response.json()
        alert('Error: ' + data.error)
      }
    } catch (err) {
      console.error('Error toggling admin:', err)
      alert('Failed to update user role')
    }
  }

  if (loading && !isAdmin) {
    return (
      <div className="admin-container">
        <div className="admin-loading">Checking permissions...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={() => router.push('/dashboard')} className="admin-back-btn">
          ← Back to Dashboard
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          Teams ({teams.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks ({tasks.length})
        </button>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="admin-loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'users' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.email}</td>
                        <td>{user.user_metadata?.name || '-'}</td>
                        <td>
                          <span className={`admin-badge ${user.user_metadata?.isAdmin ? 'admin' : 'user'}`}>
                            {user.user_metadata?.isAdmin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="admin-actions">
                            <button
                              onClick={() => handleToggleAdmin(user.id, user.user_metadata?.isAdmin || false)}
                              className="admin-btn admin-btn-edit"
                            >
                              {user.user_metadata?.isAdmin ? 'Remove Admin' : 'Make Admin'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="admin-btn admin-btn-delete"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'teams' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Members</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map(team => (
                      <tr key={team.id}>
                        <td>{team.name}</td>
                        <td>{team.description || '-'}</td>
                        <td>{team.members?.length || 0}</td>
                        <td>{new Date(team.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteTeam(team.id)}
                            className="admin-btn admin-btn-delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Due Date</th>
                      <th>Completed</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id}>
                        <td>{task.name}</td>
                        <td>
                          {task.category ? (
                            <span className={`admin-badge status-${task.category.toLowerCase()}`}>
                              {task.category}
                            </span>
                          ) : (
                            <span>None</span>
                          )}
                        </td>
                        <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                        <td>{task.completed ? '✓' : '✗'}</td>
                        <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="admin-btn admin-btn-delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

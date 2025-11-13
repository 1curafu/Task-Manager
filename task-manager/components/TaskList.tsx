'use client'

import { format } from 'date-fns'

interface Task {
  id: string
  name: string
  dueDate: string
  category?: string | null
  lastUpdated: string
  notes?: string | null
  links?: string | null
  userId: string
  createdAt: string
  completed?: boolean
  teamId?: string | null
  assignedToId?: string | null
  createdById?: string | null
}

interface TaskListProps {
  tasks: Task[]
  onToggleComplete: (id: string, currentStatus: boolean) => void
  onShowDetails: (task: Task) => void
}

export default function TaskList({ tasks, onToggleComplete, onShowDetails }: TaskListProps) {
  const getCategoryClass = (category: string) => {
    const lower = category.toLowerCase()
    if (lower === 'company') return 'category-badge-company'
    if (lower === 'clients') return 'category-badge-clients'
    if (lower === 'admin') return 'category-badge-admin'
    return ''
  }

  return (
    <div className="card">
      <div className="task-list-header">
        <h2 className="task-list-title">Task Entry</h2>
      </div>
      
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Due Date</th>
              <th>Name</th>
              <th>Category</th>
              <th>Last Updated</th>
              <th>Actions</th>
              <th className="table-header-checkbox">
                <svg className="checkbox-icon-header" width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-cell-center empty-state">
                  No tasks yet. Create your first task!
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className={task.completed ? 'task-row-completed' : ''}>
                  <td>{format(new Date(task.dueDate), 'MM/dd/yyyy')}</td>
                  <td className="table-cell-name">{task.name}</td>
                  <td>
                    {task.category ? (
                      <span className={`category-badge ${getCategoryClass(task.category)}`}>
                        {task.category}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="table-cell-timestamp">
                    {format(new Date(task.lastUpdated), 'MM/dd/yyyy HH:mm')}
                  </td>
                  <td>
                    <div className="task-actions">
                      <button
                        onClick={() => onShowDetails(task)}
                        className="action-btn action-btn-details"
                        aria-label="View details"
                        title="View details"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="table-cell-checkbox">
                    <button
                      onClick={() => onToggleComplete(task.id, task.completed || false)}
                      className={`task-checkbox ${task.completed ? 'task-checkbox-completed' : ''}`}
                      aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {task.completed && (
                        <svg className="checkbox-check" width="16" height="16" viewBox="0 0 16 16">
                          <path
                            d="M13 4L6 11L3 8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

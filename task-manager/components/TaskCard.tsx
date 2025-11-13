'use client'

interface Task {
  id: string
  name: string
  dueDate: string
  category?: string | null
}

interface TaskCardProps {
  title: string
  tasks: Task[]
  onAddTask: () => void
}

export default function TaskCard({ title, tasks, onAddTask }: TaskCardProps) {
  const getCategoryClass = (category: string) => {
    const lower = category.toLowerCase()
    if (lower === 'company') return 'category-badge-company'
    if (lower === 'clients') return 'category-badge-clients'
    if (lower === 'admin') return 'category-badge-admin'
    return ''
  }

  return (
    <div className="card task-card">
      <div className="task-card-header">
        <h3 className="task-card-title">{title}</h3>
        <button onClick={onAddTask} className="btn btn-primary btn-small">
          + New Task
        </button>
      </div>
      
      <div className="task-items">
        {tasks.length === 0 ? (
          <p className="empty-state">
            No tasks scheduled
          </p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="task-item">
              <div className="task-item-content">
                <div className="task-item-name">
                  <span className="icon-indicator">📄</span> {task.name}
                </div>
                {task.category && (
                  <span className={`category-badge ${getCategoryClass(task.category)}`}>
                    {task.category}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

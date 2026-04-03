export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'
export type TaskPriority = 'high' | 'medium' | 'low'

/** Coerce any unknown/null status to a valid TaskStatus. */
export function normalizeStatus(s: string | null | undefined): TaskStatus {
  return (['todo', 'in_progress', 'in_review', 'done'] as const).includes(s as TaskStatus)
    ? (s as TaskStatus)
    : 'todo'
}

/** Scalar task shape — used in list views, Kanban, Gantt. No joins. */
export interface Task {
  id: string
  name: string
  dueDate: string
  category?: string | null
  notes?: string | null
  description?: string | null
  links?: string | null
  userId: string
  lastUpdated: string
  createdAt: string
  teamId?: string | null
  assignedToId?: string | null
  createdById?: string | null
  completed?: boolean
  priority?: TaskPriority | null
  status?: TaskStatus | null
  recurrence?: 'daily' | 'weekly' | 'monthly' | null
  nextRecurrenceDate?: string | null
  orderIndex?: number | null
  projectId?: string | null
}

/** Extended shape for Task Detail page — includes relations. */
export interface TaskWithRelations extends Task {
  attachments?: Attachment[]
  subtasks?: Subtask[]
  labels?: { labelId: string; label: Label }[]
  comments?: TaskComment[]
}

export interface TaskComment {
  id: string
  taskId: string
  userId: string
  content: string
  createdAt: string
  profile?: { id: string; name: string; avatarUrl?: string | null } | null
}

export interface Attachment {
  id: string
  taskId: string
  fileName: string
  fileSize: number
  mimeType: string
  storagePath: string
  createdAt: string
  uploadedById: string
}

export interface Subtask {
  id: string
  taskId: string
  content: string
  completed: boolean
  orderIndex?: number | null
  notes?: string | null
}

export interface Label {
  id: string
  name: string
  color?: string | null
}

import { z } from 'zod'

export const TaskSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']),
  category: z.string().max(100).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  links: z.string().max(2000).optional().nullable(),
  teamId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  recurrence: z
    .enum(['daily', 'weekly', 'monthly'])
    .optional()
    .nullable(),
})

export type TaskFormValues = z.infer<typeof TaskSchema>

export const InviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  teamId: z.string().uuid(),
})

export const NoteSchema = z.object({
  content: z.string().min(1).max(100000),
})

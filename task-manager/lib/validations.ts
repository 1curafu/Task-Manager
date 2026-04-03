import { z } from 'zod'

export const taskSchema = z.object({
  name: z.string()
    .min(1, 'Task name is required')
    .max(200, 'Task name must be less than 200 characters')
    .trim(),
  dueDate: z.string()
    .min(1, 'Due date is required')
    .refine((date) => {
      const parsed = new Date(date)
      return !isNaN(parsed.getTime())
    }, 'Invalid date format')
    .refine((date) => {
      const parsed = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return parsed >= today
    }, 'Due date cannot be in the past'),
  responsible: z.string()
    .max(100, 'Responsible name must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  category: z.enum(['company', 'clients', 'admin', ''], {
    message: 'Please select a valid category'
  }).optional(),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  links: z.string()
    .refine((val) => {
      if (!val || val === '') return true
      try {
        new URL(val)
        return true
      } catch {
        return false
      }
    }, 'Please enter a valid URL (e.g., https://example.com)')
    .optional()
    .or(z.literal('')),
})

export type TaskFormData = z.infer<typeof taskSchema>

export const noteSchema = z.object({
  content: z.string()
    .max(5000, 'Notes must be less than 5000 characters')
    .optional()
    .or(z.literal('')),
})

export type NoteFormData = z.infer<typeof noteSchema>

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim()
    .refine((email) => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      return emailRegex.test(email)
    }, 'Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim()
    .refine((email) => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      return emailRegex.test(email)
    }, 'Please enter a valid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
    .refine((password) => {
      return /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
    }, 'Password must contain at least one letter and one number'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>

export const profileUpdateSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim()
    .optional(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
    .optional(),
  currentPassword: z.string().min(1).optional(),
  metadata: z.object({
    name: z.string().max(100).optional(),
    avatarUrl: z.string().url().optional(),
  }).strict().optional(),
}).refine(data => !data.password || !!data.currentPassword, {
  message: 'Current password is required to set a new password',
  path: ['currentPassword'],
})

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>

export const adminCreateTaskSchema = z.object({
  name: z.string().min(1).max(200),
  userId: z.string().uuid(),
  description: z.string().max(2000).optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  dueDate: z.string().optional(),
  teamId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
})

export const adminUpdateTaskSchema = z.object({
  taskId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  dueDate: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
  completed: z.boolean().optional(),
})

export const adminCreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
})

export const adminUpdateUserSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(100).optional(),
  metadata: z.object({ name: z.string().max(100).optional() }).optional(),
})

export const adminCreateTeamSchema = z.object({
  name: z.string().min(1).max(100),
  ownerId: z.string().uuid(),
  description: z.string().max(500).optional(),
})

export const adminUpdateTeamSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  ownerId: z.string().uuid().optional(),
})

export const attachmentSchema = z.object({
  taskId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024), // 10MB
  mimeType: z.string().min(1),
})

export type AttachmentData = z.infer<typeof attachmentSchema>

// ── v3 task forms ──────────────────────────────────────────────────────────

export const taskCreateSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(200).trim(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']).default('todo'),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  assignedToId: z.string().uuid().optional().nullable(),
  teamId: z.string().uuid().optional().nullable(),
  notes: z.string().max(2000).optional(),
  recurrence: z.enum(['daily', 'weekly', 'monthly']).optional().nullable(),
})

export type TaskCreateFormData = z.infer<typeof taskCreateSchema>

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  id: z.string().uuid(),
  completed: z.boolean().optional(),
})

export type TaskUpdateFormData = z.infer<typeof taskUpdateSchema>

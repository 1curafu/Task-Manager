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
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
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

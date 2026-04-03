import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'

export function useDueReminders(userId: string | undefined) {
  const supabase = createClient()
  const checked = useRef(false)

  useEffect(() => {
    if (!userId || checked.current) return
    checked.current = true

    const checkDueTasks = async () => {
      try {
        const now = new Date() // Added: Define 'now'
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        // 1. Fetch incomplete tasks due today or earlier
        const { data: upcomingTasks } = await supabase // Changed variable name from dueTasks to upcomingTasks
          .from('Task')
          .select('id, name, dueDate')
          .eq('isTemplate', false) // Added: Filter out templates
          .or(`userId.eq.${userId},assignedToId.eq.${userId}`) // Reordered: Moved after isTemplate filter
          .eq('completed', false)
          .gte('dueDate', now.toISOString()) // Added: Filter for tasks due today or later
          .lte('dueDate', todayEnd.toISOString())

        if (!upcomingTasks || upcomingTasks.length === 0) return // Changed variable name from dueTasks to upcomingTasks

        // 2. Fetch existing due reminders for these tasks to avoid spamming
        const { data: existingNotifs } = await supabase
          .from('Notification')
          .select('link')
          .eq('userId', userId)
          .eq('type', 'due_reminder')

        const existingTaskIds = new Set(
          existingNotifs?.map(n => n.link?.split('taskId=')[1]).filter(Boolean)
        )

        // 3. Create new notifications
        const notifsToInsert = upcomingTasks
          .filter((task: { id: string, name: string, dueDate: string }) => !existingTaskIds.has(task.id))
          .map((task: { id: string, name: string, dueDate: string }) => {
            const isOverdue = new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
            const title = isOverdue ? 'Task Overdue' : 'Task Due Today'
            const message = `"${task.name}" is ${isOverdue ? 'overdue' : 'due today'}!`
            
            return {
              userId,
              type: 'due_reminder',
              title,
              message,
              link: `/dashboard/tasks?taskId=${task.id}`
            }
          })

        if (notifsToInsert.length > 0) {
          await supabase.from('Notification').insert(notifsToInsert)
        }

      } catch (err) {
        console.error('Error checking due tasks:', err)
      }
    }

    void checkDueTasks()
  }, [userId, supabase])
}

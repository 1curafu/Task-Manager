import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabaseClient'
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns'

export const analyticsKeys = {
  all: ['analytics'] as const,
  overview: (userId: string) => [...analyticsKeys.all, 'overview', userId] as const,
}

export interface AnalyticsData {
  total: number
  completed: number
  overdue: number
  completionRate: number
  weeklyTrend: { week: string; completed: number }[]
  byPriority: { priority: string; count: number }[]
  byStatus: { status: string; count: number }[]
}

export function useAnalyticsQuery(userId: string | null, teamIds: string[] = []) {
  const supabase = createClient()
  return useQuery({
    queryKey: analyticsKeys.overview(userId ?? ''),
    enabled: !!userId,
    queryFn: async (): Promise<AnalyticsData> => {
      const orParts = [`userId.eq.${userId}`, `assignedToId.eq.${userId}`]
      if (teamIds.length > 0)
        orParts.push(`teamId.in.(${teamIds.join(',')})`)

      const { data } = await supabase
        .from('Task')
        .select('id, completed, status, priority, dueDate, createdAt')
        .or(orParts.join(','))
        .eq('isTemplate', false)

      const tasks = data ?? []
      const now = new Date()
      const total = tasks.length
      const completed = tasks.filter(
        (t) => t.completed || t.status === 'done'
      ).length
      const overdue = tasks.filter(
        (t) =>
          !t.completed &&
          t.status !== 'done' &&
          new Date(t.dueDate) < now
      ).length
      const completionRate =
        total > 0 ? Math.round((completed / total) * 100) : 0

      const weeklyTrend = Array.from({ length: 6 }, (_, i) => {
        const weekStart = startOfWeek(subWeeks(now, 5 - i))
        const weekEnd = endOfWeek(weekStart)
        const count = tasks.filter((t) => {
          const d = new Date(t.createdAt)
          return t.completed && d >= weekStart && d <= weekEnd
        }).length
        return { week: format(weekStart, 'MMM d'), completed: count }
      })

      const byPriority = ['high', 'medium', 'low'].map((p) => ({
        priority: p,
        count: tasks.filter((t) => t.priority === p).length,
      }))

      const byStatus = ['todo', 'in_progress', 'in_review', 'done'].map(
        (s) => ({
          status: s,
          count: tasks.filter((t) => t.status === s).length,
        })
      )

      return {
        total,
        completed,
        overdue,
        completionRate,
        weeklyTrend,
        byPriority,
        byStatus,
      }
    },
  })
}

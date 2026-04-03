import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabaseClient'
import type { Task, TaskWithRelations, Label } from '@/types/task'

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...taskKeys.lists(), filters] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
}

export function useTasksQuery(userId: string | null, teamIds: string[] = []) {
  const supabase = createClient()
  return useQuery({
    queryKey: taskKeys.list({ userId, teamIds }),
    enabled: !!userId,
    queryFn: async (): Promise<(Task & { labels: Label[] })[]> => {
      const orParts = [`userId.eq.${userId}`, `assignedToId.eq.${userId}`]
      if (teamIds.length > 0) orParts.push(`teamId.in.(${teamIds.join(',')})`)

      const { data, error } = await supabase
        .from('Task')
        .select('*, labels:TaskLabel(labelId, label:Label(*))')
        .eq('isTemplate', false)
        .or(orParts.join(','))
        .order('dueDate', { ascending: true })

      if (error) throw error

      return (data ?? []).map((t) => ({
        ...t,
        labels:
          (t.labels
            ?.map((tl: { label?: Label }) => tl.label)
            .filter(Boolean) as Label[]) ?? [],
      }))
    },
  })
}

export function useTaskQuery(taskId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: taskKeys.detail(taskId ?? ''),
    enabled: !!taskId,
    queryFn: async (): Promise<TaskWithRelations> => {
      const { data, error } = await supabase
        .from('Task')
        .select(`
          *,
          labels:TaskLabel(labelId, label:Label(*)),
          comments:TaskComment(*, profile:Profile(id, name, avatarUrl)),
          subtasks:Subtask(*),
          attachments:Attachment(*)
        `)
        .eq('id', taskId)
        .single()

      if (error) throw error
      return data as TaskWithRelations
    },
  })
}

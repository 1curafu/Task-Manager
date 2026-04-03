import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabaseClient'
import { toast } from 'sonner'

export const inboxKeys = {
  all: ['notifications'] as const,
  lists: () => [...inboxKeys.all, 'list'] as const,
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  link?: string | null
  createdAt: string
}

export function useNotificationsQuery(userId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: inboxKeys.lists(),
    enabled: !!userId,
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from('Notification')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(50)
      if (error) throw error
      return data ?? []
    },
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('Notification')
        .update({ isRead: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: inboxKeys.lists() }),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('Notification')
        .update({ isRead: true })
        .eq('userId', userId)
        .eq('isRead', false)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: inboxKeys.lists() })
      toast.success('All notifications marked as read')
    },
  })
}

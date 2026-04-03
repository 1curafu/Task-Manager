import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabaseClient'

export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  detail: (id: string) => [...noteKeys.all, 'detail', id] as const,
}

export interface Note {
  id: string
  content: string
  userId: string
  createdAt: string
  updatedAt: string
}

export function useNotesQuery(userId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: noteKeys.lists(),
    enabled: !!userId,
    queryFn: async (): Promise<Note[]> => {
      const { data, error } = await supabase
        .from('Note')
        .select('*')
        .eq('userId', userId)
        .order('updatedAt', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

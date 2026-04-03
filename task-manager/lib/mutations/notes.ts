import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { noteKeys, type Note } from '@/lib/queries/notes'

export function useUpsertNote() {
  const qc = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async ({
      id,
      content,
      userId,
    }: {
      id?: string
      content: string
      userId: string
    }) => {
      if (id) {
        const { data, error } = await supabase
          .from('Note')
          .update({ content })
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        return data as Note
      }
      const { data, error } = await supabase
        .from('Note')
        .insert({ content, userId })
        .select()
        .single()
      if (error) throw error
      return data as Note
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: noteKeys.lists() }),
    onError: () => toast.error('Failed to save note'),
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('Note').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: noteKeys.lists() })
      toast.success('Note deleted')
    },
    onError: () => toast.error('Failed to delete note'),
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { taskKeys } from '@/lib/queries/tasks'
import type { Task } from '@/types/task'

export function useCreateTask() {
  const qc = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async (
      payload: Omit<Partial<Task>, 'id' | 'createdAt' | 'lastUpdated'> & {
        name: string
        dueDate: string
        userId: string
      }
    ) => {
      const { data, error } = await supabase
        .from('Task')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: taskKeys.lists() })
      toast.success('Task created')
    },
    onError: () => toast.error('Failed to create task'),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from('Task')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: taskKeys.detail(id) })
      const prev = qc.getQueryData(taskKeys.detail(id))
      qc.setQueryData(taskKeys.detail(id), (old: Task) => ({ ...old, ...updates }))
      return { prev }
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.prev) qc.setQueryData(taskKeys.detail(id), ctx.prev)
      toast.error('Failed to update task')
    },
    onSettled: (_d, _e, { id }) => {
      void qc.invalidateQueries({ queryKey: taskKeys.detail(id) })
      void qc.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('Task').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: taskKeys.lists() })
      toast.success('Task deleted')
    },
    onError: () => toast.error('Failed to delete task'),
  })
}

export function useToggleTask() {
  const qc = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const newStatus = completed ? 'done' : 'todo'
      const { error } = await supabase
        .from('Task')
        .update({ completed, status: newStatus })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, completed }) => {
      await qc.cancelQueries({ queryKey: taskKeys.lists() })
      const allKeys = qc.getQueriesData<Task[]>({ queryKey: taskKeys.lists() })
      allKeys.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          qc.setQueryData(
            key,
            data.map((t: Task) =>
              t.id === id
                ? { ...t, completed, status: completed ? 'done' : 'todo' }
                : t
            )
          )
        }
      })
      return { allKeys }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.allKeys.forEach(([key, data]) => qc.setQueryData(key, data))
      toast.error('Failed to update task')
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  })
}

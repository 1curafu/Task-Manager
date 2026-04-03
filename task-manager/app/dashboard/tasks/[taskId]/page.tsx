'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { TaskWithRelations, Task } from '@/types/task'
import { TaskDetail } from '@/components/dashboard-v2/TaskDetail'
import { TaskActionModal } from '@/components/dashboard-v2/TaskActionModal'
import { AnimatePresence } from 'framer-motion'

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [task, setTask] = useState<TaskWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const fetchTask = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }
    setUserId(session.user.id)

    const { data, error } = await supabase
      .from('Task')
      .select(`
        *,
        attachments:Attachment(*),
        subtasks:Subtask(*),
        labels:TaskLabel(label:Label(*))
      `)
      .eq('id', taskId)
      .or(`userId.eq.${session.user.id},assignedToId.eq.${session.user.id}`)
      .single()

    if (error || !data) { router.push('/dashboard/tasks'); return }
    setTask(data as unknown as TaskWithRelations)
    setLoading(false)
  }, [taskId, supabase, router])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchTask() }, [fetchTask])

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>
  if (!task || !userId) return null

  return (
    <>
      <TaskDetail task={task} currentUserId={userId} onUpdate={fetchTask} onEditTask={() => setIsEditing(true)} />
      <AnimatePresence>
        {isEditing && (
          <TaskActionModal
            task={task as unknown as Task}
            userId={userId}
            onClose={() => setIsEditing(false)}
            onSave={() => {
              setIsEditing(false)
              void fetchTask()
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

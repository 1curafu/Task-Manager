'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import styles from '@/app/dashboard/dashboard.module.css'
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks'
import { KanbanBoard } from '@/components/dashboard-v2/KanbanBoard'
import { Task } from '@/types/task'
import { Label } from '@/components/dashboard-v2/LabelSelector'
import { PageSkeleton } from '@/components/dashboard-v2/PageSkeleton'
import { Footer } from '@/components/dashboard-v2/Footer'

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  // Stable supabase reference — avoids effect re-running on every render
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // Initialise user session once
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      setUserId(session.user.id)
    }
    void initSession()
  }, [supabase, router])

  const fetchTasks = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const { data: memberTeams } = await supabase.rpc('get_user_member_teams', { user_id_param: userId })
    const { data: ownedTeams } = await supabase.from('Team').select('id').eq('ownerId', userId)
    const teamIds = [
      ...(ownedTeams?.map((t: { id: string }) => t.id) ?? []),
      ...(memberTeams?.map((t: { id: string }) => t.id) ?? []),
    ]

    const { data, error } = await supabase
      .from('Task')
      .select(`
        *,
        labels:TaskLabel(labelId, label:Label(*))
      `)
      .eq('isTemplate', false)
      .or(
        `userId.eq.${userId},assignedToId.eq.${userId}${
          teamIds.length > 0 ? `,teamId.in.(${teamIds.join(',')})` : ''
        }`
      )

    if (error) {
      console.error('[KanbanPage] fetch error:', error.message)
      setLoading(false)
      return
    }

    const shaped = (data ?? []).map(d => ({
      ...d,
      labels: (d.labels?.map((l: { label?: Label }) => l.label).filter(Boolean) as Label[]) ?? [],
    }))

    setTasks(shaped as Task[])
    setLoading(false)
  }, [supabase, userId])

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  useRealtimeTasks(fetchTasks)

  return (
    <>
      <div className={styles.pageHeaderContainerFlex} style={{ marginBottom: '1rem' }}>
        <div>
          <h2 className={styles.pageTitle}>Kanban Board</h2>
          <p className={styles.pageSubtitle}>Visualize and move your active tasks across stages.</p>
        </div>
      </div>

      <div>
        {loading
          ? <PageSkeleton />
          : <KanbanBoard tasks={tasks} onTaskUpdate={fetchTasks} userId={userId ?? ''} />
        }
      </div>

      <Footer />
    </>
  )
}

import { useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export function useRealtimeInvites(userEmail: string | null | undefined, callback: () => void) {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (!userEmail) return

    const channel = supabase
      .channel('realtime-invites')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'TeamMember',
          filter: `userEmail=eq.${userEmail}`
        },
        () => {
          console.log('Realtime: Invite update detected')
          callback()
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router, userEmail, callback])
}

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabaseClient'

export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  members: (teamId: string) => [...teamKeys.all, 'members', teamId] as const,
  taskCount: (teamId: string) => [...teamKeys.all, 'task-count', teamId] as const,
  pendingInvites: (email: string) => [...teamKeys.all, 'pending-invites', email] as const,
}

export interface Team {
  id: string
  name: string
  description?: string | null
  ownerId: string
  createdAt: string
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  userEmail?: string | null
  role: string
  status?: string | null
  profile?: { name: string; email: string; avatarUrl?: string | null }
}

export function useTeamsQuery(userId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: teamKeys.lists(),
    enabled: !!userId,
    queryFn: async (): Promise<Team[]> => {
      const [owned, member] = await Promise.all([
        supabase.from('Team').select('*').eq('ownerId', userId),
        supabase.rpc('get_user_member_teams', { user_id_param: userId }),
      ])
      const ownedData: Team[] = owned.data ?? []
      const memberData: Team[] = member.data ?? []
      const seen = new Set<string>()
      return [...ownedData, ...memberData].filter((t) => {
        if (seen.has(t.id)) return false
        seen.add(t.id)
        return true
      })
    },
  })
}

export function useTeamTaskCountQuery(teamId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: teamKeys.taskCount(teamId ?? ''),
    enabled: !!teamId,
    queryFn: async (): Promise<number> => {
      const { count } = await supabase
        .from('Task')
        .select('*', { count: 'exact', head: true })
        .eq('teamId', teamId)
      return count ?? 0
    },
  })
}

export interface TeamInvite {
  id: string
  teamId: string
  userEmail: string
  role: string
  status: string
  invitedAt: string
  team?: { name: string; description?: string | null }
}

export function usePendingInvitesQuery(email: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: teamKeys.pendingInvites(email ?? ''),
    enabled: !!email,
    queryFn: async (): Promise<TeamInvite[]> => {
      const { data, error } = await supabase
        .from('TeamMember')
        .select('*, team:Team(name, description)')
        .eq('userEmail', email)
        .eq('status', 'pending')
      if (error) throw error
      return (data ?? []) as TeamInvite[]
    },
  })
}

export function useTeamMembersQuery(teamId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: teamKeys.members(teamId ?? ''),
    enabled: !!teamId,
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase
        .from('TeamMember')
        .select('*, profile:Profile(name, email, avatarUrl)')
        .eq('teamId', teamId)
      if (error) throw error
      return data ?? []
    },
  })
}

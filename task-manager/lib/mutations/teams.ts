import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { teamKeys } from '@/lib/queries/teams'

export function useInviteMember() {
  const qc = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async ({
      teamId,
      email,
      userId,
    }: {
      teamId: string
      email: string
      userId: string
    }) => {
      const { error } = await supabase.from('TeamMember').insert({
        teamId,
        userEmail: email,
        invitedBy: userId,
        role: 'member',
        status: 'pending',
      })
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: teamKeys.all })
      toast.success('Invite sent')
    },
    onError: () => toast.error('Failed to send invite'),
  })
}

export function useLeaveTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (teamId: string) => {
      const res = await fetch('/api/teams/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
      if (!res.ok) throw new Error('Failed to leave team')
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: teamKeys.lists() })
      toast.success('Left team')
    },
    onError: () => toast.error('Failed to leave team'),
  })
}

export function useDeleteTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (teamId: string) => {
      const res = await fetch('/api/teams/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
      if (!res.ok) throw new Error('Failed to delete team')
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: teamKeys.lists() })
      toast.success('Team deleted')
    },
    onError: () => toast.error('Failed to delete team'),
  })
}

export function useAcceptInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await fetch('/api/teams/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      })
      if (!res.ok) throw new Error('Failed to accept invite')
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: teamKeys.all })
      toast.success('Invite accepted')
    },
    onError: () => toast.error('Failed to accept invite'),
  })
}

export function useDeclineInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await fetch('/api/teams/invite/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      })
      if (!res.ok) throw new Error('Failed to decline invite')
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: teamKeys.all })
      toast.success('Invite declined')
    },
    onError: () => toast.error('Failed to decline invite'),
  })
}

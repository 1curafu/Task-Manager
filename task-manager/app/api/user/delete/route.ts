import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = user.id

    const { data: ownedTeams, error: teamsError } = await supabaseAdmin
      .from('Team')
      .select('id')
      .eq('ownerId', userId)

    if (teamsError) {
      console.error('Error fetching owned teams:', teamsError)
      return NextResponse.json(
        { error: 'Failed to check team ownership' },
        { status: 500 }
      )
    }

    if (ownedTeams && ownedTeams.length > 0) {
      for (const team of ownedTeams) {
        const { data: members, error: membersError } = await supabaseAdmin
          .from('TeamMember')
          .select('userId, role')
          .eq('teamId', team.id)
          .eq('status', 'accepted')
          .neq('userId', userId)
          .order('role', { ascending: true })
          .limit(1)

        if (membersError) {
          console.error('Error fetching team members:', membersError)
          continue
        }

        if (members && members.length > 0) {

          const newOwnerId = members[0].userId

          const { error: updateError } = await supabaseAdmin
            .from('Team')
            .update({ ownerId: newOwnerId })
            .eq('id', team.id)

          if (updateError) {
            console.error('Error transferring team ownership:', updateError)
          } else {
            await supabaseAdmin
              .from('TeamMember')
              .update({ role: 'owner' })
              .eq('teamId', team.id)
              .eq('userId', newOwnerId)
          }
        } else {
          await supabaseAdmin
            .from('Team')
            .delete()
            .eq('id', team.id)
        }
      }
    }

    const { error: teamMembersError } = await supabaseAdmin
      .from('TeamMember')
      .delete()
      .eq('userId', userId)

    if (teamMembersError) {
      console.error('Error deleting team memberships:', teamMembersError)
    }

    const { error: tasksError } = await supabaseAdmin
      .from('Task')
      .delete()
      .or(`userId.eq.${userId},createdById.eq.${userId},assignedToId.eq.${userId}`)

    if (tasksError) {
      console.error('Error deleting tasks:', tasksError)
    }

    const { error: notesError } = await supabaseAdmin
      .from('Note')
      .delete()
      .eq('userId', userId)

    if (notesError) {
      console.error('Error deleting notes:', notesError)
    }

    const { error: notificationsError } = await supabaseAdmin
      .from('Notification')
      .delete()
      .eq('userId', userId)

    if (notificationsError) {
      console.error('Error deleting notifications:', notificationsError)
    }

    const { error: profileError } = await supabaseAdmin
      .from('Profile')
      .delete()
      .eq('userId', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
    }

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError)
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'User account deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error during user deletion:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

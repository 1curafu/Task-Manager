import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminUser } from '@/lib/adminAuth'
import { adminCreateTeamSchema, adminUpdateTeamSchema } from '@/lib/validations'

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

export async function GET() {
  try {
    const isAdmin = await isAdminUser()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('Team')
      .select('*')
      .order('createdAt', { ascending: false })

    if (teamsError) {
      console.error('Database error:', teamsError)
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }

    const teamsWithMembers = await Promise.all(
      (teams || []).map(async (team) => {
        const { data: members, error: membersError } = await supabaseAdmin
          .from('TeamMember')
          .select('*')
          .eq('teamId', team.id)

        return {
          ...team,
          members: membersError ? [] : members
        }
      })
    )

    return NextResponse.json({ teams: teamsWithMembers }, { status: 200 })
  } catch (error) {
    console.error('Caught exception in GET /api/admin/teams:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAdminUser()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = adminCreateTeamSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const { name, description, ownerId } = parsed.data

    const { data, error } = await supabaseAdmin
      .from('Team')
      .insert({
        name,
        description,
        ownerId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating team:', error)
      return NextResponse.json({ error: 'Request failed' }, { status: 400 })
    }

    return NextResponse.json({ team: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await isAdminUser()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { teamId } = await request.json()

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('Team')
      .delete()
      .eq('id', teamId)

    if (error) {
      console.error('Error deleting team:', error)
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }

    return NextResponse.json(
      { success: true, message: 'Team deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await isAdminUser()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = adminUpdateTeamSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const { teamId, ...rest } = parsed.data

    const updates: Record<string, string> = {}
    if (rest.name !== undefined) updates.name = rest.name
    if (rest.description !== undefined) updates.description = rest.description
    if (rest.ownerId !== undefined) updates.ownerId = rest.ownerId

    const { data, error } = await supabaseAdmin
      .from('Team')
      .update(updates)
      .eq('id', teamId)
      .select()
      .single()

    if (error) {
      console.error('Error updating team:', error)
      return NextResponse.json({ error: 'Request failed' }, { status: 400 })
    }

    return NextResponse.json({ team: data }, { status: 200 })
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

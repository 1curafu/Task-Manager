import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

async function isUserAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: object) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: object) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  return user?.user_metadata?.isAdmin === true
}

export async function GET() {
  try {

    
    const isAdmin = await isUserAdmin()

    
    if (!isAdmin) {

      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }


    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('Team')
      .select('*')
      .order('createdAt', { ascending: false })

    if (teamsError) {
      console.error('Database error:', teamsError)
      return NextResponse.json({ error: teamsError.message }, { status: 500 })
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
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isUserAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, description, ownerId } = await request.json()

    if (!name || !ownerId) {
      return NextResponse.json(
        { error: 'Team name and owner ID are required' },
        { status: 400 }
      )
    }

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
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ team: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await isUserAdmin()
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
      return NextResponse.json({ error: error.message }, { status: 500 })
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
    const isAdmin = await isUserAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { teamId, name, description, ownerId } = await request.json()

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    const updates: Record<string, string> = {}
    if (name) updates.name = name
    if (description !== undefined) updates.description = description
    if (ownerId) updates.ownerId = ownerId

    const { data, error } = await supabaseAdmin
      .from('Team')
      .update(updates)
      .eq('id', teamId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ team: data }, { status: 200 })
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

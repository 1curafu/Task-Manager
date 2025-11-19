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

    const { data, error } = await supabaseAdmin
      .from('Task')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tasks: data }, { status: 200 })
  } catch (error) {
    console.error('Error listing tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isUserAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { title, description, status, priority, dueDate, userId, teamId, assignedToId } = await request.json()

    if (!title || !userId) {
      return NextResponse.json(
        { error: 'Title and user ID are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('Task')
      .insert({
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate,
        userId,
        teamId,
        assignedToId,
        createdById: userId
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ task: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await isUserAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { taskId } = await request.json()

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('Task')
      .delete()
      .eq('id', taskId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { success: true, message: 'Task deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await isUserAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { taskId, title, description, status, priority, dueDate, assignedToId, completed } = await request.json()

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (title) updates.title = title
    if (description !== undefined) updates.description = description
    if (status) updates.status = status
    if (priority) updates.priority = priority
    if (dueDate !== undefined) updates.dueDate = dueDate
    if (assignedToId !== undefined) updates.assignedToId = assignedToId
    if (completed !== undefined) updates.completed = completed

    const { data, error } = await supabaseAdmin
      .from('Task')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ task: data }, { status: 200 })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

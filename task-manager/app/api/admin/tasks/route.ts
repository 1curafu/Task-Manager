import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminUser } from '@/lib/adminAuth'
import { adminCreateTaskSchema, adminUpdateTaskSchema } from '@/lib/validations'

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

    const { data, error } = await supabaseAdmin
      .from('Task')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error listing tasks:', error)
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }

    return NextResponse.json({ tasks: data }, { status: 200 })
  } catch (error) {
    console.error('Error listing tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAdminUser()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = adminCreateTaskSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const { data, error } = await supabaseAdmin
      .from('Task')
      .insert({
        name: parsed.data.name,
        description: parsed.data.description,
        status: parsed.data.status ?? 'todo',
        priority: parsed.data.priority ?? 'medium',
        dueDate: parsed.data.dueDate,
        userId: parsed.data.userId,
        teamId: parsed.data.teamId,
        assignedToId: parsed.data.assignedToId,
        createdById: parsed.data.userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return NextResponse.json({ error: 'Request failed' }, { status: 400 })
    }

    return NextResponse.json({ task: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await isAdminUser()
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
      console.error('Error deleting task:', error)
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
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
    const isAdmin = await isAdminUser()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = adminUpdateTaskSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const { taskId, ...rest } = parsed.data

    const updates: Record<string, unknown> = {}
    if (rest.name !== undefined) updates.name = rest.name
    if (rest.description !== undefined) updates.description = rest.description
    if (rest.status !== undefined) updates.status = rest.status
    if (rest.priority !== undefined) updates.priority = rest.priority
    if (rest.dueDate !== undefined) updates.dueDate = rest.dueDate
    if (rest.assignedToId !== undefined) updates.assignedToId = rest.assignedToId
    if (rest.completed !== undefined) updates.completed = rest.completed

    const { data, error } = await supabaseAdmin
      .from('Task')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return NextResponse.json({ error: 'Request failed' }, { status: 400 })
    }

    return NextResponse.json({ task: data }, { status: 200 })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

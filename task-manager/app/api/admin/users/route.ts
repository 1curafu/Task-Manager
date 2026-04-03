import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminUser } from '@/lib/adminAuth'
import { adminCreateUserSchema, adminUpdateUserSchema } from '@/lib/validations'

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

    const { data, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('Error listing users:', error)
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }

    return NextResponse.json({ users: data.users }, { status: 200 })
  } catch (error) {
    console.error('Error listing users:', error)
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
    const parsed = adminCreateUserSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const { email, password } = parsed.data

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (error) {
      console.error('Error creating user:', error)
      return NextResponse.json({ error: 'Request failed' }, { status: 400 })
    }

    return NextResponse.json({ user: data.user }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await isAdminUser()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }

    return NextResponse.json(
      { success: true, message: 'User deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting user:', error)
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
    const parsed = adminUpdateUserSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const { userId, email, password, metadata } = parsed.data

    const updates: {
      email?: string
      password?: string
      user_metadata?: Record<string, unknown>
    } = {}

    if (email) updates.email = email
    if (password) updates.password = password
    if (metadata) updates.user_metadata = metadata

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updates
    )

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: 'Request failed' }, { status: 400 })
    }

    return NextResponse.json({ user: data.user }, { status: 200 })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

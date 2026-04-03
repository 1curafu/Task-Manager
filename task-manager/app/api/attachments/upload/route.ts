import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Parse multipart form
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const taskId = formData.get('taskId') as string | null

    if (!file || !taskId) {
      return NextResponse.json({ error: 'file and taskId are required' }, { status: 400 })
    }

    // 3. Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 400 })
    }

    // 4. Verify task ownership
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { userId: true, assignedToId: true } })
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    if (task.userId !== user.id && task.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 5. Sanitize filename and build storage path
    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const storagePath = `attachments/${taskId}/${randomUUID()}-${sanitized}`

    // 6. Upload to Storage
    const buffer = await file.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage
      .from('task-attachments')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('[attachments/upload]', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // 7. Create Prisma row
    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storagePath,
        uploadedById: user.id,
      },
    })

    return NextResponse.json({ attachment }, { status: 201 })
  } catch (error) {
    console.error('[attachments/upload]', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

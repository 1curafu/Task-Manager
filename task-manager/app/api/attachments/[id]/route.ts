import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (s) => { try { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: { task: { select: { userId: true, assignedToId: true } } },
    })
    if (!attachment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isUploader = attachment.uploadedById === user.id
    const isTaskOwner = attachment.task.userId === user.id || attachment.task.assignedToId === user.id
    if (!isUploader && !isTaskOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete from Storage first
    const { error: storageError } = await supabaseAdmin.storage
      .from('task-attachments')
      .remove([attachment.storagePath])
    if (storageError) {
      console.error('[DELETE attachment storage]', storageError)
      return NextResponse.json({ error: 'Storage deletion failed' }, { status: 500 })
    }

    // Then delete DB row
    await prisma.attachment.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/attachments/[id]]', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

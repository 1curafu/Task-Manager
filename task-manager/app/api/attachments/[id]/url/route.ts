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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    if (attachment.task.userId !== user.id && attachment.task.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin.storage
      .from('task-attachments')
      .createSignedUrl(attachment.storagePath, 3600) // 1 hour
    if (error) {
      console.error('[signed URL]', error)
      return NextResponse.json({ error: 'Could not generate URL' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (error) {
    console.error('[GET /api/attachments/[id]/url]', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

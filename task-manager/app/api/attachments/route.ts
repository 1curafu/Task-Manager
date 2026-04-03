import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (s) => { try { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const taskId = request.nextUrl.searchParams.get('taskId')
    if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })

    // Verify task access
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { userId: true, assignedToId: true } })
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (task.userId !== user.id && task.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ attachments })
  } catch (error) {
    console.error('[GET /api/attachments]', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

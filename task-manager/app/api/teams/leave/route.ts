import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { teamId } = (await req.json()) as { teamId: string }
  if (!teamId)
    return NextResponse.json({ error: 'Missing teamId' }, { status: 400 })

  const { error } = await supabase
    .from('TeamMember')
    .delete()
    .eq('teamId', teamId)
    .eq('userId', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

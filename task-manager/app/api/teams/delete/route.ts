import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { teamId } = (await req.json()) as { teamId: string }
  if (!teamId)
    return NextResponse.json({ error: 'Missing teamId' }, { status: 400 })

  const { data: team } = await supabase
    .from('Team')
    .select('ownerId')
    .eq('id', teamId)
    .single()
  if (!team || team.ownerId !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('Team').delete().eq('id', teamId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

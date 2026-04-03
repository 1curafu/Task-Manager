import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { inviteId } = (await req.json()) as { inviteId: string }
  if (!inviteId)
    return NextResponse.json({ error: 'Missing inviteId' }, { status: 400 })

  const { error } = await supabase
    .from('TeamMember')
    .update({
      status: 'active',
      userId: user.id,
      respondedAt: new Date().toISOString(),
    })
    .eq('id', inviteId)
    .eq('userEmail', user.email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

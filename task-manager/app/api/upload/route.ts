import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type))
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/avatar.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(path)

  await supabase.from('Profile').update({ avatar: publicUrl }).eq('id', user.id)

  return NextResponse.json({ url: publicUrl })
}

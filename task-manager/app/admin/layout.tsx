import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  if (!user.user_metadata?.isAdmin) {
    redirect('/dashboard')
  }

  return <>{children}</>
}

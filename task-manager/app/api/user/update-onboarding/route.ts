import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: object) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: object) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Upsert so it works whether or not the Profile row exists yet
    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: { hasCompletedOnboarding: true },
      create: { userId: user.id, hasCompletedOnboarding: true },
    })

    return NextResponse.json(
      { success: true, profile: updatedProfile },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating onboarding status:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

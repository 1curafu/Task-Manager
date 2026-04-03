import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { profileUpdateSchema } from '@/lib/validations'
import { z } from 'zod'

export async function PUT(request: NextRequest) {
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

    const payload = await request.json()
    
    // Server-side Input Validation
    let validatedData;
    try {
      validatedData = await profileUpdateSchema.parseAsync(payload)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationError.issues },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }

    const { email, password, currentPassword, metadata } = validatedData;

    if (email && email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: email
      })

      if (emailError) {
        return NextResponse.json(
          { error: 'Failed to update email: ' + emailError.message },
          { status: 400 }
        )
      }
    }

    if (password) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password required' }, { status: 400 })
      }
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      })
      if (reAuthError) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 })
      }
      const { error: passwordError } = await supabase.auth.updateUser({ password })
      if (passwordError) {
        console.error('[user/update password]', passwordError)
        return NextResponse.json({ error: 'Failed to update password' }, { status: 400 })
      }
    }

    if (metadata) {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: metadata
      })

      if (metadataError) {
        return NextResponse.json(
          { error: 'Failed to update profile: ' + metadataError.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { success: true, message: 'Profile updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

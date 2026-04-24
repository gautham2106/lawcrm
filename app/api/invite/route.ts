import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getUserProfile } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const profile = await getUserProfile()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 403 })
  }

  const { email, role, advocate_name } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const db = createServerClient()

  const { data, error } = await db.auth.admin.inviteUserByEmail(email, {
    data: {
      role: role ?? 'staff',
      advocate_name: advocate_name ?? null,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, userId: data.user?.id })
}

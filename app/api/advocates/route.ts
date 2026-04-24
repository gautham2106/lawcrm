import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { name, email, password, role, phone } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
  }

  const db = createServerClient()

  // Create auth user directly with email + password (no invite email sent)
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Store advocate profile
  const { error: insertError } = await db.from('advocates').insert({
    name,
    email,
    role: role ?? 'advocate',
    phone: phone ?? null,
  })

  if (insertError) {
    // Roll back auth user creation
    await db.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

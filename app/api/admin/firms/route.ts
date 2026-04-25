import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { firm, admin } = await req.json()

  if (!firm?.name || !admin?.name || !admin?.email || !admin?.password) {
    return NextResponse.json({ error: 'Firm name, admin name, email and password are required' }, { status: 400 })
  }

  const db = createServerClient()

  // 1. Create the firm
  const { data: newFirm, error: firmError } = await db
    .from('firms')
    .insert({
      name:    firm.name,
      email:   firm.email ?? null,
      phone:   firm.phone ?? null,
      address: firm.address ?? null,
    })
    .select('id')
    .single()

  if (firmError) {
    return NextResponse.json({ error: firmError.message }, { status: 400 })
  }

  // 2. Create Supabase auth user (no invite email — direct creation)
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email:         admin.email,
    password:      admin.password,
    email_confirm: true,
  })

  if (authError) {
    // Roll back firm
    await db.from('firms').delete().eq('id', newFirm.id)
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // 3. Create advocate profile as senior_advocate, linked to firm
  const { error: advocateError } = await db.from('advocates').insert({
    name:        admin.name,
    email:       admin.email,
    phone:       admin.phone ?? null,
    role:        'senior_advocate',
    firm_id:     newFirm.id,
    auth_user_id: authData.user.id,
  })

  if (advocateError) {
    // Roll back both
    await db.auth.admin.deleteUser(authData.user.id)
    await db.from('firms').delete().eq('id', newFirm.id)
    return NextResponse.json({ error: advocateError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, firmId: newFirm.id })
}

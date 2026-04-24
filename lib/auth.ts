import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServerClient as createDbClient } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

async function createAuthClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored when called from Server Component (middleware handles refresh)
          }
        },
      },
    }
  )
}

export async function getAuthUser() {
  const client = await createAuthClient()
  const { data: { user } } = await client.auth.getUser()
  return user
}

export async function getUserProfile(): Promise<Profile | null> {
  const user = await getAuthUser()
  if (!user) return null
  const db = createDbClient()
  const { data } = await db.from('profiles').select('*').eq('id', user.id).single()
  return data as Profile | null
}

export async function getFirmId(): Promise<string | null> {
  const profile = await getUserProfile()
  return profile?.firm_id ?? null
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === 'admin'
}

export function isStaff(profile: Profile | null): boolean {
  return profile?.role === 'staff'
}

export function isSuperAdmin(profile: Profile | null): boolean {
  return profile?.is_super_admin === true
}

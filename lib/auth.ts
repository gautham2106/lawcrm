import { createSupabaseServerClient, createServerClient } from './supabase'
import { Advocate } from './types'

export interface AuthContext {
  userId: string | null
  advocate: Advocate | null
  /** true = senior_advocate role OR no advocate profile (firm owner/admin) — sees all data */
  isAdmin: boolean
}

export async function getAuthContext(): Promise<AuthContext> {
  try {
    const authClient = createSupabaseServerClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) return { userId: null, advocate: null, isAdmin: false }

    const db = createServerClient()
    const { data: advocate } = await db
      .from('advocates')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    const isAdmin = !advocate || (advocate as Advocate).role === 'senior_advocate'

    return {
      userId: user.id,
      advocate: advocate as Advocate | null,
      isAdmin,
    }
  } catch {
    return { userId: null, advocate: null, isAdmin: false }
  }
}

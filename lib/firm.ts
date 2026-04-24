import { supabase } from './supabase'

// Module-level cache — valid for the lifetime of a browser session
let _firmId: string | null = null
let _userId: string | null = null

export async function getClientFirmId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (user.id === _userId && _firmId !== undefined) return _firmId

  const { data } = await supabase
    .from('profiles')
    .select('firm_id')
    .eq('id', user.id)
    .single()

  _userId = user.id
  _firmId = data?.firm_id ?? null
  return _firmId
}

/** Clears the cache — call on logout */
export function clearFirmCache() {
  _firmId = null
  _userId = null
}

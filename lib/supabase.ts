import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client — stores session in cookies so middleware can read it
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Service-role client for server components (bypasses RLS)
export function createServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return createClient(supabaseUrl, serviceKey || supabaseAnonKey, {
    auth: { persistSession: false },
  })
}

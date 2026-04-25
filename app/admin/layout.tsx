import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createServerClient } from '@/lib/supabase'
import AdminNav from '@/components/layout/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Auth check
  let userId: string | null = null
  try {
    const authClient = createSupabaseServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    userId = user?.id ?? null
  } catch {}

  if (!userId) redirect('/login')

  // Super admin check
  const db = createServerClient()
  const { data: superAdmin } = await db
    .from('super_admins')
    .select('id, name')
    .eq('auth_user_id', userId)
    .maybeSingle()

  if (!superAdmin) redirect('/')

  return (
    // Fixed full-screen overlay — completely replaces the regular app shell
    <div className="fixed inset-0 z-[9999] bg-slate-50 flex overflow-hidden">
      <AdminNav />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

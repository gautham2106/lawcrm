import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import LogoutButton from '@/components/layout/LogoutButton'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createServerClient } from '@/lib/supabase'
import { Advocate } from '@/lib/types'

export const metadata: Metadata = {
  title: 'CaseBook — Law Firm CRM',
  description: 'Manage your law firm cases, clients, hearings, and tasks',
}

const roleLabels: Record<string, string> = {
  senior_advocate: 'Senior Advocate',
  advocate: 'Advocate',
  junior: 'Junior',
  paralegal: 'Paralegal',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let user = null
  let advocate: Pick<Advocate, 'name' | 'role'> | null = null

  try {
    const authClient = createSupabaseServerClient()
    const { data } = await authClient.auth.getUser()
    user = data.user

    if (user) {
      const db = createServerClient()
      const { data: adv } = await db
        .from('advocates')
        .select('name, role')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      advocate = adv as Pick<Advocate, 'name' | 'role'> | null
    }
  } catch {}

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100">
        {user ? (
          <>
            <div className="max-w-5xl mx-auto px-4 pb-24 pt-4">
              {/* Top user bar */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(advocate?.name ?? user.email ?? 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 leading-tight">
                      {advocate?.name ?? user.email}
                    </p>
                    <p className="text-xs text-slate-500">
                      {advocate ? (roleLabels[advocate.role] ?? advocate.role) : 'Admin'}
                    </p>
                  </div>
                </div>
                <LogoutButton />
              </div>
              {children}
            </div>
            <Navbar />
          </>
        ) : (
          children
        )}
      </body>
    </html>
  )
}

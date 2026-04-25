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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      <body className="min-h-screen bg-[#e7e3d8]">
        {user ? (
          <>
            <div className="max-w-5xl mx-auto px-4 pb-24 pt-4">
              {/* User bar */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-[#1a1814]">
                    {advocate?.name ?? user.email}
                  </p>
                  <p className="text-xs text-[#8a8278]">
                    {advocate ? (roleLabels[advocate.role] ?? advocate.role) : 'Admin'}
                  </p>
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

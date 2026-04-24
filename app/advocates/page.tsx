import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { Plus, Users, Mail, Phone } from 'lucide-react'
import { Advocate } from '@/lib/types'
import EmptyState from '@/components/ui/EmptyState'

export const revalidate = 0

const roleLabels: Record<string, string> = {
  senior_advocate: 'Senior Advocate',
  advocate: 'Advocate',
  junior: 'Junior',
  paralegal: 'Paralegal',
}

const roleColors: Record<string, string> = {
  senior_advocate: 'bg-amber-100 text-amber-800',
  advocate: 'bg-blue-100 text-blue-800',
  junior: 'bg-green-100 text-green-800',
  paralegal: 'bg-purple-100 text-purple-800',
}

export default async function AdvocatesPage() {
  const db = createServerClient()
  const { data: advocates } = await db
    .from('advocates')
    .select('*')
    .order('name')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Team</h1>
        <Link href="/advocates/new" className="btn-primary flex items-center gap-1.5">
          <Plus size={16} />
          Add Member
        </Link>
      </div>

      {!advocates?.length ? (
        <EmptyState
          icon={Users}
          title="No team members"
          description="Add advocates to assign cases and tasks"
          action={<Link href="/advocates/new" className="btn-primary">Add Member</Link>}
        />
      ) : (
        <div className="card divide-y divide-[#d6cdbc]">
          {(advocates as Advocate[]).map((a) => (
            <div key={a.id} className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eee8da] flex items-center justify-center flex-shrink-0 font-bold text-sm text-[#4a4540]">
                {a.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[#1a1814]">{a.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColors[a.role] ?? 'bg-gray-100 text-gray-700'}`}>
                    {roleLabels[a.role] ?? a.role}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <a href={`mailto:${a.email}`} className="text-xs text-[#8a8278] flex items-center gap-1">
                    <Mail size={10} /> {a.email}
                  </a>
                  {a.phone && (
                    <a href={`tel:${a.phone}`} className="text-xs text-[#8a8278] flex items-center gap-1">
                      <Phone size={10} /> {a.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

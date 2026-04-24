import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { Plus, Users, ChevronRight, Phone, Mail } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { Client } from '@/lib/types'

export const revalidate = 0

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const db = createServerClient()
  const { q } = searchParams

  let query = db.from('clients').select('*, cases:cases(id)').order('name')
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: clients } = await query

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Clients</h1>
        <Link href="/clients/new" className="btn-primary flex items-center gap-1.5">
          <Plus size={16} />
          New Client
        </Link>
      </div>

      <form method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search clients..."
          className="input"
        />
      </form>

      {clients?.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to get started"
          action={<Link href="/clients/new" className="btn-primary">Add Client</Link>}
        />
      ) : (
        <div className="space-y-3">
          {(clients as (Client & { cases: any[] })[]).map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-[#d9a57b] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#1a1814]">{client.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {client.phone && (
                    <span className="text-xs text-[#8a8278] flex items-center gap-1">
                      <Phone size={10} /> {client.phone}
                    </span>
                  )}
                  <span className="text-xs text-[#8a8278]">
                    {client.cases?.length ?? 0} case{client.cases?.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#8a8278]" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

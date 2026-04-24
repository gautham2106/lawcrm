import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { Search, Briefcase, Users, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Case, Client } from '@/lib/types'

export const revalidate = 0

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const db = createServerClient()
  const q = searchParams.q?.trim()

  let cases: Case[] = []
  let clients: Client[] = []

  if (q && q.length > 1) {
    const [{ data: casesData }, { data: clientsData }] = await Promise.all([
      db
        .from('cases')
        .select('*, client:clients(name)')
        .or(`case_name.ilike.%${q}%,case_number.ilike.%${q}%,court.ilike.%${q}%`)
        .limit(10),
      db
        .from('clients')
        .select('*')
        .or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(10),
    ])
    cases = (casesData ?? []) as Case[]
    clients = (clientsData ?? []) as Client[]
  }

  const hasResults = cases.length > 0 || clients.length > 0

  return (
    <div className="space-y-5">
      <h1 className="page-header">Search</h1>

      <form method="get" className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8278]" />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search cases, clients..."
          autoFocus
          className="input pl-9"
        />
      </form>

      {q && q.length > 1 && !hasResults && (
        <div className="text-center py-12 text-[#8a8278]">
          <Search size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No results for &quot;{q}&quot;</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      )}

      {cases.length > 0 && (
        <section>
          <h2 className="section-title mb-3">Cases ({cases.length})</h2>
          <div className="space-y-2">
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
              >
                <div className="w-9 h-9 rounded-xl bg-[#eee8da] flex items-center justify-center flex-shrink-0">
                  <Briefcase size={14} className="text-[#4a4540]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-[#1a1814] truncate">{c.case_name}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-[#8a8278]">
                    {c.case_number}
                    {c.client && ` · ${(c.client as any).name}`}
                  </p>
                </div>
                <ChevronRight size={16} className="text-[#8a8278]" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {clients.length > 0 && (
        <section>
          <h2 className="section-title mb-3">Clients ({clients.length})</h2>
          <div className="space-y-2">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
              >
                <div className="w-9 h-9 rounded-full bg-[#d9a57b] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#1a1814]">{client.name}</p>
                  {client.phone && <p className="text-xs text-[#8a8278]">{client.phone}</p>}
                </div>
                <ChevronRight size={16} className="text-[#8a8278]" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {!q && (
        <div className="text-center py-12 text-[#8a8278]">
          <Search size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Type to search across cases and clients</p>
        </div>
      )}
    </div>
  )
}

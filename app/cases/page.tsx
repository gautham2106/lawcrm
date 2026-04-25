import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { getAuthContext } from '@/lib/auth'
import { format, parseISO } from 'date-fns'
import { Plus, Search, Briefcase, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { Case } from '@/lib/types'

export const revalidate = 0

export default async function CasesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string }
}) {
  const db = createServerClient()
  const { advocate, isAdmin } = await getAuthContext()
  const { status, q } = searchParams

  let query = db
    .from('cases')
    .select('*, client:clients(id, name, phone)')
    .order('created_at', { ascending: false })

  if (!isAdmin && advocate) query = query.eq('assigned_to', advocate.id)
  if (status && status !== 'all') query = query.eq('status', status)
  if (q) query = query.or(`case_name.ilike.%${q}%,case_number.ilike.%${q}%`)

  const { data: cases } = await query
  const statuses = ['all', 'active', 'pending', 'closed', 'won', 'lost']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Cases</h1>
        {isAdmin && (
          <Link href="/cases/new" className="btn-primary flex items-center gap-1.5">
            <Plus size={16} /> New Case
          </Link>
        )}
      </div>

      <form method="get" className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" name="q" defaultValue={q} placeholder="Search cases…" className="input pl-9" />
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/cases?status=${s}${q ? `&q=${q}` : ''}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
              (status ?? 'all') === s
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      {cases?.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No cases found"
          description={isAdmin ? 'Add your first case to get started' : 'No cases assigned to you yet'}
          action={isAdmin ? <Link href="/cases/new" className="btn-primary">Add Case</Link> : undefined}
        />
      ) : (
        <div className="space-y-2">
          {(cases as Case[]).map((c) => (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                <Briefcase size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm text-slate-900 truncate">{c.case_name}</p>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-slate-500">
                  {c.case_number}{c.client && ` · ${(c.client as any).name}`}
                </p>
                {c.filing_date && (
                  <p className="text-xs text-slate-400 mt-0.5">Filed {format(parseISO(c.filing_date), 'dd MMM yyyy')}</p>
                )}
              </div>
              <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

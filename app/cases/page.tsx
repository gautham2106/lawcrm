import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { getUserProfile } from '@/lib/auth'
import { format, parseISO } from 'date-fns'
import { Plus, Search, Briefcase, ChevronRight, User } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { Case } from '@/lib/types'

export const revalidate = 0

export default async function CasesPage({
  searchParams,
}: {
  searchParams: { status?: string; stage?: string; q?: string; advocate?: string }
}) {
  const db = createServerClient()
  const profile = await getUserProfile()
  const isAdmin = profile?.role === 'admin'
  const { status, stage, q, advocate } = searchParams

  let query = db
    .from('cases')
    .select('*, client:clients(id, name, phone)')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  if (stage && stage !== 'all') query = query.eq('stage', stage)
  if (q) query = query.or(`case_name.ilike.%${q}%,case_number.ilike.%${q}%`)

  // Staff can only see their own cases
  if (!isAdmin && profile?.advocate_name) {
    query = query.eq('advocate_name', profile.advocate_name)
  } else if (isAdmin && advocate && advocate !== 'all') {
    query = query.eq('advocate_name', advocate)
  }

  const { data: cases } = await query

  // Fetch stages and advocates for filters
  const { data: stagesSetting } = await db
    .from('firm_settings')
    .select('value')
    .eq('key', 'case_stages')
    .single()

  const { data: advocatesSetting } = isAdmin
    ? await db.from('firm_settings').select('value').eq('key', 'advocates').single()
    : { data: null }

  const caseStages: string[] = stagesSetting?.value ?? []
  const advocates: string[] = advocatesSetting?.value ?? []

  const statuses = ['all', 'active', 'pending', 'closed', 'won', 'lost']

  function buildUrl(params: Record<string, string | undefined>) {
    const base: Record<string, string> = {}
    if (status && status !== 'all') base.status = status
    if (stage && stage !== 'all') base.stage = stage
    if (q) base.q = q
    if (advocate && advocate !== 'all') base.advocate = advocate
    Object.assign(base, params)
    const clean = Object.fromEntries(Object.entries(base).filter(([, v]) => v))
    const qs = new URLSearchParams(clean).toString()
    return `/cases${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-header">Cases</h1>
        <Link href="/cases/new" className="btn-primary flex items-center gap-1.5">
          <Plus size={16} />
          New Case
        </Link>
      </div>

      {/* Search */}
      <form method="get" className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8278]" />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search cases..."
          className="input pl-9"
        />
        {status && <input type="hidden" name="status" value={status} />}
        {stage && <input type="hidden" name="stage" value={stage} />}
        {advocate && <input type="hidden" name="advocate" value={advocate} />}
      </form>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {statuses.map((s) => (
          <Link
            key={s}
            href={buildUrl({ status: s === 'all' ? undefined : s })}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              (status ?? 'all') === s
                ? 'bg-[#1a1814] text-white'
                : 'bg-[#f7f5f0] text-[#4a4540] border border-[#d6cdbc] hover:bg-[#eee8da]'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      {/* Stage Filter */}
      {caseStages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <Link
            href={buildUrl({ stage: undefined })}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              !stage || stage === 'all'
                ? 'bg-[#d9a57b] text-white'
                : 'bg-[#f7f5f0] text-[#4a4540] border border-[#d6cdbc] hover:bg-[#eee8da]'
            }`}
          >
            All Stages
          </Link>
          {caseStages.map((s) => (
            <Link
              key={s}
              href={buildUrl({ stage: s })}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                stage === s
                  ? 'bg-[#d9a57b] text-white'
                  : 'bg-[#f7f5f0] text-[#4a4540] border border-[#d6cdbc] hover:bg-[#eee8da]'
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
      )}

      {/* Advocate Filter (admin only) */}
      {isAdmin && advocates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <Link
            href={buildUrl({ advocate: undefined })}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              !advocate || advocate === 'all'
                ? 'bg-[#1a1814] text-white'
                : 'bg-[#f7f5f0] text-[#4a4540] border border-[#d6cdbc] hover:bg-[#eee8da]'
            }`}
          >
            All Advocates
          </Link>
          {advocates.map((a) => (
            <Link
              key={a}
              href={buildUrl({ advocate: a })}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                advocate === a
                  ? 'bg-[#1a1814] text-white'
                  : 'bg-[#f7f5f0] text-[#4a4540] border border-[#d6cdbc] hover:bg-[#eee8da]'
              }`}
            >
              {a}
            </Link>
          ))}
        </div>
      )}

      {/* Cases List */}
      {cases?.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No cases found"
          description="Add your first case to get started"
          action={<Link href="/cases/new" className="btn-primary">Add Case</Link>}
        />
      ) : (
        <div className="space-y-3">
          {(cases as Case[]).map((c) => (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-[#eee8da] flex items-center justify-center flex-shrink-0">
                <Briefcase size={16} className="text-[#4a4540]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="font-semibold text-sm text-[#1a1814] truncate">{c.case_name}</p>
                  <StatusBadge status={c.status} />
                  {c.stage && (
                    <span className="badge bg-[#eee8da] text-[#4a4540] text-[10px]">{c.stage}</span>
                  )}
                </div>
                <p className="text-xs text-[#8a8278]">
                  {c.case_number}
                  {c.client && ` · ${(c.client as any).name}`}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  {c.filing_date && (
                    <p className="text-xs text-[#8a8278]">
                      Filed {format(parseISO(c.filing_date), 'dd MMM yyyy')}
                    </p>
                  )}
                  {c.advocate_name && (
                    <p className="text-xs text-[#8a8278] flex items-center gap-1">
                      <User size={10} />{c.advocate_name}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-[#8a8278] flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

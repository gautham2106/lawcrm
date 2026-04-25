import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { getAuthContext } from '@/lib/auth'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { Briefcase, Calendar, CheckSquare, AlertCircle, Bell, Search, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Case, Hearing, Task, Fee } from '@/lib/types'

function formatHearingDate(dateStr: string) {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'dd MMM')
}

export const revalidate = 0

export default async function DashboardPage() {
  const db = createServerClient()
  const { advocate, isAdmin } = await getAuthContext()
  const today = new Date().toISOString().split('T')[0]

  let assignedCaseIds: string[] | null = null
  if (!isAdmin && advocate) {
    const { data: ac } = await db.from('cases').select('id').eq('assigned_to', advocate.id)
    assignedCaseIds = (ac ?? []).map((c: any) => c.id)
  }

  const [
    { data: cases },
    { data: todayHearings },
    { data: pendingTasks },
    { data: pendingFees },
    { data: unreadNotifications },
    { data: upcomingHearings },
  ] = await Promise.all([
    (() => {
      let q = db.from('cases').select('id, status').eq('status', 'active')
      if (!isAdmin && advocate) q = q.eq('assigned_to', advocate.id)
      return q
    })(),
    (() => {
      let q = db.from('hearings').select('*, case:cases(id, case_name, case_number)').eq('date', today).order('time')
      if (!isAdmin && assignedCaseIds) q = q.in('case_id', assignedCaseIds.length ? assignedCaseIds : [''])
      return q
    })(),
    (() => {
      let q = db.from('tasks').select('id').eq('done', false)
      if (!isAdmin && advocate) q = q.eq('assigned_to', advocate.id)
      return q
    })(),
    (() => {
      let q = db.from('fees').select('id, agreed_amount, paid_amount').gt('agreed_amount', 0)
      if (!isAdmin && assignedCaseIds) q = q.in('case_id', assignedCaseIds.length ? assignedCaseIds : [''])
      return q
    })(),
    db.from('notifications').select('id').eq('is_read', false),
    (() => {
      let q = db.from('hearings')
        .select('*, case:cases(id, case_name, case_number)')
        .gte('date', today).order('date').order('time').limit(5)
      if (!isAdmin && assignedCaseIds) q = q.in('case_id', assignedCaseIds.length ? assignedCaseIds : [''])
      return q
    })(),
  ])

  const pendingFeesTotal = (pendingFees ?? []).reduce(
    (sum: number, f) => sum + Math.max(0, f.agreed_amount - f.paid_amount), 0
  )

  const stats = [
    { label: 'Active Cases',   value: cases?.length ?? 0,         icon: Briefcase,   href: '/cases',    color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100' },
    { label: 'Today Hearings', value: todayHearings?.length ?? 0, icon: Calendar,    href: '/calendar', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Pending Tasks',  value: pendingTasks?.length ?? 0,  icon: CheckSquare, href: '/tasks',    color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-100' },
    { label: 'Fees Due',       value: pendingFeesTotal > 0 ? `₹${(pendingFeesTotal/1000).toFixed(0)}k` : '—',
      icon: AlertCircle, href: '/fees', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  ]

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">{greeting}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/search" className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 shadow-sm transition-colors">
            <Search size={16} className="text-slate-500" />
          </Link>
          <Link href="/notifications" className="relative w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 shadow-sm transition-colors">
            <Bell size={16} className="text-slate-500" />
            {(unreadNotifications?.length ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unreadNotifications!.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, href, color, bg, border }) => (
          <Link key={label} href={href} className="card p-4 hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">{label}</div>
          </Link>
        ))}
      </div>

      {/* Today's Hearings */}
      {(todayHearings?.length ?? 0) > 0 && (
        <section>
          <h2 className="section-title mb-3">Today&apos;s Hearings</h2>
          <div className="space-y-2">
            {(todayHearings as (Hearing & { case: Case })[]).map((h) => (
              <Link key={h.id} href={`/cases/${h.case_id}`} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">{h.case?.case_name}</p>
                  <p className="text-xs text-slate-500">{h.purpose ?? 'Hearing'} · {h.time ?? 'Time TBD'}</p>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Hearings */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Upcoming Hearings</h2>
          <Link href="/calendar" className="text-xs text-blue-600 font-semibold hover:text-blue-700">View all</Link>
        </div>
        <div className="card divide-y divide-slate-100">
          {(upcomingHearings as (Hearing & { case: Case })[])?.map((h) => (
            <Link key={h.id} href={`/cases/${h.case_id}`} className="flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
              <div className="w-10 text-center flex-shrink-0">
                <p className="text-[10px] font-bold text-blue-600">{format(parseISO(h.date), 'MMM').toUpperCase()}</p>
                <p className="text-xl font-bold text-slate-900 leading-none">{format(parseISO(h.date), 'd')}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 truncate">{h.case?.case_name}</p>
                <p className="text-xs text-slate-500">{h.purpose ?? 'Hearing'} {h.time ? `· ${h.time}` : ''}</p>
              </div>
              <span className="text-xs text-slate-400 font-medium flex-shrink-0">{formatHearingDate(h.date)}</span>
            </Link>
          ))}
          {!upcomingHearings?.length && (
            <div className="p-8 text-center text-sm text-slate-400">No upcoming hearings</div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="section-title mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'New Case',  href: '/cases/new',  icon: Briefcase },
            { label: 'Add Task',  href: '/tasks/new',  icon: CheckSquare },
            { label: 'Calendar',  href: '/calendar',   icon: Calendar },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className="card p-3 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Icon size={16} className="text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-slate-600">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

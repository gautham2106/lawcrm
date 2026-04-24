import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { Briefcase, Calendar, CheckSquare, AlertCircle, Bell, Search, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Case, Hearing, Task, Fee, Notification } from '@/lib/types'

function formatHearingDate(dateStr: string) {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'dd MMM')
}

export const revalidate = 0

export default async function DashboardPage() {
  const db = createServerClient()

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: cases },
    { data: todayHearings },
    { data: pendingTasks },
    { data: pendingFees },
    { data: unreadNotifications },
    { data: upcomingHearings },
  ] = await Promise.all([
    db.from('cases').select('id, status').eq('status', 'active'),
    db.from('hearings').select('*, case:cases(id, case_name, case_number)').eq('date', today).order('time'),
    db.from('tasks').select('id').eq('done', false),
    db.from('fees').select('id, agreed_amount, paid_amount').gt('agreed_amount', 0),
    db.from('notifications').select('id').eq('is_read', false),
    db.from('hearings')
      .select('*, case:cases(id, case_name, case_number)')
      .gte('date', today)
      .order('date')
      .order('time')
      .limit(5),
  ])

  const pendingFeesTotal = (pendingFees ?? []).reduce(
    (sum: number, f: Fee) => sum + Math.max(0, f.agreed_amount - f.paid_amount),
    0
  )
  const hasPendingFees = pendingFeesTotal > 0

  const stats = [
    { label: 'Active Cases',    value: cases?.length ?? 0,              icon: Briefcase,   href: '/cases',    color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Today Hearings',  value: todayHearings?.length ?? 0,      icon: Calendar,    href: '/calendar', color: 'text-amber-600',  bg: 'bg-amber-50' },
    { label: 'Pending Tasks',   value: pendingTasks?.length ?? 0,       icon: CheckSquare, href: '/tasks',    color: 'text-emerald-600',bg: 'bg-emerald-50' },
    { label: 'Fees Due',        value: hasPendingFees ? `₹${(pendingFeesTotal/1000).toFixed(0)}k` : '—', icon: AlertCircle, href: '/fees', color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#8a8278] font-medium">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          <h1 className="text-2xl font-bold text-[#1a1814] tracking-tight">Good morning</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/search" className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da] transition-colors">
            <Search size={16} className="text-[#4a4540]" />
          </Link>
          <Link href="/notifications" className="relative w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da] transition-colors">
            <Bell size={16} className="text-[#4a4540]" />
            {(unreadNotifications?.length ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#d9a57b] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unreadNotifications!.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, href, color, bg }) => (
          <Link key={label} href={href} className="card p-4 hover:shadow-sm transition-shadow">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-2xl font-bold text-[#1a1814]">{value}</div>
            <div className="text-xs text-[#8a8278] mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      {/* Today's Hearings */}
      {(todayHearings?.length ?? 0) > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Today&apos;s Hearings</h2>
          </div>
          <div className="space-y-2">
            {(todayHearings as (Hearing & { case: Case })[]).map((h) => (
              <Link key={h.id} href={`/cases/${h.case_id}`} className="card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[#d9a57b] flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#1a1814] truncate">{h.case?.case_name}</p>
                  <p className="text-xs text-[#8a8278]">{h.purpose ?? 'Hearing'} · {h.time ?? 'Time TBD'}</p>
                </div>
                <ChevronRight size={16} className="text-[#8a8278]" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Hearings */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Upcoming Hearings</h2>
          <Link href="/calendar" className="text-xs text-[#d9a57b] font-semibold">View all</Link>
        </div>
        <div className="card divide-y divide-[#d6cdbc]">
          {(upcomingHearings as (Hearing & { case: Case })[])?.map((h) => (
            <Link key={h.id} href={`/cases/${h.case_id}`} className="flex items-center gap-3 p-3.5 hover:bg-[#eee8da] transition-colors first:rounded-t-2xl last:rounded-b-2xl">
              <div className="w-10 text-center flex-shrink-0">
                <p className="text-xs font-bold text-[#d9a57b]">{format(parseISO(h.date), 'MMM').toUpperCase()}</p>
                <p className="text-xl font-bold text-[#1a1814] leading-none">{format(parseISO(h.date), 'd')}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#1a1814] truncate">{h.case?.case_name}</p>
                <p className="text-xs text-[#8a8278]">{h.purpose ?? 'Hearing'} {h.time ? `· ${h.time}` : ''}</p>
              </div>
              <span className="text-xs text-[#8a8278] font-medium flex-shrink-0">{formatHearingDate(h.date)}</span>
            </Link>
          ))}
          {!upcomingHearings?.length && (
            <div className="p-6 text-center text-sm text-[#8a8278]">No upcoming hearings</div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="section-title mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'New Case',    href: '/cases/new',    icon: Briefcase },
            { label: 'Add Task',    href: '/tasks/new',    icon: CheckSquare },
            { label: 'Calendar',    href: '/calendar',     icon: Calendar },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className="card p-3 flex flex-col items-center gap-2 hover:shadow-sm transition-shadow text-center">
              <div className="w-9 h-9 rounded-xl bg-[#eee8da] flex items-center justify-center">
                <Icon size={16} className="text-[#4a4540]" />
              </div>
              <span className="text-xs font-medium text-[#4a4540]">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

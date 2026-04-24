import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { getUserProfile } from '@/lib/auth'
import { format, parseISO, isToday, isPast } from 'date-fns'
import { Plus, CheckSquare, MapPin, Users } from 'lucide-react'
import { PriorityBadge } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import TaskToggle from './TaskToggle'
import { Task, Case } from '@/lib/types'

export const revalidate = 0

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { filter?: string; type?: string }
}) {
  const db = createServerClient()
  const profile = await getUserProfile()
  const isAdmin = profile?.role === 'admin'
  const filter = searchParams.filter ?? 'pending'
  const typeFilter = searchParams.type ?? 'all'

  let query = db
    .from('tasks')
    .select('*, case:cases(id, case_name, case_number)')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (filter === 'pending') query = query.eq('done', false)
  if (filter === 'done') query = query.eq('done', true)
  if (typeFilter !== 'all') query = query.eq('task_type', typeFilter)

  // Staff sees only tasks assigned to them
  if (!isAdmin && profile?.advocate_name) {
    query = query.eq('advocate_name', profile.advocate_name)
  }

  const { data: tasks } = await query

  function buildUrl(params: Record<string, string | undefined>) {
    const base: Record<string, string> = {}
    if (filter !== 'pending') base.filter = filter
    if (typeFilter !== 'all') base.type = typeFilter
    Object.assign(base, params)
    const clean = Object.fromEntries(Object.entries(base).filter(([, v]) => v))
    const qs = new URLSearchParams(clean).toString()
    return `/tasks${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Tasks</h1>
        <Link href="/tasks/new" className="btn-primary flex items-center gap-1.5">
          <Plus size={16} />
          New
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {['pending', 'done', 'all'].map((f) => (
          <Link
            key={f}
            href={buildUrl({ filter: f === 'pending' ? undefined : f })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-[#1a1814] text-white'
                : 'bg-[#f7f5f0] text-[#4a4540] border border-[#d6cdbc] hover:bg-[#eee8da]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Link>
        ))}
        <div className="ml-auto flex gap-2">
          {['all', 'task', 'meeting'].map((t) => (
            <Link
              key={t}
              href={buildUrl({ type: t === 'all' ? undefined : t })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                typeFilter === t
                  ? 'bg-[#d9a57b] text-white'
                  : 'bg-[#f7f5f0] text-[#4a4540] border border-[#d6cdbc] hover:bg-[#eee8da]'
              }`}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
            </Link>
          ))}
        </div>
      </div>

      {tasks?.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks"
          description={filter === 'pending' ? 'All caught up!' : 'No tasks match this filter'}
          action={<Link href="/tasks/new" className="btn-primary">Add Task</Link>}
        />
      ) : (
        <div className="card divide-y divide-[#d6cdbc]">
          {(tasks as (Task & { case: Case | null })[]).map((t) => {
            const overdue = !t.done && t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))
            const isMeeting = t.task_type === 'meeting'
            return (
              <div key={t.id} className="p-4 flex items-start gap-3">
                <TaskToggle taskId={t.id} done={t.done} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium leading-snug ${t.done ? 'line-through text-[#8a8278]' : 'text-[#1a1814]'}`}>
                      {t.title}
                    </p>
                    {isMeeting && (
                      <span className="badge bg-blue-50 text-blue-600 text-[10px]">Meeting</span>
                    )}
                  </div>

                  {isMeeting && (t.meeting_with || t.meeting_location) && (
                    <div className="flex items-center gap-3 mt-0.5">
                      {t.meeting_with && (
                        <span className="text-xs text-[#8a8278] flex items-center gap-1">
                          <Users size={10} />{t.meeting_with}
                        </span>
                      )}
                      {t.meeting_location && (
                        <span className="text-xs text-[#8a8278] flex items-center gap-1">
                          <MapPin size={10} />{t.meeting_location}
                        </span>
                      )}
                    </div>
                  )}

                  {t.case && (
                    <Link href={`/cases/${t.case_id}`} className="text-xs text-[#d9a57b] font-medium mt-0.5 block truncate">
                      {(t.case as any).case_name}
                    </Link>
                  )}

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <PriorityBadge priority={t.priority} />
                    {t.due_date && (
                      <span className={`text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-[#8a8278]'}`}>
                        {overdue ? 'Overdue · ' : ''}
                        Due {isToday(parseISO(t.due_date)) ? 'Today' : format(parseISO(t.due_date), 'dd MMM')}
                      </span>
                    )}
                    {t.advocate_name && (
                      <span className="text-xs text-[#8a8278]">· {t.advocate_name}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

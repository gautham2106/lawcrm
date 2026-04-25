import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { getAuthContext } from '@/lib/auth'
import { format, parseISO, isToday, isPast } from 'date-fns'
import { Plus, CheckSquare } from 'lucide-react'
import { PriorityBadge } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import TaskToggle from './TaskToggle'
import AssignSelect from '@/components/ui/AssignSelect'
import { Task, Case, Advocate } from '@/lib/types'

export const revalidate = 0

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { filter?: string }
}) {
  const db = createServerClient()
  const { advocate, isAdmin } = await getAuthContext()
  const filter = searchParams.filter ?? 'pending'

  const [tasksResult, advocatesResult] = await Promise.all([
    (() => {
      let query = db
        .from('tasks')
        .select('*, case:cases(id, case_name, case_number), assigned_advocate:advocates!assigned_to(id, name)')
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      // Non-admin advocates only see their assigned tasks
      if (!isAdmin && advocate) {
        query = query.eq('assigned_to', advocate.id)
      }

      if (filter === 'pending') query = query.eq('done', false)
      if (filter === 'done') query = query.eq('done', true)
      return query
    })(),
    // Only admins need the full advocate list for reassigning
    isAdmin
      ? db.from('advocates').select('id, name').order('name')
      : Promise.resolve({ data: [] }),
  ])

  const tasks = tasksResult.data
  const advocates = (advocatesResult.data ?? []) as Pick<Advocate, 'id' | 'name'>[]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Tasks</h1>
        <Link href="/tasks/new" className="btn-primary flex items-center gap-1.5">
          <Plus size={16} />
          New Task
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['pending', 'done', 'all'].map((f) => (
          <Link
            key={f}
            href={`/tasks?filter=${f}`}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-[#1a1814] text-white'
                : 'bg-[#f7f5f0] text-[#4a4540] border border-[#d6cdbc] hover:bg-[#eee8da]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Link>
        ))}
      </div>

      {tasks?.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks"
          description={
            filter === 'pending'
              ? isAdmin ? 'All caught up!' : 'No tasks assigned to you'
              : 'No tasks match this filter'
          }
          action={<Link href="/tasks/new" className="btn-primary">Add Task</Link>}
        />
      ) : (
        <div className="card divide-y divide-[#d6cdbc]">
          {(tasks as (Task & { case: Case | null; assigned_advocate: Pick<Advocate, 'id' | 'name'> | null })[]).map((t) => {
            const overdue = !t.done && t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))
            return (
              <div key={t.id} className="p-4 flex items-start gap-3">
                <TaskToggle taskId={t.id} done={t.done} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${t.done ? 'line-through text-[#8a8278]' : 'text-[#1a1814]'}`}>
                    {t.title}
                  </p>
                  {t.case && (
                    <Link href={`/cases/${t.case_id}`} className="text-xs text-[#d9a57b] font-medium mt-0.5 block">
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
                    {/* Admins can reassign; non-admins see who is assigned */}
                    {isAdmin && advocates.length > 0 ? (
                      <AssignSelect
                        table="tasks"
                        recordId={t.id}
                        currentAssignedTo={t.assigned_to}
                        advocates={advocates}
                      />
                    ) : t.assigned_advocate ? (
                      <span className="text-xs text-[#8a8278]">
                        {t.assigned_advocate.name}
                      </span>
                    ) : null}
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

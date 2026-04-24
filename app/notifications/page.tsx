import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Bell, Calendar, DollarSign, CheckSquare, AlertCircle, Info, ChevronRight } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import MarkAllRead from './MarkAllRead'
import { Notification, Case } from '@/lib/types'

export const revalidate = 0

const typeIcons = {
  hearing: Calendar,
  payment: DollarSign,
  task: CheckSquare,
  alert: AlertCircle,
  info: Info,
}

const typeColors = {
  hearing: 'bg-amber-100 text-amber-700',
  payment: 'bg-emerald-100 text-emerald-700',
  task: 'bg-blue-100 text-blue-700',
  alert: 'bg-red-100 text-red-700',
  info: 'bg-gray-100 text-gray-600',
}

export default async function NotificationsPage() {
  const db = createServerClient()

  const { data: notifications } = await db
    .from('notifications')
    .select('*, case:cases(id, case_name)')
    .order('created_at', { ascending: false })

  const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-[#8a8278] mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && <MarkAllRead />}
      </div>

      {notifications?.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="card divide-y divide-[#d6cdbc]">
          {(notifications as (Notification & { case: Case | null })[]).map((n) => {
            const Icon = typeIcons[n.type] ?? Info
            const colorClass = typeColors[n.type] ?? typeColors.info

            return (
              <div
                key={n.id}
                className={`p-4 flex items-start gap-3 first:rounded-t-2xl last:rounded-b-2xl ${
                  !n.is_read ? 'bg-[#f7f5f0]' : 'bg-transparent opacity-70'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-[#1a1814]">{n.title}</p>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#d9a57b] flex-shrink-0" />
                    )}
                  </div>
                  {n.message && <p className="text-xs text-[#4a4540] mt-0.5 leading-relaxed">{n.message}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-[#8a8278]">
                      {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                    </p>
                    {n.case && (
                      <Link href={`/cases/${n.case_id}`} className="text-xs text-[#d9a57b] font-medium flex items-center gap-0.5">
                        {(n.case as any).case_name} <ChevronRight size={10} />
                      </Link>
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

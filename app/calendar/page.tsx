import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { getFirmId } from '@/lib/auth'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from 'date-fns'
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { Hearing, Case } from '@/lib/types'

export const revalidate = 0

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string }
}) {
  const db = createServerClient()
  const firmId = await getFirmId()

  const now = new Date()
  const monthParam = searchParams.month
  const viewDate = monthParam ? new Date(monthParam + '-01') : now
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)

  const { data: hearings } = await db
    .from('hearings')
    .select('*, case:cases(id, case_name, case_number)')
    .eq('firm_id', firmId)
    .gte('date', monthStart.toISOString().split('T')[0])
    .lte('date', monthEnd.toISOString().split('T')[0])
    .order('date')
    .order('time')

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDayOfWeek = getDay(monthStart)

  function hearingsOnDay(day: Date) {
    return (hearings as (Hearing & { case: Case })[] ?? []).filter(
      (h) => isSameDay(parseISO(h.date), day)
    )
  }

  const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
  const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Calendar</h1>
      </div>

      <div className="flex items-center justify-between">
        <Link href={`/calendar?month=${format(prevMonth, 'yyyy-MM')}`} className="btn-secondary px-3 py-2 text-xs">
          ← {format(prevMonth, 'MMM')}
        </Link>
        <h2 className="font-bold text-[#1a1814]">{format(viewDate, 'MMMM yyyy')}</h2>
        <Link href={`/calendar?month=${format(nextMonth, 'yyyy-MM')}`} className="btn-secondary px-3 py-2 text-xs">
          {format(nextMonth, 'MMM')} →
        </Link>
      </div>

      <div className="card p-3">
        <div className="grid grid-cols-7 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-[#8a8278] py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const dayHearings = hearingsOnDay(day)
            const today = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={`aspect-square flex flex-col items-center justify-start pt-1.5 rounded-xl text-xs cursor-default ${
                  today ? 'bg-[#d9a57b] text-white' : 'hover:bg-[#eee8da]'
                }`}
              >
                <span className={`font-semibold ${today ? 'text-white' : 'text-[#1a1814]'}`}>
                  {format(day, 'd')}
                </span>
                {dayHearings.length > 0 && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${today ? 'bg-white' : 'bg-[#d9a57b]'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <section>
        <h2 className="section-title mb-3">
          Hearings in {format(viewDate, 'MMMM')} ({hearings?.length ?? 0})
        </h2>
        {hearings?.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="No hearings this month"
            description="Add hearings from a case page"
          />
        ) : (
          <div className="space-y-2">
            {(hearings as (Hearing & { case: Case })[]).map((h) => {
              const day = parseISO(h.date)
              return (
                <Link
                  key={h.id}
                  href={`/cases/${h.case_id}`}
                  className={`card p-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow ${
                    isToday(day) ? 'border-[#d9a57b]' : ''
                  }`}
                >
                  <div className="w-10 text-center flex-shrink-0">
                    <p className="text-[10px] font-bold text-[#d9a57b]">{format(day, 'EEE').toUpperCase()}</p>
                    <p className="text-xl font-bold text-[#1a1814] leading-none">{format(day, 'd')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#1a1814] truncate">{h.case?.case_name}</p>
                    <p className="text-xs text-[#8a8278]">
                      {h.purpose ?? 'Hearing'}{h.time ? ` · ${h.time}` : ''}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-[#8a8278]" />
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

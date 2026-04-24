import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { format, parseISO, isPast } from 'date-fns'
import { AlertCircle, ChevronRight } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { Fee, Case } from '@/lib/types'

export const revalidate = 0

export default async function FeesPage() {
  const db = createServerClient()

  const { data: fees } = await db
    .from('fees')
    .select('*, case:cases(id, case_name, case_number, status)')
    .order('expected_by', { ascending: true, nullsFirst: false })

  const pendingFees = (fees ?? []).filter(
    (f: Fee) => f.agreed_amount > f.paid_amount
  )

  const totalPending = pendingFees.reduce(
    (sum: number, f: Fee) => sum + (f.agreed_amount - f.paid_amount),
    0
  )

  return (
    <div className="space-y-5">
      <h1 className="page-header">Pending Fees</h1>

      {/* Summary */}
      <div className="card p-4 bg-[#d9a57b] border-0">
        <p className="text-sm font-semibold text-white/80">Total Outstanding</p>
        <p className="text-3xl font-bold text-white mt-1">
          ₹{totalPending.toLocaleString('en-IN')}
        </p>
        <p className="text-xs text-white/70 mt-1">{pendingFees.length} case{pendingFees.length !== 1 ? 's' : ''} with pending fees</p>
      </div>

      {pendingFees.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No pending fees"
          description="All fees have been collected"
        />
      ) : (
        <div className="space-y-3">
          {(pendingFees as (Fee & { case: Case })[]).map((f) => {
            const outstanding = f.agreed_amount - f.paid_amount
            const pct = Math.round((f.paid_amount / f.agreed_amount) * 100)
            const overdue = f.expected_by && isPast(parseISO(f.expected_by))

            return (
              <Link
                key={f.id}
                href={`/cases/${f.case_id}`}
                className="card p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm text-[#1a1814]">{f.case?.case_name}</p>
                    <p className="text-xs text-[#8a8278]">{(f.case as any)?.case_number}</p>
                  </div>
                  <ChevronRight size={16} className="text-[#8a8278]" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8a8278]">Outstanding</span>
                    <span className={`font-bold ${overdue ? 'text-red-600' : 'text-[#1a1814]'}`}>
                      ₹{outstanding.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#eee8da] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[#8a8278]">
                    <span>{pct}% received</span>
                    {f.expected_by && (
                      <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                        {overdue ? 'Overdue · ' : 'Due '}
                        {format(parseISO(f.expected_by), 'dd MMM yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft, Plus, Calendar, CheckSquare, DollarSign,
  User, Phone, ChevronRight, Edit, AlertCircle
} from 'lucide-react'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import AssignSelect from '@/components/ui/AssignSelect'
import { Case, Hearing, Task, Fee, Transaction, Advocate } from '@/lib/types'

export const revalidate = 0

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const db = createServerClient()

  const [
    { data: caseData },
    { data: hearings },
    { data: tasks },
    { data: fees },
    { data: transactions },
    { data: advocates },
  ] = await Promise.all([
    db.from('cases').select('*, client:clients(*), assigned_advocate:advocates!assigned_to(id, name)').eq('id', params.id).single(),
    db.from('hearings').select('*').eq('case_id', params.id).order('date'),
    db.from('tasks').select('*, assigned_advocate:advocates!assigned_to(id, name)').eq('case_id', params.id).order('created_at', { ascending: false }),
    db.from('fees').select('*').eq('case_id', params.id),
    db.from('transactions').select('*').eq('case_id', params.id).order('date', { ascending: false }),
    db.from('advocates').select('id, name').order('name'),
  ])

  if (!caseData) notFound()

  const c = caseData as Case & { client: any; assigned_advocate: Pick<Advocate, 'id' | 'name'> | null }
  const advocateList = (advocates ?? []) as Pick<Advocate, 'id' | 'name'>[]
  const fee = fees?.[0] as Fee | undefined
  const pendingAmount = fee ? Math.max(0, fee.agreed_amount - fee.paid_amount) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/cases" className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da]">
          <ArrowLeft size={16} className="text-[#4a4540]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg text-[#1a1814] truncate">{c.case_name}</h1>
          <p className="text-xs text-[#8a8278]">{c.case_number}</p>
        </div>
        <StatusBadge status={c.status} />
      </div>

      {/* Case Info Card */}
      <div className="card p-4 space-y-3">
        <h2 className="section-title">Case Details</h2>
        {c.court && (
          <div className="flex justify-between text-sm">
            <span className="text-[#8a8278]">Court</span>
            <span className="font-medium text-[#1a1814] text-right max-w-[60%]">{c.court}</span>
          </div>
        )}
        {c.judge && (
          <div className="flex justify-between text-sm">
            <span className="text-[#8a8278]">Judge</span>
            <span className="font-medium text-[#1a1814]">{c.judge}</span>
          </div>
        )}
        {c.filing_date && (
          <div className="flex justify-between text-sm">
            <span className="text-[#8a8278]">Filed On</span>
            <span className="font-medium text-[#1a1814]">{format(parseISO(c.filing_date), 'dd MMM yyyy')}</span>
          </div>
        )}
        {/* Advocate assignment */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#8a8278]">Advocate</span>
          {advocateList.length > 0 ? (
            <AssignSelect
              table="cases"
              recordId={c.id}
              currentAssignedTo={c.assigned_to}
              advocates={advocateList}
            />
          ) : (
            <span className="text-xs text-[#8a8278]">No advocates added</span>
          )}
        </div>
        {c.description && (
          <p className="text-sm text-[#4a4540] pt-1 border-t border-[#d6cdbc]">{c.description}</p>
        )}
      </div>

      {/* Client Card */}
      {c.client && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Client</h2>
            <Link href={`/clients/${c.client.id}`} className="text-xs text-[#d9a57b] font-semibold flex items-center gap-1">
              View <ChevronRight size={12} />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eee8da] flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-[#4a4540]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#1a1814]">{c.client.name}</p>
              {c.client.phone && (
                <a href={`tel:${c.client.phone}`} className="text-xs text-[#8a8278] flex items-center gap-1 mt-0.5">
                  <Phone size={10} /> {c.client.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fees Summary */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Fees</h2>
          <Link href={`/cases/${params.id}/payment/new`} className="text-xs text-[#d9a57b] font-semibold flex items-center gap-1">
            <Plus size={12} /> Add Payment
          </Link>
        </div>
        {fee ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#8a8278]">Agreed Amount</span>
              <span className="font-semibold text-[#1a1814]">₹{fee.agreed_amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8a8278]">Paid</span>
              <span className="font-semibold text-emerald-600">₹{fee.paid_amount.toLocaleString('en-IN')}</span>
            </div>
            {pendingAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#8a8278]">Pending</span>
                <span className="font-semibold text-red-600">₹{pendingAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            {/* Progress bar */}
            <div className="mt-2">
              <div className="h-2 bg-[#eee8da] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (fee.paid_amount / fee.agreed_amount) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-[#8a8278] mt-1">
                {Math.round((fee.paid_amount / fee.agreed_amount) * 100)}% received
                {fee.expected_by && ` · Due ${format(parseISO(fee.expected_by), 'dd MMM yyyy')}`}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#8a8278]">No fee agreement recorded</p>
        )}
      </div>

      {/* Hearings */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Hearings ({hearings?.length ?? 0})</h2>
          <Link href={`/cases/${params.id}/hearing/new`} className="text-xs text-[#d9a57b] font-semibold flex items-center gap-1">
            <Plus size={12} /> Add
          </Link>
        </div>
        {hearings?.length ? (
          <div className="divide-y divide-[#d6cdbc]">
            {(hearings as Hearing[]).map((h) => (
              <div key={h.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                <div className="w-10 text-center">
                  <p className="text-[10px] font-bold text-[#d9a57b]">{format(parseISO(h.date), 'MMM').toUpperCase()}</p>
                  <p className="text-lg font-bold text-[#1a1814] leading-none">{format(parseISO(h.date), 'd')}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-[#1a1814]">{h.purpose ?? 'Hearing'}</p>
                  <p className="text-xs text-[#8a8278]">{h.time ? `${h.time}` : 'Time TBD'}{h.court ? ` · ${h.court}` : ''}</p>
                  {h.notes && <p className="text-xs text-[#8a8278]">{h.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#8a8278]">No hearings scheduled</p>
        )}
      </div>

      {/* Tasks */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Tasks ({tasks?.length ?? 0})</h2>
          <Link href={`/cases/${params.id}/task/new`} className="text-xs text-[#d9a57b] font-semibold flex items-center gap-1">
            <Plus size={12} /> Add
          </Link>
        </div>
        {tasks?.length ? (
          <div className="divide-y divide-[#d6cdbc]">
            {(tasks as (Task & { assigned_advocate: Pick<Advocate, 'id' | 'name'> | null })[]).map((t) => (
              <div key={t.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${t.done ? 'bg-emerald-500 border-emerald-500' : 'border-[#d6cdbc]'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${t.done ? 'line-through text-[#8a8278]' : 'text-[#1a1814]'}`}>{t.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <PriorityBadge priority={t.priority} />
                    {t.due_date && <span className="text-xs text-[#8a8278]">Due {format(parseISO(t.due_date), 'dd MMM')}</span>}
                    {advocateList.length > 0 && (
                      <AssignSelect
                        table="tasks"
                        recordId={t.id}
                        currentAssignedTo={t.assigned_to}
                        advocates={advocateList}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#8a8278]">No tasks added</p>
        )}
      </div>

      {/* Transaction History */}
      {transactions && transactions.length > 0 && (
        <div className="card p-4">
          <h2 className="section-title mb-3">Payment History</h2>
          <div className="divide-y divide-[#d6cdbc]">
            {(transactions as Transaction[]).map((t) => (
              <div key={t.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1a1814]">{t.description ?? t.type}</p>
                  <p className="text-xs text-[#8a8278]">{format(parseISO(t.date), 'dd MMM yyyy')}</p>
                </div>
                <span className={`text-sm font-bold ${t.type === 'payment' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {t.type === 'payment' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

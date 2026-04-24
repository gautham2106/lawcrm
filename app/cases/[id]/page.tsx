import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { getUserProfile } from '@/lib/auth'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft, Plus, Calendar, CheckSquare, DollarSign,
  User, Phone, ChevronRight, FileText, MessageSquare,
  Paperclip, Tag, BookOpen, Mail, MapPin
} from 'lucide-react'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { Case, Hearing, Task, Fee, Transaction, CaseNote, CaseDocument } from '@/lib/types'

export const revalidate = 0

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const db = createServerClient()
  const profile = await getUserProfile()
  const isAdmin = profile?.role === 'admin'

  const [
    { data: caseData },
    { data: hearings },
    { data: tasks },
    { data: fees },
    { data: transactions },
    { data: caseNotes },
    { data: documents },
  ] = await Promise.all([
    db.from('cases').select('*, client:clients(*)').eq('id', params.id).single(),
    db.from('hearings').select('*').eq('case_id', params.id).order('date'),
    db.from('tasks').select('*').eq('case_id', params.id).order('created_at', { ascending: false }),
    db.from('fees').select('*').eq('case_id', params.id),
    isAdmin
      ? db.from('transactions').select('*').eq('case_id', params.id).order('date', { ascending: false })
      : Promise.resolve({ data: [] }),
    db.from('case_notes').select('*').eq('case_id', params.id).order('created_at', { ascending: false }),
    db.from('case_documents')
      .select('*, annotations:document_annotations(*)')
      .eq('case_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  if (!caseData) notFound()

  const c = caseData as Case & { client: any }
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
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={c.status} />
          {c.stage && (
            <span className="badge bg-[#eee8da] text-[#4a4540] text-[10px]">{c.stage}</span>
          )}
        </div>
      </div>

      {/* Case Info Card */}
      <div className="card p-4 space-y-3">
        <h2 className="section-title">Case Details</h2>
        {c.advocate_name && (
          <div className="flex justify-between text-sm">
            <span className="text-[#8a8278]">Advocate</span>
            <span className="font-medium text-[#1a1814] flex items-center gap-1">
              <User size={12} className="text-[#d9a57b]" />{c.advocate_name}
            </span>
          </div>
        )}
        {c.stage && (
          <div className="flex justify-between text-sm">
            <span className="text-[#8a8278]">Stage</span>
            <span className="font-medium text-[#1a1814]">{c.stage}</span>
          </div>
        )}
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
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eee8da] flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-[#4a4540]" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm text-[#1a1814]">{c.client.name}</p>
              {c.client.phone && (
                <a href={`tel:${c.client.phone}`} className="text-xs text-[#8a8278] flex items-center gap-1">
                  <Phone size={10} /> {c.client.phone}
                </a>
              )}
              {c.client.email && (
                <a href={`mailto:${c.client.email}`} className="text-xs text-[#8a8278] flex items-center gap-1">
                  <Mail size={10} /> {c.client.email}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fees Summary — admin only */}
      {isAdmin && (
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
      )}

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
                  {h.notes && <p className="text-xs text-[#8a8278] mt-0.5 italic">{h.notes}</p>}
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
            {(tasks as Task[]).map((t) => (
              <div key={t.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${t.done ? 'bg-emerald-500 border-emerald-500' : 'border-[#d6cdbc]'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${t.done ? 'line-through text-[#8a8278]' : 'text-[#1a1814]'}`}>{t.title}</p>
                    {t.task_type === 'meeting' && (
                      <span className="badge bg-blue-50 text-blue-600 text-[10px]">Meeting</span>
                    )}
                  </div>
                  {t.task_type === 'meeting' && (t.meeting_location || t.meeting_with) && (
                    <p className="text-xs text-[#8a8278] mt-0.5">
                      {t.meeting_with && `With: ${t.meeting_with}`}
                      {t.meeting_with && t.meeting_location && ' · '}
                      {t.meeting_location && t.meeting_location}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <PriorityBadge priority={t.priority} />
                    {t.due_date && <span className="text-xs text-[#8a8278]">Due {format(parseISO(t.due_date), 'dd MMM')}</span>}
                    {t.advocate_name && <span className="text-xs text-[#8a8278]">· {t.advocate_name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#8a8278]">No tasks added</p>
        )}
      </div>

      {/* Case Notes */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Case Notes ({caseNotes?.length ?? 0})</h2>
          <Link href={`/cases/${params.id}/note/new`} className="text-xs text-[#d9a57b] font-semibold flex items-center gap-1">
            <Plus size={12} /> Add Note
          </Link>
        </div>
        {caseNotes?.length ? (
          <div className="divide-y divide-[#d6cdbc]">
            {(caseNotes as CaseNote[]).map((n) => (
              <div key={n.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm text-[#1a1814] whitespace-pre-wrap leading-relaxed">{n.content}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {n.author_name && (
                    <span className="text-xs text-[#d9a57b] font-medium">{n.author_name}</span>
                  )}
                  <span className="text-xs text-[#8a8278]">
                    {format(parseISO(n.created_at), 'dd MMM yyyy, HH:mm')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <MessageSquare size={24} className="text-[#d6cdbc]" />
            <p className="text-sm text-[#8a8278]">No case notes yet. Add strategy notes, client instructions, or call summaries.</p>
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Documents ({documents?.length ?? 0})</h2>
          <Link href={`/cases/${params.id}/document/new`} className="text-xs text-[#d9a57b] font-semibold flex items-center gap-1">
            <Plus size={12} /> Upload
          </Link>
        </div>
        {documents?.length ? (
          <div className="divide-y divide-[#d6cdbc]">
            {(documents as CaseDocument[]).map((doc) => (
              <div key={doc.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#eee8da] flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-[#4a4540]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="font-medium text-sm text-[#1a1814] hover:text-[#d9a57b] truncate">
                          {doc.name}
                        </a>
                      ) : (
                        <span className="font-medium text-sm text-[#1a1814] truncate">{doc.name}</span>
                      )}
                      {doc.tag && (
                        <span className="badge bg-[#eee8da] text-[#4a4540] text-[10px] flex items-center gap-1">
                          <Tag size={8} />{doc.tag}
                        </span>
                      )}
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-[#8a8278] mt-0.5 italic">{doc.notes}</p>
                    )}
                    <p className="text-xs text-[#8a8278] mt-0.5">
                      {format(parseISO(doc.created_at), 'dd MMM yyyy')}
                      {doc.file_size && ` · ${(doc.file_size / 1024).toFixed(0)} KB`}
                    </p>

                    {/* Page Annotations */}
                    {doc.annotations && doc.annotations.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {doc.annotations.map((ann) => (
                          <a
                            key={ann.id}
                            href={doc.url ? `${doc.url}#page=${ann.page_number}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 text-xs text-[#4a4540] hover:text-[#d9a57b] group"
                          >
                            <span className="flex-shrink-0 font-semibold text-[#d9a57b] group-hover:underline">
                              p.{ann.page_number}
                            </span>
                            <span>{ann.note}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {doc.url && (
                      <Link
                        href={`/cases/${params.id}/document/${doc.id}`}
                        className="text-xs text-[#d9a57b] font-medium mt-1 inline-flex items-center gap-1"
                      >
                        <BookOpen size={10} /> Add annotations
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Paperclip size={24} className="text-[#d6cdbc]" />
            <p className="text-sm text-[#8a8278]">No documents uploaded yet.</p>
          </div>
        )}
      </div>

      {/* Payment History — admin only */}
      {isAdmin && transactions && transactions.length > 0 && (
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

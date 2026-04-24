import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Phone, Mail, MapPin, Briefcase, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Client, Case } from '@/lib/types'

export const revalidate = 0

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const db = createServerClient()

  const [{ data: client }, { data: cases }] = await Promise.all([
    db.from('clients').select('*').eq('id', params.id).single(),
    db.from('cases').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
  ])

  if (!client) notFound()

  const c = client as Client

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/clients" className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da]">
          <ArrowLeft size={16} className="text-[#4a4540]" />
        </Link>
        <h1 className="page-header">{c.name}</h1>
      </div>

      {/* Client Info */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#d9a57b] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-lg text-[#1a1814]">{c.name}</h2>
            <p className="text-sm text-[#8a8278]">Client since {format(parseISO(c.created_at), 'MMM yyyy')}</p>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-[#d6cdbc]">
          {c.phone && (
            <a href={`tel:${c.phone}`} className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-[#eee8da] flex items-center justify-center">
                <Phone size={14} className="text-[#4a4540]" />
              </div>
              <span className="text-[#1a1814]">{c.phone}</span>
            </a>
          )}
          {c.email && (
            <a href={`mailto:${c.email}`} className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-[#eee8da] flex items-center justify-center">
                <Mail size={14} className="text-[#4a4540]" />
              </div>
              <span className="text-[#1a1814]">{c.email}</span>
            </a>
          )}
          {c.address && (
            <div className="flex items-start gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-[#eee8da] flex items-center justify-center flex-shrink-0">
                <MapPin size={14} className="text-[#4a4540]" />
              </div>
              <span className="text-[#1a1814]">{c.address}</span>
            </div>
          )}
        </div>

        {c.notes && (
          <div className="pt-2 border-t border-[#d6cdbc]">
            <p className="text-xs font-semibold text-[#8a8278] uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-[#4a4540]">{c.notes}</p>
          </div>
        )}
      </div>

      {/* Cases */}
      <div>
        <h2 className="section-title mb-3">Cases ({cases?.length ?? 0})</h2>
        {cases?.length ? (
          <div className="space-y-2">
            {(cases as Case[]).map((cs) => (
              <Link
                key={cs.id}
                href={`/cases/${cs.id}`}
                className="card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
              >
                <div className="w-9 h-9 rounded-xl bg-[#eee8da] flex items-center justify-center flex-shrink-0">
                  <Briefcase size={14} className="text-[#4a4540]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-[#1a1814] truncate">{cs.case_name}</p>
                    <StatusBadge status={cs.status} />
                  </div>
                  <p className="text-xs text-[#8a8278]">{cs.case_number}</p>
                </div>
                <ChevronRight size={16} className="text-[#8a8278]" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center text-sm text-[#8a8278]">No cases for this client</div>
        )}
      </div>
    </div>
  )
}

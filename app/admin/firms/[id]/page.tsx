import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { ArrowLeft, Building2, Mail, Phone, MapPin, Users, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export const revalidate = 0

const roleLabels: Record<string, string> = {
  senior_advocate: 'Senior Advocate',
  advocate: 'Advocate',
  junior: 'Junior',
  paralegal: 'Paralegal',
}

const roleColors: Record<string, string> = {
  senior_advocate: 'bg-blue-100 text-blue-700 border-blue-200',
  advocate:        'bg-violet-100 text-violet-700 border-violet-200',
  junior:          'bg-emerald-100 text-emerald-700 border-emerald-200',
  paralegal:       'bg-amber-100 text-amber-700 border-amber-200',
}

export default async function FirmDetailPage({ params }: { params: { id: string } }) {
  const db = createServerClient()

  const [{ data: firm }, { data: advocates }] = await Promise.all([
    db.from('firms').select('*').eq('id', params.id).single(),
    db.from('advocates').select('*').eq('firm_id', params.id).order('name'),
  ])

  if (!firm) notFound()

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin" className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 shadow-sm">
          <ArrowLeft size={16} className="text-slate-500" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{firm.name}</h1>
          <p className="text-xs text-slate-400">Registered {format(parseISO(firm.created_at), 'dd MMM yyyy')}</p>
        </div>
      </div>

      {/* Firm Info */}
      <div className="admin-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {firm.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-lg">{firm.name}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Calendar size={10} /> Created {format(parseISO(firm.created_at), 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {firm.email && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Mail size={15} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Email</p>
                <p className="text-sm text-slate-900">{firm.email}</p>
              </div>
            </div>
          )}
          {firm.phone && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Phone size={15} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Phone</p>
                <p className="text-sm text-slate-900">{firm.phone}</p>
              </div>
            </div>
          )}
          {firm.address && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <MapPin size={15} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Address</p>
                <p className="text-sm text-slate-900">{firm.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advocates / Team */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-slate-500" />
            <h2 className="font-bold text-slate-900">Team Members ({advocates?.length ?? 0})</h2>
          </div>
        </div>

        {!advocates?.length ? (
          <div className="admin-card p-8 text-center">
            <p className="text-slate-500 text-sm">No advocates assigned to this firm yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {advocates.map((a: any) => (
              <div key={a.id} className="admin-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {a.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-slate-900">{a.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColors[a.role] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {roleLabels[a.role] ?? a.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Mail size={10} /> {a.email}
                    </span>
                    {a.phone && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Phone size={10} /> {a.phone}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0">{format(parseISO(a.created_at), 'dd MMM yyyy')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

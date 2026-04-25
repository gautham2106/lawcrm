import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { Building2, Users, Plus, ChevronRight, Mail, Phone } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export const revalidate = 0

export default async function SuperAdminDashboard() {
  const db = createServerClient()

  const [{ data: firms }, { data: advocates }] = await Promise.all([
    db.from('firms').select('*, advocates:advocates(id)').order('created_at', { ascending: false }),
    db.from('advocates').select('id'),
  ])

  const totalFirms = firms?.length ?? 0
  const totalAdvocates = advocates?.length ?? 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platform overview</p>
        </div>
        <Link href="/admin/firms/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Firm
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="admin-stat">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Total Firms</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalFirms}</p>
        </div>
        <div className="admin-stat">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center">
              <Users size={20} className="text-violet-600" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Total Advocates</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalAdvocates}</p>
        </div>
      </div>

      {/* Firms list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Registered Firms</h2>
          <Link href="/admin/firms/new" className="text-sm text-blue-600 font-semibold hover:text-blue-700">
            + Add firm
          </Link>
        </div>

        {!firms?.length ? (
          <div className="admin-card p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Building2 size={24} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">No firms yet</p>
            <p className="text-sm text-slate-400 mb-4">Add the first law firm to get started</p>
            <Link href="/admin/firms/new" className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} /> Add Firm
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {firms.map((firm: any) => (
              <Link
                key={firm.id}
                href={`/admin/firms/${firm.id}`}
                className="admin-card p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                  {firm.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{firm.name}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {firm.email && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Mail size={10} /> {firm.email}
                      </span>
                    )}
                    {firm.phone && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Phone size={10} /> {firm.phone}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Users size={10} /> {(firm.advocates as any[]).length} advocates
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400">{format(parseISO(firm.created_at), 'dd MMM yyyy')}</p>
                  <ChevronRight size={16} className="text-slate-300 mt-1 ml-auto" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

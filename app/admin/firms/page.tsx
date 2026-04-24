'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Building2, Plus, ChevronRight, Users, Phone, Mail, Save, X } from 'lucide-react'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface Firm {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  created_at: string
}

export default function AdminFirmsPage() {
  const router = useRouter()
  const supabase = getSupabase()

  const [loading, setLoading] = useState(true)
  const [firms, setFirms] = useState<Firm[]>([])
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newAddress, setNewAddress] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase.from('profiles').select('is_super_admin').eq('id', user.id).single()
      if (!prof?.is_super_admin) { router.push('/'); return }

      const { data } = await supabase.from('firms').select('*').order('name')
      setFirms(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function createFirm(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data: firm, error: err } = await supabase
      .from('firms')
      .insert({
        name: newName,
        phone: newPhone || null,
        email: newEmail || null,
        address: newAddress || null,
      })
      .select()
      .single()

    if (err) { setError(err.message); setSaving(false); return }

    // Seed default firm_settings for the new firm
    await supabase.from('firm_settings').insert([
      { firm_id: firm.id, key: 'case_stages', value: ['Intake', 'Filed', 'Notice Issued', 'Evidence', 'Arguments', 'Judgment Reserved', 'Disposed', 'Closed'] },
      { firm_id: firm.id, key: 'document_tags', value: ['Petition', 'Affidavit', 'Order', 'Vakalatnama', 'Evidence', 'Bail Order', 'Notice', 'Reply'] },
      { firm_id: firm.id, key: 'advocates', value: [] },
    ])

    setFirms((prev) => [...prev, firm].sort((a, b) => a.name.localeCompare(b.name)))
    setShowNew(false)
    setNewName('')
    setNewPhone('')
    setNewEmail('')
    setNewAddress('')
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-sm text-[#8a8278]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="page-header">All Firms</h1>
        <button
          onClick={() => setShowNew(!showNew)}
          className="btn-primary flex items-center gap-1.5"
        >
          {showNew ? <X size={16} /> : <Plus size={16} />}
          {showNew ? 'Cancel' : 'New Firm'}
        </button>
      </div>

      {showNew && (
        <form onSubmit={createFirm} className="card p-4 space-y-4">
          <h2 className="section-title">New Firm</h2>
          <div>
            <label className="label">Firm Name *</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} required className="input" placeholder="e.g. Kumar & Associates" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="input" placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="label">Email</label>
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" className="input" placeholder="firm@email.com" />
          </div>
          <div>
            <label className="label">Address</label>
            <textarea value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="input min-h-[60px] resize-none" placeholder="Office address..." />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-1.5">
            <Save size={14} />
            {saving ? 'Creating...' : 'Create Firm'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {firms.map((f) => (
          <div key={f.id} className="card p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eee8da] flex items-center justify-center flex-shrink-0">
                <Building2 size={16} className="text-[#4a4540]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#1a1814]">{f.name}</p>
                <div className="space-y-0.5 mt-1">
                  {f.phone && (
                    <p className="text-xs text-[#8a8278] flex items-center gap-1">
                      <Phone size={10} /> {f.phone}
                    </p>
                  )}
                  {f.email && (
                    <p className="text-xs text-[#8a8278] flex items-center gap-1">
                      <Mail size={10} /> {f.email}
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-[#8a8278] mt-1 font-mono truncate">{f.id}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {firms.length === 0 && (
        <div className="text-center py-12 text-[#8a8278]">
          <Building2 size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No firms yet</p>
        </div>
      )}
    </div>
  )
}

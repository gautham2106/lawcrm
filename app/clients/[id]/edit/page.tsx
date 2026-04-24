'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function EditClientPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    supabase.from('clients').select('*').eq('id', params.id).single().then(({ data }) => {
      if (data) {
        setName(data.name ?? '')
        setPhone(data.phone ?? '')
        setEmail(data.email ?? '')
        setAddress(data.address ?? '')
        setNotes(data.notes ?? '')
      }
      setLoading(false)
    })
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: err } = await supabase.from('clients').update({
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      notes: notes || null,
    }).eq('id', params.id)

    if (err) { setError(err.message); setSaving(false); return }
    router.push(`/clients/${params.id}`)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-sm text-[#8a8278]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/clients/${params.id}`} className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da]">
          <ArrowLeft size={16} className="text-[#4a4540]" />
        </Link>
        <h1 className="page-header">Edit Client</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4 space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="e.g. Ravi Sharma" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="client@email.com" />
          </div>
          <div>
            <label className="label">Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="input min-h-[80px] resize-none" placeholder="Full address..." />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[60px] resize-none" placeholder="Any additional notes..." />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full flex justify-center">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

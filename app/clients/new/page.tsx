'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getClientFirmId } from '@/lib/firm'
import { ArrowLeft } from 'lucide-react'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const firmId = await getClientFirmId()
    const form = new FormData(e.currentTarget)
    const { data: client, error: err } = await supabase
      .from('clients')
      .insert({
        firm_id: firmId,
        name: form.get('name') as string,
        phone: form.get('phone') as string || null,
        email: form.get('email') as string || null,
        address: form.get('address') as string || null,
        notes: form.get('notes') as string || null,
      })
      .select('id')
      .single()

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/clients/${client.id}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/clients" className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da]">
          <ArrowLeft size={16} className="text-[#4a4540]" />
        </Link>
        <h1 className="page-header">New Client</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4 space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input name="name" required className="input" placeholder="e.g. Ravi Sharma" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input name="phone" type="tel" className="input" placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" className="input" placeholder="client@email.com" />
          </div>
          <div>
            <label className="label">Address</label>
            <textarea name="address" className="input min-h-[80px] resize-none" placeholder="Full address..." />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea name="notes" className="input min-h-[60px] resize-none" placeholder="Any additional notes..." />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center">
          {loading ? 'Saving...' : 'Add Client'}
        </button>
      </form>
    </div>
  )
}

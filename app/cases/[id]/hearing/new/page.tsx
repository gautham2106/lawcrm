'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function NewHearingPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const { error: err } = await supabase.from('hearings').insert({
      case_id: params.id,
      date: form.get('date') as string,
      time: form.get('time') as string || null,
      court: form.get('court') as string || null,
      purpose: form.get('purpose') as string || null,
      notes: form.get('notes') as string || null,
    })

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/cases/${params.id}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/cases/${params.id}`} className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da]">
          <ArrowLeft size={16} className="text-[#4a4540]" />
        </Link>
        <h1 className="page-header">Add Hearing</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4 space-y-4">
          <div>
            <label className="label">Date *</label>
            <input name="date" type="date" required className="input" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label className="label">Time</label>
            <input name="time" type="time" className="input" />
          </div>
          <div>
            <label className="label">Court</label>
            <input name="court" className="input" placeholder="e.g. High Court, Bengaluru" />
          </div>
          <div>
            <label className="label">Purpose</label>
            <input name="purpose" className="input" placeholder="e.g. Evidence Submission, Arguments" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea name="notes" className="input min-h-[80px] resize-none" placeholder="Additional notes..." />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center">
          {loading ? 'Saving...' : 'Add Hearing'}
        </button>
      </form>
    </div>
  )
}

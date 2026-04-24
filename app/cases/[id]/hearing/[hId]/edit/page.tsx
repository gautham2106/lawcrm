'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function EditHearingPage({ params }: { params: { id: string; hId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [court, setCourt] = useState('')
  const [purpose, setPurpose] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    supabase.from('hearings').select('*').eq('id', params.hId).single().then(({ data }) => {
      if (data) {
        setDate(data.date ?? '')
        setTime(data.time ?? '')
        setCourt(data.court ?? '')
        setPurpose(data.purpose ?? '')
        setNotes(data.notes ?? '')
      }
      setLoading(false)
    })
  }, [params.hId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: err } = await supabase.from('hearings').update({
      date,
      time: time || null,
      court: court || null,
      purpose: purpose || null,
      notes: notes || null,
    }).eq('id', params.hId)

    if (err) { setError(err.message); setSaving(false); return }
    router.push(`/cases/${params.id}`)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this hearing?')) return
    await supabase.from('hearings').delete().eq('id', params.hId)
    router.push(`/cases/${params.id}`)
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
        <Link href={`/cases/${params.id}`} className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da]">
          <ArrowLeft size={16} className="text-[#4a4540]" />
        </Link>
        <h1 className="page-header">Edit Hearing</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4 space-y-4">
          <div>
            <label className="label">Date *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="input" />
          </div>
          <div>
            <label className="label">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Court</label>
            <input value={court} onChange={(e) => setCourt(e.target.value)} className="input" placeholder="e.g. High Court, Bengaluru" />
          </div>
          <div>
            <label className="label">Purpose</label>
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className="input" placeholder="e.g. Evidence Submission, Arguments" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[80px] resize-none" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full flex justify-center">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          Delete Hearing
        </button>
      </form>
    </div>
  )
}

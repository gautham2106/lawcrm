'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function NewCaseNotePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const { error: err } = await supabase.from('case_notes').insert({
      case_id: params.id,
      content: form.get('content') as string,
      author_name: form.get('author_name') as string || null,
    })

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/cases/${params.id}`)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/cases/${params.id}`} className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da]">
          <ArrowLeft size={16} className="text-[#4a4540]" />
        </Link>
        <h1 className="page-header">Add Case Note</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4 space-y-4">
          <p className="text-xs text-[#8a8278]">
            Case notes are for strategy decisions, client instructions, phone call summaries, and important observations — separate from hearing notes.
          </p>
          <div>
            <label className="label">Note *</label>
            <textarea
              name="content"
              required
              className="input min-h-[160px] resize-none"
              placeholder="Write your note here..."
              autoFocus
            />
          </div>
          <div>
            <label className="label">Author</label>
            <input
              name="author_name"
              className="input"
              placeholder="e.g. Adv. Rajan Kumar"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center">
          {loading ? 'Saving...' : 'Save Note'}
        </button>
      </form>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getClientFirmId } from '@/lib/firm'
import { ArrowLeft } from 'lucide-react'

export default function NewTaskPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [firmId, setFirmId] = useState<string | null>(null)
  const [advocates, setAdvocates] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const fid = await getClientFirmId()
      setFirmId(fid)
      const { data } = await supabase
        .from('firm_settings')
        .select('value')
        .eq('key', 'advocates')
        .eq('firm_id', fid)
        .single()
      if (data?.value) setAdvocates(data.value as string[])
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const { error: err } = await supabase.from('tasks').insert({
      firm_id: firmId,
      case_id: params.id,
      title: form.get('title') as string,
      description: form.get('description') as string || null,
      due_date: form.get('due_date') as string || null,
      priority: form.get('priority') as string,
      advocate_name: form.get('advocate_name') as string || null,
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
        <h1 className="page-header">Add Task</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4 space-y-4">
          <div>
            <label className="label">Task Title *</label>
            <input name="title" required className="input" placeholder="e.g. File evidence documents" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" className="input min-h-[80px] resize-none" placeholder="Details..." />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input name="due_date" type="date" className="input" />
          </div>
          <div>
            <label className="label">Priority</label>
            <select name="priority" className="input" defaultValue="medium">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          {advocates.length > 0 ? (
            <div>
              <label className="label">Assigned To</label>
              <select name="advocate_name" className="input" defaultValue="">
                <option value="">— Unassigned —</option>
                {advocates.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="label">Assigned To</label>
              <input name="advocate_name" className="input" placeholder="e.g. Adv. Rajan Kumar" />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center">
          {loading ? 'Saving...' : 'Add Task'}
        </button>
      </form>
    </div>
  )
}

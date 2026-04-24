'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function NewTaskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const { error: err } = await supabase.from('tasks').insert({
      title: form.get('title') as string,
      description: form.get('description') as string || null,
      due_date: form.get('due_date') as string || null,
      priority: form.get('priority') as string,
    })

    if (err) { setError(err.message); setLoading(false); return }
    router.push('/tasks')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/tasks" className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da]">
          <ArrowLeft size={16} className="text-[#4a4540]" />
        </Link>
        <h1 className="page-header">New Task</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4 space-y-4">
          <div>
            <label className="label">Task Title *</label>
            <input name="title" required className="input" placeholder="e.g. Renew Bar Council membership" />
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
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center">
          {loading ? 'Saving...' : 'Add Task'}
        </button>
      </form>
    </div>
  )
}

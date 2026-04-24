'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getClientFirmId } from '@/lib/firm'
import { ArrowLeft } from 'lucide-react'

export default function NewTaskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [taskType, setTaskType] = useState<'task' | 'meeting'>('task')
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
      title: form.get('title') as string,
      description: form.get('description') as string || null,
      due_date: form.get('due_date') as string || null,
      priority: form.get('priority') as string,
      task_type: taskType,
      meeting_location: taskType === 'meeting' ? (form.get('meeting_location') as string || null) : null,
      meeting_with: taskType === 'meeting' ? (form.get('meeting_with') as string || null) : null,
      advocate_name: form.get('advocate_name') as string || null,
    })

    if (err) { setError(err.message); setLoading(false); return }
    router.push('/tasks')
    router.refresh()
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
            <label className="label">Task Type</label>
            <div className="flex gap-2">
              {(['task', 'meeting'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTaskType(type)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    taskType === type
                      ? 'bg-[#1a1814] text-white border-[#1a1814]'
                      : 'bg-[#f7f5f0] text-[#4a4540] border-[#d6cdbc]'
                  }`}
                >
                  {type === 'task' ? '☐ Task' : '📅 Meeting'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">{taskType === 'meeting' ? 'Meeting Title *' : 'Task Title *'}</label>
            <input
              name="title"
              required
              className="input"
              placeholder={taskType === 'meeting' ? 'e.g. Client consultation' : 'e.g. File counter affidavit'}
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea name="description" className="input min-h-[80px] resize-none" placeholder="Details..." />
          </div>

          {taskType === 'meeting' && (
            <>
              <div>
                <label className="label">With Whom</label>
                <input name="meeting_with" className="input" placeholder="e.g. Client / Opposite Counsel" />
              </div>
              <div>
                <label className="label">Location</label>
                <input name="meeting_location" className="input" placeholder="e.g. Office / Court Room 3 / Video call" />
              </div>
            </>
          )}

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
          {loading ? 'Saving...' : taskType === 'meeting' ? 'Add Meeting' : 'Add Task'}
        </button>
      </form>
    </div>
  )
}

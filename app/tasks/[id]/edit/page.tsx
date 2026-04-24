'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getClientFirmId } from '@/lib/firm'
import { ArrowLeft } from 'lucide-react'

export default function EditTaskPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')
  const [taskType, setTaskType] = useState<'task' | 'meeting'>('task')
  const [meetingWith, setMeetingWith] = useState('')
  const [meetingLocation, setMeetingLocation] = useState('')
  const [advocateName, setAdvocateName] = useState('')
  const [advocates, setAdvocates] = useState<string[]>([])
  const [backPath, setBackPath] = useState('/tasks')

  useEffect(() => {
    async function load() {
      const firmId = await getClientFirmId()

      const [{ data: task }, { data: advSetting }] = await Promise.all([
        supabase.from('tasks').select('*').eq('id', params.id).single(),
        supabase.from('firm_settings').select('value').eq('key', 'advocates').eq('firm_id', firmId).single(),
      ])

      if (task) {
        setTitle(task.title ?? '')
        setDescription(task.description ?? '')
        setDueDate(task.due_date ?? '')
        setPriority(task.priority ?? 'medium')
        setTaskType(task.task_type ?? 'task')
        setMeetingWith(task.meeting_with ?? '')
        setMeetingLocation(task.meeting_location ?? '')
        setAdvocateName(task.advocate_name ?? '')
        setBackPath(task.case_id ? `/cases/${task.case_id}` : '/tasks')
      }

      if (advSetting?.value) setAdvocates(advSetting.value as string[])
      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: err } = await supabase.from('tasks').update({
      title,
      description: description || null,
      due_date: dueDate || null,
      priority,
      task_type: taskType,
      meeting_with: taskType === 'meeting' ? (meetingWith || null) : null,
      meeting_location: taskType === 'meeting' ? (meetingLocation || null) : null,
      advocate_name: advocateName || null,
    }).eq('id', params.id)

    if (err) { setError(err.message); setSaving(false); return }
    router.push(backPath)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', params.id)
    router.push(backPath)
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
        <Link href={backPath} className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da]">
          <ArrowLeft size={16} className="text-[#4a4540]" />
        </Link>
        <h1 className="page-header">Edit Task</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4 space-y-4">

          {/* Type toggle */}
          <div>
            <label className="label">Task Type</label>
            <div className="flex gap-2">
              {(['task', 'meeting'] as const).map((type) => (
                <button key={type} type="button" onClick={() => setTaskType(type)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${taskType === type ? 'bg-[#1a1814] text-white border-[#1a1814]' : 'bg-[#f7f5f0] text-[#4a4540] border-[#d6cdbc]'}`}>
                  {type === 'task' ? '☐ Task' : '📅 Meeting'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="input" />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[80px] resize-none" />
          </div>

          {taskType === 'meeting' && (
            <>
              <div>
                <label className="label">With Whom</label>
                <input value={meetingWith} onChange={(e) => setMeetingWith(e.target.value)} className="input" placeholder="e.g. Client / Opposite Counsel" />
              </div>
              <div>
                <label className="label">Location</label>
                <input value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} className="input" placeholder="e.g. Office / Court Room 3" />
              </div>
            </>
          )}

          <div>
            <label className="label">Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
          </div>

          <div>
            <label className="label">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {advocates.length > 0 ? (
            <div>
              <label className="label">Assigned To</label>
              <select value={advocateName} onChange={(e) => setAdvocateName(e.target.value)} className="input">
                <option value="">— Unassigned —</option>
                {advocates.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="label">Assigned To</label>
              <input value={advocateName} onChange={(e) => setAdvocateName(e.target.value)} className="input" placeholder="e.g. Adv. Rajan Kumar" />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full flex justify-center">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <button type="button" onClick={handleDelete}
          className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
          Delete Task
        </button>
      </form>
    </div>
  )
}

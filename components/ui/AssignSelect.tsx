'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UserCircle } from 'lucide-react'
import { Advocate } from '@/lib/types'

interface AssignSelectProps {
  table: 'tasks' | 'cases'
  recordId: string
  currentAssignedTo: string | null
  advocates: Pick<Advocate, 'id' | 'name'>[]
}

export default function AssignSelect({
  table,
  recordId,
  currentAssignedTo,
  advocates,
}: AssignSelectProps) {
  const [assignedTo, setAssignedTo] = useState(currentAssignedTo)
  const [saving, setSaving] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value || null
    setSaving(true)
    await supabase.from(table).update({ assigned_to: value }).eq('id', recordId)
    setAssignedTo(value)
    setSaving(false)
  }

  return (
    <div className="flex items-center gap-1">
      <UserCircle size={13} className={`flex-shrink-0 ${saving ? 'text-[#d9a57b]' : 'text-[#8a8278]'}`} />
      <select
        value={assignedTo ?? ''}
        onChange={handleChange}
        disabled={saving}
        className="text-xs text-[#4a4540] bg-transparent border-none outline-none cursor-pointer appearance-none max-w-[130px] truncate disabled:opacity-60"
      >
        <option value="">Unassigned</option>
        {advocates.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
    </div>
  )
}

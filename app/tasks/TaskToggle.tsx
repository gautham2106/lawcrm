'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function TaskToggle({ taskId, done }: { taskId: string; done: boolean }) {
  const [checked, setChecked] = useState(done)
  const router = useRouter()

  async function toggle() {
    const next = !checked
    setChecked(next)
    await supabase.from('tasks').update({ done: next }).eq('id', taskId)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
        checked ? 'bg-emerald-500 border-emerald-500' : 'border-[#d6cdbc] hover:border-[#d9a57b]'
      }`}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

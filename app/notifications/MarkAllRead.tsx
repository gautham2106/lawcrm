'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MarkAllRead() {
  const router = useRouter()

  async function markAll() {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    router.refresh()
  }

  return (
    <button onClick={markAll} className="text-xs text-[#d9a57b] font-semibold">
      Mark all read
    </button>
  )
}

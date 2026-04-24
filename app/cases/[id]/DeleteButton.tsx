'use client'

import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  table: string
  id: string
  redirectTo: string
  label?: string
}

export default function DeleteButton({ table, id, redirectTo, label }: Props) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Delete this ${label ?? 'item'}?`)) return
    await (supabase as any).from(table).delete().eq('id', id)
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      className="w-7 h-7 rounded-lg bg-[#eee8da] flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors flex-shrink-0 text-[#8a8278]"
    >
      <Trash2 size={12} />
    </button>
  )
}

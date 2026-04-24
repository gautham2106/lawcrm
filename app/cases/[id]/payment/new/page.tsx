'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function NewPaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const amount = parseFloat(form.get('amount') as string)
    const type = form.get('type') as string

    // Insert transaction
    const { error: txErr } = await supabase.from('transactions').insert({
      case_id: params.id,
      amount,
      type,
      description: form.get('description') as string || null,
      date: form.get('date') as string,
    })
    if (txErr) { setError(txErr.message); setLoading(false); return }

    // Update paid_amount on the fee record if it's a payment
    if (type === 'payment') {
      const { data: fees } = await supabase
        .from('fees')
        .select('id, paid_amount')
        .eq('case_id', params.id)
        .single()

      if (fees) {
        await supabase
          .from('fees')
          .update({ paid_amount: fees.paid_amount + amount })
          .eq('id', fees.id)
      }
    }

    router.push(`/cases/${params.id}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/cases/${params.id}`} className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da]">
          <ArrowLeft size={16} className="text-[#4a4540]" />
        </Link>
        <h1 className="page-header">Add Payment</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4 space-y-4">
          <div>
            <label className="label">Amount (₹) *</label>
            <input name="amount" type="number" min="1" step="100" required className="input" placeholder="0" />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type" className="input" defaultValue="payment">
              <option value="payment">Payment Received</option>
              <option value="fee">Fee / Charge</option>
              <option value="expense">Expense</option>
              <option value="refund">Refund</option>
            </select>
          </div>
          <div>
            <label className="label">Date *</label>
            <input name="date" type="date" required className="input" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label className="label">Description</label>
            <input name="description" className="input" placeholder="e.g. Advance payment, Second installment" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center">
          {loading ? 'Saving...' : 'Record Payment'}
        </button>
      </form>
    </div>
  )
}

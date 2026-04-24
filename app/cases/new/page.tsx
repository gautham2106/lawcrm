'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function NewCasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const data = {
      case_number: form.get('case_number') as string,
      case_name: form.get('case_name') as string,
      status: form.get('status') as string,
      court: form.get('court') as string || null,
      judge: form.get('judge') as string || null,
      filing_date: form.get('filing_date') as string || null,
      description: form.get('description') as string || null,
    }

    const { data: created, error: err } = await supabase
      .from('cases')
      .insert(data)
      .select('id')
      .single()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    // Create fee record
    const agreedAmount = parseFloat(form.get('agreed_amount') as string) || 0
    if (agreedAmount > 0) {
      await supabase.from('fees').insert({
        case_id: created.id,
        agreed_amount: agreedAmount,
        expected_by: form.get('fee_expected_by') as string || null,
      })
    }

    router.push(`/cases/${created.id}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/cases" className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da]">
          <ArrowLeft size={16} className="text-[#4a4540]" />
        </Link>
        <h1 className="page-header">New Case</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4 space-y-4">
          <h2 className="section-title">Case Information</h2>

          <div>
            <label className="label">Case Number *</label>
            <input name="case_number" required className="input" placeholder="e.g. CAS-2024-001" />
          </div>

          <div>
            <label className="label">Case Name *</label>
            <input name="case_name" required className="input" placeholder="e.g. Sharma vs State" />
          </div>

          <div>
            <label className="label">Status</label>
            <select name="status" className="input" defaultValue="active">
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div>
            <label className="label">Court</label>
            <input name="court" className="input" placeholder="e.g. High Court, Bengaluru" />
          </div>

          <div>
            <label className="label">Judge</label>
            <input name="judge" className="input" placeholder="e.g. Hon. Justice Reddy" />
          </div>

          <div>
            <label className="label">Filing Date</label>
            <input name="filing_date" type="date" className="input" />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea name="description" className="input min-h-[80px] resize-none" placeholder="Brief description of the case..." />
          </div>
        </div>

        <div className="card p-4 space-y-4">
          <h2 className="section-title">Fee Details</h2>

          <div>
            <label className="label">Agreed Fee (₹)</label>
            <input name="agreed_amount" type="number" min="0" step="500" className="input" placeholder="0" />
          </div>

          <div>
            <label className="label">Expected Payment By</label>
            <input name="fee_expected_by" type="date" className="input" />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex">
          {loading ? 'Creating...' : 'Create Case'}
        </button>
      </form>
    </div>
  )
}

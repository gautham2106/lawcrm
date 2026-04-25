'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Building2, User } from 'lucide-react'

export default function NewFirmPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const payload = {
      firm: {
        name:    form.get('firm_name') as string,
        email:   form.get('firm_email') as string || null,
        phone:   form.get('firm_phone') as string || null,
        address: form.get('firm_address') as string || null,
      },
      admin: {
        name:     form.get('admin_name') as string,
        email:    form.get('admin_email') as string,
        password: form.get('admin_password') as string,
        phone:    form.get('admin_phone') as string || null,
      },
    }

    const res = await fetch('/api/admin/firms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Failed to create firm')
      setLoading(false)
      return
    }

    router.push('/admin/firms/' + json.firmId)
    router.refresh()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 shadow-sm">
          <ArrowLeft size={16} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Add New Firm</h1>
          <p className="text-sm text-slate-500">Create a firm and its admin account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Firm Details */}
        <div className="admin-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 size={14} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-slate-900">Firm Details</h2>
          </div>

          <div>
            <label className="label">Firm Name *</label>
            <input name="firm_name" required className="input" placeholder="e.g. Sharma & Associates" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input name="firm_email" type="email" className="input" placeholder="firm@example.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="firm_phone" type="tel" className="input" placeholder="+91 98765 43210" />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <input name="firm_address" className="input" placeholder="Office address" />
          </div>
        </div>

        {/* Firm Admin */}
        <div className="admin-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
              <User size={14} className="text-violet-600" />
            </div>
            <h2 className="font-semibold text-slate-900">Firm Admin Account</h2>
          </div>
          <p className="text-xs text-slate-400 -mt-2">This person will have full access to manage the firm's cases and team.</p>

          <div>
            <label className="label">Full Name *</label>
            <input name="admin_name" required className="input" placeholder="e.g. Rajesh Sharma" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input name="admin_phone" type="tel" className="input" placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="label">Email Address *</label>
            <input name="admin_email" type="email" required className="input" placeholder="admin@firma.com" />
          </div>
          <div>
            <label className="label">Password *</label>
            <div className="relative">
              <input
                name="admin_password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="input pr-10"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</div>
        )}

        <div className="flex gap-3">
          <Link href="/admin" className="btn-secondary flex-1 flex justify-center">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex justify-center">
            {loading ? 'Creating…' : 'Create Firm'}
          </button>
        </div>
      </form>
    </div>
  )
}

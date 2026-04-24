'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function NewAdvocatePage() {
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
      name: form.get('name') as string,
      email: form.get('email') as string,
      password: form.get('password') as string,
      role: form.get('role') as string,
      phone: form.get('phone') as string || null,
    }

    const res = await fetch('/api/advocates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Failed to add member')
      setLoading(false)
      return
    }

    router.push('/advocates')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/advocates" className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da]">
          <ArrowLeft size={16} className="text-[#4a4540]" />
        </Link>
        <h1 className="page-header">Add Team Member</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4 space-y-4">
          <h2 className="section-title">Member Details</h2>

          <div>
            <label className="label">Full Name *</label>
            <input name="name" required className="input" placeholder="e.g. Arjun Sharma" />
          </div>

          <div>
            <label className="label">Role</label>
            <select name="role" className="input" defaultValue="advocate">
              <option value="senior_advocate">Senior Advocate</option>
              <option value="advocate">Advocate</option>
              <option value="junior">Junior</option>
              <option value="paralegal">Paralegal</option>
            </select>
          </div>

          <div>
            <label className="label">Phone</label>
            <input name="phone" type="tel" className="input" placeholder="+91 98765 43210" />
          </div>
        </div>

        <div className="card p-4 space-y-4">
          <h2 className="section-title">Login Credentials</h2>

          <div>
            <label className="label">Email Address *</label>
            <input name="email" type="email" required className="input" placeholder="advocate@firm.com" />
          </div>

          <div>
            <label className="label">Password *</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="input pr-10"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8278] hover:text-[#4a4540]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center">
          {loading ? 'Adding...' : 'Add Team Member'}
        </button>
      </form>
    </div>
  )
}

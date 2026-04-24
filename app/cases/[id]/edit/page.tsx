'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getClientFirmId } from '@/lib/firm'
import { ArrowLeft } from 'lucide-react'

export default function EditCasePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [caseNumber, setCaseNumber] = useState('')
  const [caseName, setCaseName] = useState('')
  const [status, setStatus] = useState('active')
  const [stage, setStage] = useState('')
  const [advocateName, setAdvocateName] = useState('')
  const [clientId, setClientId] = useState('')
  const [court, setCourt] = useState('')
  const [judge, setJudge] = useState('')
  const [filingDate, setFilingDate] = useState('')
  const [description, setDescription] = useState('')
  const [agreedAmount, setAgreedAmount] = useState('')
  const [expectedBy, setExpectedBy] = useState('')
  const [feeId, setFeeId] = useState('')

  // Options
  const [stages, setStages] = useState<string[]>([])
  const [advocates, setAdvocates] = useState<string[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function load() {
      const firmId = await getClientFirmId()

      const [
        { data: caseData },
        { data: feeData },
        { data: stageSetting },
        { data: advSetting },
        { data: clientsData },
      ] = await Promise.all([
        supabase.from('cases').select('*').eq('id', params.id).single(),
        supabase.from('fees').select('*').eq('case_id', params.id).single(),
        supabase.from('firm_settings').select('value').eq('key', 'case_stages').eq('firm_id', firmId).single(),
        supabase.from('firm_settings').select('value').eq('key', 'advocates').eq('firm_id', firmId).single(),
        supabase.from('clients').select('id, name').eq('firm_id', firmId).order('name'),
      ])

      if (caseData) {
        setCaseNumber(caseData.case_number ?? '')
        setCaseName(caseData.case_name ?? '')
        setStatus(caseData.status ?? 'active')
        setStage(caseData.stage ?? '')
        setAdvocateName(caseData.advocate_name ?? '')
        setClientId(caseData.client_id ?? '')
        setCourt(caseData.court ?? '')
        setJudge(caseData.judge ?? '')
        setFilingDate(caseData.filing_date ?? '')
        setDescription(caseData.description ?? '')
      }

      if (feeData) {
        setFeeId(feeData.id)
        setAgreedAmount(String(feeData.agreed_amount ?? ''))
        setExpectedBy(feeData.expected_by ?? '')
      }

      if (stageSetting?.value) setStages(stageSetting.value as string[])
      if (advSetting?.value) setAdvocates(advSetting.value as string[])
      if (clientsData) setClients(clientsData)

      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: caseErr } = await supabase.from('cases').update({
      case_number: caseNumber,
      case_name: caseName,
      status,
      stage: stage || null,
      advocate_name: advocateName || null,
      client_id: clientId || null,
      court: court || null,
      judge: judge || null,
      filing_date: filingDate || null,
      description: description || null,
    }).eq('id', params.id)

    if (caseErr) { setError(caseErr.message); setSaving(false); return }

    // Update or create fee
    const amt = parseFloat(agreedAmount) || 0
    if (feeId) {
      await supabase.from('fees').update({
        agreed_amount: amt,
        expected_by: expectedBy || null,
      }).eq('id', feeId)
    } else if (amt > 0) {
      await supabase.from('fees').insert({
        case_id: params.id,
        agreed_amount: amt,
        expected_by: expectedBy || null,
      })
    }

    router.push(`/cases/${params.id}`)
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
        <Link href={`/cases/${params.id}`} className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da]">
          <ArrowLeft size={16} className="text-[#4a4540]" />
        </Link>
        <h1 className="page-header">Edit Case</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Case Info */}
        <div className="card p-4 space-y-4">
          <h2 className="section-title">Case Information</h2>

          <div>
            <label className="label">Case Number *</label>
            <input value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} required className="input" />
          </div>

          <div>
            <label className="label">Case Name *</label>
            <input value={caseName} onChange={(e) => setCaseName(e.target.value)} required className="input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            {stages.length > 0 && (
              <div>
                <label className="label">Stage</label>
                <select value={stage} onChange={(e) => setStage(e.target.value)} className="input">
                  <option value="">— None —</option>
                  {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>

          {advocates.length > 0 ? (
            <div>
              <label className="label">Assigned Advocate</label>
              <select value={advocateName} onChange={(e) => setAdvocateName(e.target.value)} className="input">
                <option value="">— Unassigned —</option>
                {advocates.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="label">Assigned Advocate</label>
              <input value={advocateName} onChange={(e) => setAdvocateName(e.target.value)} className="input" placeholder="e.g. Adv. Rajan Kumar" />
            </div>
          )}

          <div>
            <label className="label">Client</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="input">
              <option value="">— No client —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Court</label>
            <input value={court} onChange={(e) => setCourt(e.target.value)} className="input" placeholder="e.g. High Court, Bengaluru" />
          </div>

          <div>
            <label className="label">Judge</label>
            <input value={judge} onChange={(e) => setJudge(e.target.value)} className="input" placeholder="e.g. Hon. Justice Reddy" />
          </div>

          <div>
            <label className="label">Filing Date</label>
            <input type="date" value={filingDate} onChange={(e) => setFilingDate(e.target.value)} className="input" />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[80px] resize-none" />
          </div>
        </div>

        {/* Fees */}
        <div className="card p-4 space-y-4">
          <h2 className="section-title">Fee Details</h2>
          <div>
            <label className="label">Agreed Fee (₹)</label>
            <input type="number" min="0" step="500" value={agreedAmount} onChange={(e) => setAgreedAmount(e.target.value)} className="input" placeholder="0" />
          </div>
          <div>
            <label className="label">Expected Payment By</label>
            <input type="date" value={expectedBy} onChange={(e) => setExpectedBy(e.target.value)} className="input" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full flex justify-center">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

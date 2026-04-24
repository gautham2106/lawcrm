'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Upload } from 'lucide-react'

export default function NewDocumentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('url')
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [uploadedPath, setUploadedPath] = useState('')
  const [uploadedSize, setUploadedSize] = useState<number | null>(null)

  useEffect(() => {
    supabase
      .from('firm_settings')
      .select('value')
      .eq('key', 'document_tags')
      .single()
      .then(({ data }) => {
        if (data?.value) setTags(data.value as string[])
      })
  }, [])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const ext = file.name.split('.').pop()
    const path = `cases/${params.id}/${Date.now()}.${ext}`

    const { data, error: uploadErr } = await supabase.storage
      .from('case-documents')
      .upload(path, file)

    if (uploadErr) {
      setError(`Upload failed: ${uploadErr.message}. Make sure the 'case-documents' storage bucket exists in Supabase.`)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('case-documents').getPublicUrl(path)
    setUploadedUrl(urlData.publicUrl)
    setUploadedPath(path)
    setUploadedSize(file.size)
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const url = uploadMode === 'file' ? uploadedUrl : (form.get('url') as string) || null

    const { error: err } = await supabase.from('case_documents').insert({
      case_id: params.id,
      name: form.get('name') as string,
      url,
      storage_path: uploadedPath || null,
      tag: form.get('tag') as string || null,
      notes: form.get('notes') as string || null,
      file_size: uploadedSize,
    })

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/cases/${params.id}`)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/cases/${params.id}`} className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da]">
          <ArrowLeft size={16} className="text-[#4a4540]" />
        </Link>
        <h1 className="page-header">Add Document</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4 space-y-4">
          <div>
            <label className="label">Document Name *</label>
            <input name="name" required className="input" placeholder="e.g. Petition — High Court" />
          </div>

          {tags.length > 0 && (
            <div>
              <label className="label">Document Type</label>
              <select name="tag" className="input" defaultValue="">
                <option value="">— Select type —</option>
                {tags.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          {tags.length === 0 && (
            <div>
              <label className="label">Document Type</label>
              <input name="tag" className="input" placeholder="e.g. Petition, Order, Affidavit" />
            </div>
          )}

          {/* Upload mode toggle */}
          <div>
            <label className="label">Add Document Via</label>
            <div className="flex gap-2">
              {(['url', 'file'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setUploadMode(mode)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    uploadMode === mode
                      ? 'bg-[#1a1814] text-white border-[#1a1814]'
                      : 'bg-[#f7f5f0] text-[#4a4540] border-[#d6cdbc]'
                  }`}
                >
                  {mode === 'url' ? 'Link / URL' : 'File Upload'}
                </button>
              ))}
            </div>
          </div>

          {uploadMode === 'url' ? (
            <div>
              <label className="label">Document URL</label>
              <input name="url" type="url" className="input" placeholder="https://..." />
            </div>
          ) : (
            <div>
              <label className="label">Upload File</label>
              {uploadedUrl ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <Upload size={14} className="text-emerald-600" />
                  <span className="text-xs text-emerald-700 font-medium">File uploaded successfully</span>
                </div>
              ) : (
                <label className={`flex flex-col items-center gap-2 p-6 border-2 border-dashed border-[#d6cdbc] rounded-xl cursor-pointer hover:border-[#d9a57b] transition-colors ${uploading ? 'opacity-50' : ''}`}>
                  <Upload size={20} className="text-[#8a8278]" />
                  <span className="text-sm text-[#8a8278]">{uploading ? 'Uploading...' : 'Tap to select file'}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              )}
              <p className="text-xs text-[#8a8278] mt-1">Requires the &apos;case-documents&apos; Supabase Storage bucket.</p>
            </div>
          )}

          <div>
            <label className="label">Notes</label>
            <textarea
              name="notes"
              className="input min-h-[80px] resize-none"
              placeholder='e.g. "Final version submitted on 15 Jan" or "Corrected address version"'
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
        )}

        <button type="submit" disabled={loading || uploading} className="btn-primary w-full flex justify-center">
          {loading ? 'Saving...' : 'Save Document'}
        </button>
      </form>
    </div>
  )
}

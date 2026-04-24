'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, BookOpen, Trash2 } from 'lucide-react'
import { CaseDocument, DocumentAnnotation } from '@/lib/types'

export default function DocumentDetailPage({ params }: { params: { id: string; docId: string } }) {
  const router = useRouter()
  const [doc, setDoc] = useState<CaseDocument | null>(null)
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: docData }, { data: annData }] = await Promise.all([
        supabase.from('case_documents').select('*').eq('id', params.docId).single(),
        supabase.from('document_annotations').select('*').eq('document_id', params.docId).order('page_number'),
      ])
      setDoc(docData)
      setAnnotations(annData ?? [])
      setLoading(false)
    }
    load()
  }, [params.docId])

  async function addAnnotation(e: React.FormEvent) {
    e.preventDefault()
    if (!page || !note) return
    setSaving(true)
    setError('')

    const { data, error: err } = await supabase
      .from('document_annotations')
      .insert({ document_id: params.docId, page_number: parseInt(page), note })
      .select()
      .single()

    if (err) { setError(err.message); setSaving(false); return }
    setAnnotations((prev) => [...prev, data].sort((a, b) => a.page_number - b.page_number))
    setPage('')
    setNote('')
    setSaving(false)
  }

  async function deleteAnnotation(annId: string) {
    await supabase.from('document_annotations').delete().eq('id', annId)
    setAnnotations((prev) => prev.filter((a) => a.id !== annId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-sm text-[#8a8278]">Loading...</div>
      </div>
    )
  }

  if (!doc) return null

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/cases/${params.id}`} className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#d6cdbc] flex items-center justify-center hover:bg-[#eee8da]">
          <ArrowLeft size={16} className="text-[#4a4540]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg text-[#1a1814] truncate">{doc.name}</h1>
          {doc.tag && <p className="text-xs text-[#8a8278]">{doc.tag}</p>}
        </div>
        {doc.url && (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-1.5">
            <BookOpen size={14} />
            Open
          </a>
        )}
      </div>

      {doc.notes && (
        <div className="card p-4">
          <p className="text-sm text-[#4a4540] italic">{doc.notes}</p>
        </div>
      )}

      {/* Add Annotation */}
      <div className="card p-4 space-y-4">
        <h2 className="section-title">Add Page Bookmark</h2>
        <p className="text-xs text-[#8a8278]">Bookmark important pages — clicking the page number opens that page in the document.</p>
        <form onSubmit={addAnnotation} className="space-y-3">
          <div className="flex gap-3">
            <div className="w-24 flex-shrink-0">
              <label className="label">Page #</label>
              <input
                type="number"
                min="1"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                className="input"
                placeholder="47"
                required
              />
            </div>
            <div className="flex-1">
              <label className="label">Note</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input"
                placeholder="e.g. Judge's key observation on jurisdiction"
                required
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-1.5">
            <Plus size={14} />
            {saving ? 'Adding...' : 'Add Bookmark'}
          </button>
        </form>
      </div>

      {/* Annotations List */}
      {annotations.length > 0 && (
        <div className="card p-4">
          <h2 className="section-title mb-3">Page Bookmarks ({annotations.length})</h2>
          <div className="divide-y divide-[#d6cdbc]">
            {annotations.map((ann) => (
              <div key={ann.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                <a
                  href={doc.url ? `${doc.url}#page=${ann.page_number}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-12 text-center py-1 bg-[#d9a57b] text-white text-xs font-bold rounded-lg hover:bg-[#c48a5e] transition-colors"
                >
                  p.{ann.page_number}
                </a>
                <p className="flex-1 text-sm text-[#1a1814]">{ann.note}</p>
                <button
                  onClick={() => deleteAnnotation(ann.id)}
                  className="text-[#8a8278] hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {annotations.length === 0 && (
        <div className="card p-8 flex flex-col items-center gap-2 text-center">
          <BookOpen size={28} className="text-[#d6cdbc]" />
          <p className="text-sm text-[#8a8278]">No bookmarks yet. Add page numbers with notes to quickly navigate large documents.</p>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  LogOut, Plus, X, User, Shield, Tag, Layers,
  Users, Mail, ChevronDown, ChevronUp, Save
} from 'lucide-react'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface Profile {
  id: string
  full_name: string | null
  role: 'admin' | 'staff'
  advocate_name: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = getSupabase()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Firm settings
  const [stages, setStages] = useState<string[]>([])
  const [docTags, setDocTags] = useState<string[]>([])
  const [advocates, setAdvocates] = useState<string[]>([])
  const [newStage, setNewStage] = useState('')
  const [newTag, setNewTag] = useState('')
  const [newAdvocate, setNewAdvocate] = useState('')
  const [savingStages, setSavingStages] = useState(false)
  const [savingTags, setSavingTags] = useState(false)
  const [savingAdvocates, setSavingAdvocates] = useState(false)

  // Users
  const [users, setUsers] = useState<Profile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showUserMgmt, setShowUserMgmt] = useState(false)

  // Invite
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'staff'>('staff')
  const [inviteAdvocate, setInviteAdvocate] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(prof)

      const [{ data: stageData }, { data: tagData }, { data: advData }] = await Promise.all([
        supabase.from('firm_settings').select('value').eq('key', 'case_stages').single(),
        supabase.from('firm_settings').select('value').eq('key', 'document_tags').single(),
        supabase.from('firm_settings').select('value').eq('key', 'advocates').single(),
      ])

      if (stageData?.value) setStages(stageData.value as string[])
      if (tagData?.value) setDocTags(tagData.value as string[])
      if (advData?.value) setAdvocates(advData.value as string[])

      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function saveSetting(key: string, value: string[]) {
    await supabase.from('firm_settings').upsert({ key, value }, { onConflict: 'key' })
  }

  async function saveStages() {
    setSavingStages(true)
    await saveSetting('case_stages', stages)
    setSavingStages(false)
  }

  async function saveTags() {
    setSavingTags(true)
    await saveSetting('document_tags', docTags)
    setSavingTags(false)
  }

  async function saveAdvocates() {
    setSavingAdvocates(true)
    await saveSetting('advocates', advocates)
    setSavingAdvocates(false)
  }

  async function loadUsers() {
    setLoadingUsers(true)
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    setUsers(data ?? [])
    setLoadingUsers(false)
  }

  async function updateUserProfile(userId: string, updates: Partial<Profile>) {
    await supabase.from('profiles').update(updates).eq('id', userId)
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...updates } : u))
  }

  async function inviteUser(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteMsg('')

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail,
        role: inviteRole,
        advocate_name: inviteAdvocate || null,
      }),
    })

    const json = await res.json()
    if (json.error) {
      setInviteMsg(`Error: ${json.error}`)
    } else {
      setInviteMsg(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setInviteAdvocate('')
    }
    setInviting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-sm text-[#8a8278]">Loading...</div>
      </div>
    )
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="space-y-5 pb-8">
      <h1 className="page-header">Settings</h1>

      {/* Profile Card */}
      <div className="card p-4 space-y-3">
        <h2 className="section-title">Profile</h2>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#eee8da] flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-[#4a4540]" />
          </div>
          <div>
            <p className="font-semibold text-[#1a1814]">{profile?.full_name ?? 'User'}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`badge text-[10px] ${isAdmin ? 'bg-[#1a1814] text-white' : 'bg-[#eee8da] text-[#4a4540]'}`}>
                {isAdmin ? 'Admin' : 'Staff'}
              </span>
              {profile?.advocate_name && (
                <span className="text-xs text-[#8a8278]">{profile.advocate_name}</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>

      {/* Admin-only settings */}
      {isAdmin && (
        <>
          {/* Case Stages */}
          <div className="card p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-[#d9a57b]" />
              <h2 className="section-title">Case Stages</h2>
            </div>
            <p className="text-xs text-[#8a8278]">Define the pipeline stages for your firm&apos;s cases.</p>

            <div className="flex flex-wrap gap-2">
              {stages.map((s, i) => (
                <div key={i} className="flex items-center gap-1 bg-[#eee8da] rounded-lg px-2.5 py-1">
                  <span className="text-sm text-[#1a1814]">{s}</span>
                  <button
                    type="button"
                    onClick={() => setStages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-[#8a8278] hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={newStage}
                onChange={(e) => setNewStage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newStage.trim()) {
                    e.preventDefault()
                    setStages((prev) => [...prev, newStage.trim()])
                    setNewStage('')
                  }
                }}
                className="input flex-1"
                placeholder="Add stage..."
              />
              <button
                type="button"
                onClick={() => {
                  if (newStage.trim()) {
                    setStages((prev) => [...prev, newStage.trim()])
                    setNewStage('')
                  }
                }}
                className="btn-secondary flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            <button onClick={saveStages} disabled={savingStages} className="btn-primary flex items-center gap-1.5">
              <Save size={14} />
              {savingStages ? 'Saving...' : 'Save Stages'}
            </button>
          </div>

          {/* Document Tags */}
          <div className="card p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-[#d9a57b]" />
              <h2 className="section-title">Document Tags</h2>
            </div>
            <p className="text-xs text-[#8a8278]">Tags for document types used when uploading case documents.</p>

            <div className="flex flex-wrap gap-2">
              {docTags.map((t, i) => (
                <div key={i} className="flex items-center gap-1 bg-[#eee8da] rounded-lg px-2.5 py-1">
                  <span className="text-sm text-[#1a1814]">{t}</span>
                  <button
                    type="button"
                    onClick={() => setDocTags((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-[#8a8278] hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTag.trim()) {
                    e.preventDefault()
                    setDocTags((prev) => [...prev, newTag.trim()])
                    setNewTag('')
                  }
                }}
                className="input flex-1"
                placeholder="Add tag..."
              />
              <button
                type="button"
                onClick={() => {
                  if (newTag.trim()) {
                    setDocTags((prev) => [...prev, newTag.trim()])
                    setNewTag('')
                  }
                }}
                className="btn-secondary flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            <button onClick={saveTags} disabled={savingTags} className="btn-primary flex items-center gap-1.5">
              <Save size={14} />
              {savingTags ? 'Saving...' : 'Save Tags'}
            </button>
          </div>

          {/* Advocates */}
          <div className="card p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[#d9a57b]" />
              <h2 className="section-title">Advocates</h2>
            </div>
            <p className="text-xs text-[#8a8278]">List of advocates for case and task assignment dropdowns.</p>

            <div className="flex flex-wrap gap-2">
              {advocates.map((a, i) => (
                <div key={i} className="flex items-center gap-1 bg-[#eee8da] rounded-lg px-2.5 py-1">
                  <span className="text-sm text-[#1a1814]">{a}</span>
                  <button
                    type="button"
                    onClick={() => setAdvocates((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-[#8a8278] hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={newAdvocate}
                onChange={(e) => setNewAdvocate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newAdvocate.trim()) {
                    e.preventDefault()
                    setAdvocates((prev) => [...prev, newAdvocate.trim()])
                    setNewAdvocate('')
                  }
                }}
                className="input flex-1"
                placeholder="e.g. Adv. Rajan Kumar"
              />
              <button
                type="button"
                onClick={() => {
                  if (newAdvocate.trim()) {
                    setAdvocates((prev) => [...prev, newAdvocate.trim()])
                    setNewAdvocate('')
                  }
                }}
                className="btn-secondary flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            <button onClick={saveAdvocates} disabled={savingAdvocates} className="btn-primary flex items-center gap-1.5">
              <Save size={14} />
              {savingAdvocates ? 'Saving...' : 'Save Advocates'}
            </button>
          </div>

          {/* User Management */}
          <div className="card p-4 space-y-4">
            <button
              onClick={() => {
                setShowUserMgmt(!showUserMgmt)
                if (!showUserMgmt && users.length === 0) loadUsers()
              }}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#d9a57b]" />
                <h2 className="section-title">User Management</h2>
              </div>
              {showUserMgmt ? <ChevronUp size={16} className="text-[#8a8278]" /> : <ChevronDown size={16} className="text-[#8a8278]" />}
            </button>

            {showUserMgmt && (
              <div className="space-y-4">
                {/* Invite New User */}
                <div className="bg-[#eee8da] rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-[#4a4540] uppercase tracking-wide">Invite New User</p>
                  <form onSubmit={inviteUser} className="space-y-3">
                    <div>
                      <label className="label">Email</label>
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="input"
                        placeholder="colleague@firm.com"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Role</label>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as 'admin' | 'staff')}
                          className="input"
                        >
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Advocate Name</label>
                        <input
                          value={inviteAdvocate}
                          onChange={(e) => setInviteAdvocate(e.target.value)}
                          className="input"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    {inviteMsg && (
                      <p className={`text-xs p-2 rounded-lg ${inviteMsg.startsWith('Error') ? 'text-red-600 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}>
                        {inviteMsg}
                      </p>
                    )}
                    <button type="submit" disabled={inviting} className="btn-primary flex items-center gap-1.5">
                      <Mail size={14} />
                      {inviting ? 'Sending...' : 'Send Invite'}
                    </button>
                  </form>
                </div>

                {/* Users List */}
                {loadingUsers ? (
                  <p className="text-sm text-[#8a8278]">Loading users...</p>
                ) : (
                  <div className="divide-y divide-[#d6cdbc]">
                    {users.map((u) => (
                      <div key={u.id} className="py-3 first:pt-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm text-[#1a1814]">{u.full_name ?? 'Unnamed'}</p>
                            <p className="text-xs text-[#8a8278]">{u.advocate_name ?? 'No advocate name set'}</p>
                          </div>
                          <span className={`badge text-[10px] ${u.role === 'admin' ? 'bg-[#1a1814] text-white' : 'bg-[#eee8da] text-[#4a4540]'}`}>
                            {u.role}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={u.role}
                            onChange={(e) => updateUserProfile(u.id, { role: e.target.value as 'admin' | 'staff' })}
                            className="input text-xs py-1.5"
                          >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                          <input
                            defaultValue={u.advocate_name ?? ''}
                            onBlur={(e) => {
                              if (e.target.value !== (u.advocate_name ?? '')) {
                                updateUserProfile(u.id, { advocate_name: e.target.value || null })
                              }
                            }}
                            className="input text-xs py-1.5 flex-1"
                            placeholder="Advocate name"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

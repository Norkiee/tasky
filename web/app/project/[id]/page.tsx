'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/Sidebar'
import { ChevronDownIcon, ChevronRightIcon, XIcon, CopyIcon } from '@/components/icons'
import { Epic, Feature, Project, Story, Task } from '@/lib/types'

type ItemType = 'epic' | 'feature' | 'story'

const badgeColors: Record<ItemType, string> = {
  epic: 'bg-[rgba(139,92,246,0.15)] text-[#A78BFA]',
  feature: 'bg-[rgba(34,197,94,0.15)] text-[#4ADE80]',
  story: 'bg-[rgba(59,130,246,0.15)] text-[#60A5FA]',
}

const complexityColors: Record<string, string> = {
  S: 'bg-[rgba(34,197,94,0.15)] text-[#4ADE80]',
  M: 'bg-[rgba(245,158,11,0.15)] text-[#FBBF24]',
  L: 'bg-[rgba(239,68,68,0.15)] text-[#F87171]',
}

interface ComposerState {
  mode: ItemType
  parentId?: string
  parentType?: 'epic' | 'feature'
}

interface ContextMenuState {
  type: ItemType
  id: string
  title: string
  x: number
  y: number
  confirmDelete: boolean
}

interface EditingItem {
  type: ItemType
  id: string
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [epics, setEpics] = useState<Epic[]>([])
  const [features, setFeatures] = useState<Record<string, Feature[]>>({})
  // stories keyed by featureId
  const [stories, setStories] = useState<Record<string, Story[]>>({})
  // stories keyed by epicId (direct epic children)
  const [epicStories, setEpicStories] = useState<Record<string, Story[]>>({})
  const [tasks, setTasks] = useState<Record<string, Task[]>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [composer, setComposer] = useState<ComposerState>({ mode: 'epic' })
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'documents'>('hierarchy')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Right-click context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Inline editing
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null)
  const [editText, setEditText] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    const handler = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [contextMenu])

  // Focus edit input when it appears
  useEffect(() => {
    if (editingItem) {
      setTimeout(() => {
        editInputRef.current?.focus()
        editInputRef.current?.select()
      }, 50)
    }
  }, [editingItem])

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    const [projectResult, epicsResult] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('epics').select('*').eq('project_id', projectId).order('created_at', { ascending: true })
    ])
    if (projectResult.error || !projectResult.data) {
      router.replace('/dashboard')
      return
    }
    setProject(projectResult.data)
    if (epicsResult.data) setEpics(epicsResult.data)
    setLoading(false)
  }

  const fetchFeatures = async (epicId: string) => {
    const { data } = await supabase
      .from('features').select('*').eq('epic_id', epicId).order('created_at', { ascending: true })
    if (data) setFeatures(prev => ({ ...prev, [epicId]: data }))
  }

  const fetchStoriesByFeature = async (featureId: string) => {
    const { data } = await supabase
      .from('stories').select('*').eq('feature_id', featureId).order('created_at', { ascending: true })
    if (data) setStories(prev => ({ ...prev, [featureId]: data }))
  }

  const fetchStoriesByEpic = async (epicId: string) => {
    const { data } = await supabase
      .from('stories').select('*').eq('epic_id', epicId).is('feature_id', null).order('created_at', { ascending: true })
    if (data) setEpicStories(prev => ({ ...prev, [epicId]: data }))
  }

  const fetchTasks = async (storyId: string) => {
    const { data } = await supabase
      .from('tasks').select('*').eq('story_id', storyId).order('created_at', { ascending: true })
    if (data) setTasks(prev => ({ ...prev, [storyId]: data }))
  }

  const toggleItem = async (type: ItemType, id: string) => {
    const key = `${type}-${id}`
    const isExpanding = !expanded[key]
    setExpanded(prev => ({ ...prev, [key]: isExpanding }))
    if (isExpanding) {
      if (type === 'epic') {
        if (!features[id]) await fetchFeatures(id)
        if (!epicStories[id]) await fetchStoriesByEpic(id)
      } else if (type === 'feature' && !stories[id]) {
        await fetchStoriesByFeature(id)
      } else if (type === 'story' && !tasks[id]) {
        await fetchTasks(id)
      }
    }
  }

  const openComposer = (mode: ItemType, parentId?: string, parentType?: 'epic' | 'feature') => {
    setComposer({ mode, parentId, parentType })
    setDraftTitle('')
    setDraftDescription('')
    setShowComposer(true)
  }

  const submitComposer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draftTitle || saving) return
    setSaving(true)

    if (composer.mode === 'epic') {
      const { data, error } = await supabase
        .from('epics').insert({ project_id: projectId, title: draftTitle, description: draftDescription || null })
        .select().single()
      if (!error && data) setEpics(prev => [...prev, data])
    }

    if (composer.mode === 'feature' && composer.parentId) {
      const { data, error } = await supabase
        .from('features').insert({ epic_id: composer.parentId, title: draftTitle, description: draftDescription || null })
        .select().single()
      if (!error && data) {
        setFeatures(prev => ({ ...prev, [composer.parentId!]: [...(prev[composer.parentId!] || []), data] }))
        setExpanded(prev => ({ ...prev, [`epic-${composer.parentId}`]: true }))
      }
    }

    if (composer.mode === 'story' && composer.parentId) {
      if (composer.parentType === 'epic') {
        // Story directly under an epic
        const { data, error } = await supabase
          .from('stories').insert({ epic_id: composer.parentId, title: draftTitle, description: draftDescription || null })
          .select().single()
        if (!error && data) {
          setEpicStories(prev => ({ ...prev, [composer.parentId!]: [...(prev[composer.parentId!] || []), data] }))
          setExpanded(prev => ({ ...prev, [`epic-${composer.parentId}`]: true }))
        }
      } else {
        // Story under a feature
        const { data, error } = await supabase
          .from('stories').insert({ feature_id: composer.parentId, title: draftTitle, description: draftDescription || null })
          .select().single()
        if (!error && data) {
          setStories(prev => ({ ...prev, [composer.parentId!]: [...(prev[composer.parentId!] || []), data] }))
          setExpanded(prev => ({ ...prev, [`feature-${composer.parentId}`]: true }))
        }
      }
    }

    setSaving(false)
    setShowComposer(false)
  }

  // ── Right-click handlers ───────────────────────────────────────────

  const handleContextMenu = (e: React.MouseEvent, type: ItemType, id: string, title: string) => {
    e.preventDefault()
    setContextMenu({ type, id, title, x: e.clientX, y: e.clientY, confirmDelete: false })
  }

  const handleStartRename = () => {
    if (!contextMenu) return
    setEditingItem({ type: contextMenu.type, id: contextMenu.id })
    setEditText(contextMenu.title)
    setContextMenu(null)
  }

  const handleConfirmRename = useCallback(async () => {
    if (!editingItem || !editText.trim()) { setEditingItem(null); return }

    const table = editingItem.type === 'epic' ? 'epics'
      : editingItem.type === 'feature' ? 'features' : 'stories'
    const field = editingItem.type === 'epic' || editingItem.type === 'feature' ? 'title' : 'title'

    await supabase.from(table).update({ [field]: editText.trim() }).eq('id', editingItem.id)

    if (editingItem.type === 'epic') {
      setEpics(prev => prev.map(e => e.id === editingItem.id ? { ...e, title: editText.trim() } : e))
    } else if (editingItem.type === 'feature') {
      setFeatures(prev => {
        const updated: Record<string, Feature[]> = {}
        for (const k in prev) updated[k] = prev[k].map(f => f.id === editingItem.id ? { ...f, title: editText.trim() } : f)
        return updated
      })
    } else {
      // Update in both stories (by feature) and epicStories
      setStories(prev => {
        const updated: Record<string, Story[]> = {}
        for (const k in prev) updated[k] = prev[k].map(s => s.id === editingItem.id ? { ...s, title: editText.trim() } : s)
        return updated
      })
      setEpicStories(prev => {
        const updated: Record<string, Story[]> = {}
        for (const k in prev) updated[k] = prev[k].map(s => s.id === editingItem.id ? { ...s, title: editText.trim() } : s)
        return updated
      })
    }
    setEditingItem(null)
  }, [editingItem, editText, supabase])

  const handleDeleteItem = async () => {
    if (!contextMenu) return
    const { type, id } = contextMenu
    setContextMenu(null)

    const table = type === 'epic' ? 'epics' : type === 'feature' ? 'features' : 'stories'
    await supabase.from(table).delete().eq('id', id)

    if (type === 'epic') {
      setEpics(prev => prev.filter(e => e.id !== id))
    } else if (type === 'feature') {
      setFeatures(prev => {
        const updated: Record<string, Feature[]> = {}
        for (const k in prev) updated[k] = prev[k].filter(f => f.id !== id)
        return updated
      })
    } else {
      setStories(prev => {
        const updated: Record<string, Story[]> = {}
        for (const k in prev) updated[k] = prev[k].filter(s => s.id !== id)
        return updated
      })
      setEpicStories(prev => {
        const updated: Record<string, Story[]> = {}
        for (const k in prev) updated[k] = prev[k].filter(s => s.id !== id)
        return updated
      })
    }
  }

  // ── Copy helpers ───────────────────────────────────────────────────

  const copyTask = (task: Task) => {
    navigator.clipboard.writeText(task.title)
    setCopiedId(task.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const copyAllTasks = (taskList: Task[]) => {
    navigator.clipboard.writeText(taskList.map(t => t.title).join('\n'))
    setCopiedId('all')
    setTimeout(() => setCopiedId(null), 1500)
  }

  // ── Story row shared renderer ──────────────────────────────────────

  const renderStoryRow = (story: Story) => (
    <div key={story.id} className="mb-3">
      <div
        className="flex items-center gap-3 px-4 py-3.5 bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-lg group"
        onContextMenu={(e) => handleContextMenu(e, 'story', story.id, story.title)}
      >
        <button
          onClick={() => toggleItem('story', story.id)}
          className="text-[#666666] hover:text-[#A1A1A1] transition-colors"
        >
          {expanded[`story-${story.id}`] ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
        </button>
        <span className={`text-[11px] px-2 py-0.5 rounded ${badgeColors.story}`}>Story</span>

        {editingItem?.type === 'story' && editingItem.id === story.id ? (
          <input
            ref={editInputRef}
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleConfirmRename(); if (e.key === 'Escape') setEditingItem(null) }}
            onBlur={handleConfirmRename}
            className="flex-1 bg-transparent border-b border-[#8B5CF6] text-sm text-white outline-none py-0.5"
          />
        ) : (
          <span className="text-sm text-white flex-1">{story.title}</span>
        )}

        <span className="text-xs text-[#666666] opacity-0 group-hover:opacity-100 transition-opacity">
          {(tasks[story.id] || []).length} tasks
        </span>
      </div>

      {expanded[`story-${story.id}`] && (tasks[story.id] || []).length > 0 && (
        <div className="ml-8 mt-2 bg-[#141414] rounded-lg p-4">
          {(tasks[story.id] || []).map((task, i) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 px-3 py-3 ${
                i < (tasks[story.id] || []).length - 1 ? 'border-b border-[rgba(255,255,255,0.06)]' : ''
              }`}
            >
              <input type="checkbox" className="w-4 h-4 accent-[#8B5CF6]" />
              <span className="text-sm text-[#A1A1A1] flex-1">{task.title}</span>
              {task.complexity && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${complexityColors[task.complexity]}`}>
                  {task.complexity}
                </span>
              )}
              <button
                onClick={() => copyTask(task)}
                className="text-[#666666] hover:text-[#A1A1A1] transition-colors p-1 flex items-center gap-1"
              >
                {copiedId === task.id ? (
                  <span className="text-[10px] text-[#8B5CF6]">Copied</span>
                ) : (
                  <CopyIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
          <div className="pt-3 mt-2 border-t border-[rgba(255,255,255,0.06)] text-right">
            <button
              onClick={() => copyAllTasks(tasks[story.id] || [])}
              className="text-xs text-[#A1A1A1] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 hover:border-[rgba(255,255,255,0.15)] transition-colors"
            >
              {copiedId === 'all' ? 'Copied!' : 'Copy all'}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0A0A0A]">
        <Sidebar activePage="project" />
        <main className="flex-1 flex items-center justify-center">
          <span className="text-sm text-[#666666]">Loading...</span>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0A0A0A]">
      <Sidebar activePage="project" />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
          <p className="text-xs text-[#666666] mb-1">Projects / {project?.name}</p>
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-medium text-white">{project?.name}</h1>
            <button className="text-[#A1A1A1] border border-[rgba(255,255,255,0.1)] rounded-lg px-5 py-2.5 text-sm hover:border-[rgba(255,255,255,0.15)] transition-colors">
              Upload docs
            </button>
          </div>
        </header>

        <div className="px-6 border-b border-[rgba(255,255,255,0.06)] flex gap-8 flex-shrink-0">
          {(['hierarchy', 'documents'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm py-4 border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'font-medium text-white border-[#8B5CF6]'
                  : 'text-[#666666] border-transparent hover:text-[#A1A1A1]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {activeTab === 'hierarchy' && (
            <>
              {epics.map((epic) => (
                <div key={epic.id} className="mb-4">
                  {/* Epic Row */}
                  <div
                    className="flex items-center gap-3 px-4 py-4 bg-[#141414] rounded-lg group"
                    onContextMenu={(e) => handleContextMenu(e, 'epic', epic.id, epic.title)}
                  >
                    <button
                      onClick={() => toggleItem('epic', epic.id)}
                      className="text-[#666666] hover:text-[#A1A1A1] transition-colors"
                    >
                      {expanded[`epic-${epic.id}`] ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                    </button>
                    <span className={`text-[11px] px-2 py-0.5 rounded ${badgeColors.epic}`}>Epic</span>

                    {editingItem?.type === 'epic' && editingItem.id === epic.id ? (
                      <input
                        ref={editInputRef}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleConfirmRename(); if (e.key === 'Escape') setEditingItem(null) }}
                        onBlur={handleConfirmRename}
                        className="flex-1 bg-transparent border-b border-[#8B5CF6] text-sm font-medium text-white outline-none py-0.5"
                      />
                    ) : (
                      <span className="text-sm font-medium text-white flex-1">{epic.title}</span>
                    )}

                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openComposer('story', epic.id, 'epic')}
                        className="text-xs text-[#666666] hover:text-[#60A5FA] transition-colors"
                      >
                        + Story
                      </button>
                      <button
                        onClick={() => openComposer('feature', epic.id)}
                        className="text-xs text-[#666666] hover:text-[#A1A1A1] transition-colors"
                      >
                        + Feature
                      </button>
                    </div>
                  </div>

                  {/* Expanded epic content */}
                  {expanded[`epic-${epic.id}`] && (
                    <div className="ml-8 mt-2 space-y-2">

                      {/* Direct epic stories */}
                      {(epicStories[epic.id] || []).length > 0 && (
                        <div>
                          <p className="text-[11px] text-[#555] px-1 mb-2 uppercase tracking-widest">Direct stories</p>
                          {(epicStories[epic.id] || []).map(renderStoryRow)}
                        </div>
                      )}

                      {/* Features */}
                      {(features[epic.id] || []).map((feature) => (
                        <div key={feature.id} className="mb-3">
                          <div
                            className="flex items-center gap-3 px-4 py-3.5 rounded-lg hover:bg-[#141414] transition-colors group"
                            onContextMenu={(e) => handleContextMenu(e, 'feature', feature.id, feature.title)}
                          >
                            <button
                              onClick={() => toggleItem('feature', feature.id)}
                              className="text-[#666666] hover:text-[#A1A1A1] transition-colors"
                            >
                              {expanded[`feature-${feature.id}`] ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                            </button>
                            <span className={`text-[11px] px-2 py-0.5 rounded ${badgeColors.feature}`}>Feature</span>

                            {editingItem?.type === 'feature' && editingItem.id === feature.id ? (
                              <input
                                ref={editInputRef}
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleConfirmRename(); if (e.key === 'Escape') setEditingItem(null) }}
                                onBlur={handleConfirmRename}
                                className="flex-1 bg-transparent border-b border-[#8B5CF6] text-sm text-white outline-none py-0.5"
                              />
                            ) : (
                              <span className="text-sm text-white flex-1">{feature.title}</span>
                            )}

                            <button
                              onClick={() => openComposer('story', feature.id, 'feature')}
                              className="text-xs text-[#666666] hover:text-[#A1A1A1] transition-colors opacity-0 group-hover:opacity-100"
                            >
                              + Story
                            </button>
                          </div>

                          {expanded[`feature-${feature.id}`] && (
                            <div className="ml-8 mt-2">
                              {(stories[feature.id] || []).map(renderStoryRow)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => openComposer('epic')}
                className="w-full mt-4 py-4 border border-dashed border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-[#666666] hover:border-[rgba(255,255,255,0.15)] hover:text-[#A1A1A1] transition-colors"
              >
                + Add epic
              </button>
            </>
          )}

          {activeTab === 'documents' && (
            <div className="text-center py-12">
              <p className="text-[#666666] text-sm">No documents uploaded yet</p>
            </div>
          )}
        </div>
      </main>

      {/* Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="w-full max-w-[480px] bg-[#141414] border border-[rgba(255,255,255,0.1)] rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-base font-medium text-white">
                Add {composer.mode}
                {composer.mode === 'story' && composer.parentType === 'epic' && (
                  <span className="text-xs font-normal text-[#666666] ml-2">directly under epic</span>
                )}
              </h2>
              <button onClick={() => setShowComposer(false)} className="text-[#666666] hover:text-[#A1A1A1] transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitComposer}>
              <div className="mb-6">
                <label className="block text-xs text-[#666666] mb-3">Title</label>
                <input
                  type="text"
                  placeholder={`${composer.mode.charAt(0).toUpperCase() + composer.mode.slice(1)} title`}
                  value={draftTitle}
                  onChange={e => setDraftTitle(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-4 text-sm text-white placeholder:text-[#666666] focus:border-[rgba(255,255,255,0.2)] outline-none"
                  autoFocus
                  required
                />
              </div>
              <div className="mb-8">
                <label className="block text-xs text-[#666666] mb-3">Description</label>
                <textarea
                  placeholder="Optional description"
                  value={draftDescription}
                  onChange={e => setDraftDescription(e.target.value)}
                  className="w-full h-[120px] bg-[#0D0D0D] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-4 text-sm text-white placeholder:text-[#666666] focus:border-[rgba(255,255,255,0.2)] outline-none resize-none"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowComposer(false)}
                  className="flex-1 text-sm text-[#A1A1A1] border border-[rgba(255,255,255,0.1)] rounded-lg py-3.5 hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 text-white rounded-lg py-3.5 text-sm font-medium transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Right-click Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x }}
          className="z-[9999] min-w-[180px] bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl overflow-hidden p-1"
        >
          {/* Header */}
          <div className="px-3 py-2 text-[11px] text-[#555] border-b border-[rgba(255,255,255,0.07)] mb-1 truncate">
            {contextMenu.title}
          </div>

          {contextMenu.confirmDelete ? (
            <div className="p-2">
              <p className="text-xs text-[#A1A1A1] px-1 pb-2">Delete this {contextMenu.type}?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setContextMenu(c => c ? { ...c, confirmDelete: false } : null)}
                  className="flex-1 text-xs py-1.5 rounded-lg text-[#A1A1A1] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteItem}
                  className="flex-1 text-xs py-1.5 rounded-lg text-[#F87171] bg-[rgba(239,68,68,0.1)] hover:bg-[rgba(239,68,68,0.18)] transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={handleStartRename}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#C0C0C0] hover:bg-[rgba(255,255,255,0.06)] rounded-lg transition-colors text-left"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Rename
              </button>
              <button
                onClick={() => setContextMenu(c => c ? { ...c, confirmDelete: true } : null)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#F87171] hover:bg-[rgba(239,68,68,0.08)] rounded-lg transition-colors text-left"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4h12M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

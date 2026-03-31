'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/Sidebar'
import { ChevronDownIcon, ChevronRightIcon, PlusIcon, XIcon, CopyIcon } from '@/components/icons'
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
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [epics, setEpics] = useState<Epic[]>([])
  const [features, setFeatures] = useState<Record<string, Feature[]>>({})
  const [stories, setStories] = useState<Record<string, Story[]>>({})
  const [tasks, setTasks] = useState<Record<string, Task[]>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [composer, setComposer] = useState<ComposerState>({ mode: 'epic' })
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'documents'>('hierarchy')

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
    if (epicsResult.data) {
      setEpics(epicsResult.data)
    }
    setLoading(false)
  }

  const fetchFeatures = async (epicId: string) => {
    const { data } = await supabase
      .from('features')
      .select('*')
      .eq('epic_id', epicId)
      .order('created_at', { ascending: true })

    if (data) {
      setFeatures((prev) => ({ ...prev, [epicId]: data }))
    }
  }

  const fetchStories = async (featureId: string) => {
    const { data } = await supabase
      .from('stories')
      .select('*')
      .eq('feature_id', featureId)
      .order('created_at', { ascending: true })

    if (data) {
      setStories((prev) => ({ ...prev, [featureId]: data }))
    }
  }

  const fetchTasks = async (storyId: string) => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true })

    if (data) {
      setTasks((prev) => ({ ...prev, [storyId]: data }))
    }
  }

  const toggleItem = async (type: ItemType, id: string) => {
    const key = `${type}-${id}`
    const isExpanding = !expanded[key]
    setExpanded((prev) => ({ ...prev, [key]: isExpanding }))

    if (isExpanding) {
      if (type === 'epic' && !features[id]) {
        await fetchFeatures(id)
      } else if (type === 'feature' && !stories[id]) {
        await fetchStories(id)
      } else if (type === 'story' && !tasks[id]) {
        await fetchTasks(id)
      }
    }
  }

  const openComposer = (mode: ItemType, parentId?: string) => {
    setComposer({ mode, parentId })
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
        .from('epics')
        .insert({
          project_id: projectId,
          title: draftTitle,
          description: draftDescription || null,
        })
        .select()
        .single()

      if (!error && data) {
        setEpics((prev) => [...prev, data])
      }
    }

    if (composer.mode === 'feature' && composer.parentId) {
      const { data, error } = await supabase
        .from('features')
        .insert({
          epic_id: composer.parentId,
          title: draftTitle,
          description: draftDescription || null,
        })
        .select()
        .single()

      if (!error && data) {
        setFeatures((prev) => ({
          ...prev,
          [composer.parentId!]: [...(prev[composer.parentId!] || []), data],
        }))
        setExpanded((prev) => ({ ...prev, [`epic-${composer.parentId}`]: true }))
      }
    }

    if (composer.mode === 'story' && composer.parentId) {
      const { data, error } = await supabase
        .from('stories')
        .insert({
          feature_id: composer.parentId,
          title: draftTitle,
          description: draftDescription || null,
        })
        .select()
        .single()

      if (!error && data) {
        setStories((prev) => ({
          ...prev,
          [composer.parentId!]: [...(prev[composer.parentId!] || []), data],
        }))
        setExpanded((prev) => ({ ...prev, [`feature-${composer.parentId}`]: true }))
      }
    }

    setSaving(false)
    setShowComposer(false)
  }

  const copyTask = (task: Task) => {
    navigator.clipboard.writeText(task.title)
  }

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
          <p className="text-xs text-[#666666] mb-1">
            Projects / {project?.name}
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-medium text-white">{project?.name}</h1>
            <button className="text-[#A1A1A1] border border-[rgba(255,255,255,0.1)] rounded-lg px-5 py-2.5 text-sm hover:border-[rgba(255,255,255,0.15)] transition-colors">
              Upload docs
            </button>
          </div>
        </header>

        <div className="px-6 border-b border-[rgba(255,255,255,0.06)] flex gap-8 flex-shrink-0">
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`text-sm py-4 border-b-2 transition-colors ${
              activeTab === 'hierarchy'
                ? 'font-medium text-white border-[#8B5CF6]'
                : 'text-[#666666] border-transparent hover:text-[#A1A1A1]'
            }`}
          >
            Hierarchy
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`text-sm py-4 border-b-2 transition-colors ${
              activeTab === 'documents'
                ? 'font-medium text-white border-[#8B5CF6]'
                : 'text-[#666666] border-transparent hover:text-[#A1A1A1]'
            }`}
          >
            Documents
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {activeTab === 'hierarchy' && (
            <>
              {/* Epics */}
              {epics.map((epic) => (
                <div key={epic.id} className="mb-4">
                  {/* Epic Row */}
                  <div className="flex items-center gap-3 px-4 py-4 bg-[#141414] rounded-lg">
                    <button
                      onClick={() => toggleItem('epic', epic.id)}
                      className="text-[#666666] hover:text-[#A1A1A1] transition-colors"
                    >
                      {expanded[`epic-${epic.id}`] ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                      )}
                    </button>
                    <span className={`text-[11px] px-2 py-0.5 rounded ${badgeColors.epic}`}>
                      Epic
                    </span>
                    <span className="text-sm font-medium text-white flex-1">{epic.title}</span>
                    <button
                      onClick={() => openComposer('feature', epic.id)}
                      className="text-xs text-[#666666] hover:text-[#A1A1A1] transition-colors"
                    >
                      + Feature
                    </button>
                  </div>

                  {/* Features */}
                  {expanded[`epic-${epic.id}`] && (
                    <div className="ml-8 mt-2">
                      {(features[epic.id] || []).map((feature) => (
                        <div key={feature.id} className="mb-3">
                          {/* Feature Row */}
                          <div className="flex items-center gap-3 px-4 py-3.5 rounded-lg hover:bg-[#141414] transition-colors">
                            <button
                              onClick={() => toggleItem('feature', feature.id)}
                              className="text-[#666666] hover:text-[#A1A1A1] transition-colors"
                            >
                              {expanded[`feature-${feature.id}`] ? (
                                <ChevronDownIcon className="w-4 h-4" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4" />
                              )}
                            </button>
                            <span className={`text-[11px] px-2 py-0.5 rounded ${badgeColors.feature}`}>
                              Feature
                            </span>
                            <span className="text-sm text-white flex-1">{feature.title}</span>
                            <button
                              onClick={() => openComposer('story', feature.id)}
                              className="text-xs text-[#666666] hover:text-[#A1A1A1] transition-colors"
                            >
                              + Story
                            </button>
                          </div>

                          {/* Stories */}
                          {expanded[`feature-${feature.id}`] && (
                            <div className="ml-8 mt-2">
                              {(stories[feature.id] || []).map((story) => (
                                <div key={story.id} className="mb-3">
                                  {/* Story Row */}
                                  <div className="flex items-center gap-3 px-4 py-3.5 bg-[#141414] border border-[rgba(255,255,255,0.1)] rounded-lg">
                                    <button
                                      onClick={() => toggleItem('story', story.id)}
                                      className="text-[#666666] hover:text-[#A1A1A1] transition-colors"
                                    >
                                      {expanded[`story-${story.id}`] ? (
                                        <ChevronDownIcon className="w-4 h-4" />
                                      ) : (
                                        <ChevronRightIcon className="w-4 h-4" />
                                      )}
                                    </button>
                                    <span className={`text-[11px] px-2 py-0.5 rounded ${badgeColors.story}`}>
                                      Story
                                    </span>
                                    <span className="text-sm text-white flex-1">{story.title}</span>
                                    <span className="text-xs text-[#666666]">
                                      {(tasks[story.id] || []).length} tasks
                                    </span>
                                  </div>

                                  {/* Tasks */}
                                  {expanded[`story-${story.id}`] && (tasks[story.id] || []).length > 0 && (
                                    <div className="ml-8 mt-2 bg-[#141414] rounded-lg p-4">
                                      {(tasks[story.id] || []).map((task, i) => (
                                        <div
                                          key={task.id}
                                          className={`flex items-center gap-3 px-3 py-3 ${
                                            i < (tasks[story.id] || []).length - 1
                                              ? 'border-b border-[rgba(255,255,255,0.06)]'
                                              : ''
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            className="w-4 h-4 accent-[#8B5CF6]"
                                          />
                                          <span className="text-sm text-[#A1A1A1] flex-1">
                                            {task.title}
                                          </span>
                                          {task.complexity && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${complexityColors[task.complexity]}`}>
                                              {task.complexity}
                                            </span>
                                          )}
                                          <button
                                            onClick={() => copyTask(task)}
                                            className="text-[#666666] hover:text-[#A1A1A1] transition-colors p-1"
                                          >
                                            <CopyIcon className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ))}
                                      <div className="pt-3 mt-2 border-t border-[rgba(255,255,255,0.06)] text-right">
                                        <button className="text-xs text-[#A1A1A1] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 hover:border-[rgba(255,255,255,0.15)] transition-colors">
                                          Copy all
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Add Epic Button */}
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
              </h2>
              <button
                onClick={() => setShowComposer(false)}
                className="text-[#666666] hover:text-[#A1A1A1] transition-colors"
              >
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
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-4 text-sm text-white placeholder:text-[#666666] focus:border-[rgba(255,255,255,0.2)] outline-none"
                  required
                />
              </div>

              <div className="mb-8">
                <label className="block text-xs text-[#666666] mb-3">Description</label>
                <textarea
                  placeholder="Optional description"
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
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
    </div>
  )
}

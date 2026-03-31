'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/Sidebar'
import { SearchIcon, PlusIcon, XIcon } from '@/components/icons'
import { Project } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [projects, setProjects] = useState<Project[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUserId(user.id)

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setProjects(data)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject.name || creating || !userId) return

    setCreating(true)

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: newProject.name,
        description: newProject.description || null,
      })
      .select()
      .single()

    setCreating(false)

    if (!error && data) {
      setProjects((prev) => [data, ...prev])
      setNewProject({ name: '', description: '' })
      setShowCreate(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0A0A0A]">
        <Sidebar activePage="dashboard" onCreateProject={() => setShowCreate(true)} />
        <main className="flex-1 flex items-center justify-center">
          <span className="text-sm text-[#666666]">Loading...</span>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0A0A0A]">
      <Sidebar activePage="dashboard" onCreateProject={() => setShowCreate(true)} />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-[72px] px-8 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
          <span className="text-base font-medium text-white">All projects</span>
          {/* Search */}
          <div className="flex items-center gap-3 bg-[#141414] border border-[rgba(255,255,255,0.1)] rounded-xl pr-5 h-[40px] w-[260px]" style={{ paddingLeft: '16px' }}>
            <SearchIcon className="w-4 h-4 text-[#666666] flex-shrink-0" />
            <span className="text-sm text-[#666666]">Search</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-8 overflow-auto">
          {projects.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
              {/* New Project Card — always first */}
              <button
                onClick={() => setShowCreate(true)}
                className="bg-[#141414] border border-dashed border-[rgba(255,255,255,0.1)] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[rgba(255,255,255,0.2)] transition-colors"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
                  <PlusIcon className="w-5 h-5 text-[#666666]" />
                </div>
                <span className="text-sm text-[#666666]">New project</span>
              </button>

              {/* Project Cards */}
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => router.push(`/project/${project.id}`)}
                  className="bg-[#141414] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden hover:border-[rgba(255,255,255,0.15)] cursor-pointer transition-colors text-left"
                >
                  {/* Thumbnail */}
                  <div className="h-[140px] bg-[#0D0D0D]" />
                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-white mb-1 truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-[#666666]">
                      {project.description || 'No description'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center h-full">
              <button
                onClick={() => setShowCreate(true)}
                className="flex flex-col items-center justify-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-12 h-12 rounded-xl bg-[rgba(139,92,246,0.15)] flex items-center justify-center">
                  <PlusIcon className="w-6 h-6 text-[#8B5CF6]" />
                </div>
                <span className="text-sm text-[#666666]">Create your first project</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="h-12 px-8 flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] flex-shrink-0">
          <span className="text-xs text-[#666666]">{projects.length} projects</span>
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.1)] rounded-full px-4 py-1.5 text-xs flex items-center gap-2">
            <span className="text-[#A1A1A1]">Tasks:</span>
            <span className="text-[#666666]">0 active</span>
          </div>
        </footer>
      </main>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="w-full max-w-[480px] bg-[#141414] border border-[rgba(255,255,255,0.1)] rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-base font-medium text-white">New project</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-[#666666] hover:text-[#A1A1A1] transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="mb-6">
                <label className="block text-xs text-[#666666] mb-3">Name</label>
                <input
                  type="text"
                  placeholder="Project name"
                  value={newProject.name}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#0D0D0D] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-4 text-sm text-white placeholder:text-[#666666] focus:border-[rgba(255,255,255,0.2)] outline-none"
                  required
                />
              </div>

              <div className="mb-8">
                <label className="block text-xs text-[#666666] mb-3">Description</label>
                <textarea
                  placeholder="Optional description"
                  value={newProject.description}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full h-[120px] bg-[#0D0D0D] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-4 text-sm text-white placeholder:text-[#666666] focus:border-[rgba(255,255,255,0.2)] outline-none resize-none"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 text-sm text-[#A1A1A1] border border-[rgba(255,255,255,0.1)] rounded-lg py-3.5 hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 text-white rounded-lg py-3.5 text-sm font-medium transition-colors"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

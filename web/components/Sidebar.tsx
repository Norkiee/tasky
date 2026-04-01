'use client'

import { useRouter } from 'next/navigation'
import { PlusIcon, LogoutIcon } from './icons'
import { createClient } from '@/lib/supabase/client'

interface NavIconProps {
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
  onClick?: () => void
}

function NavIcon({ icon: Icon, active = false, onClick }: NavIconProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-10 h-10 rounded-[10px] flex items-center justify-center transition-colors
        ${active
          ? 'bg-[rgba(139,92,246,0.15)] text-[#8B5CF6]'
          : 'text-[#666666] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#A1A1A1]'
        }
      `}
    >
      <Icon className="w-5 h-5" />
    </button>
  )
}

interface SidebarProps {
  activePage?: 'dashboard' | 'project'
  onCreateProject?: () => void
}

export function Sidebar({ activePage = 'dashboard', onCreateProject }: SidebarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="w-[56px] h-screen bg-transparent border-r border-[rgba(255,255,255,0.06)] flex flex-col items-center pb-8 px-2 gap-2 flex-shrink-0" style={{ paddingTop: '16px' }}>
      {/* Primary Action */}
      <button
        onClick={onCreateProject}
        className="w-10 h-10 rounded-[10px] bg-[rgba(139,92,246,0.15)] flex items-center justify-center text-[#8B5CF6] mb-2"
      >
        <PlusIcon className="w-5 h-5" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sign Out */}
      <NavIcon icon={LogoutIcon} onClick={handleSignOut} />

      {/* User Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white text-sm font-medium mt-2">
        U
      </div>
    </aside>
  )
}

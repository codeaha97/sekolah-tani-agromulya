'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Sprout } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserNavProfile } from '@/app/(dashboard)/layout'

export function MobileTopHeader({ profile }: { profile: UserNavProfile }) {
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = ['admin', 'mentor'].includes(profile.role)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="md:hidden sticky top-0 z-40 bg-emerald-950 text-white px-4 py-2.5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center shrink-0">
          <Sprout className="w-4 h-4 text-emerald-300" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold truncate">{profile.full_name}</p>
          <p className="text-[10px] text-emerald-300 truncate">
            {isAdmin
              ? 'Mentor / Admin Agro Mulya'
              : `${profile.cohort_name || '-'} • ${profile.farm_group || '-'}`}
          </p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        title="Keluar Akun"
        className="p-2 rounded-lg text-emerald-300 hover:bg-emerald-900 hover:text-white transition-colors shrink-0"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </header>
  )
}
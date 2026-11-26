'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  BookOpen,
  Sprout,
  Calculator,
  UserCog,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserNavProfile } from '@/app/(dashboard)/layout'

const navItems = [
  { href: '/dashboard', label: 'Beranda', icon: Home },
  { href: '/akademi', label: 'Akademi & Mind Map', icon: BookOpen },
  { href: '/kebun', label: 'Kebun & Monitoring', icon: Sprout },
  { href: '/bisnis', label: 'Panen & Bisnis', icon: Calculator },
  { href: '/profil', label: 'Profil & Pengaturan', icon: UserCog },
]

export function DesktopSidebar({ profile }: { profile: UserNavProfile }) {
  const [confirmLogout, setConfirmLogout] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isAdmin = ['admin', 'mentor'].includes(profile.role)

  const initials = profile.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  const handleLogoutClick = async () => {
    if (!confirmLogout) {
      setConfirmLogout(true)
      setTimeout(() => setConfirmLogout(false), 3500)
      return
    }
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-emerald-950 text-emerald-50 border-r border-emerald-900/80 p-4 z-40">
      {/* Header Brand */}
      <div className="mb-6 px-2 pt-2 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-800/90 border border-emerald-700/80 flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="font-bold text-sm tracking-tight text-white truncate">
              Sekolah Tani Organik
            </h1>
            <p className="text-[11px] font-medium text-emerald-300">by Agro Mulya</p>
          </div>
        </div>

        <div>
          <span
            className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
              isAdmin
                ? 'bg-amber-500/15 text-amber-200 border-amber-400/30'
                : 'bg-emerald-900/90 text-emerald-200 border-emerald-700/60'
            }`}
          >
            {isAdmin ? 'Mentor & Koordinator' : profile.cohort_name || 'Peserta Kelas'}
          </span>
        </div>
      </div>

      {/* Menu Navigasi */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-2xs font-semibold'
                  : 'text-emerald-200/85 hover:bg-emerald-900/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-emerald-300' : 'text-emerald-400/80 group-hover:text-emerald-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer Akun & Tombol Keluar */}
      <div className="pt-4 border-t border-emerald-900/80 space-y-2 mt-auto">
        <Link
          href="/profil"
          className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-emerald-900/60 border border-emerald-800/70 hover:bg-emerald-900 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-emerald-200 font-bold text-xs flex items-center justify-center shrink-0">
              {initials || 'AM'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{profile.full_name}</p>
              <p className="text-[11px] text-emerald-300/90 truncate">
                {isAdmin
                  ? 'Admin Agro Mulya'
                  : `${profile.cohort_name || '-'} • ${profile.farm_group || '-'}`}
              </p>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        </Link>

        <button
          type="button"
          onClick={handleLogoutClick}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            confirmLogout
              ? 'bg-red-600 text-white shadow-2xs'
              : 'text-emerald-300/90 hover:bg-emerald-900/80 hover:text-white'
          }`}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{confirmLogout ? 'Klik Sekali Lagi untuk Keluar' : 'Keluar Akun'}</span>
        </button>
      </div>
    </aside>
  )
}
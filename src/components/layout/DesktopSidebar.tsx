'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, BookOpen, Sprout, Calculator, ShieldCheck, LogOut, UserCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserNavProfile } from '@/app/(dashboard)/layout'

const baseNavItems = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/akademi', label: 'Akademi & Mind Map', icon: BookOpen },
  { href: '/kebun', label: 'Kebun & Monitoring', icon: Sprout },
  { href: '/bisnis', label: 'Panen & Bisnis', icon: Calculator },
]

export function DesktopSidebar({ profile }: { profile: UserNavProfile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isAdmin = ['admin', 'mentor'].includes(profile.role)
  const navItems = isAdmin
    ? [...baseNavItems, { href: '/admin', label: 'Panel Admin', icon: ShieldCheck }]
    : baseNavItems

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-emerald-950 text-emerald-50 p-4 z-40">
      <div className="mb-6 px-2 pt-2">
        <div className="inline-block px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
          {isAdmin ? 'Mentor / Koordinator' : profile.cohort_name || 'Peserta Kelas'}
        </div>
        <h1 className="font-bold text-lg tracking-tight text-white">Sekolah Tani Organik</h1>
        <p className="text-xs text-emerald-300">by Agro Mulya</p>
      </div>

      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-emerald-200 hover:bg-emerald-900/60 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-300' : 'text-emerald-400'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Kartu Identitas User & Tombol Keluar */}
      <div className="pt-4 border-t border-emerald-900 space-y-2 mt-auto">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-emerald-900/50">
          <UserCircle className="w-8 h-8 text-emerald-300 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{profile.full_name}</p>
            <p className="text-[11px] text-emerald-300 truncate">
              {isAdmin
                ? 'Admin Agro Mulya'
                : `${profile.cohort_name || '-'} • ${profile.farm_group || '-'}`}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-emerald-300 hover:bg-emerald-900 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar Akun
        </button>
      </div>
    </aside>
  )
}
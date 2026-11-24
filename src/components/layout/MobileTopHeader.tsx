'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Sprout, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserNavProfile } from '@/app/(dashboard)/layout'

export function MobileTopHeader({ profile }: { profile: UserNavProfile }) {
  const [confirmLogout, setConfirmLogout] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = ['admin', 'mentor'].includes(profile.role)

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
    <header className="md:hidden sticky top-0 z-40 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white border-b border-emerald-800/60 shadow-sm pt-safe">
      {/* Baris Utama: Identitas Aplikasi & Tombol Keluar */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-800/90 border border-emerald-700/80 flex items-center justify-center shrink-0 shadow-inner">
            <Sprout className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="text-sm font-bold tracking-tight text-white truncate">
              Sekolah Tani Organik
            </h1>
            <p className="text-[11px] font-medium text-emerald-300 truncate">
              by Agro Mulya
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogoutClick}
          title="Keluar Akun"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all shrink-0 ${
            confirmLogout
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-emerald-900/80 border border-emerald-800 text-emerald-200 hover:bg-emerald-800 hover:text-white'
          }`}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{confirmLogout ? 'Yakin Keluar?' : 'Keluar'}</span>
        </button>
      </div>

      {/* Baris Kedua: Pill Status Pengguna & Kelompok (Tap untuk ke Profil) */}
      <div className="px-4 pb-2.5">
        <Link
          href="/profil"
          className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/55 border border-emerald-800/70 active:bg-emerald-800/70 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="font-semibold text-white truncate">{profile.full_name}</span>
            <span className="text-emerald-500">•</span>
            <span className="text-emerald-200 truncate">
              {isAdmin
                ? 'Mentor / Admin'
                : `${profile.cohort_name || 'Angkatan'} • ${profile.farm_group || 'Kelompok'}`}
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        </Link>
      </div>
    </header>
  )
}
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DesktopSidebar } from '@/components/layout/DesktopSidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { MobileTopHeader } from '@/components/layout/MobileTopHeader'

export interface UserNavProfile {
  full_name: string
  role: string
  cohort_name: string | null
  farm_group: string | null
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, cohort_name, farm_group')
    .eq('id', user.id)
    .single()

  const userProfile: UserNavProfile = {
    full_name: profile?.full_name || 'Pengguna Agro Mulya',
    role: profile?.role || 'peserta',
    cohort_name: profile?.cohort_name || null,
    farm_group: profile?.farm_group || null,
  }

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col md:flex-row">
      {/* SIDEBAR DESKTOP */}
      <DesktopSidebar profile={userProfile} />

      {/* TOP BAR KHUSUS MOBILE */}
      <MobileTopHeader profile={userProfile} />

      {/* KONTEN UTAMA */}
      <main className="flex-1 md:pl-64 pb-24 md:pb-10">
        <div className="max-w-5xl mx-auto px-4 py-5 sm:px-6 md:p-8">{children}</div>
      </main>

      {/* BOTTOM NAVIGATION BAR MOBILE */}
      <MobileBottomNav />
    </div>
  )
}
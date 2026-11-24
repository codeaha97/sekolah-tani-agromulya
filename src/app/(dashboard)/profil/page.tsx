import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { ProfileSettingsForm } from '@/components/profil/ProfileSettingsForm'
import { ShieldCheck, Sprout } from 'lucide-react'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const isAdmin = ['admin', 'mentor'].includes(profile.role)

  return (
    <div className="space-y-5">
      {/* Header Halaman */}
      <div className="space-y-1.5 pb-3 border-b border-stone-200">
        <Badge
          className={
            isAdmin
              ? 'inline-flex items-center gap-1.5 rounded-md bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200/80 text-[11px] font-semibold'
              : 'inline-flex items-center gap-1.5 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 text-[11px] font-semibold'
          }
        >
          {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Sprout className="w-3.5 h-3.5" />}
          <span>{isAdmin ? 'Mentor & Koordinator' : `${profile.cohort_name} • ${profile.farm_group}`}</span>
        </Badge>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
          Profil &amp; Pengaturan Akun
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Kelola identitas pribadi, penempatan kelompok tani, dan keamanan kata sandi akun Anda.
        </p>
      </div>

      <ProfileSettingsForm userId={user.id} email={user.email || ''} initialProfile={profile} />
    </div>
  )
}
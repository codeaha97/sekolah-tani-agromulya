import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { ProfileSettingsForm } from '@/components/profil/ProfileSettingsForm'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const isAdmin = ['admin', 'mentor'].includes(profile.role)

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-stone-200">
        <Badge className={isAdmin ? 'bg-amber-600 mb-1' : 'bg-emerald-700 mb-1'}>
          {isAdmin ? 'Mentor / Koordinator' : `${profile.cohort_name} • ${profile.farm_group}`}
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Profil & Pengaturan Akun</h1>
        <p className="text-sm text-stone-500">Kelola informasi pribadi, kelompok tani, dan keamanan akun Anda.</p>
      </div>

      <ProfileSettingsForm userId={user.id} email={user.email || ''} initialProfile={profile} />
    </div>
  )
}
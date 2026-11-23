import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sprout, CheckSquare, TrendingUp, BookOpen, Users } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Jika Admin/Mentor, tampilkan semua ringkasan kelas; jika Peserta, filter sesuai Angkatan & Kelompoknya
  let summaryQuery = supabase.from('batch_business_summary').select('*')
  if (profile?.role === 'peserta' && profile.cohort_name && profile.farm_group) {
    summaryQuery = summaryQuery
      .eq('cohort_name', profile.cohort_name)
      .eq('farm_group', profile.farm_group)
  }
  const { data: batches } = await summaryQuery

  // Ambil daftar anggota satu kelompok (khusus peserta)
  const { data: teammates } =
    profile?.role === 'peserta' && profile.cohort_name && profile.farm_group
      ? await supabase
          .from('profiles')
          .select('id, full_name, phone_number')
          .eq('cohort_name', profile.cohort_name)
          .eq('farm_group', profile.farm_group)
      : { data: [] }

  // Ambil agenda SOP terdekat milik batch kelompok
  const batchIds = batches?.map((b) => b.batch_id) || []
  const { data: pendingTasks } =
    batchIds.length > 0
      ? await supabase
          .from('batch_sop_progress')
          .select('id, custom_step_name, target_date, batches(crop_name)')
          .in('batch_id', batchIds)
          .eq('is_completed', false)
          .order('target_date', { ascending: true })
          .limit(5)
      : { data: [] }

  const totalAlive = batches?.reduce((acc, b) => acc + (b.current_alive_count || 0), 0) || 0
  const totalInitial = batches?.reduce((acc, b) => acc + (b.initial_plant_count || 0), 0) || 0
  const survivalRate = totalInitial > 0 ? Math.round((totalAlive / totalInitial) * 100) : 100

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-stone-900">Halo, {profile?.full_name}</h1>
          </div>
          <p className="text-sm text-stone-500">
            {profile?.role === 'peserta'
              ? `${profile.cohort_name} • ${profile.farm_group}`
              : 'Koordinator / Mentor Sekolah Tani Organik Agro Mulya'}
          </p>
        </div>

        {profile?.role !== 'peserta' && (
          <Link
            href="/admin"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
          >
            Buka Panel Admin
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-emerald-600" /> Populasi Hidup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalAlive} <span className="text-xs font-normal text-stone-500">batang</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Survival Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{survivalRate}%</div>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" /> Batch Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {batches?.length || 0} <span className="text-xs font-normal text-stone-500">kloter tanam</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anggota Kelompok Kolaborasi (Khusus Peserta) */}
      {profile?.role === 'peserta' && teammates && teammates.length > 0 && (
        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-950 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" /> Rekan Satu Kelompok ({profile.farm_group})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {teammates.map((member) => (
              <Badge key={member.id} variant="secondary" className="bg-white border border-emerald-200 text-stone-700 py-1 px-2.5">
                {member.full_name}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Checklist SOP Terdekat */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-700" /> Agenda Tahapan Bertani
          </CardTitle>
          <Link href="/kebun" className="text-xs font-medium text-emerald-700 hover:underline">
            Lihat Kebun
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingTasks && pendingTasks.length > 0 ? (
            pendingTasks.map((task: any) => (
              <div key={task.id} className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-100 text-sm">
                <div>
                  <span className="font-medium text-stone-800">{task.custom_step_name}</span>
                  {task.batches?.crop_name && (
                    <span className="ml-2 text-xs text-emerald-700 font-medium">• {task.batches.crop_name}</span>
                  )}
                </div>
                <span className="text-xs text-stone-500">{task.target_date || 'Segera'}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-stone-500">Belum ada jadwal perawatan tertunda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
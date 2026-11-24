import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sprout,
  CheckSquare,
  TrendingUp,
  BookOpen,
  Users,
  MessageCircle,
  ArrowUpRight,
  Scale,
} from 'lucide-react'
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

  const isAdmin = ['admin', 'mentor'].includes(profile?.role || '')

  // Query batch: Admin melihat semua kelompok; Peserta hanya melihat kelompoknya
  let summaryQuery = supabase.from('batch_business_summary').select('*').order('cohort_name', { ascending: true })
  if (!isAdmin && profile?.cohort_name && profile?.farm_group) {
    summaryQuery = summaryQuery
      .eq('cohort_name', profile.cohort_name)
      .eq('farm_group', profile.farm_group)
  }
  const { data: batches } = await summaryQuery

  // Jika Peserta: ambil rekan satu kelompok; Jika Admin: ambil seluruh daftar peserta
  const [{ data: teammates }, { data: allParticipants }] = await Promise.all([
    !isAdmin && profile?.cohort_name && profile?.farm_group
      ? supabase
          .from('profiles')
          .select('id, full_name, phone_number')
          .eq('cohort_name', profile.cohort_name)
          .eq('farm_group', profile.farm_group)
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase
          .from('profiles')
          .select('*')
          .eq('role', 'peserta')
          .order('cohort_name', { ascending: true })
          .order('farm_group', { ascending: true })
      : Promise.resolve({ data: [] }),
  ])

  // Ambil agenda SOP terdekat
  const batchIds = batches?.map((b) => b.batch_id) || []
  const { data: pendingTasks } =
    batchIds.length > 0
      ? await supabase
          .from('batch_sop_progress')
          .select('id, custom_step_name, target_date, batches(crop_name, cohort_name, farm_group)')
          .in('batch_id', batchIds)
          .eq('is_completed', false)
          .order('target_date', { ascending: true })
          .limit(6)
      : { data: [] }

  const totalAlive = batches?.reduce((acc, b) => acc + (b.current_alive_count || 0), 0) || 0
  const totalInitial = batches?.reduce((acc, b) => acc + (b.initial_plant_count || 0), 0) || 0
  const totalHarvestKg = batches?.reduce((acc, b) => acc + Number(b.total_harvest_kg || 0), 0) || 0
  const survivalRate = totalInitial > 0 ? Math.round((totalAlive / totalInitial) * 100) : 100

  return (
    <div className="space-y-6">
      {/* Header Beranda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className={isAdmin ? 'bg-amber-600 hover:bg-amber-600' : 'bg-emerald-700 hover:bg-emerald-700'}>
              {isAdmin ? 'Mentor & Koordinator' : `${profile?.cohort_name} • ${profile?.farm_group}`}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Halo, {profile?.full_name}</h1>
          <p className="text-sm text-stone-500">
            {isAdmin
              ? 'Pantau progres budidaya seluruh angkatan, jadwal perawatan, dan direktori peserta.'
              : 'Ringkasan perkembangan tanaman dan agenda perawatan kelompok Anda.'}
          </p>
        </div>

        <Link
          href="/profil"
          className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg border border-stone-200 bg-white text-stone-700 text-xs font-medium hover:bg-stone-50 self-start sm:self-auto"
        >
          Pengaturan Profil
        </Link>
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'md:grid-cols-3'} gap-3 md:gap-4`}>
        {isAdmin && (
          <Card className="border-stone-200/80 shadow-none">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-700" /> Total Peserta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-stone-900">
                {allParticipants?.length || 0}{' '}
                <span className="text-xs font-normal text-stone-500">orang</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-stone-200/80 shadow-none">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-emerald-600" /> Populasi Hidup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-stone-900">
              {totalAlive} <span className="text-xs font-normal text-stone-500">batang</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/80 shadow-none">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Survival Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{survivalRate}%</div>
          </CardContent>
        </Card>

        <Card className={`${isAdmin ? '' : 'col-span-2 md:col-span-1'} border-stone-200/80 shadow-none`}>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
              {isAdmin ? (
                <>
                  <Scale className="w-4 h-4 text-amber-600" /> Total Panen Kelas
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 text-amber-600" /> Batch Aktif
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-stone-900">
              {isAdmin ? (
                <>
                  {totalHarvestKg} <span className="text-xs font-normal text-stone-500">kg</span>
                </>
              ) : (
                <>
                  {batches?.length || 0} <span className="text-xs font-normal text-stone-500">kloter tanam</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TAMPILAN KHUSUS ADMIN / MENTOR: TAB MONITORING KELAS & DIREKTORI PESERTA */}
      {isAdmin ? (
        <Tabs defaultValue="progres-kelompok" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-stone-200/70">
            <TabsTrigger value="progres-kelompok">Progres Kelompok ({batches?.length || 0})</TabsTrigger>
            <TabsTrigger value="direktori-peserta">Peserta ({allParticipants?.length || 0})</TabsTrigger>
          </TabsList>

          {/* TAB 1: REKAPITULASI TANAMAN LINTAS KELOMPOK */}
          <TabsContent value="progres-kelompok" className="mt-4">
            <Card className="border-stone-200/80 shadow-none">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">Rekapitulasi Tanaman per Kelompok</CardTitle>
                <Link href="/kebun" className="text-xs font-medium text-emerald-700 hover:underline">
                  Semua Kebun & SOP →
                </Link>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 text-xs uppercase">
                      <th className="py-2.5 px-3">Angkatan & Kelompok</th>
                      <th className="py-2.5 px-3">Komoditas</th>
                      <th className="py-2.5 px-3">Populasi</th>
                      <th className="py-2.5 px-3">Panen</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {batches && batches.length > 0 ? (
                      batches.map((row: any) => (
                        <tr key={row.batch_id} className="hover:bg-stone-50/80">
                          <td className="py-2.5 px-3 font-medium">
                            {row.cohort_name} • {row.farm_group}
                            <span className="block text-xs text-stone-400 font-normal">PIC: {row.owner_name}</span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-stone-800">{row.crop_name}</td>
                          <td className="py-2.5 px-3 text-stone-600">
                            {row.current_alive_count} / {row.initial_plant_count} btg
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-700">{row.total_harvest_kg} kg</td>
                          <td className="py-2.5 px-3 text-right">
                            <Link
                              href={`/kebun/${row.batch_id}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                            >
                              Detail <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-stone-400 text-xs">
                          Belum ada data tanaman kelompok yang didaftarkan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: DIREKTORI PESERTA LINTAS ANGKATAN */}
          <TabsContent value="direktori-peserta" className="mt-4">
            <Card className="border-stone-200/80 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Direktori Peserta Kelas</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 text-xs uppercase">
                      <th className="py-2.5 px-3">Nama Peserta</th>
                      <th className="py-2.5 px-3">Angkatan</th>
                      <th className="py-2.5 px-3">Kelompok</th>
                      <th className="py-2.5 px-3">WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {allParticipants && allParticipants.length > 0 ? (
                      allParticipants.map((p: any) => {
                        const cleanPhone = p.phone_number?.replace(/[^0-9]/g, '').replace(/^0/, '62')
                        return (
                          <tr key={p.id} className="hover:bg-stone-50/80">
                            <td className="py-2.5 px-3 font-medium text-stone-800">{p.full_name}</td>
                            <td className="py-2.5 px-3">
                              <Badge variant="outline" className="text-xs font-normal">
                                {p.cohort_name || '-'}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-stone-600">{p.farm_group || '-'}</td>
                            <td className="py-2.5 px-3">
                              {cleanPhone ? (
                                <a
                                  href={`https://wa.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" /> {p.phone_number}
                                </a>
                              ) : (
                                <span className="text-xs text-stone-400">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-stone-400 text-xs">
                          Belum ada peserta yang mendaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* TAMPILAN KHUSUS PESERTA: ANGGOTA KELOMPOK */
        teammates &&
        teammates.length > 0 && (
          <Card className="bg-emerald-50/50 border-emerald-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-950 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" /> Rekan Satu Kelompok ({profile?.farm_group})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {teammates.map((member) => (
                <Badge
                  key={member.id}
                  variant="secondary"
                  className="bg-white border border-emerald-200 text-stone-700 py-1 px-2.5"
                >
                  {member.full_name}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )
      )}

      {/* Checklist SOP Terdekat (Berlaku untuk Peserta & Pemantauan Mentor) */}
      <Card className="border-stone-200/80 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-700" />
            {isAdmin ? 'Agenda Perawatan Kelompok Mendatang' : 'Agenda Tahapan Bertani'}
          </CardTitle>
          <Link href="/kebun" className="text-xs font-medium text-emerald-700 hover:underline">
            Lihat Kebun
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingTasks && pendingTasks.length > 0 ? (
            pendingTasks.map((task: any) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-100 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-medium text-stone-800">{task.custom_step_name}</span>
                  {task.batches?.crop_name && (
                    <span className="ml-2 text-xs text-emerald-700 font-medium">
                      • {task.batches.crop_name}
                      {isAdmin && task.batches.farm_group ? ` (${task.batches.farm_group})` : ''}
                    </span>
                  )}
                </div>
                <span className="text-xs text-stone-500 shrink-0">{task.target_date || 'Segera'}</span>
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
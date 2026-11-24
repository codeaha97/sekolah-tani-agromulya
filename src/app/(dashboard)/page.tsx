import { connection } from 'next/server'
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
  Settings2,
  CalendarClock,
  PlusCircle,
  Calculator,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

interface AgendaItem {
  id: string
  batch_id: string
  step_name: string
  target_date: string | null
  crop_name: string
  farm_group: string | null
}

export default async function DashboardHomePage() {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = ['admin', 'mentor'].includes(profile?.role || '')

  let summaryQuery = supabase
    .from('batch_business_summary')
    .select('*')
    .order('cohort_name', { ascending: true })
    .order('farm_group', { ascending: true })

  if (!isAdmin && profile?.cohort_name && profile?.farm_group) {
    summaryQuery = summaryQuery
      .eq('cohort_name', profile.cohort_name)
      .eq('farm_group', profile.farm_group)
  }
  const { data: batches } = await summaryQuery

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

  // Bangun peta batch untuk pencocokan cepat tanpa nested join RLS
  const batchMap = new Map<string, any>()
  batches?.forEach((b) => batchMap.set(b.batch_id, b))
  const batchIds = Array.from(batchMap.keys())

  let upcomingAgenda: AgendaItem[] = []

  if (batchIds.length > 0) {
    // 1. Ambil tahapan yang belum selesai dari batch_sop_progress
    const { data: progressRows } = await supabase
      .from('batch_sop_progress')
      .select('id, batch_id, custom_step_name, target_date, is_completed')
      .in('batch_id', batchIds)
      .eq('is_completed', false)
      .order('target_date', { ascending: true })
      .limit(8)

    if (progressRows && progressRows.length > 0) {
      upcomingAgenda = progressRows.map((row) => {
        const b = batchMap.get(row.batch_id)
        return {
          id: row.id,
          batch_id: row.batch_id,
          step_name: row.custom_step_name,
          target_date: row.target_date,
          crop_name: b?.crop_name || 'Tanaman',
          farm_group: b?.farm_group || null,
        }
      })
    } else {
      // 2. Fallback: Jika batch_sop_progress masih kosong, hitung langsung dari crop_sop_templates
      const { data: templates } = await supabase
        .from('crop_sop_templates')
        .select('*')
        .order('step_order', { ascending: true })

      if (templates && templates.length > 0 && batches) {
        const generated: AgendaItem[] = []
        for (const b of batches) {
          const matchedTpls = templates.filter(
            (t) => t.crop_name?.trim().toLowerCase() === b.crop_name?.trim().toLowerCase()
          )
          for (const tpl of matchedTpls) {
            const target = new Date(b.planting_date)
            target.setDate(target.getDate() + Number(tpl.target_hst || 0))
            generated.push({
              id: `${b.batch_id}-${tpl.id}`,
              batch_id: b.batch_id,
              step_name: `${tpl.phase_name} (HST ${tpl.target_hst})`,
              target_date: target.toISOString().split('T')[0],
              crop_name: b.crop_name,
              farm_group: b.farm_group || null,
            })
          }
        }
        upcomingAgenda = generated
          .sort((a, b) => (a.target_date || '').localeCompare(b.target_date || ''))
          .slice(0, 6)
      }
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const totalAlive = batches?.reduce((acc, b) => acc + (b.current_alive_count || 0), 0) || 0
  const totalInitial = batches?.reduce((acc, b) => acc + (b.initial_plant_count || 0), 0) || 0
  const totalHarvestKg = batches?.reduce((acc, b) => acc + Number(b.total_harvest_kg || 0), 0) || 0
  const survivalRate = totalInitial > 0 ? Math.round((totalAlive / totalInitial) * 100) : 100

  return (
    <div className="space-y-6">
      {/* Header Beranda */}
      <div className="flex items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div className="space-y-1 min-w-0">
          <Badge
            className={
              isAdmin
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 rounded-md font-semibold text-[11px]'
                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 rounded-md font-semibold text-[11px]'
            }
          >
            {isAdmin ? 'Mentor & Koordinator' : `${profile?.cohort_name} • ${profile?.farm_group}`}
          </Badge>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 truncate">
            Halo, {profile?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            {isAdmin
              ? 'Ringkasan performa budidaya lintas angkatan dan direktori peserta aktif.'
              : 'Pantau kesehatan tanaman dan jadwal perawatan kelompok Anda hari ini.'}
          </p>
        </div>

        <Link
          href="/profil"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors shrink-0 shadow-2xs"
        >
          <Settings2 className="w-3.5 h-3.5 text-stone-500" />
          <span className="hidden sm:inline">Pengaturan</span>
        </Link>
      </div>

      {/* Kartu KPI Enterprise */}
      <div className={`grid grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'md:grid-cols-3'} gap-3`}>
        {isAdmin && (
          <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Peserta</p>
                <p className="text-xl sm:text-2xl font-bold text-stone-900 tabular-nums">
                  {allParticipants?.length || 0}{' '}
                  <span className="text-xs font-normal text-stone-400">org</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Populasi</p>
              <p className="text-xl sm:text-2xl font-bold text-stone-900 tabular-nums">
                {totalAlive} <span className="text-xs font-normal text-stone-400">btg</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Survival</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-700 tabular-nums">{survivalRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`${isAdmin ? '' : 'col-span-2 md:col-span-1'} rounded-xl border-stone-200/90 shadow-2xs bg-white`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              {isAdmin ? <Scale className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                {isAdmin ? 'Total Panen' : 'Batch Aktif'}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-stone-900 tabular-nums">
                {isAdmin ? (
                  <>
                    {totalHarvestKg} <span className="text-xs font-normal text-stone-400">kg</span>
                  </>
                ) : (
                  <>
                    {batches?.length || 0} <span className="text-xs font-normal text-stone-400">kloter</span>
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Bar (Khusus Peserta) */}
      {!isAdmin && (
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/kebun"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-700 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-800 transition-colors shadow-2xs"
          >
            <PlusCircle className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>Monitoring Kebun</span>
          </Link>
          <Link
            href="/bisnis"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white border border-stone-200 text-stone-800 text-xs sm:text-sm font-semibold hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <Calculator className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Catat RAB &amp; Panen</span>
          </Link>
        </div>
      )}

      {/* TAMPILAN KHUSUS ADMIN / MENTOR */}
      {isAdmin ? (
        <Tabs defaultValue="progres-kelompok" className="w-full">
          <TabsList className="flex w-full sm:w-fit h-auto p-1 bg-stone-200/80 rounded-lg gap-1">
            <TabsTrigger
              value="progres-kelompok"
              className="flex-1 sm:flex-initial rounded-md px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
            >
              Kelompok ({batches?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="direktori-peserta"
              className="flex-1 sm:flex-initial rounded-md px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
            >
              Peserta ({allParticipants?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: REKAPITULASI TANAMAN LINTAS KELOMPOK */}
          <TabsContent value="progres-kelompok" className="mt-4">
            <div className="md:hidden space-y-2.5">
              {batches && batches.length > 0 ? (
                batches.map((row: any) => (
                  <Link key={row.batch_id} href={`/kebun/${row.batch_id}`} className="block">
                    <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white hover:border-emerald-500 transition-colors">
                      <CardContent className="p-3.5 flex items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <Badge variant="outline" className="rounded-md text-[10px] font-medium">
                            {row.cohort_name} • {row.farm_group}
                          </Badge>
                          <p className="font-bold text-sm text-stone-900 truncate">{row.crop_name}</p>
                          <p className="text-[11px] text-stone-500">
                            Hidup: <strong>{row.current_alive_count}/{row.initial_plant_count}</strong> btg • Panen:{' '}
                            <strong className="text-emerald-700">{row.total_harvest_kg} kg</strong>
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <p className="text-center text-stone-400 text-xs py-6 bg-white rounded-xl border border-stone-200">
                  Belum ada data tanaman kelompok.
                </p>
              )}
            </div>

            <Card className="hidden md:block rounded-xl border-stone-200/90 shadow-2xs bg-white">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">Rekapitulasi Tanaman per Kelompok</CardTitle>
                <Link href="/kebun" className="text-xs font-semibold text-emerald-700 hover:underline">
                  Semua Kebun &amp; SOP →
                </Link>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 text-xs uppercase">
                      <th className="py-2.5 px-3">Angkatan &amp; Kelompok</th>
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
                          <td className="py-3 px-3 font-medium text-stone-800">
                            {row.cohort_name} • {row.farm_group}
                            <span className="block text-xs text-stone-400 font-normal">PIC: {row.owner_name}</span>
                          </td>
                          <td className="py-3 px-3 font-medium text-stone-800">{row.crop_name}</td>
                          <td className="py-3 px-3 text-stone-600 tabular-nums">
                            {row.current_alive_count} / {row.initial_plant_count} btg
                          </td>
                          <td className="py-3 px-3 font-semibold text-emerald-700 tabular-nums">
                            {row.total_harvest_kg} kg
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link
                              href={`/kebun/${row.batch_id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
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
            <div className="md:hidden space-y-2.5">
              {allParticipants && allParticipants.length > 0 ? (
                allParticipants.map((p: any) => {
                  const cleanPhone = p.phone_number?.replace(/[^0-9]/g, '').replace(/^0/, '62')
                  return (
                    <Card key={p.id} className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
                      <CardContent className="p-3.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-stone-900 truncate">{p.full_name}</p>
                          <p className="text-xs text-stone-500">
                            {p.cohort_name || '-'} • {p.farm_group || '-'}
                          </p>
                        </div>
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 shrink-0"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Chat
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <p className="text-center text-stone-400 text-xs py-6 bg-white rounded-xl border border-stone-200">
                  Belum ada peserta yang mendaftar.
                </p>
              )}
            </div>

            <Card className="hidden md:block rounded-xl border-stone-200/90 shadow-2xs bg-white">
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
                      <th className="py-2.5 px-3 text-right">Kontak WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {allParticipants && allParticipants.length > 0 ? (
                      allParticipants.map((p: any) => {
                        const cleanPhone = p.phone_number?.replace(/[^0-9]/g, '').replace(/^0/, '62')
                        return (
                          <tr key={p.id} className="hover:bg-stone-50/80">
                            <td className="py-3 px-3 font-medium text-stone-800">{p.full_name}</td>
                            <td className="py-3 px-3">
                              <Badge variant="outline" className="rounded-md text-xs font-normal">
                                {p.cohort_name || '-'}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-stone-600">{p.farm_group || '-'}</td>
                            <td className="py-3 px-3 text-right">
                              {cleanPhone ? (
                                <a
                                  href={`https://wa.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
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
          <Card className="rounded-xl bg-emerald-50/60 border-emerald-200/80 shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" /> Rekan Satu Kelompok ({profile?.farm_group})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {teammates.map((member) => (
                <Badge
                  key={member.id}
                  variant="secondary"
                  className="rounded-lg bg-white border border-emerald-200/80 text-stone-800 py-1.5 px-3 text-xs font-medium shadow-2xs"
                >
                  {member.full_name}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )
      )}

      {/* Checklist SOP Terdekat */}
      <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-700" />
            {isAdmin ? 'Agenda Perawatan Kelompok Mendatang' : 'Agenda Tahapan Bertani'}
          </CardTitle>
          <Link href="/kebun" className="text-xs font-semibold text-emerald-700 hover:underline">
            Lihat Kebun →
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcomingAgenda.length > 0 ? (
            upcomingAgenda.map((task) => {
              const isOverdue = task.target_date && task.target_date < todayStr
              const isToday = task.target_date === todayStr

              return (
                <Link
                  key={task.id}
                  href={`/kebun/${task.batch_id}`}
                  className="group flex items-center justify-between gap-3 p-3 rounded-lg bg-stone-50 hover:bg-emerald-50/60 border border-stone-200/70 transition-colors text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-800 group-hover:text-emerald-900 truncate">
                      {task.step_name}
                    </p>
                    <p className="text-xs text-emerald-700 font-medium mt-0.5">
                      {task.crop_name}
                      {isAdmin && task.farm_group ? ` • ${task.farm_group}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-semibold tabular-nums ${
                        isOverdue
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : isToday
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-white border-stone-200 text-stone-600'
                      }`}
                    >
                      <CalendarClock className="w-3 h-3" />
                      {isToday ? 'Hari Ini' : task.target_date || 'Segera'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700" />
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="text-center py-6 space-y-1">
              <p className="text-sm font-medium text-stone-700">Belum ada jadwal perawatan tertunda.</p>
              <p className="text-xs text-stone-400">
                Daftarkan komoditas tanaman di menu Kebun untuk memunculkan tahapan SOP otomatis.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
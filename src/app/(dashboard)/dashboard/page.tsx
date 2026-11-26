import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminDashboardTabs } from '@/components/dashboard/AdminDashboardTabs'
import {
  Sprout,
  CheckSquare,
  TrendingUp,
  BookOpen,
  Users,
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
  cohort_name: string | null
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
    .order('cohort_name', { ascending: false })
    .order('farm_group', { ascending: true })

  if (!isAdmin && profile?.cohort_name && profile?.farm_group) {
    summaryQuery = summaryQuery
      .eq('cohort_name', profile.cohort_name)
      .eq('farm_group', profile.farm_group)
  }
  const { data: batches } = await summaryQuery

  const [
    { data: teammates },
    { data: allProfiles },
    { data: rawGeneralExpenses },
    { data: recentGrowthLogs },
    { data: recentHarvestLogs },
    { data: recentExpenseLogs },
    { data: recentSopLogs },
    { data: rawDiscussions },
    { data: modules },
  ] = await Promise.all([
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
          .order('cohort_name', { ascending: false })
          .order('farm_group', { ascending: true })
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase.from('expenses').select('*').is('batch_id', null)
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase
          .from('growth_logs')
          .select('batch_id, log_date')
          .order('log_date', { ascending: false })
          .limit(300)
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase
          .from('harvest_logs')
          .select('batch_id, harvest_date')
          .order('harvest_date', { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase
          .from('expenses')
          .select('batch_id, expense_date')
          .not('batch_id', 'is', null)
          .order('expense_date', { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase
          .from('batch_sop_progress')
          .select('batch_id, completed_at, target_date')
          .eq('is_completed', true)
          .limit(200)
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase
          .from('module_discussions')
          .select('id, module_id, user_id, parent_id, content, created_at')
          .order('created_at', { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase.from('learning_modules').select('id, title')
      : Promise.resolve({ data: [] }),
  ])

  const batchMap = new Map<string, any>()
  batches?.forEach((b) => batchMap.set(b.batch_id, b))
  const batchIds = Array.from(batchMap.keys())

  let upcomingAgenda: AgendaItem[] = []

  if (batchIds.length > 0) {
    const { data: progressRows } = await supabase
      .from('batch_sop_progress')
      .select('id, batch_id, custom_step_name, target_date, is_completed')
      .in('batch_id', batchIds)
      .eq('is_completed', false)
      .order('target_date', { ascending: true })
      .limit(isAdmin ? 20 : 8)

    if (progressRows && progressRows.length > 0) {
      upcomingAgenda = progressRows.map((row) => {
        const b = batchMap.get(row.batch_id)
        return {
          id: row.id,
          batch_id: row.batch_id,
          step_name: row.custom_step_name,
          target_date: row.target_date,
          crop_name: b?.crop_name || 'Tanaman',
          cohort_name: b?.cohort_name || null,
          farm_group: b?.farm_group || null,
        }
      })
    } else {
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
              cohort_name: b.cohort_name || null,
              farm_group: b.farm_group || null,
            })
          }
        }
        upcomingAgenda = generated
          .sort((a, b) => (a.target_date || '').localeCompare(b.target_date || ''))
          .slice(0, isAdmin ? 15 : 6)
      }
    }
  }

  // Pisahkan seluruh profil vs daftar peserta murni & daftar admin/mentor
  const allProfilesMap = new Map((allProfiles || []).map((p: any) => [p.id, p]))
  const allParticipants = (allProfiles || []).filter((p: any) => p.role === 'peserta')
  const allMentors = (allProfiles || []).filter((p: any) =>
    ['admin', 'mentor'].includes(p.role || '')
  )
  const moduleMap = new Map((modules || []).map((m: any) => [m.id, m.title]))

  // Gabungkan tanggal aktivitas paling baru per batch dari log pertumbuhan, panen, biaya, dan SOP
  const latestLogByBatch: Record<string, string> = {}
  const recordLatestDate = (batchId?: string | null, rawDate?: string | null) => {
    if (!batchId || !rawDate) return
    const dateOnly = String(rawDate).slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return
    if (!latestLogByBatch[batchId] || dateOnly > latestLogByBatch[batchId]) {
      latestLogByBatch[batchId] = dateOnly
    }
  }

  ;(recentGrowthLogs || []).forEach((log: any) => recordLatestDate(log.batch_id, log.log_date))
  ;(recentHarvestLogs || []).forEach((log: any) => recordLatestDate(log.batch_id, log.harvest_date))
  ;(recentExpenseLogs || []).forEach((log: any) => recordLatestDate(log.batch_id, log.expense_date))
  ;(recentSopLogs || []).forEach((log: any) =>
    recordLatestDate(log.batch_id, log.completed_at || log.target_date)
  )

  const enrichedGeneralExpenses = (rawGeneralExpenses || []).map((exp: any) => {
    const owner = exp.user_id ? allProfilesMap.get(exp.user_id) : null
    return {
      ...exp,
      cohort_name: owner?.cohort_name || null,
      farm_group: owner?.farm_group || null,
    }
  })

  // Tandai utas diskusi yang sudah dijawab oleh mentor/admin
  const mentorRepliedParentIds = new Set(
    (rawDiscussions || [])
      .filter((d: any) => {
        if (!d.parent_id) return false
        const replier = allProfilesMap.get(d.user_id)
        return ['admin', 'mentor'].includes(replier?.role || '')
      })
      .map((d: any) => d.parent_id)
  )

  const unansweredDiscussions = (rawDiscussions || [])
    .filter((d: any) => {
      if (d.parent_id || mentorRepliedParentIds.has(d.id)) return false
      const author = allProfilesMap.get(d.user_id)
      // Abaikan jika utas dibuat oleh mentor/admin sendiri
      return !['admin', 'mentor'].includes(author?.role || '')
    })
    .map((d: any) => {
      const author = allProfilesMap.get(d.user_id)
      return {
        ...d,
        author_name: author?.full_name || 'Peserta',
        farm_group: author?.farm_group || null,
        module_title: moduleMap.get(d.module_id) || 'Materi Akademi',
      }
    })

  // Metrik khusus Peserta
  const todayStr = new Date().toISOString().split('T')[0]
  const totalAlive = batches?.reduce((acc, b) => acc + (b.current_alive_count || 0), 0) || 0
  const totalInitial = batches?.reduce((acc, b) => acc + (b.initial_plant_count || 0), 0) || 0
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
              ? 'Pusat kendali budidaya, finansial RAB, dan pendampingan kelompok lintas angkatan.'
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

      {isAdmin ? (
        <AdminDashboardTabs
          batches={batches || []}
          participants={allParticipants}
          mentors={allMentors}
          generalExpenses={enrichedGeneralExpenses}
          agendaItems={upcomingAgenda}
          latestLogByBatch={latestLogByBatch}
          unansweredDiscussions={unansweredDiscussions}
        />
      ) : (
        <>
          {/* Kartu KPI Khusus Peserta */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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

            <Card className="col-span-2 md:col-span-1 rounded-xl border-stone-200/90 shadow-2xs bg-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Batch Aktif</p>
                  <p className="text-xl sm:text-2xl font-bold text-stone-900 tabular-nums">
                    {batches?.length || 0} <span className="text-xs font-normal text-stone-400">kloter</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action Bar Peserta */}
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

          {/* Rekan Satu Kelompok */}
          {teammates && teammates.length > 0 && (
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
          )}

          {/* Checklist SOP Terdekat Peserta */}
          <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-700" />
                Agenda Tahapan Bertani
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
                        <p className="text-xs text-emerald-700 font-medium mt-0.5">{task.crop_name}</p>
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
        </>
      )}
    </div>
  )
}
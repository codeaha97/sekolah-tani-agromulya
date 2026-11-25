'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Users,
  Sprout,
  TrendingUp,
  Scale,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  MessageCircle,
  MessageSquare,
  CalendarClock,
  CheckSquare,
  ChevronRight,
  Search,
  Layers,
} from 'lucide-react'

const formatRp = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

interface AdminDashboardProps {
  batches: any[]
  participants: any[]
  generalExpenses: any[]
  agendaItems: any[]
  latestLogByBatch: Record<string, string>
  unansweredDiscussions: any[]
}

export function AdminDashboardTabs({
  batches,
  participants,
  generalExpenses,
  agendaItems,
  latestLogByBatch,
  unansweredDiscussions,
}: AdminDashboardProps) {
  // Kumpulkan semua nama angkatan unik dari peserta & batch, urutkan terbaru di depan
  const cohorts = useMemo(() => {
    const set = new Set<string>()
    participants.forEach((p) => p.cohort_name && set.add(p.cohort_name.trim()))
    batches.forEach((b) => b.cohort_name && set.add(b.cohort_name.trim()))
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [participants, batches])

  const [selectedCohort, setSelectedCohort] = useState<string>('ALL')
  const [searchParticipant, setSearchParticipant] = useState('')

  // Filter data sesuai angkatan yang dipilih
  const filteredBatches = useMemo(() => {
    if (selectedCohort === 'ALL') return batches
    return batches.filter((b) => b.cohort_name === selectedCohort)
  }, [batches, selectedCohort])

  const filteredParticipants = useMemo(() => {
    if (selectedCohort === 'ALL') return participants
    return participants.filter((p) => p.cohort_name === selectedCohort)
  }, [participants, selectedCohort])

  const filteredGeneralExpenses = useMemo(() => {
    if (selectedCohort === 'ALL') return generalExpenses
    return generalExpenses.filter((e) => e.cohort_name === selectedCohort)
  }, [generalExpenses, selectedCohort])

  const filteredAgenda = useMemo(() => {
    if (selectedCohort === 'ALL') return agendaItems
    return agendaItems.filter((a) => a.cohort_name === selectedCohort)
  }, [agendaItems, selectedCohort])

  // Kalkulasi KPI sesuai filter angkatan
  const totalAlive = filteredBatches.reduce((acc, b) => acc + Number(b.current_alive_count || 0), 0)
  const totalInitial = filteredBatches.reduce((acc, b) => acc + Number(b.initial_plant_count || 0), 0)
  const survivalRate = totalInitial > 0 ? Math.round((totalAlive / totalInitial) * 100) : 100
  const totalHarvestKg = filteredBatches.reduce((acc, b) => acc + Number(b.total_harvest_kg || 0), 0)

  const batchExpenseSum = filteredBatches.reduce((acc, b) => acc + Number(b.total_expense || 0), 0)
  const generalExpenseSum = filteredGeneralExpenses.reduce(
    (acc, e) => acc + Number(e.total_cost ?? Number(e.quantity || 0) * Number(e.unit_price || 0)),
    0
  )
  const totalExpense = batchExpenseSum + generalExpenseSum
  const totalRevenue = filteredBatches.reduce((acc, b) => acc + Number(b.total_revenue || 0), 0)
  const netProfit = totalRevenue - totalExpense

  // Kelompokkan data berdasarkan (cohort_name + farm_group)
  const groupedFarms = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string
        cohort_name: string
        farm_group: string
        members: any[]
        crops: any[]
        generalCost: number
        totalCost: number
        totalRevenue: number
        totalHarvestKg: number
      }
    >()

    const ensureGroup = (cohort: string, group: string) => {
      const c = cohort || 'Tanpa Angkatan'
      const g = group || 'Tanpa Kelompok'
      const key = `${c}__${g}`
      if (!map.has(key)) {
        map.set(key, {
          key,
          cohort_name: c,
          farm_group: g,
          members: [],
          crops: [],
          generalCost: 0,
          totalCost: 0,
          totalRevenue: 0,
          totalHarvestKg: 0,
        })
      }
      return map.get(key)!
    }

    filteredParticipants.forEach((p) => {
      const grp = ensureGroup(p.cohort_name, p.farm_group)
      grp.members.push(p)
    })

    filteredBatches.forEach((b) => {
      const grp = ensureGroup(b.cohort_name, b.farm_group)
      grp.crops.push(b)
      grp.totalCost += Number(b.total_expense || 0)
      grp.totalRevenue += Number(b.total_revenue || 0)
      grp.totalHarvestKg += Number(b.total_harvest_kg || 0)
    })

    filteredGeneralExpenses.forEach((exp) => {
      if (!exp.farm_group && !exp.cohort_name) return
      const grp = ensureGroup(exp.cohort_name, exp.farm_group)
      const cost = Number(exp.total_cost ?? Number(exp.quantity || 0) * Number(exp.unit_price || 0))
      grp.generalCost += cost
      grp.totalCost += cost
    })

    return Array.from(map.values()).sort((a, b) => {
      const cmpCohort = b.cohort_name.localeCompare(a.cohort_name)
      if (cmpCohort !== 0) return cmpCohort
      return a.farm_group.localeCompare(b.farm_group)
    })
  }, [filteredParticipants, filteredBatches, filteredGeneralExpenses])

  // Radar Peringatan Mentor (Survival < 80%, Jarang Monitoring > 5 hari, atau SOP Terlewat)
  const todayStr = new Date().toISOString().split('T')[0]
  const alerts = useMemo(() => {
    const list: { id: string; title: string; subtitle: string; href: string; severity: 'high' | 'warn' }[] = []

    filteredBatches.forEach((b) => {
      const init = Number(b.initial_plant_count || 0)
      const alive = Number(b.current_alive_count || 0)
      const rate = init > 0 ? Math.round((alive / init) * 100) : 100
      if (init > 0 && rate < 80) {
        list.push({
          id: `surv-${b.batch_id}`,
          title: `Survival Rendah (${rate}%): ${b.crop_name}`,
          subtitle: `${b.cohort_name} • ${b.farm_group} (${alive}/${init} btg hidup)`,
          href: `/kebun/${b.batch_id}`,
          severity: 'high',
        })
      }

      const lastLogDate = latestLogByBatch[b.batch_id] || b.planting_date
      if (lastLogDate) {
        const diffDays = Math.floor(
          (new Date(todayStr).getTime() - new Date(lastLogDate).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (diffDays >= 5) {
          list.push({
            id: `stale-${b.batch_id}`,
            title: `Belum Ada Log ${diffDays} Hari: ${b.crop_name}`,
            subtitle: `${b.cohort_name} • ${b.farm_group} • Terakhir update ${lastLogDate}`,
            href: `/kebun/${b.batch_id}`,
            severity: 'warn',
          })
        }
      }
    })

    const overdueCount = filteredAgenda.filter((t) => t.target_date && t.target_date < todayStr).length
    if (overdueCount > 0) {
      list.push({
        id: 'overdue-sop',
        title: `${overdueCount} Agenda SOP Melewati Jadwal`,
        subtitle: 'Cek tab Agenda Mentor untuk menindaklanjuti kelompok terkait',
        href: '/kebun',
        severity: 'warn',
      })
    }

    return list
  }, [filteredBatches, filteredAgenda, latestLogByBatch, todayStr])

  const searchedParticipants = useMemo(() => {
    const q = searchParticipant.trim().toLowerCase()
    if (!q) return filteredParticipants
    return filteredParticipants.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.farm_group?.toLowerCase().includes(q) ||
        p.cohort_name?.toLowerCase().includes(q)
    )
  }, [filteredParticipants, searchParticipant])

  return (
    <div className="space-y-5">
      {/* Filter Angkatan (Siap Multi-Angkatan) */}
      {cohorts.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mr-1 shrink-0">
            Angkatan:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCohort('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              selectedCohort === 'ALL'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            Semua ({cohorts.length})
          </button>
          {cohorts.map((cohort) => (
            <button
              key={cohort}
              type="button"
              onClick={() => setSelectedCohort(cohort)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                selectedCohort === cohort
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {cohort}
            </button>
          ))}
        </div>
      )}

      {/* 6 Kartu KPI Ringkas & Simetris (Budidaya + Finansial Kelas) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 h-full">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Peserta &amp; Kloter</p>
              <p className="text-sm sm:text-base font-bold text-stone-900 tabular-nums truncate">
                {filteredParticipants.length} org • {filteredBatches.length} kloter
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 h-full">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Sprout className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Populasi &amp; Survival</p>
              <p className="text-sm sm:text-base font-bold text-stone-900 tabular-nums truncate">
                {totalAlive} btg <span className="text-emerald-700">({survivalRate}%)</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 h-full">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Total Panen</p>
              <p className="text-sm sm:text-base font-bold text-stone-900 tabular-nums truncate">
                {totalHarvestKg} <span className="text-xs font-normal text-stone-400">kg</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 h-full">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Total Modal (RAB)</p>
              <p className="text-sm sm:text-base font-bold text-stone-900 tabular-nums truncate">
                {formatRp(totalExpense)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 h-full">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Total Omzet</p>
              <p className="text-sm sm:text-base font-bold text-emerald-700 tabular-nums truncate">
                {formatRp(totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 h-full">
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${
                netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-600'
              }`}
            >
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Laba / Rugi Kelas</p>
              <p
                className={`text-sm sm:text-base font-bold tabular-nums truncate ${
                  netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {formatRp(netProfit)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Radar Perhatian Mentor (Muncul otomatis jika ada anomali) */}
      {alerts.length > 0 && (
        <Card className="rounded-xl border-amber-200/90 bg-amber-50/60 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Perlu Perhatian Mentor ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {alerts.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between gap-2.5 p-2.5 rounded-lg bg-white border border-amber-200/80 hover:border-amber-400 transition-colors"
              >
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold truncate ${
                      item.severity === 'high' ? 'text-red-700' : 'text-amber-950'
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate">{item.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs Utama Dashboard Admin */}
      <Tabs defaultValue="kelompok" className="w-full">
        <TabsList className="flex w-full sm:w-fit h-auto p-1 bg-stone-200/80 rounded-lg gap-1 overflow-x-auto">
          <TabsTrigger
            value="kelompok"
            className="flex-1 sm:flex-initial rounded-md px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
          >
            Kelompok ({groupedFarms.length})
          </TabsTrigger>
          <TabsTrigger
            value="peserta"
            className="flex-1 sm:flex-initial rounded-md px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
          >
            Peserta ({filteredParticipants.length})
          </TabsTrigger>
          <TabsTrigger
            value="agenda"
            className="flex-1 sm:flex-initial rounded-md px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
          >
            Agenda ({filteredAgenda.length})
          </TabsTrigger>
          {unansweredDiscussions.length > 0 && (
            <TabsTrigger
              value="diskusi"
              className="flex-1 sm:flex-initial rounded-md px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
            >
              Tanya Materi ({unansweredDiscussions.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* TAB 1: REKAP PER KELOMPOK & DAFTAR KOMODITAS DI DALAMNYA */}
        <TabsContent value="kelompok" className="mt-4 space-y-3">
          {groupedFarms.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {groupedFarms.map((grp) => (
                <Card key={grp.key} className="rounded-xl border-stone-200/90 shadow-2xs bg-white flex flex-col">
                  <CardHeader className="pb-2.5 border-b border-stone-100">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge
                          variant="outline"
                          className="rounded-md text-[10px] font-semibold bg-emerald-50/70 text-emerald-800 border-emerald-200 mb-1"
                        >
                          {grp.cohort_name}
                        </Badge>
                        <CardTitle className="text-base font-bold text-stone-900">
                          {grp.farm_group}
                        </CardTitle>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {grp.members.length > 0
                            ? `Anggota (${grp.members.length}): ${grp.members.map((m) => m.full_name).join(', ')}`
                            : 'Belum ada anggota terdaftar'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase text-stone-400 block">Modal / Omzet</span>
                        <span className="text-xs font-bold text-stone-800 tabular-nums block">
                          {formatRp(grp.totalCost)}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 tabular-nums block">
                          +{formatRp(grp.totalRevenue)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-3 space-y-2 flex-1">
                    {grp.crops.length > 0 ? (
                      grp.crops.map((crop: any) => {
                        const init = Number(crop.initial_plant_count || 0)
                        const alive = Number(crop.current_alive_count || 0)
                        const rate = init > 0 ? Math.round((alive / init) * 100) : 100

                        return (
                          <Link
                            key={crop.batch_id}
                            href={`/kebun/${crop.batch_id}`}
                            className="group flex items-center justify-between gap-2.5 p-2.5 rounded-lg bg-stone-50 hover:bg-emerald-50/70 border border-stone-200/70 transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-stone-900 group-hover:text-emerald-900 truncate">
                                  {crop.crop_name} {crop.variety ? `(${crop.variety})` : ''}
                                </span>
                                <Badge
                                  className={`rounded text-[10px] py-0 px-1.5 tabular-nums ${
                                    rate < 80
                                      ? 'bg-red-100 text-red-700 hover:bg-red-100'
                                      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                                  }`}
                                >
                                  {rate}%
                                </Badge>
                              </div>
                              <p className="text-[11px] text-stone-500 mt-0.5 tabular-nums">
                                Blok {crop.plot_name || 'Utama'} • Hidup {alive}/{init} btg • Panen{' '}
                                <strong className="text-emerald-700">{crop.total_harvest_kg} kg</strong>
                              </p>
                            </div>

                            <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 shrink-0" />
                          </Link>
                        )
                      })
                    ) : (
                      <div className="py-5 text-center rounded-lg border border-dashed border-stone-200 text-xs text-stone-400">
                        Kelompok ini belum mendaftarkan kloter komoditas tanaman.
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl border border-dashed border-stone-300 text-center text-xs text-stone-500">
              Belum ada kelompok terdaftar pada angkatan ini.
            </div>
          )}
        </TabsContent>

        {/* TAB 2: DIREKTORI PESERTA + PENCARIAN */}
        <TabsContent value="peserta" className="mt-4 space-y-3">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Cari nama peserta atau kelompok..."
              value={searchParticipant}
              onChange={(e) => setSearchParticipant(e.target.value)}
              className="pl-9 h-9 rounded-lg bg-white text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {searchedParticipants.length > 0 ? (
              searchedParticipants.map((p: any) => {
                const cleanPhone = p.phone_number?.replace(/[^0-9]/g, '').replace(/^0/, '62')
                return (
                  <Card key={p.id} className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
                    <CardContent className="p-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-stone-900 truncate">{p.full_name}</p>
                        <p className="text-xs text-stone-500 truncate">
                          {p.cohort_name || '-'} • {p.farm_group || '-'}
                        </p>
                      </div>
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 shrink-0"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> WA
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <p className="col-span-full text-center text-stone-400 text-xs py-6 bg-white rounded-xl border border-stone-200">
                Tidak ada peserta yang cocok dengan pencarian.
              </p>
            )}
          </div>
        </TabsContent>

        {/* TAB 3: AGENDA PERAWATAN LINTAS KELOMPOK */}
        <TabsContent value="agenda" className="mt-4">
          <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-700" />
                Jadwal SOP Kelompok Terdekat
              </CardTitle>
              <Link href="/kebun" className="text-xs font-semibold text-emerald-700 hover:underline">
                Semua Kebun →
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredAgenda.length > 0 ? (
                filteredAgenda.map((task: any) => {
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
                          {task.crop_name} • {task.cohort_name} ({task.farm_group})
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
                <p className="text-center py-6 text-xs text-stone-400">
                  Belum ada jadwal SOP tertunda pada angkatan ini.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: PERTANYAAN MATERI BELUM DIBALAS MENTOR */}
        {unansweredDiscussions.length > 0 && (
          <TabsContent value="diskusi" className="mt-4">
            <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  Pertanyaan Peserta di Akademi yang Menunggu Jawaban
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {unansweredDiscussions.map((disc: any) => (
                  <Link
                    key={disc.id}
                    href={`/akademi/${disc.module_id}`}
                    className="block p-3 rounded-lg bg-stone-50 hover:bg-emerald-50/60 border border-stone-200/70 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-stone-900">
                        {disc.author_name} ({disc.farm_group || 'Peserta'})
                      </span>
                      <Badge variant="outline" className="text-[10px] rounded-md">
                        {disc.module_title}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-600 line-clamp-2">{disc.content}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
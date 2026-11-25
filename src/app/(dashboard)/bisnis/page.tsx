import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HppSummaryCard } from '@/components/bisnis/HppSummaryCard'
import { BusinessActionModals } from '@/components/bisnis/BusinessActionModals'
import { CashbookTransactionList } from '@/components/bisnis/CashbookTransactionList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Wallet,
  Scale,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Sprout,
  Layers,
} from 'lucide-react'

const formatRp = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

export default async function BisnisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
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
  const { data: summaries } = await summaryQuery

  const batchIds = summaries?.map((s) => s.batch_id) || []

  const [{ data: rawBatchExpenses }, { data: rawGeneralExpenses }, { data: allProfiles }, { data: rawHarvests }] =
    await Promise.all([
      batchIds.length > 0
        ? supabase
            .from('expenses')
            .select('*')
            .in('batch_id', batchIds)
            .order('expense_date', { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] }),
      supabase
        .from('expenses')
        .select('*')
        .is('batch_id', null)
        .order('expense_date', { ascending: false })
        .limit(50),
      supabase.from('profiles').select('id, full_name, cohort_name, farm_group'),
      batchIds.length > 0
        ? supabase
            .from('harvest_logs')
            .select('*')
            .in('batch_id', batchIds)
            .order('harvest_date', { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] }),
    ])

  const profileMap = new Map((allProfiles || []).map((p: any) => [p.id, p]))
  const summaryMap = new Map((summaries || []).map((s: any) => [s.batch_id, s]))

  const batchExpenses = (rawBatchExpenses || []).map((exp: any) => ({
    ...exp,
    batches: exp.batch_id ? summaryMap.get(exp.batch_id) || null : null,
  }))

  const generalExpenses = (rawGeneralExpenses || [])
    .map((exp: any) => ({
      ...exp,
      owner: exp.user_id ? profileMap.get(exp.user_id) || null : null,
    }))
    .filter((exp: any) => {
      if (isAdmin) return true
      if (!exp.user_id || exp.user_id === user.id) return true
      return (
        exp.owner?.cohort_name === profile?.cohort_name &&
        exp.owner?.farm_group === profile?.farm_group
      )
    })

  const harvests = (rawHarvests || []).map((harv: any) => ({
    ...harv,
    batches: harv.batch_id ? summaryMap.get(harv.batch_id) || null : null,
  }))

  const allExpenses = [...batchExpenses, ...generalExpenses].sort((a: any, b: any) => {
    const dateA = new Date(a.expense_date || 0).getTime()
    const dateB = new Date(b.expense_date || 0).getTime()
    return dateB - dateA
  })

  const totalBatchExpense = summaries?.reduce((acc, s) => acc + Number(s.total_expense || 0), 0) || 0
  const totalGeneralExpense = generalExpenses.reduce(
    (acc: number, item: any) =>
      acc + Number(item.total_cost ?? Number(item.quantity || 0) * Number(item.unit_price || 0)),
    0
  )

  const grandTotalExpense = totalBatchExpense + totalGeneralExpense
  const grandTotalRevenue = summaries?.reduce((acc, s) => acc + Number(s.total_revenue || 0), 0) || 0
  const grandTotalHarvestKg = summaries?.reduce((acc, s) => acc + Number(s.total_harvest_kg || 0), 0) || 0
  const grandNetProfit = grandTotalRevenue - grandTotalExpense

  const hasAnyData = (summaries && summaries.length > 0) || generalExpenses.length > 0

  return (
    <div className="space-y-5">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            {!isAdmin ? `Agribisnis ${profile?.farm_group}` : 'Agribisnis & HPP Kelas'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            {!isAdmin
              ? 'Analisis HPP per kg, pencatatan RAB lahan & komoditas, serta omzet panen kelompok.'
              : 'Evaluasi efisiensi modal (RAB), biaya umum lahan, volume panen, dan profitabilitas kelompok.'}
          </p>
        </div>

        {/* Selalu tampilkan tombol modal agar bisa mencatat sewa/olah lahan sebelum tanam */}
        <BusinessActionModals
          batches={(summaries || []).map((s) => ({
            batch_id: s.batch_id,
            crop_name: `${s.crop_name}${s.variety ? ` (${s.variety})` : ''} • ${s.farm_group || 'Bedengan'}`,
          }))}
        />
      </div>

      {/* 4 Kartu KPI Keuangan (Simetris & Proporsional) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 h-full">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Modal (RAB)</p>
              <p className="text-sm sm:text-base font-bold text-stone-900 tabular-nums truncate">
                {formatRp(grandTotalExpense)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 h-full">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Total Omzet</p>
              <p className="text-sm sm:text-base font-bold text-emerald-700 tabular-nums truncate">
                {formatRp(grandTotalRevenue)}
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
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Volume Panen</p>
              <p className="text-sm sm:text-base font-bold text-stone-900 tabular-nums truncate">
                {grandTotalHarvestKg} <span className="text-xs font-normal text-stone-400">kg</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 h-full">
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${
                grandNetProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-600'
              }`}
            >
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Laba / Rugi</p>
              <p
                className={`text-sm sm:text-base font-bold tabular-nums truncate ${
                  grandNetProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {formatRp(grandNetProfit)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Mobile-Friendly */}
      {hasAnyData ? (
        <Tabs
          defaultValue={
            summaries && summaries.length > 0 ? (isAdmin ? 'komparasi' : 'hpp') : 'transaksi'
          }
          className="w-full"
        >
          <TabsList className="flex w-full sm:w-fit h-auto p-1 bg-stone-200/80 rounded-lg gap-1">
            {isAdmin && summaries && summaries.length > 0 && (
              <TabsTrigger
                value="komparasi"
                className="flex-1 sm:flex-initial rounded-md px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
              >
                Komparasi
              </TabsTrigger>
            )}
            {summaries && summaries.length > 0 && (
              <TabsTrigger
                value="hpp"
                className="flex-1 sm:flex-initial rounded-md px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
              >
                Analisis HPP
              </TabsTrigger>
            )}
            <TabsTrigger
              value="transaksi"
              className="flex-1 sm:flex-initial rounded-md px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
            >
              Buku Kas ({allExpenses.length + (harvests?.length || 0)})
            </TabsTrigger>
          </TabsList>

          {/* TAB KHUSUS ADMIN: KOMPARASI KELOMPOK */}
          {isAdmin && summaries && summaries.length > 0 && (
            <TabsContent value="komparasi" className="mt-4">
              {/* Kartu Ringkas Mobile (< md) */}
              <div className="md:hidden space-y-3">
                {summaries.map((row: any) => {
                  const profit = Number(row.net_profit || 0)
                  return (
                    <Card key={row.batch_id} className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Badge variant="outline" className="rounded-md text-[10px] font-medium mb-1">
                              {row.cohort_name} • {row.farm_group}
                            </Badge>
                            <h3 className="font-bold text-sm text-stone-900 truncate">
                              {row.crop_name} {row.variety ? `(${row.variety})` : ''}
                            </h3>
                            <p className="text-[11px] text-stone-400">PIC: {row.owner_name}</p>
                          </div>
                          <Badge
                            className={
                              profit >= 0
                                ? 'rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-semibold tabular-nums shrink-0'
                                : 'rounded-md bg-red-100 text-red-700 hover:bg-red-100 font-semibold tabular-nums shrink-0'
                            }
                          >
                            {profit >= 0 ? '+' : ''}
                            {formatRp(profit)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-stone-50 border border-stone-100 text-xs">
                          <div>
                            <span className="text-[11px] text-stone-400 block">Modal (RAB)</span>
                            <span className="font-semibold text-red-600 tabular-nums">
                              {formatRp(Number(row.total_expense || 0))}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-stone-400 block">Omzet Panen</span>
                            <span className="font-semibold text-emerald-700 tabular-nums">
                              {formatRp(Number(row.total_revenue || 0))}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-stone-400 block">Volume Panen</span>
                            <span className="font-semibold text-stone-800 tabular-nums">{row.total_harvest_kg} kg</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-stone-400 block">HPP / Kg</span>
                            <span className="font-semibold text-stone-900 tabular-nums">
                              {formatRp(Number(row.hpp_per_kg || 0))}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Tabel Lengkap Desktop (>= md) */}
              <Card className="hidden md:block rounded-xl border-stone-200/90 shadow-2xs bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-700" /> Perbandingan HPP &amp; Profitabilitas Kelompok
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 text-xs uppercase">
                        <th className="py-2.5 px-3">Angkatan &amp; Kelompok</th>
                        <th className="py-2.5 px-3">Komoditas</th>
                        <th className="py-2.5 px-3">Modal (RAB)</th>
                        <th className="py-2.5 px-3">Panen</th>
                        <th className="py-2.5 px-3">HPP / Kg</th>
                        <th className="py-2.5 px-3">Omzet</th>
                        <th className="py-2.5 px-3 text-right">Laba / Rugi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {summaries.map((row: any) => {
                        const profit = Number(row.net_profit || 0)
                        return (
                          <tr key={row.batch_id} className="hover:bg-stone-50/80">
                            <td className="py-3 px-3 font-medium text-stone-800">
                              {row.cohort_name} • {row.farm_group}
                              <span className="block text-xs text-stone-400 font-normal">PIC: {row.owner_name}</span>
                            </td>
                            <td className="py-3 px-3 font-medium text-stone-800">
                              {row.crop_name} {row.variety ? `(${row.variety})` : ''}
                            </td>
                            <td className="py-3 px-3 text-red-600 font-medium tabular-nums">
                              {formatRp(Number(row.total_expense || 0))}
                            </td>
                            <td className="py-3 px-3 text-stone-700 tabular-nums">{row.total_harvest_kg} kg</td>
                            <td className="py-3 px-3 font-semibold text-stone-900 tabular-nums">
                              {formatRp(Number(row.hpp_per_kg || 0))}
                            </td>
                            <td className="py-3 px-3 text-emerald-700 font-medium tabular-nums">
                              {formatRp(Number(row.total_revenue || 0))}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <Badge
                                className={
                                  profit >= 0
                                    ? 'rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-100 tabular-nums'
                                    : 'rounded-md bg-red-100 text-red-700 hover:bg-red-100 tabular-nums'
                                }
                              >
                                {profit >= 0 ? '+' : ''}
                                {formatRp(profit)}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* TAB KARTU HPP PER KOMODITAS */}
          {summaries && summaries.length > 0 && (
            <TabsContent value="hpp" className="mt-4 space-y-4">
              {totalGeneralExpense > 0 && (
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-amber-950">Biaya Umum Lahan (Non-Komoditas)</p>
                      <p className="text-[11px] text-amber-800 truncate">
                        Sewa lahan, olah lahan, dan sarana bersama yang belum dialokasikan ke komoditas tertentu
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-red-700 text-sm tabular-nums shrink-0">
                    -{formatRp(totalGeneralExpense)}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summaries.map((item) => (
                  <HppSummaryCard
                    key={item.batch_id}
                    cropName={`${item.crop_name}${item.variety ? ` (${item.variety})` : ''}`}
                    subtitle={`${item.cohort_name} • ${item.farm_group} • Blok ${item.plot_name || 'Utama'}`}
                    totalExpense={Number(item.total_expense)}
                    totalHarvestKg={Number(item.total_harvest_kg)}
                    totalRevenue={Number(item.total_revenue)}
                    hppPerKg={Number(item.hpp_per_kg)}
                    netProfit={Number(item.net_profit)}
                  />
                ))}
              </div>
            </TabsContent>
          )}

          {/* TAB RIWAYAT PENGELUARAN & PANEN (BUKU KAS INTERAKTIF) */}
          <TabsContent value="transaksi" className="mt-4">
            <CashbookTransactionList
              expenses={allExpenses}
              harvests={harvests || []}
              isAdmin={isAdmin}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="bg-white p-8 rounded-xl border border-dashed border-stone-300 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Sprout className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-stone-700">Belum ada catatan modal maupun tanaman</p>
          <p className="text-xs text-stone-500">
            Klik <strong>Catat Biaya (RAB)</strong> di atas untuk mencatat sewa/olah lahan, atau daftarkan tanaman baru di menu <strong>Kebun</strong>.
          </p>
        </div>
      )}
    </div>
  )
}
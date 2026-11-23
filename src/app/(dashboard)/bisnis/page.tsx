import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HppSummaryCard } from '@/components/bisnis/HppSummaryCard'
import { BusinessActionModals } from '@/components/bisnis/BusinessActionModals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Wallet, TrendingUp, Scale, ArrowDownRight, ArrowUpRight } from 'lucide-react'

const formatRp = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

export default async function BisnisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  let summaryQuery = supabase.from('batch_business_summary').select('*')
  if (profile?.role === 'peserta' && profile.cohort_name && profile.farm_group) {
    summaryQuery = summaryQuery
      .eq('cohort_name', profile.cohort_name)
      .eq('farm_group', profile.farm_group)
  }
  const { data: summaries } = await summaryQuery

  const batchIds = summaries?.map((s) => s.batch_id) || []

  const [{ data: expenses }, { data: harvests }] = await Promise.all([
    batchIds.length > 0
      ? supabase
          .from('expenses')
          .select('*, batches(crop_name, variety)')
          .in('batch_id', batchIds)
          .order('expense_date', { ascending: false })
          .limit(15)
      : Promise.resolve({ data: [] }),
    batchIds.length > 0
      ? supabase
          .from('harvest_logs')
          .select('*, batches(crop_name, variety)')
          .in('batch_id', batchIds)
          .order('harvest_date', { ascending: false })
          .limit(15)
      : Promise.resolve({ data: [] }),
  ])

  const grandTotalExpense = summaries?.reduce((acc, s) => acc + Number(s.total_expense || 0), 0) || 0
  const grandTotalRevenue = summaries?.reduce((acc, s) => acc + Number(s.total_revenue || 0), 0) || 0
  const grandTotalHarvestKg = summaries?.reduce((acc, s) => acc + Number(s.total_harvest_kg || 0), 0) || 0
  const grandNetProfit = grandTotalRevenue - grandTotalExpense

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            {profile?.role === 'peserta' ? `Agribisnis ${profile.farm_group}` : 'Rekap Agribisnis Kelas'}
          </h1>
          <p className="text-sm text-stone-500">
            Analisis HPP per kilogram, pencatatan RAB, dan realisasi omzet panen.
          </p>
        </div>

        {summaries && summaries.length > 0 && (
          <BusinessActionModals
            batches={summaries.map((s) => ({
              batch_id: s.batch_id,
              crop_name: `${s.crop_name}${s.variety ? ` (${s.variety})` : ''} • ${s.farm_group || 'Demplot'}`,
            }))}
          />
        )}
      </div>

      {/* 4 Kartu KPI Keuangan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 shrink-0">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-stone-500">Total Modal (RAB)</p>
              <p className="text-sm sm:text-base font-bold text-stone-900 truncate">{formatRp(grandTotalExpense)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-stone-500">Total Omzet</p>
              <p className="text-sm sm:text-base font-bold text-emerald-700 truncate">{formatRp(grandTotalRevenue)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-stone-500">Volume Panen</p>
              <p className="text-sm sm:text-base font-bold text-stone-900 truncate">{grandTotalHarvestKg} kg</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${grandNetProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-600'}`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-stone-500">Saldo Laba/Rugi</p>
              <p className={`text-sm sm:text-base font-bold truncate ${grandNetProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {formatRp(grandNetProfit)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Analisis HPP vs Buku Kas */}
      {summaries && summaries.length > 0 ? (
        <Tabs defaultValue="hpp" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-stone-200/70">
            <TabsTrigger value="hpp">Analisis HPP per Tanaman</TabsTrigger>
            <TabsTrigger value="transaksi">Buku Kas (RAB & Panen)</TabsTrigger>
          </TabsList>

          {/* TAB 1: KARTU HPP PER KOMODITAS */}
          <TabsContent value="hpp" className="mt-4">
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

          {/* TAB 2: RIWAYAT PENGELUARAN & PANEN */}
          <TabsContent value="transaksi" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-stone-200/80 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-600 rotate-180" /> Rincian Pengeluaran (RAB)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs">
                  {expenses && expenses.length > 0 ? (
                    expenses.map((exp: any) => (
                      <div key={exp.id} className="flex justify-between items-start gap-2 py-2 border-b border-stone-100 last:border-0">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-stone-800">{exp.item_name}</p>
                          <div className="flex items-center gap-1.5 text-stone-400">
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                              {exp.category}
                            </Badge>
                            <span>
                              {exp.batches?.crop_name} • {exp.quantity} {exp.unit}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-red-600 shrink-0">-{formatRp(Number(exp.total_cost))}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-stone-400 py-4 text-center">Belum ada catatan biaya.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-stone-200/80 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-700" /> Rincian Panen & Penjualan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs">
                  {harvests && harvests.length > 0 ? (
                    harvests.map((harv: any) => (
                      <div key={harv.id} className="flex justify-between items-start gap-2 py-2 border-b border-stone-100 last:border-0">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-stone-800">
                            {harv.batches?.crop_name} ({harv.net_weight_kg} kg bersih)
                          </p>
                          <p className="text-stone-400">
                            {harv.harvest_date} • {formatRp(Number(harv.selling_price_per_kg))}/kg • {harv.buyer_info || 'Penjualan'}
                          </p>
                        </div>
                        <span className="font-bold text-emerald-700 shrink-0">+{formatRp(Number(harv.total_revenue))}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-stone-400 py-4 text-center">Belum ada catatan panen.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <p className="text-sm text-stone-500 bg-white p-8 rounded-xl border border-dashed border-stone-300 text-center">
          Belum ada data tanaman pada kelompok Anda. Daftarkan tanaman terlebih dahulu di menu <strong>Kebun</strong>.
        </p>
      )}
    </div>
  )
}
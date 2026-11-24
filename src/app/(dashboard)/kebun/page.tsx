import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sprout, ArrowRight, Scale, MapPin, UserCheck } from 'lucide-react'
import { AddBatchDialog } from '@/components/kebun/AddBatchDialog'
import { DeleteBatchButton } from '@/components/kebun/DeleteBatchButton'
import { AdminActionForms } from '@/components/admin/AdminActionForms'
import { AdminCurriculumManager } from '@/components/admin/AdminCurriculumManager'

export default async function KebunPage() {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const isAdmin = ['admin', 'mentor'].includes(profile?.role || '')

  const [{ data: allBatches }, { data: sopTemplates }] = await Promise.all([
    supabase
      .from('batch_business_summary')
      .select('*')
      .order('planting_date', { ascending: false }),
    isAdmin
      ? supabase
          .from('crop_sop_templates')
          .select('*')
          .order('crop_name', { ascending: true })
          .order('step_order', { ascending: true })
      : Promise.resolve({ data: [] }),
  ])

  const now = Date.now()

  const myGroupBatches = !isAdmin
    ? allBatches?.filter(
        (b) => b.cohort_name === profile?.cohort_name && b.farm_group === profile?.farm_group
      ) || []
    : allBatches || []

  const otherBatches = !isAdmin
    ? allBatches?.filter(
        (b) => !(b.cohort_name === profile?.cohort_name && b.farm_group === profile?.farm_group)
      ) || []
    : []

  const renderBatchCard = (batch: any, isEditable: boolean) => {
    const hst = Math.max(
      0,
      Math.floor((now - new Date(batch.planting_date).getTime()) / (1000 * 60 * 60 * 24))
    )
    const alive = Number(batch.current_alive_count || 0)
    const initial = Number(batch.initial_plant_count || 0)
    const survivalPct = initial > 0 ? Math.min(100, Math.round((alive / initial) * 100)) : 100

    return (
      <Card
        key={batch.batch_id}
        className="group rounded-xl border-stone-200/90 shadow-2xs bg-white hover:border-emerald-500 transition-all h-full flex flex-col justify-between"
      >
        <Link href={`/kebun/${batch.batch_id}`} className="block">
          <CardHeader className="pb-2.5 flex flex-row items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="rounded-md text-[10px] font-medium">
                  {batch.cohort_name || 'Kelas'} • {batch.farm_group || 'Demplot'}
                </Badge>
              </div>
              <CardTitle className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors truncate">
                {batch.crop_name} {batch.variety ? `(${batch.variety})` : ''}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-stone-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-stone-400" /> Blok {batch.plot_name || 'Utama'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-stone-400" /> {batch.owner_name}
                </span>
              </div>
            </div>

            <Badge className="rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/70 font-semibold text-xs tabular-nums shrink-0">
              HST {hst}
            </Badge>
          </CardHeader>

          <CardContent className="pt-0 pb-3 space-y-2.5">
            {/* Progress Bar Populasi Hidup */}
            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 flex items-center gap-1.5 font-medium">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                  Hidup:{' '}
                  <strong className="text-stone-900 tabular-nums">
                    {alive}/{initial}
                  </strong>{' '}
                  btg ({survivalPct}%)
                </span>
                <span className="text-stone-600 flex items-center gap-1 font-medium tabular-nums">
                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                  {Number(batch.total_harvest_kg || 0)} kg
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${survivalPct}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Link>

        <div className="px-6 py-2.5 border-t border-stone-100 flex items-center justify-between">
          <div>{isEditable && <DeleteBatchButton batchId={batch.batch_id} />}</div>
          <Link
            href={`/kebun/${batch.batch_id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {isEditable ? 'Kelola & Monitoring' : 'Lihat Perkembangan'}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </Card>
    )
  }

  const renderKebunContent = () => (
    <div className="space-y-8">
      {/* Bagian 1: Kebun Kelompok Sendiri / Seluruh Kebun (jika Admin) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {myGroupBatches.length > 0 ? (
          myGroupBatches.map((b) => renderBatchCard(b, true))
        ) : (
          <div className="col-span-full bg-white p-8 rounded-xl border border-dashed border-stone-300 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <Sprout className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-stone-800">Belum ada tanaman yang didaftarkan</p>
            <p className="text-xs text-stone-500">
              Klik tombol <strong>Tanam Baru</strong> di atas untuk mendaftarkan kloter tanam dan membuat jadwal SOP otomatis.
            </p>
          </div>
        )}
      </div>

      {/* Bagian 2: Observasi Kebun Kelompok Lain (Khusus Peserta) */}
      {otherBatches.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-stone-200">
          <div>
            <h2 className="text-base font-bold text-stone-900">Observasi Kebun Kelompok Lain</h2>
            <p className="text-xs text-stone-500">
              Lihat perkembangan tanaman rekan angkatan sebagai bahan pembanding belajar.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {otherBatches.map((b) => renderBatchCard(b, false))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            {!isAdmin ? `Kebun ${profile?.farm_group}` : 'Inventaris Kebun & Master SOP'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            {!isAdmin
              ? `Kolaborasi pemantauan tanaman ${profile?.cohort_name} (${profile?.farm_group}).`
              : 'Pantau seluruh batch budidaya kelompok dan kelola standar SOP komoditas.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && <AdminActionForms mode="sop" />}
          <AddBatchDialog />
        </div>
      </div>

      {isAdmin ? (
        <Tabs defaultValue="inventaris" className="w-full">
          <TabsList className="flex w-full sm:w-fit h-auto p-1 bg-stone-200/80 rounded-lg gap-1">
            <TabsTrigger
              value="inventaris"
              className="flex-1 sm:flex-initial rounded-md px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
            >
              Inventaris ({myGroupBatches.length})
            </TabsTrigger>
            <TabsTrigger
              value="master-sop"
              className="flex-1 sm:flex-initial rounded-md px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
            >
              Master SOP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventaris" className="mt-4">
            {renderKebunContent()}
          </TabsContent>

          <TabsContent value="master-sop" className="mt-4">
            <AdminCurriculumManager sopTemplates={sopTemplates || []} mode="sop" />
          </TabsContent>
        </Tabs>
      ) : (
        renderKebunContent()
      )}
    </div>
  )
}
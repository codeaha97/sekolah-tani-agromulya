import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sprout, ArrowRight } from 'lucide-react'
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
    return (
      <Card key={batch.batch_id} className="border-stone-200/90 shadow-none hover:border-emerald-500 transition-colors h-full flex flex-col justify-between">
        <Link href={`/kebun/${batch.batch_id}`} className="block">
          <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Badge variant="outline" className="text-[10px]">
                  {batch.cohort_name || 'Kelas'} • {batch.farm_group || 'Demplot'}
                </Badge>
              </div>
              <CardTitle className="text-base hover:text-emerald-700 transition-colors">
                {batch.crop_name} {batch.variety ? `(${batch.variety})` : ''}
              </CardTitle>
              <p className="text-xs text-stone-500">
                Blok {batch.plot_name || 'Utama'} • Didaftarkan oleh {batch.owner_name}
              </p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 shrink-0">
              HST {hst}
            </Badge>
          </CardHeader>
        </Link>

        <CardContent className="flex items-center justify-between text-sm pt-2">
          <span className="text-stone-600 flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-emerald-600" /> Hidup:{' '}
            <strong>
              {batch.current_alive_count} / {batch.initial_plant_count}
            </strong>{' '}
            btg
          </span>
          <div className="flex items-center gap-2">
            {isEditable && <DeleteBatchButton batchId={batch.batch_id} />}
            <Link
              href={`/kebun/${batch.batch_id}`}
              className="text-emerald-700 font-medium flex items-center text-xs hover:underline"
            >
              {isEditable ? 'Detail' : 'Lihat'} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderKebunContent = () => (
    <div className="space-y-8">
      {/* Bagian 1: Kebun Kelompok Sendiri / Seluruh Kebun (jika Admin) */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myGroupBatches.length > 0 ? (
            myGroupBatches.map((b) => renderBatchCard(b, true))
          ) : (
            <p className="text-sm text-stone-500 col-span-2 bg-white p-6 rounded-xl border border-dashed border-stone-300 text-center">
              Belum ada tanaman yang didaftarkan. Klik tombol <strong>Tanam Baru</strong> untuk memulai.
            </p>
          )}
        </div>
      </div>

      {/* Bagian 2: Observasi Kebun Kelompok Lain (Khusus Peserta) */}
      {otherBatches.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-stone-200">
          <div>
            <h2 className="text-base font-semibold text-stone-800">Observasi Kebun Kelompok Lain</h2>
            <p className="text-xs text-stone-500">Lihat perkembangan tanaman rekan angkatan sebagai bahan pembanding belajar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherBatches.map((b) => renderBatchCard(b, false))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            {!isAdmin ? `Kebun ${profile?.farm_group}` : 'Inventaris Kebun & Master SOP'}
          </h1>
          <p className="text-sm text-stone-500">
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
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-stone-200/70">
            <TabsTrigger value="inventaris">Inventaris Kebun ({myGroupBatches.length})</TabsTrigger>
            <TabsTrigger value="master-sop">Master Template SOP</TabsTrigger>
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
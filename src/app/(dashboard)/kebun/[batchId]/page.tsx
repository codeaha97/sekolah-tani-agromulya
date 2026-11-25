import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GrowthChart } from '@/components/kebun/GrowthChart'
import { QuickLogDrawer } from '@/components/kebun/QuickLogDrawer'
import { SopChecklistCard } from '@/components/kebun/SopChecklistCard'
import { DeleteBatchButton } from '@/components/kebun/DeleteBatchButton'
import MentorLogActions from '@/components/kebun/MentorLogActions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  Sprout,
  Wallet,
  Scale,
  Calculator,
  Calendar,
  MapPin,
  UserCheck,
  ExternalLink,
  ClipboardList,
} from 'lucide-react'
import { MonitoringLogCard } from '@/components/kebun/MonitoringLogCard'

const formatRp = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

export default async function BatchDetailPage({ params }: { params: Promise<{ batchId: string }> }) {
  await connection()
  const { batchId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: batch } = await supabase
    .from('batch_business_summary')
    .select('*')
    .eq('batch_id', batchId)
    .single()

  const { data: logs } = await supabase
    .from('monitoring_logs')
    .select('*, recorder:recorded_by(full_name)')
    .eq('batch_id', batchId)
    .order('hst', { ascending: true })

  const { data: sopSteps } = await supabase
    .from('batch_sop_progress')
    .select('*, completer:completed_by(full_name)')
    .eq('batch_id', batchId)
    .order('target_date', { ascending: true })

  if (!batch) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
          <Sprout className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-stone-800">Data tanaman tidak ditemukan.</p>
        <Link
          href="/kebun"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Kebun
        </Link>
      </div>
    )
  }

  const isAdmin = ['admin', 'mentor'].includes(currentUserProfile?.role || '')
  const isSameGroup =
    currentUserProfile?.role === 'peserta' &&
    currentUserProfile.cohort_name === batch.cohort_name &&
    currentUserProfile.farm_group === batch.farm_group
  const canEdit = isSameGroup || isAdmin

  const currentHst = Math.max(
    0,
    Math.floor((Date.now() - new Date(batch.planting_date).getTime()) / (1000 * 60 * 60 * 24))
  )

  return (
    <div className="space-y-5">
      {/* Navigasi Kembali & Header Batch */}
      <div className="space-y-3 pb-3 border-b border-stone-200">
        <Link
          href="/kebun"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Kebun
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className="rounded-md bg-emerald-700 hover:bg-emerald-700 text-[11px] font-semibold">
                {batch.cohort_name} • {batch.farm_group}
              </Badge>
              <Badge variant="outline" className="rounded-md text-[11px] font-semibold tabular-nums">
                HST {currentHst}
              </Badge>
              {isAdmin && (
                <Badge
                  variant="secondary"
                  className="rounded-md bg-amber-100 text-amber-800 border border-amber-200/80 text-[11px] font-semibold"
                >
                  Mode Evaluasi Mentor
                </Badge>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              {batch.crop_name} {batch.variety ? `(${batch.variety})` : ''}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" /> Blok {batch.plot_name || 'Utama'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" /> Tanam: {batch.planting_date}
              </span>
              <span className="inline-flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-stone-400" /> PIC:{' '}
                <strong className="text-stone-700">{batch.owner_name}</strong>
              </span>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 shrink-0">
              <QuickLogDrawer
                batchId={batch.batch_id}
                currentAlive={batch.current_alive_count}
                currentHst={currentHst}
              />
              <DeleteBatchButton batchId={batch.batch_id} redirectAfter />
            </div>
          )}
        </div>
      </div>

      {/* Ringkasan Kondisi & Finansial Singkat Batch */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Sprout className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Populasi</p>
              <p className="text-sm sm:text-base font-bold text-stone-900 tabular-nums truncate">
                {batch.current_alive_count}/{batch.initial_plant_count}{' '}
                <span className="text-xs font-normal text-stone-400">btg</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Modal RAB</p>
              <p className="text-sm sm:text-base font-bold text-stone-900 tabular-nums truncate">
                {formatRp(Number(batch.total_expense || 0))}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Total Panen</p>
              <p className="text-sm sm:text-base font-bold text-stone-900 tabular-nums truncate">
                {batch.total_harvest_kg || 0} <span className="text-xs font-normal text-stone-400">kg</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">HPP / Kg</p>
              <p className="text-sm sm:text-base font-bold text-emerald-700 tabular-nums truncate">
                {formatRp(Number(batch.hpp_per_kg || 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checklist SOP Interaktif */}
      <SopChecklistCard
        batchId={batch.batch_id}
        cropName={batch.crop_name}
        plantingDate={batch.planting_date}
        steps={sopSteps || []}
        canEdit={canEdit}
      />

      {/* Grafik Tinggi & pH Tanah */}
      <GrowthChart data={logs || []} />

      {/* Riwayat Pengamatan Lapangan */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-emerald-700" />
            Riwayat Pengamatan Lapangan ({logs?.length || 0})
          </h2>
          {canEdit && logs && logs.length > 0 && (
            <p className="text-[11px] text-stone-400 sm:hidden">
              Ketuk kartu untuk edit • Geser kiri untuk hapus
            </p>
          )}
        </div>

        {logs && logs.length > 0 ? (
          <div className="space-y-3">
            {logs
              .slice()
              .reverse()
              .map((log: any) => (
                <MonitoringLogCard
                  key={log.id}
                  log={log}
                  canEdit={canEdit}
                  isAdmin={isAdmin}
                />
              ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl border border-dashed border-stone-300 text-center">
            <p className="text-xs sm:text-sm text-stone-500">
              Belum ada log pengamatan untuk tanaman ini.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
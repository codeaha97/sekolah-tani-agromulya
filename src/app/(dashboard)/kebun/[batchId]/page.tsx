import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GrowthChart } from '@/components/kebun/GrowthChart'
import { QuickLogDrawer } from '@/components/kebun/QuickLogDrawer'
import { SopChecklistCard } from '@/components/kebun/SopChecklistCard'
import { DeleteBatchButton } from '@/components/kebun/DeleteBatchButton'
import { MentorLogActions } from '@/components/kebun/MentorLogActions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Sprout, Wallet, Scale, Calculator } from 'lucide-react'

const formatRp = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

export default async function BatchDetailPage({ params }: { params: Promise<{ batchId: string }> }) {
  await connection()
  const { batchId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentUserProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
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

  if (!batch) return <p className="text-sm text-stone-500">Data tanaman tidak ditemukan.</p>

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
    <div className="space-y-6">
      {/* Navigasi Kembali */}
      <Link
        href="/kebun"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-emerald-700"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Kebun
      </Link>

      {/* Header Batch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge className="bg-emerald-700">{batch.cohort_name} • {batch.farm_group}</Badge>
            <Badge variant="outline">HST {currentHst}</Badge>
            {isAdmin && (
              <Badge variant="secondary" className="bg-amber-50 text-amber-800">
                Mode Evaluasi Mentor
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-stone-900">
            {batch.crop_name} {batch.variety ? `(${batch.variety})` : ''}
          </h1>
          <p className="text-sm text-stone-500">
            Blok {batch.plot_name || 'Utama'} • Tanam: {batch.planting_date} • PIC: <strong>{batch.owner_name}</strong>
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <QuickLogDrawer
              batchId={batch.batch_id}
              currentAlive={batch.current_alive_count}
              currentHst={currentHst}
            />
            <DeleteBatchButton batchId={batch.batch_id} redirectAfter />
          </div>
        )}
      </div>

      {/* Ringkasan Kondisi & Finansial Singkat Batch */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="p-3.5 flex items-center gap-2.5">
            <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[11px] text-stone-500">Populasi Hidup</p>
              <p className="text-sm font-bold text-stone-900">
                {batch.current_alive_count} / {batch.initial_plant_count} btg
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="p-3.5 flex items-center gap-2.5">
            <Wallet className="w-4 h-4 text-red-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-stone-500">Modal RAB</p>
              <p className="text-sm font-bold text-stone-900 truncate">
                {formatRp(Number(batch.total_expense || 0))}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="p-3.5 flex items-center gap-2.5">
            <Scale className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="text-[11px] text-stone-500">Total Panen</p>
              <p className="text-sm font-bold text-stone-900">{batch.total_harvest_kg || 0} kg</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/80 shadow-none">
          <CardContent className="p-3.5 flex items-center gap-2.5">
            <Calculator className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-stone-500">HPP / Kg</p>
              <p className="text-sm font-bold text-emerald-700 truncate">
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
      <div className="space-y-2.5">
        <h2 className="text-base font-semibold text-stone-800">Riwayat Pengamatan Lapangan</h2>
        {logs && logs.length > 0 ? (
          logs.slice().reverse().map((log: any) => (
            <div key={log.id} className="bg-white p-3.5 rounded-xl border border-stone-200 flex items-start justify-between gap-3 text-sm">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div>
                  <span className="font-bold text-emerald-800">HST {log.hst}</span>
                  <span className="text-stone-400 mx-2">•</span>
                  <span className="text-stone-600">{log.recorded_date}</span>
                </div>
                <p className="text-xs text-stone-400">
                  Dicatat oleh: <strong className="text-stone-600">{log.recorder?.full_name || 'Anggota Kelompok'}</strong>
                </p>
                {log.general_notes && (
                  <p className="text-xs text-stone-700">
                    <strong>Kondisi Umum:</strong> {log.general_notes}
                  </p>
                )}
                {log.treatment_applied && (
                  <p className="text-xs text-stone-600 bg-stone-50 px-2 py-1 rounded">
                    <strong>Perlakuan:</strong> {log.treatment_applied}
                  </p>
                )}
                {log.pest_disease_notes && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/70 px-2 py-1 rounded">
                    <strong>Hama/Penyakit:</strong> {log.pest_disease_notes}
                  </p>
                )}
                {log.mentor_feedback && (
                  <p className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                    <strong>Arahan Mentor:</strong> {log.mentor_feedback}
                  </p>
                )}
                {log.photo_url && (
                  <a href={log.photo_url} target="_blank" rel="noreferrer" className="inline-block text-xs text-emerald-700 underline pt-0.5">
                    Lihat Foto Dokumentasi
                  </a>
                )}

                {/* Kontrol Arahan & Hapus Log Khusus Admin / Mentor */}
                {isAdmin && (
                  <MentorLogActions logId={log.id} initialFeedback={log.mentor_feedback} />
                )}
              </div>

              <div className="text-right text-xs space-y-0.5 shrink-0">
                <p className="font-semibold text-stone-800">Tinggi: {log.avg_height_cm} cm</p>
                <p className="text-amber-700">pH Tanah: {log.soil_ph}</p>
                <p className="text-emerald-700">Hidup: {log.alive_count} btg</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-stone-500">Belum ada log pengamatan untuk tanaman ini.</p>
        )}
      </div>
    </div>
  )
}
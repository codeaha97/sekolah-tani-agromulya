import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GrowthChart } from '@/components/kebun/GrowthChart'
import { QuickLogDrawer } from '@/components/kebun/QuickLogDrawer'
import { SopChecklistCard } from '@/components/kebun/SopChecklistCard'
import { DeleteBatchButton } from '@/components/kebun/DeleteBatchButton'
import { Badge } from '@/components/ui/badge'

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

  const isSameGroup =
    currentUserProfile?.role === 'peserta' &&
    currentUserProfile.cohort_name === batch.cohort_name &&
    currentUserProfile.farm_group === batch.farm_group
  const canEdit = isSameGroup || ['admin', 'mentor'].includes(currentUserProfile?.role || '')

  const currentHst = Math.max(
    0,
    Math.floor((Date.now() - new Date(batch.planting_date).getTime()) / (1000 * 60 * 60 * 24))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-emerald-700">{batch.cohort_name} • {batch.farm_group}</Badge>
            <Badge variant="outline">HST {currentHst}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">
            {batch.crop_name} {batch.variety ? `(${batch.variety})` : ''}
          </h1>
          <p className="text-sm text-stone-500">
            Hidup: <strong>{batch.current_alive_count}</strong> / {batch.initial_plant_count} batang • Blok {batch.plot_name || '-'}
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
              <div className="space-y-1.5">
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
                {log.photo_url && (
                  <a href={log.photo_url} target="_blank" rel="noreferrer" className="inline-block text-xs text-emerald-700 underline pt-0.5">
                    Lihat Foto Dokumentasi
                  </a>
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
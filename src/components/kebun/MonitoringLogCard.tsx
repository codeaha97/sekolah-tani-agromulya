'use client'

import { useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ExternalLink,
  Pencil,
  Trash2,
  ClipboardEdit,
  AlertCircle,
  Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import MentorLogActions from '@/components/kebun/MentorLogActions'

export interface MonitoringLogItem {
  id: string
  batch_id: string
  hst: number
  recorded_date: string
  alive_count: number
  dead_count: number
  avg_height_cm: number
  soil_ph: number
  treatment_applied?: string | null
  pest_disease_notes?: string | null
  general_notes?: string | null
  mentor_feedback?: string | null
  photo_url?: string | null
  recorder?: { full_name: string } | null
}

interface MonitoringLogCardProps {
  log: MonitoringLogItem
  canEdit: boolean
  isAdmin: boolean
}

export function MonitoringLogCard({ log, canEdit, isAdmin }: MonitoringLogCardProps) {
  const supabase = createClient()
  const router = useRouter()

  // State Swipe Gesture Mobile
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const hasMoved = useRef(false)

  // State Dialog Edit Log
  const [editOpen, setEditOpen] = useState(false)
  const [aliveCount, setAliveCount] = useState(String(log.alive_count))
  const [heightCm, setHeightCm] = useState(String(log.avg_height_cm))
  const [soilPh, setSoilPh] = useState(String(log.soil_ph))
  const [treatment, setTreatment] = useState(log.treatment_applied || '')
  const [pestNotes, setPestNotes] = useState(log.pest_disease_notes || '')
  const [generalNotes, setGeneralNotes] = useState(log.general_notes || '')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // State Hapus
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const ACTION_WIDTH = 88

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!canEdit) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    hasMoved.current = false
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canEdit || touchStartX.current === null || touchStartY.current === null) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current

    // Abaikan jika pengguna sedang menggulir halaman ke atas/bawah
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dx) < 12) return

    if (Math.abs(dx) > 8) {
      hasMoved.current = true
    }

    // Batasi geseran hanya ke kiri (-ACTION_WIDTH s/d 0)
    const base = swipeOffset === -ACTION_WIDTH ? -ACTION_WIDTH : 0
    const nextOffset = Math.max(-ACTION_WIDTH, Math.min(0, base + dx))
    setSwipeOffset(nextOffset)
  }

  const handleTouchEnd = () => {
    if (!canEdit) return
    setIsSwiping(false)
    if (swipeOffset < -ACTION_WIDTH / 2) {
      setSwipeOffset(-ACTION_WIDTH)
    } else {
      setSwipeOffset(0)
      setConfirmDelete(false)
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const handleCardTap = (e: React.MouseEvent) => {
    if (!canEdit) return
    // Jangan buka modal jika sedang menggeser, atau menekan tombol/tautan di dalam kartu
    if (hasMoved.current) return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('input')) return

    if (swipeOffset !== 0) {
      setSwipeOffset(0)
      setConfirmDelete(false)
      return
    }
    openEditModal()
  }

  const openEditModal = () => {
    setAliveCount(String(log.alive_count))
    setHeightCm(String(log.avg_height_cm))
    setSoilPh(String(log.soil_ph))
    setTreatment(log.treatment_applied || '')
    setPestNotes(log.pest_disease_notes || '')
    setGeneralNotes(log.general_notes || '')
    setErrorMsg('')
    setEditOpen(true)
  }

  const handleUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')

    const { error } = await supabase
      .from('monitoring_logs')
      .update({
        alive_count: Number(aliveCount),
        avg_height_cm: parseFloat(heightCm) || 0,
        soil_ph: parseFloat(soilPh) || 6.5,
        treatment_applied: treatment.trim() || null,
        pest_disease_notes: pestNotes.trim() || null,
        general_notes: generalNotes.trim() || null,
      })
      .eq('id', log.id)

    setSaving(false)
    if (error) {
      setErrorMsg(`Gagal memperbarui log: ${error.message}`)
      return
    }

    setEditOpen(false)
    router.refresh()
  }

  const handleDeleteLog = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }

    setDeleting(true)
    await supabase.from('monitoring_logs').delete().eq('id', log.id)
    setDeleting(false)
    router.refresh()
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-stone-200/90 bg-red-600 shadow-2xs">
        {/* Layer Belakang (Muncul saat Swipe ke Kiri di Mobile) */}
        {canEdit && (
          <div
            style={{ width: `${ACTION_WIDTH}px` }}
            className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-600 text-white"
          >
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteLog}
              className="w-full h-full flex flex-col items-center justify-center gap-1 px-2 text-center active:bg-red-700 transition-colors"
            >
              {confirmDelete ? (
                <>
                  <Check className="w-5 h-5" />
                  <span className="text-[11px] font-bold leading-tight">
                    {deleting ? 'Hapus...' : 'Yakin?'}
                  </span>
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  <span className="text-[11px] font-semibold">Hapus</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Layer Depan (Kartu Pengamatan) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleCardTap}
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: isSwiping ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className={`relative bg-white p-4 space-y-3 select-none sm:select-auto ${
            canEdit ? 'cursor-pointer active:bg-stone-50/80' : ''
          }`}
        >
          {/* Baris Atas: HST, Tanggal & Metrik Cepat */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-bold text-xs tabular-nums">
                    HST {log.hst}
                  </Badge>
                  <span className="text-xs font-medium text-stone-600">{log.recorded_date}</span>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  Dicatat oleh:{' '}
                  <strong className="text-stone-600">
                    {log.recorder?.full_name || 'Anggota Kelompok'}
                  </strong>
                </p>
              </div>

              {/* Tombol Cepat untuk Desktop (Mobile cukup Tap / Swipe) */}
              {canEdit && (
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    type="button"
                    onClick={openEditModal}
                    title="Edit pengamatan ini"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleDeleteLog}
                    title="Hapus pengamatan ini"
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                      confirmDelete
                        ? 'bg-red-600 text-white'
                        : 'text-stone-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {confirmDelete && <span>Yakin?</span>}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-semibold tabular-nums">
                Hidup: {log.alive_count} btg
              </span>
              <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 font-semibold tabular-nums">
                Tinggi: {log.avg_height_cm} cm
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-semibold tabular-nums">
                pH: {log.soil_ph}
              </span>
            </div>
          </div>

          {/* Detail Catatan Lapangan */}
          <div className="space-y-2 text-xs">
            {log.general_notes && (
              <p className="text-stone-700 leading-relaxed">
                <strong className="text-stone-900">Kondisi Umum:</strong> {log.general_notes}
              </p>
            )}

            {log.treatment_applied && (
              <div className="text-stone-700 bg-stone-50 border border-stone-200/70 px-3 py-2 rounded-lg">
                <strong className="text-stone-900">Perlakuan / Pupuk:</strong> {log.treatment_applied}
              </div>
            )}

            {log.pest_disease_notes && (
              <div className="text-amber-900 bg-amber-50 border border-amber-200/80 px-3 py-2 rounded-lg">
                <strong>Catatan Hama/Penyakit:</strong> {log.pest_disease_notes}
              </div>
            )}

            {log.mentor_feedback && (
              <div className="text-emerald-950 bg-emerald-50/90 border border-emerald-200 px-3 py-2 rounded-lg">
                <strong className="text-emerald-800">Arahan Mentor:</strong> {log.mentor_feedback}
              </div>
            )}

            {log.photo_url && (
              <div className="pt-0.5">
                <a
                  href={log.photo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-emerald-50 text-emerald-700 font-semibold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Lihat Foto Dokumentasi
                </a>
              </div>
            )}

            {/* Kontrol Arahan Mentor (Khusus Admin / Mentor) */}
            {isAdmin && <MentorLogActions logId={log.id} initialFeedback={log.mentor_feedback} />}
          </div>
        </div>
      </div>

      {/* DIALOG EDIT LOG PENGAMATAN (Terbuka saat Tap Kartu) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
              <ClipboardEdit className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-stone-900">
              Edit Pengamatan (HST {log.hst})
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Perbarui data populasi, tinggi batang, pH tanah, atau catatan lapangan tanggal {log.recorded_date}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateLog} className="space-y-3.5 pt-2">
            {errorMsg && (
              <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Hidup (btg)</Label>
                <Input
                  type="number"
                  min="0"
                  value={aliveCount}
                  onChange={(e) => setAliveCount(e.target.value)}
                  className="h-10 rounded-lg tabular-nums"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Tinggi (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="h-10 rounded-lg tabular-nums"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">pH Tanah</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="3"
                  max="10"
                  value={soilPh}
                  onChange={(e) => setSoilPh(e.target.value)}
                  className="h-10 rounded-lg tabular-nums"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Perlakuan / POC</Label>
              <Input
                placeholder="Kocor POC / Neem Oil"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                className="h-10 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Hama &amp; Penyakit</Label>
              <Input
                placeholder="Misal: Nihil / Kutu kebul"
                value={pestNotes}
                onChange={(e) => setPestNotes(e.target.value)}
                className="h-10 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Perkembangan Umum</Label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-stone-200 p-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-600"
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-semibold"
            >
              {saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Pengamatan'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
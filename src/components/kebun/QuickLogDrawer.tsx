'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, Camera, ClipboardCheck, AlertCircle, X, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface QuickLogDrawerProps {
  batchId: string
  currentAlive: number
  currentHst: number
}

export function QuickLogDrawer({ batchId, currentAlive, currentHst }: QuickLogDrawerProps) {
  const [open, setOpen] = useState(false)
  const [aliveCount, setAliveCount] = useState(currentAlive)
  const [heightCm, setHeightCm] = useState('')
  const [soilPh, setSoilPh] = useState('6.5')
  const [treatment, setTreatment] = useState('')
  const [pestNotes, setPestNotes] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const deadDiff = Math.max(0, currentAlive - aliveCount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    let uploadedPhotoUrl: string | null = null

    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop()
      const filePath = `${batchId}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('crop-photos')
        .upload(filePath, photoFile)

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('crop-photos')
          .getPublicUrl(filePath)
        uploadedPhotoUrl = publicUrlData.publicUrl
      }
    }

    const { error: insertError } = await supabase.from('monitoring_logs').insert({
      batch_id: batchId,
      hst: currentHst,
      alive_count: aliveCount,
      dead_count: deadDiff,
      avg_height_cm: parseFloat(heightCm) || 0,
      soil_ph: parseFloat(soilPh) || 6.5,
      treatment_applied: treatment.trim() || null,
      pest_disease_notes: pestNotes.trim() || null,
      general_notes: generalNotes.trim() || null,
      photo_url: uploadedPhotoUrl,
    })

    setLoading(false)
    if (insertError) {
      setErrorMsg(`Gagal menyimpan log pengamatan: ${insertError.message}`)
      return
    }

    setOpen(false)
    setHeightCm('')
    setTreatment('')
    setPestNotes('')
    setGeneralNotes('')
    setPhotoFile(null)
    router.refresh()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val)
        setErrorMsg('')
        if (val) setAliveCount(currentAlive)
      }}
    >
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: 'default' }),
          'rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-2xs'
        )}
      >
        <PlusCircle className="w-4 h-4 mr-1.5" /> Catat Kondisi (HST {currentHst})
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-stone-900">
            Log Monitoring Lapangan (HST {currentHst})
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500">
            Rekam parameter pertumbuhan, pH tanah, aplikasi POC/pestisida nabati, dan foto tanaman.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {errorMsg && (
            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-stone-700">Batang Hidup</Label>
                {deadDiff > 0 && (
                  <span className="text-[10px] font-semibold text-amber-700 tabular-nums">
                    -{deadDiff} btg
                  </span>
                )}
              </div>
              <Input
                type="number"
                min="0"
                value={aliveCount}
                onChange={(e) => setAliveCount(Number(e.target.value))}
                className="rounded-lg h-10 tabular-nums"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Tinggi Rata-rata (cm)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="Misal: 24.5"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="rounded-lg h-10 tabular-nums"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">pH Tanah</Label>
              <Input
                type="number"
                step="0.1"
                min="3"
                max="10"
                value={soilPh}
                onChange={(e) => setSoilPh(e.target.value)}
                className="rounded-lg h-10 tabular-nums"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Perlakuan / POC</Label>
              <Input
                placeholder="Kocor POC / Neem Oil"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                className="rounded-lg h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-stone-700">Hama &amp; Penyakit Ditemukan</Label>
            <Input
              placeholder="Misal: Nihil / Kutu kebul di daun muda / Bercak daun"
              value={pestNotes}
              onChange={(e) => setPestNotes(e.target.value)}
              className="rounded-lg h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-stone-700">Perkembangan Umum Tanaman</Label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-stone-200 p-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="Misal: Daun hijau segar, mulai muncul tunas cabang / bakal bunga..."
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
            />
          </div>

          {/* Upload Foto Dokumentasi */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-700" /> Foto Kondisi Tanaman (Opsional)
            </Label>

            {photoFile ? (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <ImageIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-medium text-emerald-950 truncate">{photoFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoFile(null)}
                  className="p-1 rounded-md text-stone-500 hover:text-red-600 hover:bg-white shrink-0"
                  title="Hapus foto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-stone-300 bg-stone-50/70 hover:bg-emerald-50/40 hover:border-emerald-400 cursor-pointer transition-colors text-xs text-stone-600">
                <Camera className="w-4 h-4 text-emerald-700" />
                <span className="font-medium">Ambil Foto Kamera atau Pilih dari Galeri</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-semibold"
          >
            {loading ? 'Mengunggah & Menyimpan...' : 'Simpan Log Hari Ini'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
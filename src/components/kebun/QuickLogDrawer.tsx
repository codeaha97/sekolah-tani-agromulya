'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, Camera } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const deadCount = Math.max(0, currentAlive - aliveCount)
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

    await supabase.from('monitoring_logs').insert({
      batch_id: batchId,
      hst: currentHst,
      alive_count: aliveCount,
      dead_count: deadCount,
      avg_height_cm: parseFloat(heightCm) || 0,
      soil_ph: parseFloat(soilPh) || 6.5,
      treatment_applied: treatment,
      pest_disease_notes: pestNotes,
      general_notes: generalNotes,
      photo_url: uploadedPhotoUrl,
    })

    setLoading(false)
    setOpen(false)
    setHeightCm('')
    setTreatment('')
    setPestNotes('')
    setGeneralNotes('')
    setPhotoFile(null)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: 'default' }),
          'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm'
        )}
      >
        <PlusCircle className="w-4 h-4 mr-2" /> Catat Monitoring (HST {currentHst})
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Monitoring Lapangan (HST {currentHst})</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Jumlah Batang Hidup</Label>
              <Input
                type="number"
                value={aliveCount}
                onChange={(e) => setAliveCount(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Tinggi Rata-rata (cm)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Misal: 24.5"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>pH Tanah</Label>
              <Input
                type="number"
                step="0.1"
                min="3"
                max="10"
                value={soilPh}
                onChange={(e) => setSoilPh(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Perlakuan / POC</Label>
              <Input
                placeholder="Kocor POC / Neem Oil"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Hama & Penyakit Ditemukan</Label>
            <Input
              placeholder="Misal: Nihil / Kutu kebul di daun muda / Bercak daun"
              value={pestNotes}
              onChange={(e) => setPestNotes(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Perkembangan Tanaman Secara Umum</Label>
            <textarea
              rows={2}
              className="w-full rounded-md border border-stone-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="Misal: Daun hijau segar, mulai muncul tunas cabang / bakal bunga..."
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-700" /> Foto Kondisi Tanaman (Opsional)
            </Label>
            <Input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="text-xs"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800">
            {loading ? 'Mengunggah & Menyimpan...' : 'Simpan Log Hari Ini'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
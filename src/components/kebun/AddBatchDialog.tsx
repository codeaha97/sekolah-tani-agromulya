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
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Plus, Sprout, CalendarCheck2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { STANDARD_CROPS } from '@/lib/constants/crops'

export function AddBatchDialog() {
  const [open, setOpen] = useState(false)
  const [selectedCrop, setSelectedCrop] = useState<string>('Cabai Rawit')
  const [customCrop, setCustomCrop] = useState('')
  const [variety, setVariety] = useState('')
  const [plotName, setPlotName] = useState('')
  const [plantCount, setPlantCount] = useState('')
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0])
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const finalCropName = selectedCrop === 'Lainnya' ? customCrop.trim() : selectedCrop

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!finalCropName) return
    setLoading(true)
    setErrorMsg('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: newBatch, error: insertError } = await supabase
      .from('batches')
      .insert({
        user_id: user.id,
        crop_name: finalCropName,
        variety: variety.trim() || null,
        plot_name: plotName.trim() || null,
        initial_plant_count: Number(plantCount),
        planting_date: plantingDate,
      })
      .select()
      .single()

    if (insertError || !newBatch) {
      setErrorMsg(`Gagal menyimpan data tanaman: ${insertError?.message || 'Terjadi kesalahan'}`)
      setLoading(false)
      return
    }

    // Cari template SOP yang cocok (exact case-insensitive, fallback partial match)
    let { data: templates } = await supabase
      .from('crop_sop_templates')
      .select('*')
      .ilike('crop_name', finalCropName)
      .order('step_order', { ascending: true })

    if (!templates || templates.length === 0) {
      const { data: partialTemplates } = await supabase
        .from('crop_sop_templates')
        .select('*')
        .ilike('crop_name', `%${finalCropName}%`)
        .order('step_order', { ascending: true })
      templates = partialTemplates
    }

    if (templates && templates.length > 0) {
      const steps = templates.map((t) => {
        const target = new Date(plantingDate)
        target.setDate(target.getDate() + Number(t.target_hst || 0))
        return {
          batch_id: newBatch.id,
          sop_template_id: t.id,
          custom_step_name: `${t.phase_name} (HST ${t.target_hst})`,
          target_date: target.toISOString().split('T')[0],
          is_completed: false,
        }
      })
      await supabase.from('batch_sop_progress').insert(steps)
    }

    setLoading(false)
    setOpen(false)
    setVariety('')
    setPlantCount('')
    setPlotName('')
    setCustomCrop('')
    router.push(`/kebun/${newBatch.id}`)
    router.refresh()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val)
        setErrorMsg('')
      }}
    >
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: 'default' }),
          'rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-2xs'
        )}
      >
        <Plus className="w-4 h-4 mr-1.5" /> Tanam Baru
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
            <Sprout className="w-5 h-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-stone-900">
            Tambah Inventaris Tanaman Baru
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500">
            Daftarkan kloter tanam baru untuk menghasilkan jadwal perawatan SOP otomatis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-3.5 pt-2">
          {errorMsg && (
            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Komoditas</Label>
              <Select value={selectedCrop} onValueChange={(val) => val && setSelectedCrop(val)}>
                <SelectTrigger className="w-full h-10 rounded-lg justify-between">
                  <span className="truncate">{selectedCrop}</span>
                </SelectTrigger>
                <SelectContent>
                  {STANDARD_CROPS.map((crop) => (
                    <SelectItem key={crop} value={crop}>
                      {crop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Varietas (Opsional)</Label>
              <Input
                placeholder="Misal: Ori 212 / Lokal"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                className="rounded-lg h-10"
              />
            </div>
          </div>

          {selectedCrop === 'Lainnya' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Nama Komoditas Lainnya</Label>
              <Input
                placeholder="Tuliskan nama tanaman..."
                value={customCrop}
                onChange={(e) => setCustomCrop(e.target.value)}
                className="rounded-lg h-10"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Populasi Awal (Batang)</Label>
              <Input
                type="number"
                min="1"
                placeholder="100"
                value={plantCount}
                onChange={(e) => setPlantCount(e.target.value)}
                className="rounded-lg h-10 tabular-nums"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Blok / Bedengan</Label>
              <Input
                placeholder="Bedengan A1"
                value={plotName}
                onChange={(e) => setPlotName(e.target.value)}
                className="rounded-lg h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-stone-700">Tanggal Tanam (Patokan HST 0)</Label>
            <Input
              type="date"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              className="rounded-lg h-10"
              required
            />
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-950">
            <CalendarCheck2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Tahapan perawatan standar untuk <strong>{finalCropName || 'komoditas ini'}</strong> akan otomatis dijadwalkan di Beranda dan menu Kebun.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-semibold"
          >
            {loading ? 'Menyimpan...' : 'Simpan & Buka Jadwal SOP'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
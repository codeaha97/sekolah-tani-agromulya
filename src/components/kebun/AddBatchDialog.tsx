'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const finalCropName = selectedCrop === 'Lainnya' ? customCrop.trim() : selectedCrop

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!finalCropName) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: newBatch } = await supabase
      .from('batches')
      .insert({
        user_id: user.id,
        crop_name: finalCropName,
        variety,
        plot_name: plotName,
        initial_plant_count: Number(plantCount),
        planting_date: plantingDate,
      })
      .select()
      .single()

    // Otomatis salin template SOP sesuai komoditas yang dipilih
    if (newBatch) {
      const { data: templates } = await supabase
        .from('crop_sop_templates')
        .select('*')
        .eq('crop_name', finalCropName)
        .order('step_order', { ascending: true })

      if (templates && templates.length > 0) {
        const steps = templates.map((t) => {
          const target = new Date(plantingDate)
          target.setDate(target.getDate() + t.target_hst)
          return {
            batch_id: newBatch.id,
            sop_template_id: t.id,
            custom_step_name: `${t.phase_name} (HST ${t.target_hst})`,
            target_date: target.toISOString().split('T')[0],
          }
        })
        await supabase.from('batch_sop_progress').insert(steps)
      }
    }

    setLoading(false)
    setOpen(false)
    setVariety('')
    setPlantCount('')
    setCustomCrop('')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(buttonVariants({ variant: 'default' }), 'bg-emerald-700 hover:bg-emerald-800 text-white')}
      >
        <Plus className="w-4 h-4 mr-1.5" /> Tanam Baru
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Inventaris Tanaman Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Komoditas</Label>
              <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih komoditas" />
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
            <div className="space-y-1">
              <Label>Varietas</Label>
              <Input
                placeholder="Misal: Ori 212 / Lokal"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
              />
            </div>
          </div>

          {selectedCrop === 'Lainnya' && (
            <div className="space-y-1">
              <Label>Nama Komoditas Lainnya</Label>
              <Input
                placeholder="Tuliskan nama tanaman..."
                value={customCrop}
                onChange={(e) => setCustomCrop(e.target.value)}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Jumlah Batang Awal</Label>
              <Input
                type="number"
                min="1"
                placeholder="100"
                value={plantCount}
                onChange={(e) => setPlantCount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Blok / Bedengan</Label>
              <Input
                placeholder="Bedengan A1"
                value={plotName}
                onChange={(e) => setPlotName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Tanggal Tanam (Patokan HST 0)</Label>
            <Input
              type="date"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800">
            {loading ? 'Menyimpan...' : 'Simpan & Generate Jadwal SOP'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
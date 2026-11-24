'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { BookPlus, ListChecks } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { STANDARD_CROPS } from '@/lib/constants/crops'

export function AdminActionForms({ mode = 'all' }: { mode?: 'all' | 'module' | 'sop' }) {
  const [openModule, setOpenModule] = useState(false)
  const [openSop, setOpenSop] = useState(false)

  // State Materi
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Kesehatan Tanah')
  const [summary, setSummary] = useState('')

  // State SOP Template
  const [cropName, setCropName] = useState<string>('Cabai Rawit')
  const [stepOrder, setStepOrder] = useState('1')
  const [phaseName, setPhaseName] = useState('')
  const [targetHst, setTargetHst] = useState('0')

  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('learning_modules').insert({
      title,
      category,
      summary_markdown: summary,
      created_by: user?.id,
    })

    setLoading(false)
    setOpenModule(false)
    setTitle('')
    setSummary('')
    router.refresh()
  }

  const handleSaveSop = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await supabase.from('crop_sop_templates').insert({
      crop_name: cropName,
      step_order: Number(stepOrder),
      phase_name: phaseName,
      target_hst: Number(targetHst),
    })

    setLoading(false)
    setOpenSop(false)
    setPhaseName('')
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* MODAL TAMBAH MATERI */}
      {(mode === 'all' || mode === 'module') && (
        <Dialog open={openModule} onOpenChange={setOpenModule}>
          <DialogTrigger
            className={cn(
              buttonVariants({ variant: 'default' }),
              'bg-emerald-700 hover:bg-emerald-800 text-white'
            )}
          >
            <BookPlus className="w-4 h-4 mr-1.5" /> Tambah Materi
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Publikasi Materi Kelas Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveModule} className="space-y-3">
              <div className="space-y-1">
                <Label>Judul Materi</Label>
                <Input
                  placeholder="Misal: Pembuatan Kompos Bokashi & Tricoderma"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Kategori</Label>
                <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                  <SelectTrigger className="w-full justify-between">
                    <span>{category}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kesehatan Tanah">Kesehatan Tanah</SelectItem>
                    <SelectItem value="Pembibitan">Pembibitan</SelectItem>
                    <SelectItem value="Nutrisi & POC">Nutrisi & POC</SelectItem>
                    <SelectItem value="Pengendalian Hama">Pengendalian Hama</SelectItem>
                    <SelectItem value="Pasca Panen">Pasca Panen</SelectItem>
                    <SelectItem value="Bisnis Tani">Bisnis Tani</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Ringkasan Materi</Label>
                <textarea
                  rows={5}
                  className="w-full rounded-md border border-stone-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  placeholder="Tuliskan poin-poin inti materi kelas..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800">
                {loading ? 'Menyimpan...' : 'Simpan & Buka Mind Map'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL TAMBAH TEMPLATE SOP */}
      {(mode === 'all' || mode === 'sop') && (
        <Dialog open={openSop} onOpenChange={setOpenSop}>
          <DialogTrigger className={cn(buttonVariants({ variant: 'outline' }), 'bg-white border-stone-300')}>
            <ListChecks className="w-4 h-4 mr-1.5 text-emerald-700" /> Tambah Template SOP
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Buat Template Tahapan Bertani</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveSop} className="space-y-3">
              <div className="space-y-1">
                <Label>Pilih Komoditas</Label>
                <Select value={cropName} onValueChange={(val) => val && setCropName(val)}>
                  <SelectTrigger className="w-full justify-between">
                    <span>{cropName}</span>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Urutan Langkah</Label>
                  <Input type="number" min="1" value={stepOrder} onChange={(e) => setStepOrder(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>Target HST (Hari)</Label>
                  <Input type="number" placeholder="-7, 0, 14, 30" value={targetHst} onChange={(e) => setTargetHst(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Nama Tahapan Perawatan</Label>
                <Input placeholder="Misal: Kocor POC Vegetatif + Asam Humat" value={phaseName} onChange={(e) => setPhaseName(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800">
                {loading ? 'Menyimpan...' : 'Simpan Template SOP'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
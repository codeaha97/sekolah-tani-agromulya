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
import { BookPlus, ListChecks, BookOpen, Sprout, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { STANDARD_CROPS } from '@/lib/constants/crops'

const MODULE_CATEGORIES = [
  'Kesehatan Tanah',
  'Pembibitan',
  'Nutrisi & POC',
  'Pengendalian Hama',
  'Pasca Panen',
  'Bisnis Tani',
]

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
  const [description, setDescription] = useState('')

  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    const { data: { user } } = await supabase.auth.getUser()

    const { data: created, error } = await supabase
      .from('learning_modules')
      .insert({
        title: title.trim(),
        category,
        summary_markdown: summary.trim(),
        created_by: user?.id,
      })
      .select('id')
      .single()

    setLoading(false)
    if (error) {
      setErrorMsg(`Gagal menyimpan materi: ${error.message}`)
      return
    }

    setOpenModule(false)
    setTitle('')
    setSummary('')
    if (created?.id) {
      router.push(`/akademi/${created.id}`)
    }
    router.refresh()
  }

  const handleSaveSop = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.from('crop_sop_templates').insert({
      crop_name: cropName,
      step_order: Number(stepOrder),
      phase_name: phaseName.trim(),
      target_hst: Number(targetHst),
      description: description.trim() || null,
    })

    setLoading(false)
    if (error) {
      setErrorMsg(`Gagal menyimpan template SOP: ${error.message}`)
      return
    }

    setOpenSop(false)
    setPhaseName('')
    setDescription('')
    setStepOrder((prev) => String(Number(prev || 0) + 1))
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* MODAL TAMBAH MATERI */}
      {(mode === 'all' || mode === 'module') && (
        <Dialog
          open={openModule}
          onOpenChange={(val) => {
            setOpenModule(val)
            setErrorMsg('')
          }}
        >
          <DialogTrigger
            className={cn(
              buttonVariants({ variant: 'default' }),
              'rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-2xs'
            )}
          >
            <BookPlus className="w-4 h-4 mr-1.5" /> Tambah Materi
          </DialogTrigger>

          <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
            <DialogHeader className="space-y-1.5 text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
                <BookOpen className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-stone-900">
                Publikasi Materi Kelas Baru
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Tulis intisari materi pembelajaran, lalu susun peta konsep (Mind Map) interaktifnya.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveModule} className="space-y-3.5 pt-2">
              {errorMsg && (
                <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Judul Materi</Label>
                <Input
                  placeholder="Misal: Pembuatan Kompos Bokashi & Trichoderma"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-lg h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Kategori Topik</Label>
                <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                  <SelectTrigger className="w-full h-10 rounded-lg justify-between">
                    <span>{category}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {MODULE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Ringkasan Materi</Label>
                <textarea
                  rows={5}
                  className="w-full rounded-lg border border-stone-200 p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  placeholder="Tuliskan poin-poin inti materi kelas..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-semibold"
              >
                {loading ? 'Menyimpan...' : 'Simpan & Susun Mind Map'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL TAMBAH TEMPLATE SOP */}
      {(mode === 'all' || mode === 'sop') && (
        <Dialog
          open={openSop}
          onOpenChange={(val) => {
            setOpenSop(val)
            setErrorMsg('')
          }}
        >
          <DialogTrigger
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'rounded-lg bg-white border-stone-200 hover:bg-stone-50 text-stone-800 font-semibold shadow-2xs'
            )}
          >
            <ListChecks className="w-4 h-4 mr-1.5 text-emerald-700" /> Tambah SOP
          </DialogTrigger>

          <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
            <DialogHeader className="space-y-1.5 text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
                <Sprout className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-stone-900">
                Tambah Tahapan Standar SOP
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Tahapan ini menjadi acuan otomatis saat peserta mendaftarkan komoditas terkait.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveSop} className="space-y-3.5 pt-2">
              {errorMsg && (
                <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Pilih Komoditas</Label>
                <Select value={cropName} onValueChange={(val) => val && setCropName(val)}>
                  <SelectTrigger className="w-full h-10 rounded-lg justify-between">
                    <span>{cropName}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {STANDARD_CROPS.filter((c) => c !== 'Lainnya').map((crop) => (
                      <SelectItem key={crop} value={crop}>
                        {crop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">Urutan Langkah</Label>
                  <Input
                    type="number"
                    min="1"
                    value={stepOrder}
                    onChange={(e) => setStepOrder(e.target.value)}
                    className="rounded-lg h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">Target HST (Hari)</Label>
                  <Input
                    type="number"
                    placeholder="-7, 0, 14, 30"
                    value={targetHst}
                    onChange={(e) => setTargetHst(e.target.value)}
                    className="rounded-lg h-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Nama Tahapan Perawatan</Label>
                <Input
                  placeholder="Misal: Kocor POC Vegetatif + Asam Humat"
                  value={phaseName}
                  onChange={(e) => setPhaseName(e.target.value)}
                  className="rounded-lg h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Panduan Singkat / Dosis Organik (Opsional)
                </Label>
                <Input
                  placeholder="Misal: 10 ml POC per liter air, kocor 200 ml/tanaman"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-lg h-10"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-semibold"
              >
                {loading ? 'Menyimpan...' : 'Simpan Template SOP'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
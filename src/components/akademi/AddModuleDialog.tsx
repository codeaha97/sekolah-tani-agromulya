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
import { BookPlus, BookOpen, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const MODULE_CATEGORIES = [
  'Kesehatan Tanah',
  'Pembibitan',
  'Nutrisi & POC',
  'Pengendalian Hama',
  'Pasca Panen',
  'Bisnis Tani',
]

export function AddModuleDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Kesehatan Tanah')
  const [summary, setSummary] = useState('')
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

    setOpen(false)
    setTitle('')
    setSummary('')
    if (created?.id) {
      router.push(`/akademi/${created.id}`)
    }
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
        <BookPlus className="w-4 h-4 mr-1.5" /> Tambah Materi Kelas
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
            Tulis ringkasan inti materi, lalu lanjutkan menyusun peta konsep interaktifnya.
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
            {loading ? 'Menyimpan...' : 'Simpan & Buka Mind Map'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
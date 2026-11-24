'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function AddModuleDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Kesehatan Tanah')
  const [summary, setSummary] = useState('')
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
    setOpen(false)
    setTitle('')
    setSummary('')
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
        <BookPlus className="w-4 h-4 mr-1.5" /> Tambah Materi Kelas
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Publikasi Materi Kelas Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveModule} className="space-y-3 pt-1">
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
  )
}
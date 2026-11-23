'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2, BookOpen, ListChecks, Network, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface LearningModuleItem {
  id: string
  title: string
  category: string
  summary_markdown?: string | null
}

interface SopTemplateItem {
  id: string
  crop_name: string
  step_order: number
  phase_name: string
  target_hst: number
  description?: string | null
}

export function AdminCurriculumManager({
  modules,
  sopTemplates,
}: {
  modules: LearningModuleItem[]
  sopTemplates: SopTemplateItem[]
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // State Edit Materi
  const [editingModule, setEditingModule] = useState<LearningModuleItem | null>(null)
  const [modTitle, setModTitle] = useState('')
  const [modCategory, setModCategory] = useState('')
  const [modSummary, setModSummary] = useState('')

  // State Edit SOP
  const [editingSop, setEditingSop] = useState<SopTemplateItem | null>(null)
  const [sopOrder, setSopOrder] = useState('1')
  const [sopHst, setSopHst] = useState('0')
  const [sopPhase, setSopPhase] = useState('')
  const [sopDesc, setSopDesc] = useState('')

  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const openEditModule = (mod: LearningModuleItem) => {
    setEditingModule(mod)
    setModTitle(mod.title)
    setModCategory(mod.category)
    setModSummary(mod.summary_markdown || '')
  }

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingModule) return
    setSaving(true)
    await supabase
      .from('learning_modules')
      .update({
        title: modTitle,
        category: modCategory,
        summary_markdown: modSummary,
      })
      .eq('id', editingModule.id)
    setSaving(false)
    setEditingModule(null)
    router.refresh()
  }

  const openEditSop = (step: SopTemplateItem) => {
    setEditingSop(step)
    setSopOrder(String(step.step_order))
    setSopHst(String(step.target_hst))
    setSopPhase(step.phase_name)
    setSopDesc(step.description || '')
  }

  const handleUpdateSop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSop) return
    setSaving(true)
    await supabase
      .from('crop_sop_templates')
      .update({
        step_order: Number(sopOrder),
        target_hst: Number(sopHst),
        phase_name: sopPhase,
        description: sopDesc,
      })
      .eq('id', editingSop.id)
    setSaving(false)
    setEditingSop(null)
    router.refresh()
  }

  const handleDeleteModule = async (id: string) => {
    setDeletingId(id)
    await supabase.from('learning_modules').delete().eq('id', id)
    setDeletingId(null)
    router.refresh()
  }

  const handleDeleteSop = async (id: string) => {
    setDeletingId(id)
    await supabase.from('crop_sop_templates').delete().eq('id', id)
    setDeletingId(null)
    router.refresh()
  }

  const groupedSop = sopTemplates.reduce((acc, item) => {
    if (!acc[item.crop_name]) acc[item.crop_name] = []
    acc[item.crop_name].push(item)
    return acc
  }, {} as Record<string, SopTemplateItem[]>)

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DAFTAR MATERI KELAS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" /> Daftar Materi Kelas ({modules.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {modules.length > 0 ? (
              modules.map((mod) => (
                <div
                  key={mod.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl border border-stone-200 bg-white"
                >
                  <div className="min-w-0">
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 text-[10px] mb-1">
                      {mod.category}
                    </Badge>
                    <p className="text-sm font-medium text-stone-800 truncate">{mod.title}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/akademi/${mod.id}`}
                      title="Edit Mind Map"
                      className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50"
                    >
                      <Network className="w-4 h-4" />
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModule(mod)}
                      title="Edit Materi"
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 w-8"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={deletingId === mod.id}
                      onClick={() => handleDeleteModule(mod.id)}
                      title="Hapus Materi"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">Belum ada materi kelas yang dipublikasikan.</p>
            )}
          </CardContent>
        </Card>

        {/* DAFTAR TEMPLATE SOP PER KOMODITAS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-amber-600" /> Master Template SOP ({Object.keys(groupedSop).length} Komoditas)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
            {Object.keys(groupedSop).length > 0 ? (
              Object.entries(groupedSop).map(([cropName, steps]) => (
                <div key={cropName} className="rounded-xl border border-stone-200 p-3 bg-stone-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-emerald-900">{cropName}</h4>
                    <Badge variant="outline" className="text-[10px]">
                      {steps.length} Tahapan
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {steps
                      .sort((a, b) => a.step_order - b.step_order)
                      .map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-stone-100 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-stone-500 mr-1.5">#{step.step_order}</span>
                            <span className="text-stone-800">{step.phase_name}</span>
                            <span className="ml-2 text-emerald-700 font-medium">(HST {step.target_hst})</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditSop(step)}
                              className="text-stone-400 hover:text-amber-600 p-1"
                              title="Edit tahapan SOP"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === step.id}
                              onClick={() => handleDeleteSop(step.id)}
                              className="text-stone-400 hover:text-red-600 p-1"
                              title="Hapus tahapan SOP"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">Belum ada template SOP.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DIALOG EDIT MATERI */}
      <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Materi Pembelajaran</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateModule} className="space-y-3">
            <div className="space-y-1">
              <Label>Judul Materi</Label>
              <Input value={modTitle} onChange={(e) => setModTitle(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Kategori</Label>
              <Select value={modCategory} onValueChange={setModCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                rows={6}
                className="w-full rounded-md border border-stone-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                value={modSummary}
                onChange={(e) => setModSummary(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full bg-emerald-700 hover:bg-emerald-800">
              {saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Materi'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG EDIT TAHAPAN SOP */}
      <Dialog open={!!editingSop} onOpenChange={(open) => !open && setEditingSop(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tahapan SOP ({editingSop?.crop_name})</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSop} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Urutan Langkah</Label>
                <Input type="number" min="1" value={sopOrder} onChange={(e) => setSopOrder(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Target HST (Hari)</Label>
                <Input type="number" value={sopHst} onChange={(e) => setSopHst(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Nama Tahapan Perawatan</Label>
              <Input value={sopPhase} onChange={(e) => setSopPhase(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Panduan Singkat / Dosis Organik</Label>
              <Input value={sopDesc} onChange={(e) => setSopDesc(e.target.value)} />
            </div>
            <Button type="submit" disabled={saving} className="w-full bg-emerald-700 hover:bg-emerald-800">
              {saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan SOP'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
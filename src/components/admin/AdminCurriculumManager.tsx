'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trash2, BookOpen, ListChecks, Network, Pencil, Search, Check, X } from 'lucide-react'
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

const MODULE_CATEGORIES = [
  'Kesehatan Tanah',
  'Pembibitan',
  'Nutrisi & POC',
  'Pengendalian Hama',
  'Pasca Panen',
  'Bisnis Tani',
]

export function AdminCurriculumManager({
  modules = [],
  sopTemplates = [],
  mode = 'all',
}: {
  modules?: LearningModuleItem[]
  sopTemplates?: SopTemplateItem[]
  mode?: 'all' | 'module' | 'sop'
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [sopSearch, setSopSearch] = useState('')

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
        title: modTitle.trim(),
        category: modCategory,
        summary_markdown: modSummary.trim(),
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
        phase_name: sopPhase.trim(),
        description: sopDesc.trim() || null,
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
    setConfirmDeleteId(null)
    router.refresh()
  }

  const handleDeleteSop = async (id: string) => {
    setDeletingId(id)
    await supabase.from('crop_sop_templates').delete().eq('id', id)
    setDeletingId(null)
    setConfirmDeleteId(null)
    router.refresh()
  }

  const filteredTemplates = sopTemplates.filter((item) => {
    if (!sopSearch.trim()) return true
    const q = sopSearch.toLowerCase()
    return (
      item.crop_name.toLowerCase().includes(q) ||
      item.phase_name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    )
  })

  const groupedSop = filteredTemplates.reduce((acc, item) => {
    if (!acc[item.crop_name]) acc[item.crop_name] = []
    acc[item.crop_name].push(item)
    return acc
  }, {} as Record<string, SopTemplateItem[]>)

  const showModules = mode === 'all' || mode === 'module'
  const showSops = mode === 'all' || mode === 'sop'

  return (
    <>
      <div className={mode === 'all' ? 'grid grid-cols-1 lg:grid-cols-2 gap-5' : 'space-y-4'}>
        {/* DAFTAR MATERI KELAS */}
        {showModules && (
          <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                Daftar Materi Kelas ({modules.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {modules.length > 0 ? (
                modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-stone-200/90 bg-stone-50/40 hover:bg-white transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <Badge
                        variant="secondary"
                        className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[10px] font-semibold"
                      >
                        {mod.category}
                      </Badge>
                      <p className="text-sm font-semibold text-stone-900 truncate">{mod.title}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/akademi/${mod.id}`}
                        title="Susun Mind Map"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold"
                      >
                        <Network className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Mind Map</span>
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModule(mod)}
                        title="Edit Materi"
                        className="rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 w-8"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>

                      {confirmDeleteId === mod.id ? (
                        <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-1.5 py-0.5">
                          <button
                            type="button"
                            disabled={deletingId === mod.id}
                            onClick={() => handleDeleteModule(mod.id)}
                            className="p-1 text-red-700 hover:text-red-900"
                            title="Konfirmasi Hapus"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1 text-stone-500 hover:text-stone-700"
                            title="Batal"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmDeleteId(mod.id)}
                          title="Hapus Materi"
                          className="rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-500 py-4 text-center">
                  Belum ada materi kelas yang dipublikasikan.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* DAFTAR TEMPLATE SOP PER KOMODITAS */}
        {showSops && (
          <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
            <CardHeader className="pb-3 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-amber-600" />
                  Master Template SOP ({Object.keys(groupedSop).length} Komoditas)
                </CardTitle>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    placeholder="Cari komoditas / tahapan..."
                    value={sopSearch}
                    onChange={(e) => setSopSearch(e.target.value)}
                    className="pl-8 h-9 rounded-lg text-xs"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 max-h-[650px] overflow-y-auto pr-1">
              {Object.keys(groupedSop).length > 0 ? (
                Object.entries(groupedSop).map(([cropName, steps]) => (
                  <div
                    key={cropName}
                    className="rounded-xl border border-stone-200/90 p-3.5 bg-stone-50/70 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-emerald-950">{cropName}</h4>
                      <Badge variant="outline" className="rounded-md bg-white text-[11px] font-semibold">
                        {steps.length} Tahapan
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      {steps
                        .sort((a, b) => a.step_order - b.step_order)
                        .map((step) => (
                          <div
                            key={step.id}
                            className="flex items-start justify-between gap-2 bg-white p-2.5 rounded-lg border border-stone-200/70 text-xs"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-stone-400 tabular-nums">
                                  #{step.step_order}
                                </span>
                                <span className="font-semibold text-stone-800">{step.phase_name}</span>
                                <Badge className="rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-50 border border-emerald-200/70 text-[10px] font-semibold tabular-nums py-0 px-1.5">
                                  HST {step.target_hst}
                                </Badge>
                              </div>
                              {step.description && (
                                <p className="text-[11px] text-stone-500 leading-relaxed pl-5">
                                  {step.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditSop(step)}
                                className="rounded-md text-stone-400 hover:text-amber-600 hover:bg-amber-50 p-1.5 transition-colors"
                                title="Edit tahapan SOP"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {confirmDeleteId === step.id ? (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-md px-1 py-0.5">
                                  <button
                                    type="button"
                                    disabled={deletingId === step.id}
                                    onClick={() => handleDeleteSop(step.id)}
                                    className="p-0.5 text-red-700 hover:text-red-900"
                                    title="Konfirmasi Hapus"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="p-0.5 text-stone-500 hover:text-stone-700"
                                    title="Batal"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(step.id)}
                                  className="rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 p-1.5 transition-colors"
                                  title="Hapus tahapan SOP"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-500 py-6 text-center">
                  {sopSearch ? 'Tidak ada tahapan SOP yang cocok dengan pencarian.' : 'Belum ada template SOP.'}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* DIALOG EDIT MATERI */}
      <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-lg font-bold text-stone-900">Edit Materi Pembelajaran</DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Perbarui judul, kategori, atau ringkasan materi kelas.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateModule} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Judul Materi</Label>
              <Input
                value={modTitle}
                onChange={(e) => setModTitle(e.target.value)}
                className="rounded-lg h-10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Kategori</Label>
              <Select value={modCategory} onValueChange={(val) => val && setModCategory(val)}>
                <SelectTrigger className="w-full h-10 rounded-lg justify-between">
                  <span>{modCategory}</span>
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
                rows={6}
                className="w-full rounded-lg border border-stone-200 p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-600"
                value={modSummary}
                onChange={(e) => setModSummary(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="w-full h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-semibold"
            >
              {saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Materi'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG EDIT TAHAPAN SOP */}
      <Dialog open={!!editingSop} onOpenChange={(open) => !open && setEditingSop(null)}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-lg font-bold text-stone-900">
              Edit Tahapan SOP ({editingSop?.crop_name})
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Sesuaikan urutan langkah, target HST, atau panduan aplikasi organik.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSop} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Urutan Langkah</Label>
                <Input
                  type="number"
                  min="1"
                  value={sopOrder}
                  onChange={(e) => setSopOrder(e.target.value)}
                  className="rounded-lg h-10"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Target HST (Hari)</Label>
                <Input
                  type="number"
                  value={sopHst}
                  onChange={(e) => setSopHst(e.target.value)}
                  className="rounded-lg h-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Nama Tahapan Perawatan</Label>
              <Input
                value={sopPhase}
                onChange={(e) => setSopPhase(e.target.value)}
                className="rounded-lg h-10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Panduan Singkat / Dosis Organik</Label>
              <Input
                placeholder="Misal: 10 ml POC per liter air"
                value={sopDesc}
                onChange={(e) => setSopDesc(e.target.value)}
                className="rounded-lg h-10"
              />
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="w-full h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-semibold"
            >
              {saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan SOP'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
'use client'

import { useRef, useState } from 'react'
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
import {
  TrendingUp,
  Pencil,
  Trash2,
  Check,
  AlertCircle,
  Receipt,
  Scale,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { EXPENSE_CATEGORIES } from '@/components/bisnis/BusinessActionModals'

const formatRp = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

// Komponen pembungkus baris transaksi dengan gestur Tap (Edit) & Swipe Left (Hapus) di Mobile
function SwipeableTransactionRow({
  children,
  onTapEdit,
  onConfirmDelete,
  isDeleting,
}: {
  children: React.ReactNode
  onTapEdit: () => void
  onConfirmDelete: () => Promise<void>
  isDeleting: boolean
}) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const hasMoved = useRef(false)

  const ACTION_WIDTH = 82

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    hasMoved.current = false
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current

    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dx) < 12) return
    if (Math.abs(dx) > 8) hasMoved.current = true

    const base = swipeOffset === -ACTION_WIDTH ? -ACTION_WIDTH : 0
    const nextOffset = Math.max(-ACTION_WIDTH, Math.min(0, base + dx))
    setSwipeOffset(nextOffset)
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)
    if (swipeOffset < -ACTION_WIDTH / 2) {
      setSwipeOffset(-ACTION_WIDTH)
    } else {
      setSwipeOffset(0)
      setConfirmDelete(false)
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const handleClick = (e: React.MouseEvent) => {
    if (hasMoved.current) return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a')) return

    if (swipeOffset !== 0) {
      setSwipeOffset(0)
      setConfirmDelete(false)
      return
    }
    onTapEdit()
  }

  const handleDeleteClick = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    await onConfirmDelete()
    setSwipeOffset(0)
    setConfirmDelete(false)
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-red-600 border-b border-stone-100 last:border-0">
      {/* Panel Belakang Merah (Muncul saat Swipe Left di Mobile) */}
      <div
        style={{ width: `${ACTION_WIDTH}px` }}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-600 text-white"
      >
        <button
          type="button"
          disabled={isDeleting}
          onClick={handleDeleteClick}
          className="w-full h-full flex flex-col items-center justify-center gap-0.5 px-1.5 text-center active:bg-red-700 transition-colors"
        >
          {confirmDelete ? (
            <>
              <Check className="w-4 h-4" />
              <span className="text-[10px] font-bold leading-tight">
                {isDeleting ? 'Hapus...' : 'Yakin?'}
              </span>
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              <span className="text-[10px] font-semibold">Hapus</span>
            </>
          )}
        </button>
      </div>

      {/* Konten Baris Depan */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className="relative bg-white py-2.5 px-1 cursor-pointer active:bg-stone-50 select-none sm:select-auto"
      >
        {children}
      </div>
    </div>
  )
}

interface CashbookTransactionListProps {
  expenses: any[]
  harvests: any[]
  isAdmin: boolean
}

export function CashbookTransactionList({
  expenses,
  harvests,
  isAdmin,
}: CashbookTransactionListProps) {
  const supabase = createClient()
  const router = useRouter()

  // State Edit Pengeluaran
  const [editingExpense, setEditingExpense] = useState<any | null>(null)
  const [expCategory, setExpCategory] = useState('')
  const [expItemName, setExpItemName] = useState('')
  const [expQty, setExpQty] = useState('')
  const [expUnit, setExpUnit] = useState('')
  const [expUnitPrice, setExpUnitPrice] = useState('')

  // State Edit Panen
  const [editingHarvest, setEditingHarvest] = useState<any | null>(null)
  const [harvGrossKg, setHarvGrossKg] = useState('')
  const [harvNetKg, setHarvNetKg] = useState('')
  const [harvSellPrice, setHarvSellPrice] = useState('')
  const [harvBuyer, setHarvBuyer] = useState('')

  // State Simpan & Hapus
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmDesktopDeleteId, setConfirmDesktopDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const openEditExpense = (exp: any) => {
    setEditingExpense(exp)
    setExpCategory(exp.category || EXPENSE_CATEGORIES[0])
    setExpItemName(exp.item_name || '')
    setExpQty(String(exp.quantity ?? 1))
    setExpUnit(exp.unit || 'paket')
    setExpUnitPrice(String(exp.unit_price ?? 0))
    setErrorMsg('')
  }

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpense) return
    setSaving(true)
    setErrorMsg('')

    const { error } = await supabase
      .from('expenses')
      .update({
        category: expCategory,
        item_name: expItemName.trim(),
        quantity: Number(expQty),
        unit: expUnit.trim(),
        unit_price: Number(expUnitPrice),
      })
      .eq('id', editingExpense.id)

    setSaving(false)
    if (error) {
      setErrorMsg(`Gagal memperbarui biaya: ${error.message}`)
      return
    }

    setEditingExpense(null)
    router.refresh()
  }

  const deleteExpenseById = async (id: string) => {
    setDeletingId(id)
    await supabase.from('expenses').delete().eq('id', id)
    setDeletingId(null)
    setConfirmDesktopDeleteId(null)
    router.refresh()
  }

  const openEditHarvest = (harv: any) => {
    setEditingHarvest(harv)
    setHarvGrossKg(String(harv.gross_weight_kg ?? 0))
    setHarvNetKg(String(harv.net_weight_kg ?? 0))
    setHarvSellPrice(String(harv.selling_price_per_kg ?? 0))
    setHarvBuyer(harv.buyer_info || '')
    setErrorMsg('')
  }

  const handleUpdateHarvest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingHarvest) return
    if (Number(harvNetKg) > Number(harvGrossKg) && Number(harvGrossKg) > 0) {
      setErrorMsg('Berat bersih jual tidak boleh melebihi berat kotor panen.')
      return
    }

    setSaving(true)
    setErrorMsg('')

    const { error } = await supabase
      .from('harvest_logs')
      .update({
        gross_weight_kg: Number(harvGrossKg),
        net_weight_kg: Number(harvNetKg),
        selling_price_per_kg: Number(harvSellPrice),
        buyer_info: harvBuyer.trim() || null,
      })
      .eq('id', editingHarvest.id)

    setSaving(false)
    if (error) {
      setErrorMsg(`Gagal memperbarui panen: ${error.message}`)
      return
    }

    setEditingHarvest(null)
    router.refresh()
  }

  const deleteHarvestById = async (id: string) => {
    setDeletingId(id)
    await supabase.from('harvest_logs').delete().eq('id', id)
    setDeletingId(null)
    setConfirmDesktopDeleteId(null)
    router.refresh()
  }

  // Pastikan jika ada data lama dengan kategori non-baku tetap muncul di opsi dropdown saat edit
  const availableCategories =
    expCategory && !EXPENSE_CATEGORIES.includes(expCategory)
      ? [expCategory, ...EXPENSE_CATEGORIES]
      : EXPENSE_CATEGORIES

  return (
    <>
      <div className="space-y-2">
        {(expenses.length > 0 || harvests.length > 0) && (
          <p className="text-[11px] text-stone-400 sm:hidden px-0.5">
            Ketuk item untuk edit • Geser kiri untuk hapus
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* KARTU 1: RINCIAN PENGELUARAN (RAB) */}
          <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-600 rotate-180" /> Rincian Pengeluaran (RAB)
                </span>
                <span className="text-[11px] font-normal text-stone-400 tabular-nums">
                  {expenses.length} item
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-0.5 text-xs">
              {expenses.length > 0 ? (
                expenses.map((exp: any) => {
                  const cost = Number(
                    exp.total_cost ?? Number(exp.quantity || 0) * Number(exp.unit_price || 0)
                  )
                  const isGeneral = !exp.batch_id
                  const groupLabel = isGeneral ? exp.owner?.farm_group : exp.batches?.farm_group
                  const isConfirmDesktop = confirmDesktopDeleteId === exp.id

                  return (
                    <SwipeableTransactionRow
                      key={exp.id}
                      onTapEdit={() => openEditExpense(exp)}
                      onConfirmDelete={() => deleteExpenseById(exp.id)}
                      isDeleting={deletingId === exp.id}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1 min-w-0">
                          <p className="font-semibold text-stone-800 break-words">{exp.item_name}</p>
                          <div className="flex flex-wrap items-center gap-1.5 text-stone-400">
                            <Badge variant="outline" className="rounded-md text-[10px] py-0 px-1.5 font-normal">
                              {exp.category}
                            </Badge>
                            {isGeneral ? (
                              <Badge
                                variant="secondary"
                                className="rounded-md bg-amber-50 text-amber-800 border border-amber-200/70 text-[10px] py-0 px-1.5 font-medium"
                              >
                                Umum Lahan
                              </Badge>
                            ) : (
                              <span className="font-medium text-stone-600">{exp.batches?.crop_name}</span>
                            )}
                            <span>
                              {isAdmin && groupLabel ? `(${groupLabel}) ` : ''}• {exp.quantity} {exp.unit}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="font-bold text-red-600 tabular-nums">
                            -{formatRp(cost)}
                          </span>

                          {/* Tombol Aksi Khusus Desktop */}
                          <div className="hidden sm:flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditExpense(exp)}
                              title="Edit biaya"
                              className="p-1 rounded text-stone-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === exp.id}
                              onClick={() => {
                                if (isConfirmDesktop) {
                                  deleteExpenseById(exp.id)
                                } else {
                                  setConfirmDesktopDeleteId(exp.id)
                                  setTimeout(
                                    () => setConfirmDesktopDeleteId((prev) => (prev === exp.id ? null : prev)),
                                    4000
                                  )
                                }
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 transition-colors ${
                                isConfirmDesktop
                                  ? 'bg-red-600 text-white font-semibold'
                                  : 'text-stone-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                              {isConfirmDesktop && <span>Yakin?</span>}
                            </button>
                          </div>
                        </div>
                      </div>
                    </SwipeableTransactionRow>
                  )
                })
              ) : (
                <p className="text-stone-400 py-6 text-center">Belum ada catatan biaya.</p>
              )}
            </CardContent>
          </Card>

          {/* KARTU 2: RINCIAN PANEN & PENJUALAN */}
          <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-700" /> Rincian Panen &amp; Penjualan
                </span>
                <span className="text-[11px] font-normal text-stone-400 tabular-nums">
                  {harvests.length} item
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-0.5 text-xs">
              {harvests.length > 0 ? (
                harvests.map((harv: any) => {
                  const revenue = Number(
                    harv.total_revenue ??
                      Number(harv.net_weight_kg || 0) * Number(harv.selling_price_per_kg || 0)
                  )
                  const isConfirmDesktop = confirmDesktopDeleteId === harv.id

                  return (
                    <SwipeableTransactionRow
                      key={harv.id}
                      onTapEdit={() => openEditHarvest(harv)}
                      onConfirmDelete={() => deleteHarvestById(harv.id)}
                      isDeleting={deletingId === harv.id}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1 min-w-0">
                          <p className="font-semibold text-stone-800">
                            {harv.batches?.crop_name}
                            {isAdmin && harv.batches?.farm_group ? ` (${harv.batches.farm_group})` : ''} (
                            {harv.net_weight_kg} kg bersih)
                          </p>
                          <p className="text-stone-400">
                            {harv.harvest_date} • {formatRp(Number(harv.selling_price_per_kg))}/kg •{' '}
                            {harv.buyer_info || 'Penjualan'}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="font-bold text-emerald-700 tabular-nums">
                            +{formatRp(revenue)}
                          </span>

                          {/* Tombol Aksi Khusus Desktop */}
                          <div className="hidden sm:flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditHarvest(harv)}
                              title="Edit panen"
                              className="p-1 rounded text-stone-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === harv.id}
                              onClick={() => {
                                if (isConfirmDesktop) {
                                  deleteHarvestById(harv.id)
                                } else {
                                  setConfirmDesktopDeleteId(harv.id)
                                  setTimeout(
                                    () => setConfirmDesktopDeleteId((prev) => (prev === harv.id ? null : prev)),
                                    4000
                                  )
                                }
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 transition-colors ${
                                isConfirmDesktop
                                  ? 'bg-red-600 text-white font-semibold'
                                  : 'text-stone-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                              {isConfirmDesktop && <span>Yakin?</span>}
                            </button>
                          </div>
                        </div>
                      </div>
                    </SwipeableTransactionRow>
                  )
                })
              ) : (
                <p className="text-stone-400 py-6 text-center">Belum ada catatan panen.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL EDIT PENGELUARAN (RAB) */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-1">
              <Receipt className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-stone-900">
              Edit Catatan Pengeluaran
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Perbarui kategori, nama keperluan, jumlah, atau harga satuan RAB.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateExpense} className="space-y-3.5 pt-2">
            {errorMsg && (
              <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Kategori Biaya</Label>
              <Select value={expCategory} onValueChange={(val) => val && setExpCategory(val)}>
                <SelectTrigger className="w-full h-10 rounded-lg justify-between">
                  <span>{expCategory}</span>
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Nama Item / Keperluan</Label>
              <Input
                value={expItemName}
                onChange={(e) => setExpItemName(e.target.value)}
                className="rounded-lg h-10"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Jumlah</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={expQty}
                  onChange={(e) => setExpQty(e.target.value)}
                  className="rounded-lg h-10 tabular-nums"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Satuan</Label>
                <Input
                  value={expUnit}
                  onChange={(e) => setExpUnit(e.target.value)}
                  className="rounded-lg h-10"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Harga (Rp)</Label>
                <Input
                  type="number"
                  min="0"
                  value={expUnitPrice}
                  onChange={(e) => setExpUnitPrice(e.target.value)}
                  className="rounded-lg h-10 tabular-nums"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-red-50/80 border border-red-200/70 text-xs">
              <span className="font-medium text-stone-600">Total Biaya Baru:</span>
              <span className="font-bold text-red-700 text-sm tabular-nums">
                {formatRp((Number(expQty) || 0) * (Number(expUnitPrice) || 0))}
              </span>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-semibold"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan Biaya'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL EDIT PANEN */}
      <Dialog open={!!editingHarvest} onOpenChange={(open) => !open && setEditingHarvest(null)}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
              <Scale className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-stone-900">
              Edit Catatan Panen
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Perbarui berat timbangan panen atau harga jual per kilogram.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateHarvest} className="space-y-3.5 pt-2">
            {errorMsg && (
              <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Berat Kotor (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={harvGrossKg}
                  onChange={(e) => setHarvGrossKg(e.target.value)}
                  className="rounded-lg h-10 tabular-nums"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Berat Bersih Jual (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={harvNetKg}
                  onChange={(e) => setHarvNetKg(e.target.value)}
                  className="rounded-lg h-10 tabular-nums"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Harga Jual / kg (Rp)</Label>
                <Input
                  type="number"
                  min="0"
                  value={harvSellPrice}
                  onChange={(e) => setHarvSellPrice(e.target.value)}
                  className="rounded-lg h-10 tabular-nums"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Tujuan / Pembeli</Label>
                <Input
                  value={harvBuyer}
                  onChange={(e) => setHarvBuyer(e.target.value)}
                  className="rounded-lg h-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-xs">
              <span className="font-medium text-stone-600">Estimasi Omzet Baru:</span>
              <span className="font-bold text-emerald-800 text-sm tabular-nums">
                {formatRp((Number(harvNetKg) || 0) * (Number(harvSellPrice) || 0))}
              </span>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-semibold"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan Panen'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
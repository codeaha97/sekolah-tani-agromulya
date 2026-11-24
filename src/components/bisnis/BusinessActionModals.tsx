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
import { Receipt, Scale, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BatchOption {
  batch_id: string
  crop_name: string
}

const EXPENSE_CATEGORIES = [
  'Benih/Bibit',
  'Media & Pupuk Dasar',
  'POC & Pestisida Nabati',
  'Tenaga Kerja',
  'Kemasan & Panen',
  'Lain-lain',
]

const formatRp = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

export function BusinessActionModals({ batches }: { batches: BatchOption[] }) {
  const [openExpense, setOpenExpense] = useState(false)
  const [openHarvest, setOpenHarvest] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState(batches[0]?.batch_id || '')

  // State Biaya
  const [category, setCategory] = useState('Media & Pupuk Dasar')
  const [itemName, setItemName] = useState('')
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState('kg')
  const [unitPrice, setUnitPrice] = useState('')

  // State Panen
  const [grossKg, setGrossKg] = useState('')
  const [netKg, setNetKg] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [buyer, setBuyer] = useState('')

  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const selectedBatchLabel =
    batches.find((b) => b.batch_id === selectedBatch)?.crop_name || 'Pilih komoditas tanaman'

  const previewExpenseTotal = (Number(qty) || 0) * (Number(unitPrice) || 0)
  const previewHarvestTotal = (Number(netKg) || 0) * (Number(sellPrice) || 0)

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatch) return
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.from('expenses').insert({
      batch_id: selectedBatch,
      category,
      item_name: itemName.trim(),
      quantity: Number(qty),
      unit: unit.trim(),
      unit_price: Number(unitPrice),
    })

    setLoading(false)
    if (error) {
      setErrorMsg(`Gagal menyimpan biaya: ${error.message}`)
      return
    }

    setOpenExpense(false)
    setItemName('')
    setUnitPrice('')
    router.refresh()
  }

  const handleSaveHarvest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatch) return
    if (Number(netKg) > Number(grossKg) && Number(grossKg) > 0) {
      setErrorMsg('Berat bersih jual tidak boleh melebihi berat kotor panen.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.from('harvest_logs').insert({
      batch_id: selectedBatch,
      gross_weight_kg: Number(grossKg),
      net_weight_kg: Number(netKg),
      selling_price_per_kg: Number(sellPrice),
      buyer_info: buyer.trim() || null,
    })

    setLoading(false)
    if (error) {
      setErrorMsg(`Gagal menyimpan panen: ${error.message}`)
      return
    }

    setOpenHarvest(false)
    setGrossKg('')
    setNetKg('')
    setSellPrice('')
    setBuyer('')
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* MODAL INPUT BIAYA RAB */}
      <Dialog
        open={openExpense}
        onOpenChange={(val) => {
          setOpenExpense(val)
          setErrorMsg('')
        }}
      >
        <DialogTrigger
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'rounded-lg border-stone-200 bg-white hover:bg-stone-50 text-stone-800 font-semibold shadow-2xs'
          )}
        >
          <Receipt className="w-4 h-4 mr-1.5 text-red-600" /> Catat Biaya (RAB)
        </DialogTrigger>

        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-1">
              <Receipt className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-stone-900">
              Input Pengeluaran / Modal Tanam
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Catat pembelian sarana produksi untuk menghitung HPP per kilogram secara otomatis.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveExpense} className="space-y-3.5 pt-2">
            {errorMsg && (
              <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Pilih Batch Tanaman</Label>
              <Select value={selectedBatch} onValueChange={(val) => val && setSelectedBatch(val)}>
                <SelectTrigger className="w-full h-10 rounded-lg justify-between">
                  <span className="truncate text-left">{selectedBatchLabel}</span>
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.batch_id} value={b.batch_id}>
                      {b.crop_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Kategori Biaya</Label>
              <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                <SelectTrigger className="w-full h-10 rounded-lg justify-between">
                  <span>{category}</span>
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
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
                placeholder="Misal: Pupuk Kandang Kohe Kambing"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
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
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="rounded-lg h-10 tabular-nums"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Satuan</Label>
                <Input
                  placeholder="karung/liter"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="rounded-lg h-10"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Harga (Rp)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="15000"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="rounded-lg h-10 tabular-nums"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-red-50/80 border border-red-200/70 text-xs">
              <span className="font-medium text-stone-600">Total Biaya Tercatat:</span>
              <span className="font-bold text-red-700 text-sm tabular-nums">
                {formatRp(previewExpenseTotal)}
              </span>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-semibold"
            >
              {loading ? 'Menyimpan...' : 'Simpan Biaya RAB'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL INPUT PANEN */}
      <Dialog
        open={openHarvest}
        onOpenChange={(val) => {
          setOpenHarvest(val)
          setErrorMsg('')
        }}
      >
        <DialogTrigger
          className={cn(
            buttonVariants({ variant: 'default' }),
            'rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-2xs'
          )}
        >
          <Scale className="w-4 h-4 mr-1.5" /> Catat Hasil Panen
        </DialogTrigger>

        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
              <Scale className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-stone-900">
              Catat Hasil Panen &amp; Penjualan
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Masukkan hasil timbangan panen bersih dan harga jual per kilogram.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveHarvest} className="space-y-3.5 pt-2">
            {errorMsg && (
              <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Pilih Batch Tanaman</Label>
              <Select value={selectedBatch} onValueChange={(val) => val && setSelectedBatch(val)}>
                <SelectTrigger className="w-full h-10 rounded-lg justify-between">
                  <span className="truncate text-left">{selectedBatchLabel}</span>
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.batch_id} value={b.batch_id}>
                      {b.crop_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Berat Kotor (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="12.5"
                  value={grossKg}
                  onChange={(e) => {
                    const val = e.target.value
                    setGrossKg(val)
                    if (!netKg || netKg === grossKg) setNetKg(val)
                  }}
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
                  placeholder="11.8"
                  value={netKg}
                  onChange={(e) => setNetKg(e.target.value)}
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
                  placeholder="25000"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="rounded-lg h-10 tabular-nums"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Tujuan / Pembeli</Label>
                <Input
                  placeholder="Kolektif Angkatan / Pasar"
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                  className="rounded-lg h-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-xs">
              <span className="font-medium text-stone-600">Estimasi Omzet Panen:</span>
              <span className="font-bold text-emerald-800 text-sm tabular-nums">
                {formatRp(previewHarvestTotal)}
              </span>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-semibold"
            >
              {loading ? 'Menyimpan...' : 'Simpan Panen & Hitung HPP'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
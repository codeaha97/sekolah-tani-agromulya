'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Receipt, Scale } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BatchOption {
  batch_id: string
  crop_name: string
}

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

  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Cari label nama batch agar tidak menampilkan UUID di SelectValue
  const selectedBatchLabel =
    batches.find((b) => b.batch_id === selectedBatch)?.crop_name || 'Pilih tanaman'

  const previewExpenseTotal = (Number(qty) || 0) * (Number(unitPrice) || 0)
  const previewHarvestTotal = (Number(netKg) || 0) * (Number(sellPrice) || 0)

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatch) return
    setLoading(true)
    await supabase.from('expenses').insert({
      batch_id: selectedBatch,
      category,
      item_name: itemName,
      quantity: Number(qty),
      unit,
      unit_price: Number(unitPrice),
    })
    setLoading(false)
    setOpenExpense(false)
    setItemName('')
    setUnitPrice('')
    router.refresh()
  }

  const handleSaveHarvest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatch) return
    setLoading(true)
    await supabase.from('harvest_logs').insert({
      batch_id: selectedBatch,
      gross_weight_kg: Number(grossKg),
      net_weight_kg: Number(netKg),
      selling_price_per_kg: Number(sellPrice),
      buyer_info: buyer,
    })
    setLoading(false)
    setOpenHarvest(false)
    setGrossKg('')
    setNetKg('')
    setSellPrice('')
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* MODAL INPUT BIAYA RAB */}
      <Dialog open={openExpense} onOpenChange={setOpenExpense}>
        <DialogTrigger className={cn(buttonVariants({ variant: 'outline' }), 'border-stone-300 bg-white')}>
          <Receipt className="w-4 h-4 mr-1.5 text-red-600" /> Catat Biaya (RAB)
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Input Pengeluaran / Modal Tanam</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveExpense} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <Label>Pilih Batch Tanaman</Label>
              <Select value={selectedBatch} onValueChange={(val) => val && setSelectedBatch(val)}>
                <SelectTrigger className="w-full justify-between">
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

            <div className="space-y-1">
              <Label>Kategori Biaya</Label>
              <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{category}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Benih/Bibit">Benih / Bibit</SelectItem>
                  <SelectItem value="Media & Pupuk Dasar">Media & Pupuk Dasar</SelectItem>
                  <SelectItem value="POC & Pestisida Nabati">POC & Pestisida Nabati</SelectItem>
                  <SelectItem value="Tenaga Kerja">Tenaga Kerja</SelectItem>
                  <SelectItem value="Kemasan & Panen">Kemasan & Panen</SelectItem>
                  <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Nama Item / Keperluan</Label>
              <Input
                placeholder="Misal: Pupuk Kandang Kohe Kambing"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>Jumlah</Label>
                <Input type="number" step="0.1" value={qty} onChange={(e) => setQty(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Satuan</Label>
                <Input placeholder="karung/liter" value={unit} onChange={(e) => setUnit(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Harga Satuan</Label>
                <Input type="number" placeholder="15000" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50/70 border border-red-100 text-xs">
              <span className="text-stone-600">Total Biaya Tercatat:</span>
              <span className="font-bold text-red-700 text-sm">{formatRp(previewExpenseTotal)}</span>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800">
              {loading ? 'Menyimpan...' : 'Simpan Biaya'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL INPUT PANEN */}
      <Dialog open={openHarvest} onOpenChange={setOpenHarvest}>
        <DialogTrigger className={cn(buttonVariants({ variant: 'default' }), 'bg-emerald-700 hover:bg-emerald-800 text-white')}>
          <Scale className="w-4 h-4 mr-1.5" /> Catat Hasil Panen
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Hasil Panen & Penjualan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveHarvest} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <Label>Pilih Batch Tanaman</Label>
              <Select value={selectedBatch} onValueChange={(val) => val && setSelectedBatch(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{selectedBatchLabel}</SelectValue>
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
              <div className="space-y-1">
                <Label>Berat Kotor (kg)</Label>
                <Input type="number" step="0.01" placeholder="12.5" value={grossKg} onChange={(e) => setGrossKg(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Berat Bersih Jual (kg)</Label>
                <Input type="number" step="0.01" placeholder="11.8" value={netKg} onChange={(e) => setNetKg(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Harga Jual / kg (Rp)</Label>
                <Input type="number" placeholder="25000" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Tujuan / Pembeli</Label>
                <Input placeholder="Kolektif Angkatan / Pasar" value={buyer} onChange={(e) => setBuyer(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-xs">
              <span className="text-stone-600">Estimasi Pendapatan Panen:</span>
              <span className="font-bold text-emerald-800 text-sm">{formatRp(previewHarvestTotal)}</span>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800">
              {loading ? 'Menyimpan...' : 'Simpan Panen & Hitung HPP'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
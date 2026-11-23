import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface HppSummaryProps {
  cropName: string
  subtitle?: string
  totalExpense: number
  totalHarvestKg: number
  totalRevenue: number
  hppPerKg: number
  netProfit: number
}

const formatRp = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

export function HppSummaryCard({
  cropName,
  subtitle,
  totalExpense,
  totalHarvestKg,
  totalRevenue,
  hppPerKg,
  netProfit,
}: HppSummaryProps) {
  const isProfit = netProfit >= 0 && totalRevenue > 0
  const avgSellPrice = totalHarvestKg > 0 ? Math.round(totalRevenue / totalHarvestKg) : 0
  const bepPct = totalExpense > 0 ? Math.min(100, Math.round((totalRevenue / totalExpense) * 100)) : 0

  return (
    <Card className="border-stone-200/90 shadow-none bg-white overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base font-bold text-stone-900">{cropName}</CardTitle>
          {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
        </div>
        <Badge
          className={
            isProfit
              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
              : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
          }
        >
          {isProfit ? 'Profit' : totalHarvestKg > 0 ? 'Proses BEP' : 'Masa Tanam'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        {/* Grid Metrik Utama */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-stone-50 border border-stone-100">
          <div>
            <p className="text-[11px] text-stone-500">HPP / Kg</p>
            <p className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5">{formatRp(hppPerKg)}</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-500">Harga Jual Avg</p>
            <p className="font-bold text-emerald-700 text-xs sm:text-sm mt-0.5">
              {avgSellPrice > 0 ? formatRp(avgSellPrice) : '-'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-stone-500">Total Panen</p>
            <p className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5">{totalHarvestKg} kg</p>
          </div>
        </div>

        {/* Progress Bar Balik Modal (BEP) */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-stone-500">Progres Balik Modal (BEP)</span>
            <span className="font-semibold text-stone-700">{bepPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isProfit ? 'bg-emerald-600' : 'bg-amber-500'}`}
              style={{ width: `${bepPct}%` }}
            />
          </div>
        </div>

        {/* Rincian Modal vs Omzet */}
        <div className="space-y-1.5 pt-1 text-xs sm:text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Total Modal (RAB)</span>
            <span className="font-medium text-red-600">-{formatRp(totalExpense)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Total Omzet Panen</span>
            <span className="font-medium text-emerald-700">+{formatRp(totalRevenue)}</span>
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-stone-100 font-bold text-base">
            <span className="text-stone-800">Laba Bersih</span>
            <span className={`flex items-center gap-1 ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {formatRp(netProfit)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
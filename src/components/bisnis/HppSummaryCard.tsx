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
  const marginPerKg = avgSellPrice > 0 && hppPerKg > 0 ? avgSellPrice - hppPerKg : null
  const bepPct = totalExpense > 0 ? Math.min(100, Math.round((totalRevenue / totalExpense) * 100)) : 0

  return (
    <Card className="rounded-xl border-stone-200/90 shadow-2xs bg-white overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
        <div className="min-w-0">
          <CardTitle className="text-base font-bold text-stone-900 truncate">{cropName}</CardTitle>
          {subtitle && <p className="text-xs text-stone-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <Badge
          className={
            isProfit
              ? 'rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/70 text-[11px] font-semibold shrink-0'
              : 'rounded-md bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200/70 text-[11px] font-semibold shrink-0'
          }
        >
          {isProfit ? 'Profit' : totalHarvestKg > 0 ? 'Proses BEP' : 'Masa Tanam'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        {/* Grid Metrik Utama */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200/70">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-stone-500">HPP / Kg</p>
            <p className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5 tabular-nums truncate">
              {formatRp(hppPerKg)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-stone-500">Jual Rata-rata</p>
            <p className="font-bold text-emerald-700 text-xs sm:text-sm mt-0.5 tabular-nums truncate">
              {avgSellPrice > 0 ? formatRp(avgSellPrice) : '-'}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-stone-500">Total Panen</p>
            <p className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5 tabular-nums truncate">
              {totalHarvestKg} kg
            </p>
          </div>
        </div>

        {/* Progress Bar Balik Modal (BEP) */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-stone-500 font-medium">Progres Balik Modal (BEP)</span>
            <span className="font-bold text-stone-700 tabular-nums">{bepPct}%</span>
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
            <span className="font-semibold text-red-600 tabular-nums">-{formatRp(totalExpense)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Total Omzet Panen</span>
            <span className="font-semibold text-emerald-700 tabular-nums">+{formatRp(totalRevenue)}</span>
          </div>
          {marginPerKg !== null && (
            <div className="flex justify-between text-stone-500 text-xs">
              <span>Margin per Kg</span>
              <span
                className={`font-semibold tabular-nums ${
                  marginPerKg >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {marginPerKg >= 0 ? '+' : ''}
                {formatRp(marginPerKg)}/kg
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2.5 border-t border-stone-100 font-bold text-sm sm:text-base">
            <span className="text-stone-800">Laba Bersih</span>
            <span
              className={`flex items-center gap-1 tabular-nums ${
                netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {formatRp(netProfit)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
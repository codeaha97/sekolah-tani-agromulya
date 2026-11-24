'use client'

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { BarChart3 } from 'lucide-react'

interface GrowthDataPoint {
  hst: number
  avg_height_cm: number
  soil_ph: number
  alive_count: number
}

function CustomGrowthTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  const point: GrowthDataPoint | undefined = payload[0]?.payload

  return (
    <div className="bg-white/95 backdrop-blur-xs border border-stone-200 rounded-xl p-3 shadow-md text-xs space-y-1.5">
      <p className="font-bold text-stone-900 border-b border-stone-100 pb-1">Pengamatan HST {label}</p>
      <div className="space-y-1 tabular-nums">
        <p className="flex items-center justify-between gap-4 text-emerald-700 font-semibold">
          <span>Tinggi Batang:</span>
          <span>{point?.avg_height_cm ?? 0} cm</span>
        </p>
        <p className="flex items-center justify-between gap-4 text-amber-700 font-semibold">
          <span>pH Tanah:</span>
          <span>{point?.soil_ph ?? '-'}</span>
        </p>
        {point?.alive_count !== undefined && (
          <p className="flex items-center justify-between gap-4 text-stone-600 font-medium">
            <span>Populasi Hidup:</span>
            <span>{point.alive_count} btg</span>
          </p>
        )}
      </div>
    </div>
  )
}

export function GrowthChart({ data }: { data: GrowthDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-dashed border-stone-300 text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
          <BarChart3 className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-stone-700">Belum ada grafik pertumbuhan</p>
        <p className="text-xs text-stone-500">
          Catat pengamatan lapangan pertama melalui tombol <strong>Catat Kondisi</strong> untuk melihat grafik tinggi &amp; pH tanah.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200/90 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-stone-900">
            Tren Tinggi Batang (cm) &amp; pH Tanah
          </h3>
          <p className="text-[11px] text-stone-500">
            Garis putus-putus menunjukkan acuan pH tanah netral ideal (6,5)
          </p>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
            <XAxis
              dataKey="hst"
              tickFormatter={(val) => `HST ${val}`}
              fontSize={11}
              tick={{ fill: '#57534e' }}
              axisLine={{ stroke: '#d6d3d1' }}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              stroke="#047857"
              fontSize={11}
              unit=" cm"
              tick={{ fill: '#047857' }}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[4, 9]}
              stroke="#d97706"
              fontSize={11}
              tick={{ fill: '#b45309' }}
              axisLine={false}
            />
            <Tooltip content={<CustomGrowthTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <ReferenceLine
              yAxisId="right"
              y={6.5}
              stroke="#059669"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <Bar
              yAxisId="left"
              dataKey="avg_height_cm"
              name="Tinggi Batang (cm)"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              maxBarSize={42}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="soil_ph"
              name="pH Tanah"
              stroke="#d97706"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#d97706', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
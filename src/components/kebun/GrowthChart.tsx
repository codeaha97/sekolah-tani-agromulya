'use client'

import { useState } from 'react'
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
import { BarChart3, Ruler, FlaskConical } from 'lucide-react'

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
        <p className="flex items-center justify-between gap-4 text-emerald-700 font-bold">
          <span>Populasi Hidup:</span>
          <span>{point?.alive_count ?? 0} btg</span>
        </p>
        <p className="flex items-center justify-between gap-4 text-sky-700 font-semibold">
          <span>Tinggi Batang:</span>
          <span>{point?.avg_height_cm ?? 0} cm</span>
        </p>
        <p className="flex items-center justify-between gap-4 text-amber-700 font-semibold">
          <span>pH Tanah:</span>
          <span>{point?.soil_ph ?? '-'}</span>
        </p>
      </div>
    </div>
  )
}

export function GrowthChart({ data }: { data: GrowthDataPoint[] }) {
  const [secondaryMetric, setSecondaryMetric] = useState<'height' | 'ph'>('height')

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-dashed border-stone-300 text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
          <BarChart3 className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-stone-700">Belum ada grafik populasi &amp; pertumbuhan</p>
        <p className="text-xs text-stone-500">
          Catat pengamatan lapangan pertama melalui tombol <strong>Catat Kondisi</strong> untuk melihat tren populasi hidup, tinggi batang, dan pH tanah.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200/90 shadow-2xs space-y-3">
      {/* Header & Pengalih Metrik Pembanding */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-stone-900">
            {secondaryMetric === 'height'
              ? 'Populasi Hidup (btg) & Tinggi Batang (cm)'
              : 'Populasi Hidup (btg) & pH Tanah'}
          </h3>
          <p className="text-[11px] text-stone-500">
            {secondaryMetric === 'height'
              ? 'Batang hijau menunjukkan populasi bertahan hidup; garis biru menunjukkan laju tinggi tanaman'
              : 'Garis putus-putus menunjukkan acuan pH tanah netral ideal (6,5)'}
          </p>
        </div>

        {/* Toggle Switcher Metrik Kedua */}
        <div className="inline-flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200/70 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setSecondaryMetric('height')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              secondaryMetric === 'height'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Ruler className="w-3.5 h-3.5 text-sky-600" />
            <span>+ Tinggi Batang</span>
          </button>
          <button
            type="button"
            onClick={() => setSecondaryMetric('ph')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              secondaryMetric === 'ph'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
            <span>+ pH Tanah</span>
          </button>
        </div>
      </div>

      {/* Area Grafik */}
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

            {/* Sumbu Kiri Utama: Jumlah Populasi Hidup (btg) */}
            <YAxis
              yAxisId="left"
              orientation="left"
              domain={[0, 'auto']}
              allowDecimals={false}
              stroke="#047857"
              fontSize={11}
              unit=" btg"
              tick={{ fill: '#047857' }}
              axisLine={false}
            />

            {/* Sumbu Kanan Pembanding: Tinggi Batang (cm) atau pH Tanah */}
            {secondaryMetric === 'height' ? (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 'auto']}
                stroke="#0284c7"
                fontSize={11}
                unit=" cm"
                tick={{ fill: '#0369a1' }}
                axisLine={false}
              />
            ) : (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[4, 9]}
                stroke="#d97706"
                fontSize={11}
                tick={{ fill: '#b45309' }}
                axisLine={false}
              />
            )}

            <Tooltip content={<CustomGrowthTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />

            {secondaryMetric === 'ph' && (
              <ReferenceLine
                yAxisId="right"
                y={6.5}
                stroke="#059669"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
            )}

            {/* Bar Utama: Populasi Hidup */}
            <Bar
              yAxisId="left"
              dataKey="alive_count"
              name="Populasi Hidup (btg)"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              maxBarSize={42}
            />

            {/* Garis Pembanding */}
            {secondaryMetric === 'height' ? (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avg_height_cm"
                name="Tinggi Batang (cm)"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#0284c7', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6 }}
              />
            ) : (
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
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
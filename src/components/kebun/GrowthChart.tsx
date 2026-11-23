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
} from 'recharts'

interface GrowthDataPoint {
  hst: number
  avg_height_cm: number
  soil_ph: number
  alive_count: number
}

export function GrowthChart({ data }: { data: GrowthDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center rounded-xl border border-dashed border-stone-300 text-sm text-stone-500">
        Belum ada data monitoring pertumbuhan.
      </div>
    )
  }

  return (
    <div className="h-72 w-full bg-white p-4 rounded-xl border border-stone-200">
      <h3 className="text-sm font-semibold text-stone-800 mb-3">Tren Tinggi Batang (cm) & pH Tanah</h3>
      <ResponsiveContainer width="100%" height="88%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis dataKey="hst" tickFormatter={(val) => `HST ${val}`} fontSize={12} />
          <YAxis yAxisId="left" orientation="left" stroke="#047857" fontSize={12} unit=" cm" />
          <YAxis yAxisId="right" orientation="right" domain={[4, 9]} stroke="#d97706" fontSize={12} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar yAxisId="left" dataKey="avg_height_cm" name="Tinggi Batang (cm)" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="soil_ph" name="pH Tanah" stroke="#d97706" strokeWidth={2.5} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
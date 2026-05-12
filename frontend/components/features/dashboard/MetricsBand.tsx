'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useStats } from '@/hooks/useStats'

function formatTime(ms: number | undefined | null): string {
  if (ms == null || isNaN(ms) || ms === 0) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-[#ede8e1] rounded-xl overflow-hidden mb-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white p-5 animate-pulse h-20" />
      ))}
    </div>
  )
}

export function MetricsBand() {
  const { data, isLoading, isError } = useStats()

  if (isLoading) return <MetricsSkeleton />

  if (isError || !data) {
    return (
      <div className="bg-white rounded-xl border border-[#ede8e1] p-4 text-center text-sm text-[#dc2626] mb-6"
        style={{ fontFamily: "var(--font-sans)" }}>
        No se pudieron cargar las métricas.
      </div>
    )
  }

  const metrics = [
    { label: "Total Datasets", value: data.totalDatasets, accent: true },
    { label: "Total Jobs", value: data.totalJobs, accent: true },
    { label: "Completados", value: data.jobsCompleted },
    { label: "Fallidos", value: data.jobsFailed },
    { label: "T. Promedio", value: formatTime(data.avgProcessingTimeMs) },
    { label: "Pendientes", value: data.pendingReviews },
  ]

  const chartData = [
    { name: 'Completados', value: data.jobsCompleted, color: '#059669' },
    { name: 'Fallidos', value: data.jobsFailed, color: '#dc2626' },
  ]

  return (
    <div className="space-y-4">

      {/* Métricas en grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-[#ede8e1] rounded-xl overflow-hidden">
        {metrics.map(({ label, value, accent }) => (
          <div key={label} className="bg-white px-5 py-4">
            <p
              className="text-[10px] font-semibold text-[#6b6258] tracking-widest uppercase mb-1"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {label}
            </p>
            <p
              className="text-2xl font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: accent ? "#ff6600" : "#1a1612",
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-[#ede8e1] px-5 py-4">
        <p
          className="text-xs font-semibold text-[#1a1612] mb-3"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Jobs ETL — Completados vs Fallidos
        </p>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b6258", fontFamily: "var(--font-sans)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9c9189", fontFamily: "var(--font-sans)" }} allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value) => [value as number, 'Jobs']}
              contentStyle={{
                border: '1px solid #ede8e1',
                borderRadius: '10px',
                fontSize: '12px',
                fontFamily: "var(--font-sans)",
              }}
              cursor={{ fill: '#f7f5f2' }}
            />
            <Bar dataKey="value" radius={4} maxBarSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

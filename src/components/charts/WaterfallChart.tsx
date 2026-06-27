'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface WaterfallItem {
  name: string
  value: number
  isTotal?: boolean
}

interface WaterfallChartProps {
  data: WaterfallItem[]
  title?: string
}

export function WaterfallChart({ data, title }: WaterfallChartProps) {
  // Compute running total for waterfall offsets
  let running = 0
  const chartData = data.map((item) => {
    if (item.isTotal) {
      return { ...item, start: 0, barValue: item.value, fill: '#2E75B6' }
    }
    const start = running
    running += item.value
    const fill = item.value >= 0 ? '#10B981' : '#EF4444'
    return { ...item, start, barValue: Math.abs(item.value), fill }
  })

  return (
    <div>
      {title && <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(val: number, name: string, props: any) => {
              const orig = props.payload?.value ?? val
              return [`C$${orig.toFixed(1)}MM`, props.payload?.name]
            }}
          />
          <ReferenceLine y={0} stroke="#999" />
          {/* Invisible base bar for offset */}
          <Bar dataKey="start" stackId="a" fill="transparent" />
          <Bar dataKey="barValue" stackId="a" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

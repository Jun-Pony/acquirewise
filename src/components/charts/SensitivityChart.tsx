'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface SensitivityItem {
  label: string
  low: number
  base: number
  high: number
}

interface SensitivityChartProps {
  data: SensitivityItem[]
  title?: string
}

export function SensitivityChart({ data, title }: SensitivityChartProps) {
  const chartData = data.map((item) => ({
    name: item.label,
    downside: item.base - item.low,
    upside: item.high - item.base,
    base: item.base,
  }))

  return (
    <div>
      {title && <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 5, right: 16, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={75} />
          <Tooltip
            formatter={(val: number) => [`C$${val.toFixed(1)}MM swing`]}
          />
          <Bar dataKey="downside" stackId="a" fill="#EF4444" name="Downside" radius={[0, 0, 0, 0]} />
          <Bar dataKey="upside" stackId="a" fill="#10B981" name="Upside" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { YearlyFlow } from '@/types'
import { useLang } from '@/context/LangContext'

interface DeclineChartProps {
  flows: { name: string; yearlyFlows: YearlyFlow[] }[]
}

const COLORS = ['#2E75B6', '#F59E0B', '#10B981']

export function DeclineChart({ flows }: DeclineChartProps) {
  const { t } = useLang()

  // Build combined data by year
  const maxYears = Math.max(...flows.map((f) => f.yearlyFlows.length), 1)
  const data = Array.from({ length: maxYears }, (_, i) => {
    const entry: Record<string, number> = { year: i + 1 }
    flows.forEach((f) => {
      const yr = f.yearlyFlows[i]
      entry[f.name] = yr ? Math.round(yr.rate) : 0
    })
    return entry
  })

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="year"
          label={{ value: t.nav_model.year, position: 'insideBottom', offset: -2, fontSize: 11 }}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          label={{ value: 'boe/d', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11 }}
        />
        <Tooltip
          formatter={(val: number) => [`${val.toLocaleString()} boe/d`]}
          labelFormatter={(label) => `Year ${label}`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {flows.map((f, i) => (
          <Line
            key={f.name}
            type="monotone"
            dataKey={f.name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

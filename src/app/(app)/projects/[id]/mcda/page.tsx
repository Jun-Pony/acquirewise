'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/context/LangContext'
import { Card, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { computeMCDA, validateWeights, DEFAULT_MCDA_WEIGHTS } from '@/lib/models/mcda'
import { genId } from '@/lib/utils'
import type { MCDAWeights, MCDATarget, MCDAResult } from '@/types'

const COLORS = ['#2E75B6', '#F59E0B', '#10B981', '#8B5CF6']

export default function MCDAPage() {
  const { t } = useLang()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [weights, setWeights] = useState<MCDAWeights>(DEFAULT_MCDA_WEIGHTS)
  const [targets, setTargets] = useState<MCDATarget[]>([
    { id: genId(), name: 'Target A', screeningValue: 92.5, pdpShare: 0.72, aroRatio: 0.24, strategicFit: 7, askingPriceMM: 85 },
    { id: genId(), name: 'Target B', screeningValue: 78.0, pdpShare: 0.58, aroRatio: 0.31, strategicFit: 5, askingPriceMM: 65 },
    { id: genId(), name: 'Target C', screeningValue: 105.0, pdpShare: 0.45, aroRatio: 0.19, strategicFit: 8, askingPriceMM: 98 },
  ])

  // Synergy confirmations per target
  const [synergyConfirmed, setSynergyConfirmed] = useState<Record<string, Record<string, boolean>>>({})

  const weightValid = validateWeights(weights)
  const weightSum = weights.screeningValue + weights.pdpShare + weights.aroRatio + weights.strategicFit

  const results: MCDAResult[] = useMemo(() => {
    if (!weightValid || targets.length === 0) return []
    return computeMCDA(targets, weights)
  }, [targets, weights, weightValid])

  const sortedResults = [...results].sort((a, b) => b.score - a.score)

  const updateWeight = (field: keyof MCDAWeights, value: number) => {
    setWeights((prev) => ({ ...prev, [field]: value }))
  }

  const updateTarget = (idx: number, field: keyof MCDATarget, value: number | string) => {
    setTargets((prev) => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      return updated
    })
  }

  const addTarget = () => {
    setTargets((prev) => [
      ...prev,
      {
        id: genId(),
        name: `Target ${String.fromCharCode(65 + prev.length)}`,
        screeningValue: 80,
        pdpShare: 0.6,
        aroRatio: 0.25,
        strategicFit: 5,
        askingPriceMM: 75,
      },
    ])
  }

  const removeTarget = (idx: number) => {
    setTargets((prev) => prev.filter((_, i) => i !== idx))
  }

  const toggleSynergy = (targetId: string, key: string) => {
    setSynergyConfirmed((prev) => ({
      ...prev,
      [targetId]: {
        ...prev[targetId],
        [key]: !(prev[targetId]?.[key] ?? false),
      },
    }))
  }

  // Radar chart data
  const radarData = [
    { subject: 'Screening', fullMark: 1 },
    { subject: 'PDP Share', fullMark: 1 },
    { subject: 'ARO Ratio (inv)', fullMark: 1 },
    { subject: 'Strategic Fit', fullMark: 1 },
  ].map((item, i) => {
    const entry: Record<string, number | string> = { subject: item.subject, fullMark: 1 }
    sortedResults.slice(0, 3).forEach((r) => {
      const vals = Object.values(r.normalizedValues)
      entry[r.name] = i === 2 ? 1 - vals[i] : vals[i]
    })
    return entry
  })

  const rankBadge = (rank: number) =>
    rank === 1 ? 'green' : rank === 2 ? 'blue' : 'gray'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F3864]">{t.mcda.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t.mcda.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: weights */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.mcda.weights}</CardTitle>
              <CardSubtitle>Sum = {weightSum.toFixed(3)}</CardSubtitle>
            </CardHeader>

            {!weightValid && (
              <div className="mb-3 flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {t.mcda.weightError}
              </div>
            )}
            {weightValid && (
              <div className="mb-3 flex items-center gap-2 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Weights valid (sum = 1.000)
              </div>
            )}

            <div className="space-y-3">
              {[
                { label: t.mcda.wScreening, field: 'screeningValue' as keyof MCDAWeights },
                { label: t.mcda.wPdpShare, field: 'pdpShare' as keyof MCDAWeights },
                { label: t.mcda.wAroRatio, field: 'aroRatio' as keyof MCDAWeights },
                { label: t.mcda.wStrategicFit, field: 'strategicFit' as keyof MCDAWeights },
              ].map(({ label, field }) => (
                <div key={field}>
                  <Input
                    label={label}
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={String(weights[field])}
                    onChange={(e) => updateWeight(field, parseFloat(e.target.value) || 0)}
                    error={!weightValid ? ' ' : undefined}
                  />
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2E75B6] rounded-full transition-all"
                      style={{ width: `${weights[field] * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Radar chart */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Radar Comparison</CardTitle>
              </CardHeader>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  {sortedResults.slice(0, 3).map((r, i) => (
                    <Radar
                      key={r.id}
                      name={r.name}
                      dataKey={r.name}
                      stroke={COLORS[i]}
                      fill={COLORS[i]}
                      fillOpacity={0.15}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Right: targets + results */}
        <div className="lg:col-span-2 space-y-4">
          {/* TOPSIS ranking */}
          {results.length > 0 && (
            <Card padding="none">
              <div className="p-4 border-b border-gray-50">
                <CardTitle className="text-base">TOPSIS Rankings</CardTitle>
              </div>
              <Table>
                <Thead>
                  <tr>
                    <Th>Rank</Th>
                    <Th>Target</Th>
                    <Th>TOPSIS Score</Th>
                    <Th>Screening (C$MM)</Th>
                    <Th>PDP Share</Th>
                    <Th>ARO Ratio</Th>
                    <Th>Fit</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {sortedResults.map((r) => (
                    <Tr key={r.id}>
                      <Td>
                        <Badge variant={rankBadge(r.rank)}>#{r.rank}</Badge>
                      </Td>
                      <Td className="font-medium">{r.name}</Td>
                      <Td className="font-bold text-[#2E75B6]">{r.score.toFixed(3)}</Td>
                      <Td>{r.normalizedValues.screeningValue.toFixed(3)}</Td>
                      <Td>{r.normalizedValues.pdpShare.toFixed(3)}</Td>
                      <Td>{r.normalizedValues.aroRatio.toFixed(3)}</Td>
                      <Td>{r.normalizedValues.strategicFit.toFixed(3)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
          )}

          {/* Target input table */}
          <Card padding="none">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <CardTitle className="text-base">{t.mcda.targets}</CardTitle>
              <Button size="sm" onClick={addTarget} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#1F3864] text-white">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">{t.mcda.screeningValue}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">{t.mcda.pdpShare}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">{t.mcda.aroRatio}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">{t.mcda.strategicFit}</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {targets.map((target, i) => (
                    <React.Fragment key={target.id}>
                      <tr className="hover:bg-blue-50/30">
                        <td className="px-3 py-2">
                          <input
                            className="w-full bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[#2E75B6] rounded px-1"
                            value={target.name}
                            onChange={(e) => updateTarget(i, 'name', e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" step="0.1" className="w-20 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[#2E75B6] rounded px-1"
                            value={target.screeningValue}
                            onChange={(e) => updateTarget(i, 'screeningValue', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" step="0.01" min="0" max="1" className="w-16 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[#2E75B6] rounded px-1"
                            value={target.pdpShare}
                            onChange={(e) => updateTarget(i, 'pdpShare', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" step="0.01" min="0" className="w-16 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[#2E75B6] rounded px-1"
                            value={target.aroRatio}
                            onChange={(e) => updateTarget(i, 'aroRatio', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" step="1" min="1" max="10" className="w-12 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[#2E75B6] rounded px-1"
                            value={target.strategicFit}
                            onChange={(e) => updateTarget(i, 'strategicFit', parseInt(e.target.value) || 5)} />
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => removeTarget(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                      {/* Synergy confirmation row */}
                      <tr className="bg-blue-50/30">
                        <td colSpan={6} className="px-3 py-2">
                          <p className="text-xs font-medium text-gray-600 mb-1.5">{t.mcda.synergy}:</p>
                          <div className="flex flex-wrap gap-3">
                            {[
                              { key: 'infra', label: t.mcda.infraScore },
                              { key: 'staff', label: t.mcda.staffScore },
                              { key: 'water', label: t.mcda.waterScore },
                            ].map(({ key, label }) => (
                              <label key={key} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={synergyConfirmed[target.id]?.[key] ?? false}
                                  onChange={() => toggleSynergy(target.id, key)}
                                  className="w-3.5 h-3.5 accent-[#2E75B6]"
                                />
                                <span>{label}</span>
                                {synergyConfirmed[target.id]?.[key] && (
                                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                                )}
                              </label>
                            ))}
                          </div>
                          {Object.values(synergyConfirmed[target.id] ?? {}).some(Boolean) && (
                            <p className="text-xs text-amber-600 mt-1">{t.mcda.confirmSynergy}</p>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/context/LangContext'
import { Card, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { GateIndicator } from '@/components/GateIndicator'
import { computeScenarioNAV, DEFAULT_SCENARIO_MULTIPLIERS } from '@/lib/models/scenarios'
import { DEFAULT_RESERVE_CATEGORIES, DEFAULT_NAV_ASSUMPTIONS } from '@/lib/models/nav'
import { DEFAULT_LIABILITY_ITEMS } from '@/lib/models/lanav'
import { fmtMM } from '@/lib/utils'
import type { ScenarioMultipliers, ScenarioResult, NAVAssumptions, ReserveCategory, LiabilityItem } from '@/types'

type ScenarioKey = 'base' | 'downside' | 'upside'

const SCENARIO_COLORS: Record<ScenarioKey, string> = {
  base: '#2E75B6',
  downside: '#EF4444',
  upside: '#10B981',
}

export default function ScenariosPage() {
  const { t } = useLang()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [assumptions, setAssumptions] = useState<NAVAssumptions>(DEFAULT_NAV_ASSUMPTIONS)
  const [categories] = useState<ReserveCategory[]>(DEFAULT_RESERVE_CATEGORIES)
  const [liabilities] = useState<LiabilityItem[]>(DEFAULT_LIABILITY_ITEMS)
  const [askingPrice, setAskingPrice] = useState(85)
  const [multipliers, setMultipliers] = useState<Record<ScenarioKey, ScenarioMultipliers>>({
    base: { ...DEFAULT_SCENARIO_MULTIPLIERS.base },
    downside: { ...DEFAULT_SCENARIO_MULTIPLIERS.downside },
    upside: { ...DEFAULT_SCENARIO_MULTIPLIERS.upside },
  })
  const [results, setResults] = useState<ScenarioResult[]>([])
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>('base')

  useEffect(() => {
    supabase
      .from('assumptions')
      .select('*')
      .eq('project_id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setAssumptions({
            discountRate: data.discount_rate,
            fx: data.fx_rate,
            edmontonDiff: data.edmonton_diff,
            qualityAdj: data.quality_adj,
            wtiPriceDeck: Array.isArray(data.wti_price_deck) ? data.wti_price_deck : DEFAULT_NAV_ASSUMPTIONS.wtiPriceDeck,
            royaltyFloor: data.royalty_floor,
            royaltyCap: data.royalty_cap,
            priceLow: data.price_low,
            priceHigh: data.price_high,
            horizonYears: data.horizon_years,
            economicLimit: data.economic_limit,
          })
        }
      })
  }, [id])

  useEffect(() => {
    const scenarios: ScenarioKey[] = ['base', 'downside', 'upside']
    const res = scenarios.map((s) =>
      computeScenarioNAV(categories, liabilities, askingPrice, multipliers[s], assumptions, s)
    )
    setResults(res)
  }, [multipliers, assumptions, askingPrice, categories, liabilities])

  const updateMult = (scenario: ScenarioKey, field: keyof ScenarioMultipliers, value: number) => {
    setMultipliers((prev) => ({
      ...prev,
      [scenario]: { ...prev[scenario], [field]: value },
    }))
  }

  const multField = (
    scenario: ScenarioKey,
    label: string,
    field: keyof ScenarioMultipliers,
    suffix?: string
  ) => (
    <Input
      label={label}
      type="number"
      step="0.01"
      value={String(multipliers[scenario][field])}
      onChange={(e) => updateMult(scenario, field, parseFloat(e.target.value) || 0)}
      suffix={suffix}
    />
  )

  const chartData = [
    {
      name: 'NAV (C$MM)',
      base: results[0]?.nav ?? 0,
      downside: results[1]?.nav ?? 0,
      upside: results[2]?.nav ?? 0,
    },
    {
      name: 'LANAV (C$MM)',
      base: results[0]?.lanav ?? 0,
      downside: results[1]?.lanav ?? 0,
      upside: results[2]?.lanav ?? 0,
    },
  ]

  const scenarioLabels: Record<ScenarioKey, string> = {
    base: t.scenarios.base,
    downside: t.scenarios.downside,
    upside: t.scenarios.upside,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F3864]">{t.scenarios.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t.scenarios.subtitle}</p>
      </div>

      {/* Asking price */}
      <Card className="mb-4 max-w-xs">
        <Input
          label={`Asking Price (C$MM)`}
          type="number"
          value={String(askingPrice)}
          onChange={(e) => setAskingPrice(parseFloat(e.target.value) || 0)}
          suffix="C$MM"
        />
      </Card>

      {/* Scenario tabs */}
      <div className="flex gap-2 mb-4">
        {(['base', 'downside', 'upside'] as ScenarioKey[]).map((s) => (
          <button
            key={s}
            onClick={() => setActiveScenario(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeScenario === s
                ? 'text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
            style={activeScenario === s ? { backgroundColor: SCENARIO_COLORS[s] } : {}}
          >
            {scenarioLabels[s]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multiplier inputs */}
        <Card>
          <CardHeader>
            <CardTitle>{scenarioLabels[activeScenario]} — Multipliers</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4">
            {multField(activeScenario, t.scenarios.priceMult, 'priceMult', '×')}
            {multField(activeScenario, t.scenarios.prodMult, 'prodMult', '×')}
            {multField(activeScenario, t.scenarios.opexMult, 'opexMult', '×')}
            {multField(activeScenario, t.scenarios.liabilityMult, 'liabilityMult', '×')}
            {multField(activeScenario, t.scenarios.declineAdj, 'declineAdj', '+/yr')}
          </div>
        </Card>

        {/* Results comparison */}
        <div className="space-y-3">
          {results.map((r, i) => {
            const sk = r.scenario as ScenarioKey
            return (
              <Card key={r.scenario} padding="sm">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: SCENARIO_COLORS[sk] }}
                  />
                  <span className="font-semibold text-sm text-gray-700 flex-1">
                    {scenarioLabels[sk]}
                  </span>
                  <GateIndicator gate={r.gate} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">NAV</p>
                    <p className="text-base font-bold text-[#1F3864]">{fmtMM(r.nav)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">LANAV</p>
                    <p className="text-base font-bold text-[#2E75B6]">{fmtMM(r.lanav)}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Comparison chart */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t.scenarios.comparison}</CardTitle>
        </CardHeader>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => [`C$${v.toFixed(1)}MM`]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="base" name={t.scenarios.base} fill={SCENARIO_COLORS.base} radius={[4, 4, 0, 0]} />
            <Bar dataKey="downside" name={t.scenarios.downside} fill={SCENARIO_COLORS.downside} radius={[4, 4, 0, 0]} />
            <Bar dataKey="upside" name={t.scenarios.upside} fill={SCENARIO_COLORS.upside} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

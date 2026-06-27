'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/context/LangContext'
import { Card, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { DeclineChart } from '@/components/charts/DeclineChart'
import {
  computeNAV,
  DEFAULT_RESERVE_CATEGORIES,
  DEFAULT_NAV_ASSUMPTIONS,
} from '@/lib/models/nav'
import { fmtMM, fmtPct, fmtNum } from '@/lib/utils'
import type { ReserveCategory, NAVAssumptions, NAVResult } from '@/types'

const CATEGORY_COLORS: Record<string, string> = {
  PDP: 'blue',
  PUD: 'gray',
  Probable: 'gray',
}

export default function NAVPage() {
  const { t } = useLang()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [assumptions, setAssumptions] = useState<NAVAssumptions>(DEFAULT_NAV_ASSUMPTIONS)
  const [categories, setCategories] = useState<ReserveCategory[]>(DEFAULT_RESERVE_CATEGORIES)
  const [result, setResult] = useState<NAVResult | null>(null)
  const [activeCategory, setActiveCategory] = useState(0)

  // Load global assumptions
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
            wtiPriceDeck: Array.isArray(data.wti_price_deck)
              ? data.wti_price_deck
              : DEFAULT_NAV_ASSUMPTIONS.wtiPriceDeck,
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

  // Recompute whenever inputs change
  useEffect(() => {
    const nav = computeNAV(categories, assumptions)
    setResult(nav)
  }, [categories, assumptions])

  const updateCat = (idx: number, field: keyof ReserveCategory, value: number) => {
    setCategories((prev) => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      return updated
    })
  }

  const catField = (idx: number, label: string, field: keyof ReserveCategory, suffix?: string) => (
    <Input
      label={label}
      type="number"
      step="any"
      value={String(categories[idx][field] as number)}
      onChange={(e) => updateCat(idx, field, parseFloat(e.target.value) || 0)}
      suffix={suffix}
    />
  )

  const cat = categories[activeCategory]
  const catResult = result?.categories[activeCategory]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F3864]">{t.nav_model.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t.nav_model.subtitle}</p>
      </div>

      {/* Summary strip */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {result.categories.map((c) => (
            <Card key={c.name} padding="sm" className="border-l-4 border-[#2E75B6]">
              <p className="text-xs text-gray-500 font-medium">{c.name} Risked NAV</p>
              <p className="text-xl font-bold text-[#1F3864] mt-0.5">{fmtMM(c.riskedNAV)}</p>
              <p className="text-xs text-gray-400">NAV@10%: {fmtMM(c.nav10)}</p>
            </Card>
          ))}
          <Card padding="sm" className="border-l-4 border-green-500">
            <p className="text-xs text-gray-500 font-medium">Total Risked NAV</p>
            <p className="text-2xl font-bold text-green-700 mt-0.5">{fmtMM(result.totalRiskedNAV)}</p>
            <p className="text-xs text-gray-400">ARO PV: {fmtMM(result.totalAroPV)}</p>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: inputs */}
        <div className="space-y-4">
          {/* Category tabs */}
          <div className="flex gap-2">
            {categories.map((c, i) => (
              <button
                key={c.name}
                onClick={() => setActiveCategory(i)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === i
                    ? 'bg-[#2E75B6] text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {c.name}
                <span className="ml-1.5 text-xs opacity-75">
                  RF={c.riskFactor}
                </span>
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t.nav_model.category}: {cat.name}</CardTitle>
              <CardSubtitle>Risk Factor: {cat.riskFactor}</CardSubtitle>
            </CardHeader>
            <div className="grid grid-cols-2 gap-4">
              {catField(activeCategory, t.nav_model.qi, 'qi', 'boe/d')}
              {catField(activeCategory, t.nav_model.di, 'Di', '/yr')}
              {catField(activeCategory, t.nav_model.bFactor, 'b')}
              {catField(activeCategory, t.nav_model.capexYr1, 'capexYr1', 'C$MM')}
              {catField(activeCategory, t.nav_model.varOpex, 'varOpex', 'CAD/boe')}
              {catField(activeCategory, t.nav_model.fixedOpex, 'fixedOpex', 'C$MM/yr')}
              {catField(activeCategory, t.nav_model.aroUndiscounted, 'aroUndiscounted', 'C$MM')}
              {catField(activeCategory, t.nav_model.aroTiming, 'aroTiming', 'yr')}
            </div>
          </Card>

          {/* Current category results */}
          {catResult && (
            <Card>
              <CardHeader>
                <CardTitle>{t.nav_model.results} — {catResult.name}</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{t.nav_model.grossNAV}</p>
                  <p className="text-lg font-bold text-gray-800">{fmtMM(catResult.grossNAV)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{t.nav_model.nav10}</p>
                  <p className="text-lg font-bold text-[#2E75B6]">{fmtMM(catResult.nav10)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600">{t.nav_model.riskedNAV}</p>
                  <p className="text-lg font-bold text-[#1F3864]">{fmtMM(catResult.riskedNAV)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-red-500">{t.nav_model.aroPV}</p>
                  <p className="text-lg font-bold text-red-700">{fmtMM(catResult.aroPV)}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right: charts & table */}
        <div className="space-y-4">
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>{t.nav_model.declineCurve}</CardTitle>
              </CardHeader>
              <DeclineChart
                flows={result.categories.map((c) => ({
                  name: c.name,
                  yearlyFlows: c.yearlyFlows,
                }))}
              />
            </Card>
          )}

          {catResult && catResult.yearlyFlows.length > 0 && (
            <Card padding="none">
              <div className="p-4 border-b border-gray-50">
                <CardTitle className="text-base">{t.nav_model.yearlyFlow} — {catResult.name}</CardTitle>
              </div>
              <Table>
                <Thead>
                  <tr>
                    <Th>Yr</Th>
                    <Th>Rate (boe/d)</Th>
                    <Th>Net Rev (C$MM)</Th>
                    <Th>Net CF (C$MM)</Th>
                    <Th>DF</Th>
                    <Th>PV CF (C$MM)</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {catResult.yearlyFlows.map((yr) => (
                    <Tr key={yr.year}>
                      <Td>{yr.year}</Td>
                      <Td>{fmtNum(yr.rate, 0)}</Td>
                      <Td>{yr.netRevenue.toFixed(2)}</Td>
                      <Td className={yr.netCF < 0 ? 'text-red-600' : ''}>{yr.netCF.toFixed(2)}</Td>
                      <Td className="text-gray-400">{yr.df.toFixed(3)}</Td>
                      <Td className="font-medium">{yr.pvCF.toFixed(2)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

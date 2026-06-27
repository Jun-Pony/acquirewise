'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/context/LangContext'
import { Card, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { GateIndicator } from '@/components/GateIndicator'
import { WaterfallChart } from '@/components/charts/WaterfallChart'
import { computeLANAV, DEFAULT_LIABILITY_ITEMS, liabilityPV } from '@/lib/models/lanav'
import { genId, fmtMM, fmtPct } from '@/lib/utils'
import type { LiabilityItem, LANAVResult } from '@/types'

export default function LANAVPage() {
  const { t } = useLang()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [discountRate, setDiscountRate] = useState(0.10)
  const [riskedNAV, setRiskedNAV] = useState(92.5)
  const [askingPrice, setAskingPrice] = useState(85)
  const [liabilities, setLiabilities] = useState<LiabilityItem[]>(() =>
    DEFAULT_LIABILITY_ITEMS.map((l) => ({ ...l, id: genId() }))
  )
  const [result, setResult] = useState<LANAVResult | null>(null)

  // Load discount rate from assumptions
  useEffect(() => {
    supabase
      .from('assumptions')
      .select('discount_rate')
      .eq('project_id', id)
      .single()
      .then(({ data }) => {
        if (data) setDiscountRate(data.discount_rate)
      })
  }, [id])

  // Recompute
  useEffect(() => {
    const res = computeLANAV(riskedNAV, askingPrice, liabilities, discountRate)
    setResult(res)
  }, [riskedNAV, askingPrice, liabilities, discountRate])

  const updateLiability = (idx: number, field: keyof LiabilityItem, value: number | string) => {
    setLiabilities((prev) => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      return updated
    })
  }

  const addLiability = () => {
    setLiabilities((prev) => [
      ...prev,
      { id: genId(), name: 'New Item', grossMM: 1.0, probability: 0.5, timingYears: 5 },
    ])
  }

  const removeLiability = (idx: number) => {
    setLiabilities((prev) => prev.filter((_, i) => i !== idx))
  }

  const waterfallData = result
    ? [
        { name: 'Risked NAV', value: riskedNAV },
        ...liabilities.map((l) => ({
          name: l.name.length > 18 ? l.name.slice(0, 16) + '…' : l.name,
          value: -liabilityPV(l, discountRate),
        })),
        { name: 'LANAV', value: result.lanav, isTotal: true },
      ]
    : []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F3864]">{t.lanav.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t.lanav.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: inputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <Input
                label={t.lanav.riskedNAV}
                type="number"
                step="0.1"
                value={String(riskedNAV)}
                onChange={(e) => setRiskedNAV(parseFloat(e.target.value) || 0)}
                suffix="C$MM"
              />
              <Input
                label={t.lanav.askingPrice}
                type="number"
                step="0.1"
                value={String(askingPrice)}
                onChange={(e) => setAskingPrice(parseFloat(e.target.value) || 0)}
                suffix="C$MM"
              />
              <Input
                label="Discount Rate"
                type="number"
                step="0.01"
                value={String(discountRate)}
                onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0.10)}
                suffix="%"
              />
            </div>
          </Card>

          {/* Gate result */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>{t.lanav.gate}</CardTitle>
              </CardHeader>
              <GateIndicator gate={result.gate} ratio={result.lanaVRatio} large />

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t.lanav.lanav}</span>
                  <span className="font-bold text-[#1F3864]">{fmtMM(result.lanav)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t.lanav.totalLiabPV}</span>
                  <span className="font-bold text-red-600">{fmtMM(result.totalLiabPV)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t.lanav.lanaVRatio}</span>
                  <span className="font-bold">{(result.lanaVRatio * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t.lanav.liabDrag}</span>
                  <span className="font-bold text-amber-600">{fmtPct(result.liabDrag)}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right: liability table + chart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Waterfall chart */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Value Bridge</CardTitle>
                <CardSubtitle>Risked NAV → Liability deductions → LANAV</CardSubtitle>
              </CardHeader>
              <WaterfallChart data={waterfallData} />
            </Card>
          )}

          {/* Liability items table */}
          <Card padding="none">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <CardTitle className="text-base">Liability Items</CardTitle>
              <Button size="sm" onClick={addLiability} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                {t.lanav.addItem}
              </Button>
            </div>
            <Table>
              <Thead>
                <tr>
                  <Th>{t.lanav.liabilityName}</Th>
                  <Th>{t.lanav.grossMM}</Th>
                  <Th>{t.lanav.probability}</Th>
                  <Th>{t.lanav.timingYears}</Th>
                  <Th>{t.lanav.pvMM}</Th>
                  <Th></Th>
                </tr>
              </Thead>
              <Tbody>
                {liabilities.map((l, i) => (
                  <Tr key={l.id}>
                    <Td>
                      <input
                        className="w-full bg-transparent text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2E75B6] rounded px-1"
                        value={l.name}
                        onChange={(e) => updateLiability(i, 'name', e.target.value)}
                      />
                    </Td>
                    <Td>
                      <input
                        type="number"
                        step="0.1"
                        className="w-20 bg-transparent text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2E75B6] rounded px-1"
                        value={l.grossMM}
                        onChange={(e) => updateLiability(i, 'grossMM', parseFloat(e.target.value) || 0)}
                      />
                    </Td>
                    <Td>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        className="w-16 bg-transparent text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2E75B6] rounded px-1"
                        value={l.probability}
                        onChange={(e) => updateLiability(i, 'probability', parseFloat(e.target.value) || 0)}
                      />
                    </Td>
                    <Td>
                      <input
                        type="number"
                        step="1"
                        className="w-12 bg-transparent text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2E75B6] rounded px-1"
                        value={l.timingYears}
                        onChange={(e) => updateLiability(i, 'timingYears', parseFloat(e.target.value) || 0)}
                      />
                    </Td>
                    <Td className={l.grossMM < 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {liabilityPV(l, discountRate).toFixed(2)}
                    </Td>
                    <Td>
                      <button
                        onClick={() => removeLiability(i)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  )
}

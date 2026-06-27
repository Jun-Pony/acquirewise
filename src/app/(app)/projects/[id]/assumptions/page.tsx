'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Save, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/context/LangContext'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import type { Assumptions } from '@/types'

const DEFAULT_ASSUMPTIONS: Omit<Assumptions, 'id' | 'project_id'> = {
  discount_rate: 0.10,
  fx_rate: 1.36,
  edmonton_diff: -4,
  quality_adj: -2,
  horizon_years: 15,
  wti_price_deck: [74, 76, 78, 79, 80, 80, 80, 80, 80, 80, 81, 81, 81, 81, 82],
  royalty_floor: 0.05,
  royalty_cap: 0.40,
  price_low: 40,
  price_high: 120,
  pdp_risk: 1.0,
  pnp_risk: 0.85,
  pud_risk: 0.60,
  probable_risk: 0.30,
  economic_limit: 5,
}

export default function AssumptionsPage() {
  const { t } = useLang()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [assumptions, setAssumptions] = useState<Omit<Assumptions, 'id' | 'project_id'>>(DEFAULT_ASSUMPTIONS)
  const [assumptionsId, setAssumptionsId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('assumptions')
        .select('*')
        .eq('project_id', id)
        .single()

      if (data) {
        setAssumptionsId(data.id)
        setAssumptions({
          discount_rate: data.discount_rate,
          fx_rate: data.fx_rate,
          edmonton_diff: data.edmonton_diff,
          quality_adj: data.quality_adj,
          horizon_years: data.horizon_years,
          wti_price_deck: Array.isArray(data.wti_price_deck) ? data.wti_price_deck : DEFAULT_ASSUMPTIONS.wti_price_deck,
          royalty_floor: data.royalty_floor,
          royalty_cap: data.royalty_cap,
          price_low: data.price_low,
          price_high: data.price_high,
          pdp_risk: data.pdp_risk,
          pnp_risk: data.pnp_risk,
          pud_risk: data.pud_risk,
          probable_risk: data.probable_risk,
          economic_limit: data.economic_limit,
        })
      }
    }
    load()
  }, [id])

  const update = (field: string, value: number) => {
    setAssumptions((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const updateDeck = (index: number, value: number) => {
    setAssumptions((prev) => {
      const deck = [...prev.wti_price_deck]
      deck[index] = value
      return { ...prev, wti_price_deck: deck }
    })
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = { ...assumptions, project_id: id }

    if (assumptionsId) {
      await supabase.from('assumptions').update(payload).eq('id', assumptionsId)
    } else {
      const { data } = await supabase
        .from('assumptions')
        .insert(payload)
        .select()
        .single()
      if (data) setAssumptionsId(data.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const numField = (label: string, field: keyof typeof assumptions, suffix?: string) => (
    <Input
      label={label}
      type="number"
      step="any"
      value={String((assumptions as any)[field])}
      onChange={(e) => update(field, parseFloat(e.target.value) || 0)}
      suffix={suffix}
    />
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3864]">{t.assumptions.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Global parameters applied to all models</p>
        </div>
        <Button onClick={handleSave} loading={saving} className="gap-2">
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? t.assumptions.saved : t.assumptions.save}
        </Button>
      </div>

      {/* Core financials */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Parameters</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {numField(t.assumptions.discountRate, 'discount_rate', '%')}
          {numField(t.assumptions.fxRate, 'fx_rate', 'CAD/USD')}
          {numField(t.assumptions.edmontonDiff, 'edmonton_diff', 'USD/bbl')}
          {numField(t.assumptions.qualityAdj, 'quality_adj', 'CAD/bbl')}
          {numField(t.assumptions.horizonYears, 'horizon_years', 'yr')}
          {numField(t.assumptions.economicLimit, 'economic_limit', 'boe/d')}
        </div>
      </Card>

      {/* Royalty */}
      <Card>
        <CardHeader>
          <CardTitle>Alberta MRF Royalty</CardTitle>
          <CardSubtitle>Linear interpolation between floor and cap based on price</CardSubtitle>
        </CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {numField(t.assumptions.royaltyFloor, 'royalty_floor', '%')}
          {numField(t.assumptions.royaltyCap, 'royalty_cap', '%')}
          {numField(t.assumptions.priceLow, 'price_low', 'USD')}
          {numField(t.assumptions.priceHigh, 'price_high', 'USD')}
        </div>
      </Card>

      {/* Risk factors */}
      <Card>
        <CardHeader>
          <CardTitle>Reserve Risk Factors</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {numField('PDP Risk', 'pdp_risk')}
          {numField('P+NP Risk', 'pnp_risk')}
          {numField('PUD Risk', 'pud_risk')}
          {numField('Probable Risk', 'probable_risk')}
        </div>
      </Card>

      {/* WTI Price deck */}
      <Card>
        <CardHeader>
          <CardTitle>{t.assumptions.wtiPriceDeck}</CardTitle>
          <CardSubtitle>15-year WTI forward price curve (USD/bbl)</CardSubtitle>
        </CardHeader>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {assumptions.wti_price_deck.map((price, i) => (
            <Input
              key={i}
              label={`Yr ${i + 1}`}
              type="number"
              step="0.5"
              value={String(price)}
              onChange={(e) => updateDeck(i, parseFloat(e.target.value) || 0)}
              suffix="$"
            />
          ))}
        </div>
      </Card>
    </div>
  )
}

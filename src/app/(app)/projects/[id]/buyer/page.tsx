'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/context/LangContext'
import { Card, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { computeBuyerStrategy } from '@/lib/models/buyer'
import { fmtMM, fmtPct } from '@/lib/utils'
import type { BuyerStrategyResult } from '@/types'

export default function BuyerPage() {
  const { t } = useLang()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [baseLANAV, setBaseLANAV] = useState(87.2)
  const [upsideLANAV, setUpsideLANAV] = useState(112.0)
  const [downsideLANAV, setDownsideLANAV] = useState(68.0)
  const [nBidders, setNBidders] = useState(4)
  const [hurdleReturn, setHurdleReturn] = useState(0.15)
  const [sellerBATNA, setSellerBATNA] = useState(55.0)
  const [sellerPower, setSellerPower] = useState(0.5)

  const result: BuyerStrategyResult = useMemo(
    () =>
      computeBuyerStrategy(
        baseLANAV,
        upsideLANAV,
        downsideLANAV,
        nBidders,
        hurdleReturn,
        sellerBATNA,
        sellerPower
      ),
    [baseLANAV, upsideLANAV, downsideLANAV, nBidders, hurdleReturn, sellerBATNA, sellerPower]
  )

  const rivalChartData = result.rivalSensitivity.map((r) => ({
    n: r.n,
    'Walk-Away': parseFloat(r.walkAway.toFixed(2)),
    'Sealed Bid': parseFloat(r.sealedBid.toFixed(2)),
    'Curse Adj': parseFloat(r.curseAdj.toFixed(3)),
  }))

  const metricCard = (label: string, value: string, subtext?: string, highlight?: boolean) => (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-[#2E75B6] text-white' : 'bg-gray-50'}`}>
      <p className={`text-xs font-medium mb-1 ${highlight ? 'text-white/70' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-white' : 'text-[#1F3864]'}`}>{value}</p>
      {subtext && <p className={`text-xs mt-0.5 ${highlight ? 'text-white/60' : 'text-gray-400'}`}>{subtext}</p>}
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F3864]">{t.buyer.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t.buyer.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Input
              label={t.buyer.baseLANAV}
              type="number"
              step="0.1"
              value={String(baseLANAV)}
              onChange={(e) => setBaseLANAV(parseFloat(e.target.value) || 0)}
              suffix="C$MM"
            />
            <Input
              label={t.buyer.upsideLANAV}
              type="number"
              step="0.1"
              value={String(upsideLANAV)}
              onChange={(e) => setUpsideLANAV(parseFloat(e.target.value) || 0)}
              suffix="C$MM"
            />
            <Input
              label={t.buyer.downsideLANAV}
              type="number"
              step="0.1"
              value={String(downsideLANAV)}
              onChange={(e) => setDownsideLANAV(parseFloat(e.target.value) || 0)}
              suffix="C$MM"
            />
            <Input
              label={t.buyer.nBidders}
              type="number"
              step="1"
              min="1"
              value={String(nBidders)}
              onChange={(e) => setNBidders(parseInt(e.target.value) || 2)}
            />
            <Input
              label={t.buyer.hurdleReturn}
              type="number"
              step="0.01"
              value={String(hurdleReturn)}
              onChange={(e) => setHurdleReturn(parseFloat(e.target.value) || 0)}
              suffix="%"
            />
            <Input
              label={t.buyer.sellerBATNA}
              type="number"
              step="0.5"
              value={String(sellerBATNA)}
              onChange={(e) => setSellerBATNA(parseFloat(e.target.value) || 0)}
              suffix="C$MM"
            />
            <Input
              label={t.buyer.sellerPower}
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={String(sellerPower)}
              onChange={(e) => setSellerPower(parseFloat(e.target.value) || 0)}
            />
          </div>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {metricCard(t.buyer.curseAdj, result.curseAdj.toFixed(4))}
            {metricCard(t.buyer.walkAway, fmtMM(result.walkAway))}
            {metricCard(t.buyer.sealedBid, fmtMM(result.sealedBid))}
            {metricCard(t.buyer.hurdleCap, fmtMM(result.hurdleCap))}
            {metricCard(t.buyer.finalBid, fmtMM(result.finalBid), 'min(sealed, hurdle)', true)}
            {metricCard(t.buyer.nashPrice, fmtMM(result.nashPrice))}
          </div>

          {/* ZOPA */}
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">{t.buyer.zopaExists}:</span>
              <Badge variant={result.zopaExists ? 'green' : 'red'}>
                {result.zopaExists ? t.buyer.yes : t.buyer.no}
              </Badge>
              {result.zopaExists && (
                <span className="text-sm text-gray-500">
                  ZOPA: C${sellerBATNA.toFixed(1)}MM — C${baseLANAV.toFixed(1)}MM
                </span>
              )}
            </div>
          </Card>

          {/* Rival sensitivity chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t.buyer.rivalSensitivity}</CardTitle>
              <CardSubtitle>How bid price changes with number of competitors</CardSubtitle>
            </CardHeader>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={rivalChartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="n" label={{ value: 'Bidders', position: 'insideBottom', offset: -2, fontSize: 11 }} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`C$${v.toFixed(1)}MM`]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={sellerBATNA} stroke="#999" strokeDasharray="4 2" label={{ value: "Seller BATNA", fontSize: 10 }} />
                <Line type="monotone" dataKey="Walk-Away" stroke="#2E75B6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Sealed Bid" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Rival sensitivity table */}
          <Card padding="none">
            <div className="p-4 border-b border-gray-50">
              <CardTitle className="text-base">{t.buyer.rivalSensitivity}</CardTitle>
            </div>
            <Table>
              <Thead>
                <tr>
                  <Th>N Bidders</Th>
                  <Th>Curse Adj.</Th>
                  <Th>Walk-Away (C$MM)</Th>
                  <Th>Sealed Bid (C$MM)</Th>
                </tr>
              </Thead>
              <Tbody>
                {result.rivalSensitivity.map((r) => (
                  <Tr key={r.n} className={r.n === nBidders ? 'bg-blue-50' : ''}>
                    <Td className="font-medium">
                      {r.n}
                      {r.n === nBidders && <Badge variant="blue" className="ml-2">current</Badge>}
                    </Td>
                    <Td>{r.curseAdj.toFixed(4)}</Td>
                    <Td>{r.walkAway.toFixed(1)}</Td>
                    <Td>{r.sealedBid.toFixed(1)}</Td>
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

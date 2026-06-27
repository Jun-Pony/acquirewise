'use client'

import React, { useState, useMemo } from 'react'
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
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { useLang } from '@/context/LangContext'
import { Card, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table'
import { computeSellerStrategy } from '@/lib/models/seller'
import { fmtMM } from '@/lib/utils'
import type { SellerStrategyResult } from '@/types'

const FORMAT_COLORS = ['#2E75B6', '#F59E0B', '#10B981']

export default function SellerPage() {
  const { t } = useLang()
  const params = useParams()

  const [medianBuyerValue, setMedianBuyerValue] = useState(98.0)
  const [buyerSigma, setBuyerSigma] = useState(0.25)
  const [vdrNoise, setVdrNoise] = useState(0.15)
  const [sellerBATNA, setSellerBATNA] = useState(55.0)
  const [nBidders, setNBidders] = useState(4)

  const result: SellerStrategyResult = useMemo(
    () =>
      computeSellerStrategy(
        medianBuyerValue,
        buyerSigma,
        vdrNoise,
        sellerBATNA,
        nBidders
      ),
    [medianBuyerValue, buyerSigma, vdrNoise, sellerBATNA, nBidders]
  )

  const bestFormat = result.auctionComparison.reduce(
    (best, cur) => (cur.expected > best.expected ? cur : best),
    result.auctionComparison[0]
  )

  // Reserve price vs expected proceeds chart
  const reserveChart = result.reserveVsFormats.map((r) => ({
    reserve: parseFloat(r.reserve.toFixed(1)),
    English: parseFloat(r.english.toFixed(2)),
    'Sealed-Bid': parseFloat(r.sealed.toFixed(2)),
  }))

  const metricCard = (label: string, value: string, highlight?: boolean, sub?: string) => (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-[#2E75B6] text-white' : 'bg-gray-50'}`}>
      <p className={`text-xs font-medium mb-1 ${highlight ? 'text-white/70' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-white' : 'text-[#1F3864]'}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${highlight ? 'text-white/60' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F3864]">{t.seller.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t.seller.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Input
              label={t.seller.medianBuyerValue}
              type="number"
              step="0.5"
              value={String(medianBuyerValue)}
              onChange={(e) => setMedianBuyerValue(parseFloat(e.target.value) || 0)}
              suffix="C$MM"
            />
            <Input
              label={t.seller.buyerSigma}
              type="number"
              step="0.01"
              min="0.01"
              value={String(buyerSigma)}
              onChange={(e) => setBuyerSigma(parseFloat(e.target.value) || 0.1)}
            />
            <Input
              label={t.seller.vdrNoise}
              type="number"
              step="0.01"
              min="0"
              value={String(vdrNoise)}
              onChange={(e) => setVdrNoise(parseFloat(e.target.value) || 0)}
            />
            <Input
              label={t.seller.sellerBATNA}
              type="number"
              step="0.5"
              value={String(sellerBATNA)}
              onChange={(e) => setSellerBATNA(parseFloat(e.target.value) || 0)}
              suffix="C$MM"
            />
            <Input
              label={t.seller.nBidders}
              type="number"
              step="1"
              min="2"
              value={String(nBidders)}
              onChange={(e) => setNBidders(parseInt(e.target.value) || 2)}
            />
          </div>

          {/* Recommendation */}
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-xs font-medium text-green-700 mb-1">Recommended Format</p>
            <p className="font-bold text-green-800">{bestFormat?.format}</p>
            <p className="text-sm text-green-700 mt-0.5">
              Expected: {fmtMM(bestFormat?.expected ?? 0)}
            </p>
          </div>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {metricCard(t.seller.myersonReserve, fmtMM(result.myersonReserve), true, 'Optimal reserve price')}
            {metricCard(t.seller.englishExpected, fmtMM(result.englishExpected))}
            {metricCard(t.seller.sealedExpected, fmtMM(result.sealedExpected))}
          </div>

          {/* Auction format comparison */}
          <Card>
            <CardHeader>
              <CardTitle>{t.seller.auctionComparison}</CardTitle>
            </CardHeader>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={result.auctionComparison}
                margin={{ top: 5, right: 16, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="format" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`C$${v.toFixed(1)}MM`]} />
                <ReferenceLine y={sellerBATNA} stroke="#999" strokeDasharray="4 2" label={{ value: 'BATNA', fontSize: 10 }} />
                <Bar dataKey="expected" name="Expected Proceeds" radius={[4, 4, 0, 0]}>
                  {result.auctionComparison.map((_, i) => (
                    <Cell key={i} fill={FORMAT_COLORS[i % FORMAT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Reserve price vs expected chart */}
          <Card>
            <CardHeader>
              <CardTitle>Reserve Price vs Expected Proceeds</CardTitle>
              <CardSubtitle>Higher reserve reduces probability of sale but increases conditional expected price</CardSubtitle>
            </CardHeader>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={reserveChart} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="reserve" label={{ value: 'Reserve Price (C$MM)', position: 'insideBottom', offset: -2, fontSize: 11 }} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`C$${v.toFixed(1)}MM`]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine x={result.myersonReserve} stroke="#2E75B6" strokeDasharray="4 2" label={{ value: 'Optimal', fontSize: 10 }} />
                <Line type="monotone" dataKey="English" stroke="#2E75B6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Sealed-Bid" stroke="#F59E0B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Format comparison table */}
          <Card padding="none">
            <div className="p-4 border-b border-gray-50">
              <CardTitle className="text-base">{t.seller.auctionComparison}</CardTitle>
            </div>
            <Table>
              <Thead>
                <tr>
                  <Th>{t.seller.format}</Th>
                  <Th>{t.seller.expected}</Th>
                  <Th>vs BATNA</Th>
                  <Th>Status</Th>
                </tr>
              </Thead>
              <Tbody>
                {result.auctionComparison.map((item, i) => (
                  <Tr key={item.format}>
                    <Td className="font-medium">{item.format}</Td>
                    <Td className="font-bold">{fmtMM(item.expected)}</Td>
                    <Td className={item.expected > sellerBATNA ? 'text-green-600' : 'text-red-600'}>
                      {item.expected > sellerBATNA ? '+' : ''}{fmtMM(item.expected - sellerBATNA)}
                    </Td>
                    <Td>
                      {item.format === bestFormat?.format ? (
                        <Badge variant="green">Best</Badge>
                      ) : (
                        <Badge variant="gray">—</Badge>
                      )}
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

import type { SellerStrategyResult } from '@/types'
import { blomOrderStat } from './buyer'

// ─── Error function approximation ────────────────────────────────────────────

export function erf(x: number): number {
  // Abramowitz & Stegun approximation 7.1.26
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const poly =
    t * (0.254829592 +
      t * (-0.284496736 +
        t * (1.421413741 +
          t * (-1.453152027 +
            t * 1.061405429))))
  const result = 1 - poly * Math.exp(-(x * x))
  return x >= 0 ? result : -result
}

// ─── Lognormal CDF ───────────────────────────────────────────────────────────

export function lognormalCDF(x: number, median: number, sigma: number): number {
  if (x <= 0) return 0
  const mu = Math.log(median)
  return 0.5 * (1 + erf((Math.log(x) - mu) / (sigma * Math.sqrt(2))))
}

// ─── Lognormal PDF ───────────────────────────────────────────────────────────

export function lognormalPDF(x: number, median: number, sigma: number): number {
  if (x <= 0) return 0
  const mu = Math.log(median)
  return (
    Math.exp(-((Math.log(x) - mu) ** 2) / (2 * sigma ** 2)) /
    (x * sigma * Math.sqrt(2 * Math.PI))
  )
}

// ─── Myerson virtual value ────────────────────────────────────────────────────

export function virtualValue(r: number, median: number, sigma: number): number {
  const F = lognormalCDF(r, median, sigma)
  const f = lognormalPDF(r, median, sigma)
  if (f === 0) return r
  return r - (1 - F) / f
}

// ─── Optimal reserve price (Myerson) — 50 steps ──────────────────────────────

export function myersonReserve(
  batna: number,
  median: number,
  sigma: number,
  steps = 50
): number {
  const high = median * 2
  if (high <= batna) return batna
  const stepSize = (high - batna) / (steps - 1)
  for (let i = 0; i < steps; i++) {
    const r = batna + i * stepSize
    if (virtualValue(r, median, sigma) >= batna) return r
  }
  return high
}

// ─── Curse adjustment for seller side ────────────────────────────────────────

export function sellerCurseAdj(noise: number, n: number): number {
  if (n <= 0) return 1
  const exponent = -0.5 * noise ** 2 + noise * blomOrderStat(n)
  return 1 / Math.exp(exponent)
}

// ─── English auction expected proceeds ───────────────────────────────────────

export function englishExpected(
  medianV: number,
  sigma: number,
  noise: number,
  n: number
): number {
  if (n < 2) return medianV
  const adj = sellerCurseAdj(noise, n)
  // 2nd order statistic: use n-1 bidders for the second-highest
  return medianV * Math.exp(sigma * blomOrderStat(n - 1)) * adj
}

// ─── Sealed-bid auction expected proceeds ────────────────────────────────────

export function sealedExpected(
  medianV: number,
  sigma: number,
  noise: number,
  n: number
): number {
  if (n < 2) return medianV
  return englishExpected(medianV, sigma, noise, n) * (n - 1) / n
}

// ─── Main seller strategy ─────────────────────────────────────────────────────

export function computeSellerStrategy(
  medianBuyerValue: number,
  buyerSigma: number,
  vdrNoise: number,
  sellerBATNA: number,
  nBidders = 4
): SellerStrategyResult {
  const optReserve = myersonReserve(sellerBATNA, medianBuyerValue, buyerSigma)
  const engExp = englishExpected(medianBuyerValue, buyerSigma, vdrNoise, nBidders)
  const sealedExp = sealedExpected(medianBuyerValue, buyerSigma, vdrNoise, nBidders)

  const auctionComparison = [
    {
      format: 'English (Open Ascending)',
      expected: engExp,
      advantage: engExp - sealedExp,
    },
    {
      format: 'Sealed-Bid (First-Price)',
      expected: sealedExp,
      advantage: sealedExp - engExp,
    },
    {
      format: 'Negotiated (Nash)',
      expected: sellerBATNA + 0.5 * (medianBuyerValue - sellerBATNA),
      advantage: 0,
    },
  ]

  // Reserve vs format comparison across reserve prices
  const reserveRange = Array.from({ length: 10 }, (_, i) =>
    sellerBATNA + (i / 9) * (medianBuyerValue - sellerBATNA)
  )
  const reserveVsFormats = reserveRange.map((reserve) => ({
    reserve,
    english: engExp * (1 - lognormalCDF(reserve, medianBuyerValue, buyerSigma)),
    sealed: sealedExp * (1 - lognormalCDF(reserve, medianBuyerValue, buyerSigma)),
  }))

  return {
    myersonReserve: optReserve,
    englishExpected: engExp,
    sealedExpected: sealedExp,
    auctionComparison,
    reserveVsFormats,
  }
}

import type { BuyerStrategyResult } from '@/types'

// ─── Normal distribution inverse (Beasley-Springer-Moro approximation) ───────

export function normInv(p: number): number {
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity

  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.38357751867269e2,
    -3.066479806614716e1,
    2.506628277459239,
  ]
  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1,
  ]
  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838,
    -2.549732539343734,
    4.374664141464968,
    2.938163982698783,
  ]
  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996,
    3.754408661907416,
  ]

  const pLow = 0.02425
  const pHigh = 1 - pLow

  let q: number, r: number

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p))
    const num = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
    const den = ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    return num / den
  } else if (p <= pHigh) {
    q = p - 0.5
    r = q * q
    const num = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q
    const den = (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    return num / den
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p))
    const num = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
    const den = ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    return -(num / den)
  }
}

// ─── Blom order statistic approximation ─────────────────────────────────────

export function blomOrderStat(n: number): number {
  if (n <= 0) return 0
  return normInv((n - 0.375) / (n + 0.25))
}

// ─── Winner's curse adjustment ───────────────────────────────────────────────

export function winnerCurseAdj(
  upsideLANAV: number,
  downsideLANAV: number,
  nBidders: number
): number {
  if (upsideLANAV <= 0 || downsideLANAV <= 0) return 1
  const sigma = (Math.log(upsideLANAV) - Math.log(downsideLANAV)) / (2 * 1.281552)
  const eMaxZ = blomOrderStat(nBidders)
  const exponent = -0.5 * sigma * sigma + sigma * eMaxZ
  return 1 / Math.exp(exponent)
}

// ─── Main buyer strategy ─────────────────────────────────────────────────────

export function computeBuyerStrategy(
  baseLANAV: number,
  upsideLANAV: number,
  downsideLANAV: number,
  nBidders: number,
  hurdleReturn: number,
  sellerBATNA: number,
  sellerPower: number
): BuyerStrategyResult {
  const curseAdj = winnerCurseAdj(upsideLANAV, downsideLANAV, nBidders)
  const walkAway = baseLANAV * curseAdj
  const sealedBid = nBidders > 1 ? walkAway * (nBidders - 1) / nBidders : walkAway
  const hurdleCap = hurdleReturn > -1 ? baseLANAV / (1 + hurdleReturn) : baseLANAV
  const finalBid = Math.min(sealedBid, hurdleCap)
  const nashPrice = sellerBATNA + sellerPower * (baseLANAV - sellerBATNA)
  const zopaExists = baseLANAV > sellerBATNA

  const rivalNs = [2, 3, 4, 5, 6, 8]
  const rivalSensitivity = rivalNs.map((n) => {
    const adj = winnerCurseAdj(upsideLANAV, downsideLANAV, n)
    const wa = baseLANAV * adj
    const sb = n > 1 ? wa * (n - 1) / n : wa
    return { n, curseAdj: adj, walkAway: wa, sealedBid: sb }
  })

  return {
    curseAdj,
    walkAway,
    sealedBid,
    hurdleCap,
    finalBid,
    nashPrice,
    zopaExists,
    rivalSensitivity,
  }
}

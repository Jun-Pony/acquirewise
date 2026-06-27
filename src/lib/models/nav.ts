import type { ReserveCategory, NAVAssumptions, NAVResult, YearlyFlow } from '@/types'

// ─── Core formula helpers ────────────────────────────────────────────────────

/** Arps hyperbolic decline: rate at mid-year n+0.5 */
export function arpsRate(qi: number, Di: number, b: number, n: number): number {
  if (b === 0) {
    // Exponential limit
    return qi * Math.exp(-Di * (n + 0.5))
  }
  return qi / Math.pow(1 + b * Di * (n + 0.5), 1 / b)
}

/** Alberta MRF royalty proxy — linear interpolation between floor and cap */
export function royaltyRate(
  price: number,
  floor: number,
  cap: number,
  pLow: number,
  pHigh: number
): number {
  if (pHigh <= pLow) return floor
  const raw = floor + ((price - pLow) / (pHigh - pLow)) * (cap - floor)
  return Math.min(cap, Math.max(floor, raw))
}

/** Mid-year discount factor: 1/(1+r)^(n+0.5) */
export function discountFactor(r: number, n: number): number {
  return 1 / Math.pow(1 + r, n + 0.5)
}

// ─── Main computation ────────────────────────────────────────────────────────

export function computeNAV(
  categories: ReserveCategory[],
  assumptions: NAVAssumptions
): NAVResult {
  const {
    discountRate,
    fx,
    edmontonDiff,
    qualityAdj,
    wtiPriceDeck,
    royaltyFloor,
    royaltyCap,
    priceLow,
    priceHigh,
    horizonYears,
    economicLimit,
  } = assumptions

  const results: NAVResult['categories'] = categories.map((cat) => {
    const yearlyFlows: YearlyFlow[] = []
    let nav10 = 0
    let grossNAV = 0

    // ARO present value: discounted at full year timing (not mid-year)
    const aroPV =
      cat.aroUndiscounted > 0
        ? cat.aroUndiscounted / Math.pow(1 + discountRate, cat.aroTiming)
        : 0

    for (let n = 0; n < horizonYears; n++) {
      const wtiPrice = wtiPriceDeck[n] ?? wtiPriceDeck[wtiPriceDeck.length - 1]

      // Edmonton price in CAD/bbl
      const edmPrice = (wtiPrice + edmontonDiff) * fx + qualityAdj

      // Mid-year production rate (boe/d)
      const rate = arpsRate(cat.qi, cat.Di, cat.b, n)

      // Economic limit check
      if (rate < economicLimit) {
        break
      }

      // Annual production (boe)
      const annualProd = rate * 365

      // Royalty
      const royalty = royaltyRate(edmPrice, royaltyFloor, royaltyCap, priceLow, priceHigh)

      // Revenue (C$MM)
      const grossRevenue = (annualProd * edmPrice) / 1_000_000
      const royaltyCost = grossRevenue * royalty
      const netRevenue = grossRevenue - royaltyCost

      // Opex (C$MM)
      const varOpexCost = (annualProd * cat.varOpex) / 1_000_000
      const fixedOpexCost = cat.fixedOpex

      // Capex: year 1 only
      const capex = n === 0 ? cat.capexYr1 : 0

      // Net cash flow (C$MM)
      const netCF = netRevenue - varOpexCost - fixedOpexCost - capex

      // Mid-year discounting
      const df = discountFactor(discountRate, n)
      const pvCF = netCF * df

      yearlyFlows.push({
        year: n + 1,
        rate,
        grossRevenue,
        royalty: royaltyCost,
        netRevenue,
        varOpex: varOpexCost,
        fixedOpex: fixedOpexCost,
        capex,
        netCF,
        df,
        pvCF,
      })

      grossNAV += netCF
      nav10 += pvCF
    }

    // Subtract ARO PV
    const nav10Net = nav10 - aroPV
    const riskedNAV = nav10Net * cat.riskFactor

    return {
      name: cat.name,
      yearlyFlows,
      grossNAV,
      nav10: nav10Net,
      riskedNAV,
      aroPV,
    }
  })

  const totalRiskedNAV = results.reduce((s, c) => s + c.riskedNAV, 0)
  const totalNAV10 = results.reduce((s, c) => s + c.nav10, 0)
  const totalAroPV = results.reduce((s, c) => s + c.aroPV, 0)

  return { categories: results, totalRiskedNAV, totalNAV10, totalAroPV }
}

// ─── Default inputs ──────────────────────────────────────────────────────────

export const DEFAULT_RESERVE_CATEGORIES: ReserveCategory[] = [
  {
    name: 'PDP',
    qi: 1400,
    Di: 0.28,
    b: 0.9,
    capexYr1: 0,
    riskFactor: 1.0,
    varOpex: 15.5,
    fixedOpex: 1.2,
    aroUndiscounted: 22,
    aroTiming: 12,
  },
  {
    name: 'PUD',
    qi: 600,
    Di: 0.35,
    b: 0.8,
    capexYr1: 8.0,
    riskFactor: 0.6,
    varOpex: 15.5,
    fixedOpex: 0.6,
    aroUndiscounted: 8,
    aroTiming: 15,
  },
  {
    name: 'Probable',
    qi: 300,
    Di: 0.40,
    b: 0.7,
    capexYr1: 5.0,
    riskFactor: 0.3,
    varOpex: 16.0,
    fixedOpex: 0.4,
    aroUndiscounted: 4,
    aroTiming: 15,
  },
]

export const DEFAULT_NAV_ASSUMPTIONS: NAVAssumptions = {
  discountRate: 0.10,
  fx: 1.36,
  edmontonDiff: -4,
  qualityAdj: -2,
  wtiPriceDeck: [74, 76, 78, 79, 80, 80, 80, 80, 80, 80, 81, 81, 81, 81, 82],
  royaltyFloor: 0.05,
  royaltyCap: 0.40,
  priceLow: 40,
  priceHigh: 120,
  horizonYears: 15,
  economicLimit: 5,
}

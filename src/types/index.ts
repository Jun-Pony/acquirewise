// ─── Project & Auth ──────────────────────────────────────────────────────────

export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

// ─── Assumptions ─────────────────────────────────────────────────────────────

export interface Assumptions {
  id?: string
  project_id: string
  discount_rate: number
  fx_rate: number
  edmonton_diff: number
  quality_adj: number
  horizon_years: number
  wti_price_deck: number[]
  royalty_floor: number
  royalty_cap: number
  price_low: number
  price_high: number
  pdp_risk: number
  pnp_risk: number
  pud_risk: number
  probable_risk: number
  economic_limit: number
}

// ─── Targets ─────────────────────────────────────────────────────────────────

export interface Target {
  id: string
  project_id: string
  label: string
  name?: string
  asking_price_mm: number
  strategic_fit: number
  sort_order: number
}

// ─── NAV ─────────────────────────────────────────────────────────────────────

export type ReserveCategoryName = 'PDP' | 'PUD' | 'Probable'

export interface ReserveCategory {
  name: ReserveCategoryName
  qi: number          // boe/d initial rate
  Di: number          // /yr nominal decline
  b: number           // hyperbolic exponent
  capexYr1: number    // C$MM, year-1 only
  riskFactor: number  // PDP=1.0, PUD=0.6, Probable=0.3
  varOpex: number     // CAD/boe
  fixedOpex: number   // C$MM/yr
  aroUndiscounted: number  // C$MM
  aroTiming: number        // years
}

export interface NAVAssumptions {
  discountRate: number
  fx: number
  edmontonDiff: number
  qualityAdj: number
  wtiPriceDeck: number[]
  royaltyFloor: number
  royaltyCap: number
  priceLow: number
  priceHigh: number
  horizonYears: number
  economicLimit: number
}

export interface YearlyFlow {
  year: number
  rate: number          // boe/d
  grossRevenue: number  // C$MM
  royalty: number       // C$MM
  netRevenue: number    // C$MM
  varOpex: number       // C$MM
  fixedOpex: number     // C$MM
  capex: number         // C$MM
  netCF: number         // C$MM
  df: number            // discount factor
  pvCF: number          // C$MM PV
}

export interface NAVResult {
  categories: {
    name: ReserveCategoryName
    yearlyFlows: YearlyFlow[]
    grossNAV: number    // C$MM undiscounted
    nav10: number       // C$MM discounted at r
    riskedNAV: number   // C$MM after risk factor
    aroPV: number       // C$MM ARO present value
  }[]
  totalRiskedNAV: number
  totalNAV10: number
  totalAroPV: number
}

// ─── LANAV ───────────────────────────────────────────────────────────────────

export interface LiabilityItem {
  id: string
  name: string
  grossMM: number
  probability: number
  timingYears: number
  confirmed?: boolean
}

export type GateStatus = 'PASS' | 'WATCH' | 'BLOCK'

export interface LANAVResult {
  lanav: number
  totalLiabPV: number
  lanaVRatio: number
  liabDrag: number
  gate: GateStatus
}

// ─── Scenarios ───────────────────────────────────────────────────────────────

export interface ScenarioMultipliers {
  priceMult: number
  prodMult: number
  opexMult: number
  liabilityMult: number
  declineAdj: number
}

export interface ScenarioResult {
  scenario: 'base' | 'downside' | 'upside'
  nav: number
  lanav: number
  gate: GateStatus
  yearlyFlows: YearlyFlow[]
}

// ─── MCDA / TOPSIS ───────────────────────────────────────────────────────────

export interface MCDAWeights {
  screeningValue: number
  pdpShare: number
  aroRatio: number
  strategicFit: number
}

export interface MCDATarget {
  id: string
  name: string
  screeningValue: number
  pdpShare: number
  aroRatio: number
  strategicFit: number
  askingPriceMM: number
}

export interface MCDAResult {
  id: string
  name: string
  score: number
  rank: number
  normalizedValues: {
    screeningValue: number
    pdpShare: number
    aroRatio: number
    strategicFit: number
  }
  distancePlus: number
  distanceMinus: number
}

// ─── Buyer Strategy ──────────────────────────────────────────────────────────

export interface BuyerStrategyResult {
  curseAdj: number
  walkAway: number
  sealedBid: number
  hurdleCap: number
  finalBid: number
  nashPrice: number
  zopaExists: boolean
  rivalSensitivity: {
    n: number
    curseAdj: number
    walkAway: number
    sealedBid: number
  }[]
}

// ─── Seller Strategy ─────────────────────────────────────────────────────────

export interface SellerStrategyResult {
  myersonReserve: number
  englishExpected: number
  sealedExpected: number
  auctionComparison: {
    format: string
    expected: number
    advantage: number
  }[]
  reserveVsFormats: {
    reserve: number
    english: number
    sealed: number
  }[]
}

// ─── i18n ────────────────────────────────────────────────────────────────────

export type Lang = 'zh' | 'en'

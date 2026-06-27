import type { ReserveCategory, NAVAssumptions, ScenarioMultipliers, ScenarioResult, GateStatus } from '@/types'
import { computeNAV } from './nav'
import { computeLANAV } from './lanav'
import type { LiabilityItem } from '@/types'

// ─── Apply multipliers and recompute NAV ─────────────────────────────────────

export function computeScenarioNAV(
  baseCategories: ReserveCategory[],
  baseLiabilities: LiabilityItem[],
  askingPrice: number,
  multipliers: ScenarioMultipliers,
  assumptions: NAVAssumptions,
  scenarioLabel: 'base' | 'downside' | 'upside'
): ScenarioResult {
  // Adjust categories
  const adjustedCategories: ReserveCategory[] = baseCategories.map((cat) => ({
    ...cat,
    qi: cat.qi * multipliers.prodMult,
    Di: Math.max(0.01, cat.Di + multipliers.declineAdj),
    varOpex: cat.varOpex * multipliers.opexMult,
    fixedOpex: cat.fixedOpex * multipliers.opexMult,
  }))

  // Adjust price deck
  const adjustedAssumptions: NAVAssumptions = {
    ...assumptions,
    wtiPriceDeck: assumptions.wtiPriceDeck.map((p) => p * multipliers.priceMult),
  }

  // Adjust liabilities
  const adjustedLiabilities: LiabilityItem[] = baseLiabilities.map((l) => ({
    ...l,
    grossMM: l.grossMM * multipliers.liabilityMult,
  }))

  const navResult = computeNAV(adjustedCategories, adjustedAssumptions)
  const lanavResult = computeLANAV(
    navResult.totalRiskedNAV,
    askingPrice,
    adjustedLiabilities,
    assumptions.discountRate
  )

  // Flatten yearly flows from first category for charting
  const yearlyFlows = navResult.categories[0]?.yearlyFlows ?? []

  return {
    scenario: scenarioLabel,
    nav: navResult.totalRiskedNAV,
    lanav: lanavResult.lanav,
    gate: lanavResult.gate,
    yearlyFlows,
  }
}

// ─── Default scenario multipliers ────────────────────────────────────────────

export const DEFAULT_SCENARIO_MULTIPLIERS: Record<string, ScenarioMultipliers> = {
  base: {
    priceMult: 1.0,
    prodMult: 1.0,
    opexMult: 1.0,
    liabilityMult: 1.0,
    declineAdj: 0.0,
  },
  downside: {
    priceMult: 0.80,
    prodMult: 0.85,
    opexMult: 1.15,
    liabilityMult: 1.25,
    declineAdj: 0.05,
  },
  upside: {
    priceMult: 1.20,
    prodMult: 1.15,
    opexMult: 0.90,
    liabilityMult: 0.80,
    declineAdj: -0.05,
  },
}

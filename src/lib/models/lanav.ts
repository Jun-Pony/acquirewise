import type { LiabilityItem, LANAVResult, GateStatus } from '@/types'

// ─── Liability PV ────────────────────────────────────────────────────────────

export function liabilityPV(item: LiabilityItem, r: number): number {
  if (item.timingYears <= 0) return item.grossMM * item.probability
  return (item.grossMM * item.probability) / Math.pow(1 + r, item.timingYears)
}

// ─── Main computation ────────────────────────────────────────────────────────

export function computeLANAV(
  riskedNAV: number,
  askingPrice: number,
  liabilities: LiabilityItem[],
  r: number
): LANAVResult {
  const totalLiabPV = liabilities.reduce((sum, l) => sum + liabilityPV(l, r), 0)
  const lanav = riskedNAV - totalLiabPV
  const lanaVRatio = askingPrice > 0 ? lanav / askingPrice : 0
  const liabDrag = riskedNAV > 0.001 ? totalLiabPV / riskedNAV : 0

  let gate: GateStatus
  if (lanaVRatio >= 1.10) {
    gate = 'PASS'
  } else if (lanaVRatio >= 0.90) {
    gate = 'WATCH'
  } else {
    gate = 'BLOCK'
  }

  return { lanav, totalLiabPV, lanaVRatio, liabDrag, gate }
}

// ─── Default liability items ─────────────────────────────────────────────────

let _id = 0
function lid() {
  return `default-${++_id}`
}

export const DEFAULT_LIABILITY_ITEMS: LiabilityItem[] = [
  { id: lid(), name: 'Well ARO gap', grossMM: 4.5, probability: 0.80, timingYears: 8 },
  { id: lid(), name: 'Facility decommissioning', grossMM: 3.0, probability: 0.70, timingYears: 10 },
  { id: lid(), name: 'Pipeline abandonment', grossMM: 2.0, probability: 0.60, timingYears: 10 },
  { id: lid(), name: 'Reclamation/remediation', grossMM: 2.5, probability: 0.50, timingYears: 7 },
  { id: lid(), name: 'Surface lease/rentals', grossMM: 0.8, probability: 0.75, timingYears: 3 },
  { id: lid(), name: 'License transfer/security', grossMM: 3.5, probability: 0.45, timingYears: 1 },
  { id: lid(), name: 'Closure quota/orphan levy', grossMM: 1.2, probability: 0.65, timingYears: 2 },
  { id: lid(), name: 'WI/title leakage', grossMM: 1.5, probability: 0.35, timingYears: 1 },
  { id: lid(), name: 'Royalty/tax true-up', grossMM: 1.0, probability: 0.40, timingYears: 1 },
  { id: lid(), name: 'Integration/transition', grossMM: 1.5, probability: 0.80, timingYears: 1 },
  { id: lid(), name: 'Salvage credit', grossMM: -1.0, probability: 0.50, timingYears: 5 },
]

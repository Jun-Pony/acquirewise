import type { MCDAWeights, MCDATarget, MCDAResult } from '@/types'

// ─── Weight validation ───────────────────────────────────────────────────────

export function validateWeights(w: MCDAWeights): boolean {
  const sum = w.screeningValue + w.pdpShare + w.aroRatio + w.strategicFit
  return Math.abs(sum - 1) <= 0.001
}

// ─── TOPSIS Implementation ───────────────────────────────────────────────────

/**
 * directions: 'benefit' = higher is better, 'cost' = lower is better
 */
export function topsis(
  alternatives: number[][],
  weights: number[],
  directions: ('benefit' | 'cost')[]
): number[] {
  const nAlt = alternatives.length
  const nCrit = weights.length

  if (nAlt === 0) return []

  // Step 1: Normalize by column vector norm
  const colNorms = Array(nCrit).fill(0)
  for (let j = 0; j < nCrit; j++) {
    let sumSq = 0
    for (let i = 0; i < nAlt; i++) {
      sumSq += alternatives[i][j] ** 2
    }
    colNorms[j] = Math.sqrt(sumSq) || 1
  }

  const normalized: number[][] = alternatives.map((row) =>
    row.map((val, j) => val / colNorms[j])
  )

  // Step 2: Weighted normalized matrix
  const weighted: number[][] = normalized.map((row) =>
    row.map((val, j) => val * weights[j])
  )

  // Step 3: Ideal (A+) and anti-ideal (A-)
  const idealPlus = Array(nCrit).fill(0)
  const idealMinus = Array(nCrit).fill(0)

  for (let j = 0; j < nCrit; j++) {
    const colVals = weighted.map((row) => row[j])
    if (directions[j] === 'benefit') {
      idealPlus[j] = Math.max(...colVals)
      idealMinus[j] = Math.min(...colVals)
    } else {
      idealPlus[j] = Math.min(...colVals)
      idealMinus[j] = Math.max(...colVals)
    }
  }

  // Step 4: Euclidean distances D+ and D-
  const dPlus = weighted.map((row) =>
    Math.sqrt(row.reduce((sum, val, j) => sum + (val - idealPlus[j]) ** 2, 0))
  )
  const dMinus = weighted.map((row) =>
    Math.sqrt(row.reduce((sum, val, j) => sum + (val - idealMinus[j]) ** 2, 0))
  )

  // Step 5: Score = D- / (D+ + D-)
  return dPlus.map((dp, i) => {
    const dm = dMinus[i]
    return dp + dm === 0 ? 0 : dm / (dp + dm)
  })
}

// ─── Main MCDA computation ───────────────────────────────────────────────────

export function computeMCDA(targets: MCDATarget[], weights: MCDAWeights): MCDAResult[] {
  if (targets.length === 0) return []

  const matrix = targets.map((t) => [
    t.screeningValue,
    t.pdpShare,
    t.aroRatio,
    t.strategicFit,
  ])

  const w = [weights.screeningValue, weights.pdpShare, weights.aroRatio, weights.strategicFit]
  const directions: ('benefit' | 'cost')[] = ['benefit', 'benefit', 'cost', 'benefit']

  const scores = topsis(matrix, w, directions)

  // Build results with details
  const nAlt = targets.length
  const nCrit = 4

  const colNorms = Array(nCrit).fill(0)
  for (let j = 0; j < nCrit; j++) {
    let sumSq = 0
    for (let i = 0; i < nAlt; i++) {
      sumSq += matrix[i][j] ** 2
    }
    colNorms[j] = Math.sqrt(sumSq) || 1
  }

  const results: MCDAResult[] = targets.map((t, i) => ({
    id: t.id,
    name: t.name,
    score: scores[i],
    rank: 0,
    normalizedValues: {
      screeningValue: matrix[i][0] / colNorms[0],
      pdpShare: matrix[i][1] / colNorms[1],
      aroRatio: matrix[i][2] / colNorms[2],
      strategicFit: matrix[i][3] / colNorms[3],
    },
    distancePlus: 0,
    distanceMinus: 0,
  }))

  // Sort and assign ranks
  const sorted = [...results].sort((a, b) => b.score - a.score)
  sorted.forEach((r, idx) => {
    r.rank = idx + 1
  })

  return results
}

// ─── Default weights ─────────────────────────────────────────────────────────

export const DEFAULT_MCDA_WEIGHTS: MCDAWeights = {
  screeningValue: 0.454,
  pdpShare: 0.262,
  aroRatio: 0.156,
  strategicFit: 0.128,
}

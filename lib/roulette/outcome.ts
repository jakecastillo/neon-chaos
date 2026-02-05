import type { ChaosModifier } from "@/lib/models"
import { rngFromSeed, weightedPickIndex } from "@/lib/rng/seeded"

export type RouletteOutcomeInput = {
  seed: string
  optionIds: string[]
  voteCountsByOptionId: Record<string, number>
}

export type RouletteOutcome = {
  modifier: ChaosModifier
  winnerOptionId: string
  winnerIndex: number
  weights: number[]
}

const modifiers: ChaosModifier[] = [
  "DoubleDown",
  "Lucky7",
  "SabotageLowSteals",
  "HotStreakNerf"
]

export function computeRouletteOutcome(input: RouletteOutcomeInput): RouletteOutcome {
  const rng = rngFromSeed(input.seed)

  const baseWeights = input.optionIds.map((id) => 1 + (input.voteCountsByOptionId[id] ?? 0))
  const modifier = modifiers[Math.floor(rng() * modifiers.length)] ?? "DoubleDown"

  const weights = applyModifier({ modifier, rng, weights: baseWeights })
  const winnerIndex = weightedPickIndex(rng, weights)
  const winnerOptionId = input.optionIds[winnerIndex] ?? input.optionIds[0]!

  return { modifier, winnerOptionId, winnerIndex, weights }
}

function applyModifier(args: {
  modifier: ChaosModifier
  rng: () => number
  weights: number[]
}) {
  const w = [...args.weights]
  const n = w.length
  if (n === 0) return w

  const max = Math.max(...w)
  const min = Math.min(...w)

  switch (args.modifier) {
    case "DoubleDown": {
      for (let i = 0; i < n; i++) {
        if (w[i] === max) w[i] = w[i] * 2
      }
      return w
    }
    case "Lucky7": {
      const idx = Math.floor(args.rng() * n)
      w[idx] = (w[idx] ?? 0) + 7
      return w
    }
    case "SabotageLowSteals": {
      const lowIndices = w
        .map((v, i) => ({ v, i }))
        .filter((x) => x.v === min)
        .map((x) => x.i)
      const low =
        lowIndices[Math.floor(args.rng() * lowIndices.length)] ??
        lowIndices[0] ??
        0

      let stolen = 0
      for (let i = 0; i < n; i++) {
        if (i === low) continue
        const take = Math.max(0, Math.floor((w[i] ?? 0) * 0.18))
        w[i] = Math.max(1, (w[i] ?? 0) - take)
        stolen += take
      }
      w[low] = (w[low] ?? 0) + Math.max(2, stolen)
      return w
    }
    case "HotStreakNerf": {
      for (let i = 0; i < n; i++) {
        if (w[i] === max) w[i] = Math.max(1, Math.round((w[i] ?? 0) * 0.7))
      }
      return w
    }
  }
}


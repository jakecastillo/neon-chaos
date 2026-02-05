export function xmur3(str: string) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function rngFromSeed(seed: string) {
  const seed32 = xmur3(seed)()
  return mulberry32(seed32)
}

export function weightedPickIndex(rng: () => number, weights: number[]) {
  const total = weights.reduce((a, b) => a + b, 0)
  if (total <= 0) return 0
  let r = rng() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i] ?? 0
    if (r <= 0) return i
  }
  return Math.max(0, weights.length - 1)
}


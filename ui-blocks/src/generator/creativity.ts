// How adventurous the generators are: one setting for the whole app ("temperature").
//   safe      0.1  the best known choice almost every time (the site you would get from a template)
//   balanced  0.5  the usual choices, now and then a new combination
//   wild      0.9  new colours, new headlines, new scene mixes most of the time
// The generators stay seeded (the same prompt, variation and level give the same site); the level only decides how far they may stray.
export type CreativityLevel = 'safe' | 'balanced' | 'wild'

export const CREATIVITY_LEVELS: [CreativityLevel, string][] = [['safe', 'Safe'], ['balanced', 'Balanced'], ['wild', 'Wild']]
const TEMPERATURE: Record<CreativityLevel, number> = { safe: 0.1, balanced: 0.5, wild: 0.9 }
const KEY = 'ui-blocks:creativity'

let level: CreativityLevel = 'balanced'

export const creativityLevel = () => level
export const temperature = () => TEMPERATURE[level]
export function setCreativity(next: CreativityLevel): void {
  level = next
}

export function loadCreativity(): CreativityLevel {
  try {
    const saved = localStorage.getItem(KEY)
    return saved === 'safe' || saved === 'wild' || saved === 'balanced' ? saved : 'balanced'
  } catch {
    return 'balanced'
  }
}
export function saveCreativity(next: CreativityLevel): void {
  try {
    localStorage.setItem(KEY, next)
  } catch {
    // optional
  }
}

/**
 * Chooses from the best few instead of always the best: a softmax over the scores with the temperature as its heat.
 * Temperature 0 (or near) takes the best one; a high temperature gives the second and third best a real chance.
 */
export function sampleTopK<T>(ranked: { item: T; score: number }[], temp: number, rand: () => number): T {
  const sorted = [...ranked].sort((a, b) => b.score - a.score)
  if (sorted.length === 1 || temp < 0.15) return sorted[0].item
  const k = Math.min(sorted.length, 1 + Math.round(temp * 3))
  // never one that is far worse than the best
  const top = sorted.slice(0, k).filter((entry, i) => i === 0 || entry.score >= sorted[0].score - 0.3)
  const heat = Math.max(0.05, temp) * 0.5
  const weights = top.map((entry) => Math.exp((entry.score - top[0].score) / heat))
  const total = weights.reduce((a, b) => a + b, 0)
  let pick = rand() * total
  for (let i = 0; i < top.length; i += 1) {
    pick -= weights[i]
    if (pick <= 0) return top[i].item
  }
  return top[0].item
}

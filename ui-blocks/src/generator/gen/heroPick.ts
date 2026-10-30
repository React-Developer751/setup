// Whether a page gets a generated first screen, and which one. A generated hero is a first screen written from a spec (heroSpec.ts) instead of taken from the stored components.
// It is chosen for some pages, not all: safe creativity never, balanced now and then, wild most of the time, and a request to stand out ("unique", "alag hatke") leans to it.
// A page whose design is a named kit ("obys style"), whose first screen was resized, or a short simple page keeps the stored first screen. The choice only depends on the prompt and the variation,
// so a prompt gives the same page every time, and the id says everything about the hero.
import { archetypeOf } from '../motionBrain'
import { seededRandom } from '../random'
import { decodeId, randomSpec, specId, type HeroMood } from './heroSpec'
import { decodeFeatures, randomFeatures, featuresId } from './featuresSpec'
import { setHeroTaste, type HeroRating } from './heroTaste'

const hash = (text: string) => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 11)

/** the lean of a business type's look: calm places stay quiet, energetic ones are big and loud */
const MOOD_OF: Record<string, HeroMood> = { calm: 'calm', energetic: 'bold', elegant: 'soft', appetite: 'soft', tech: 'dark', playful: 'playful', creative: 'bold', wander: 'soft' }

export type PickInput = {
  prompt: string
  variation: number
  level: 'safe' | 'balanced' | 'wild'
  tier: string
  theme: string
  dark: boolean
  bold: boolean
  /** the first screen is one of a named design's, or was resized by the person: it stays */
  keep: boolean
}

export function pickGenHero(i: PickInput): string | undefined {
  if (i.keep || i.level === 'safe' || i.tier === 'normal') return undefined
  const rand = seededRandom(hash(`${i.prompt.trim().toLowerCase()}|genhero|${i.variation}`))
  const chance = i.level === 'wild' ? 0.7 : 0.4
  if (rand() >= Math.min(0.95, chance + (i.bold ? 0.3 : 0))) return undefined
  const mood: HeroMood = i.bold ? 'bold' : i.dark ? 'dark' : (MOOD_OF[archetypeOf(i.theme)] ?? 'any')
  return specId(randomSpec(rand, mood))
}

/** the ratings of this person (the server's, else this browser's) become the taste of the generator; returns how many ratings there are */
export async function loadHeroTaste(): Promise<number> {
  let rows: HeroRating[] = []
  try {
    const res = await fetch('/api/gen-ratings', { signal: AbortSignal.timeout(4000) })
    if (res.ok) rows = ((await res.json()) as { rows: HeroRating[] }).rows
  } catch {
    // no server
  }
  if (!rows.length) {
    try {
      rows = Object.values(JSON.parse(localStorage.getItem('ui-blocks:gen-ratings') ?? '{}') as Record<string, HeroRating>)
    } catch {
      rows = []
    }
  }
  setHeroTaste(rows, decodeId, 'hero')
  setHeroTaste(rows, decodeFeatures, 'features')
  return rows.length
}

/** the services part: same rules of choice as the first screen (never for safe creativity, a short page or a named design), a little less often */
export function pickGenFeatures(i: PickInput): string | undefined {
  if (i.keep || i.level === 'safe' || i.tier === 'normal') return undefined
  const rand = seededRandom(hash(`${i.prompt.trim().toLowerCase()}|genfeatures|${i.variation}`))
  const chance = i.level === 'wild' ? 0.6 : 0.3
  if (rand() >= Math.min(0.9, chance + (i.bold ? 0.3 : 0))) return undefined
  const mood: HeroMood = i.bold ? 'bold' : i.dark ? 'dark' : (MOOD_OF[archetypeOf(i.theme)] ?? 'any')
  return featuresId(randomFeatures(rand, mood))
}

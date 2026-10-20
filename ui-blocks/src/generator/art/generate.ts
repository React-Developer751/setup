// Many pictures, one shown: a population of genomes is drawn small, the judge (judge.ts) scores each, the best are mixed (crossover) and nudged
// (mutation) for a few generations, and the winner is drawn at full size. Everything is seeded: the same seed gives the same picture.
import type { Img } from './buffer'
import { SCHEMES } from './color'
import { judge, type ArtReport } from './judge'
import { BASES, OVERLAYS, renderGenome, type Base, type Genome, type Overlay } from './render'
import { sampleTopK } from '../creativity'
import { seededRandom } from '../random'

export type ArtOptions = {
  seed: number
  accent: string
  alt?: string
  dark?: boolean
  width: number
  height: number
  population?: number
  generations?: number
  temperature?: number
  prefer?: { base?: Base[]; overlay?: Overlay[] }
}

export type Art = { image: Img; genome: Genome; report: ArtReport; tried: number; rejected: number }

const pick = <T,>(list: readonly T[], rand: () => number) => list[Math.floor(rand() * list.length)]

export function randomGenome(rand: () => number, dark: boolean, prefer?: ArtOptions['prefer']): Genome {
  return {
    seed: 1 + Math.floor(rand() * 1_000_000),
    base: pick(prefer?.base?.length ? prefer.base : BASES, rand),
    overlay: pick(prefer?.overlay?.length ? prefer.overlay : OVERLAYS, rand),
    scheme: pick(SCHEMES, rand),
    scale: 1.5 + rand() * 4.5,
    octaves: 3 + Math.floor(rand() * 4),
    warp: rand() < 0.6 ? rand() : 0,
    contrast: 0.9 + rand() * 0.9,
    view: Math.floor(rand() * 7),
    strokes: 1.5 + rand() * 3.5,
    overlayAlpha: 0.35 + rand() * 0.45,
    dark,
  }
}

export function mutate(g: Genome, rand: () => number): Genome {
  return {
    ...g,
    seed: rand() < 0.4 ? 1 + Math.floor(rand() * 1_000_000) : g.seed,
    scheme: rand() < 0.3 ? pick(SCHEMES, rand) : g.scheme,
    scale: Math.max(1, Math.min(7, g.scale + (rand() - 0.5) * 2)),
    octaves: Math.max(2, Math.min(6, g.octaves + (rand() < 0.3 ? (rand() < 0.5 ? -1 : 1) : 0))),
    warp: Math.max(0, Math.min(1, g.warp + (rand() - 0.5) * 0.5)),
    contrast: Math.max(0.8, Math.min(1.9, g.contrast + (rand() - 0.5) * 0.4)),
    view: rand() < 0.3 ? Math.floor(rand() * 7) : g.view,
    strokes: Math.max(1, Math.min(5.5, g.strokes + (rand() - 0.5))),
    overlayAlpha: Math.max(0.3, Math.min(0.85, g.overlayAlpha + (rand() - 0.5) * 0.2)),
  }
}

export function crossover(a: Genome, b: Genome, rand: () => number): Genome {
  return { ...a, base: rand() < 0.5 ? a.base : b.base, overlay: rand() < 0.5 ? a.overlay : b.overlay, scheme: rand() < 0.5 ? a.scheme : b.scheme, scale: (a.scale + b.scale) / 2, warp: rand() < 0.5 ? a.warp : b.warp, contrast: rand() < 0.5 ? a.contrast : b.contrast, view: rand() < 0.5 ? a.view : b.view, seed: rand() < 0.5 ? a.seed : b.seed }
}

export function makeArt(options: ArtOptions): Art {
  const { seed, accent, alt, dark = false, width, height } = options
  const population = options.population ?? 18
  const generations = options.generations ?? 2
  const temp = options.temperature ?? 0.5
  const rand = seededRandom(seed)
  const smallW = 96
  const smallH = Math.max(32, Math.round((smallW * height) / width))
  let tried = 0
  let rejected = 0
  const evaluate = (g: Genome) => {
    tried += 1
    const report = judge(renderGenome(g, smallW, smallH, accent, alt), accent)
    if (!report.ok) rejected += 1
    return { item: g, score: report.ok ? report.score : 0, ok: report.ok }
  }
  let scored = Array.from({ length: population }, () => evaluate(randomGenome(rand, dark, options.prefer)))
  for (let gen = 0; gen < generations; gen += 1) {
    const parents = [...scored].sort((a, b) => b.score - a.score).slice(0, 4)
    const kids = Array.from({ length: population - 4 }, () => {
      const a = pick(parents, rand).item
      const b = pick(parents, rand).item
      return evaluate(mutate(rand() < 0.5 ? crossover(a, b, rand) : a, rand))
    })
    scored = [...parents, ...kids]
  }
  const good = scored.filter((s) => s.ok)
  const pool = (good.length ? good : scored).map((s) => ({ item: s.item, score: s.score }))
  // the winner: the best at a low temperature, one of the best few at a high one
  const winner = sampleTopK(pool, temp, rand)
  const image = renderGenome(winner, width, height, accent, alt)
  return { image, genome: winner, report: judge(image, accent), tried, rejected }
}

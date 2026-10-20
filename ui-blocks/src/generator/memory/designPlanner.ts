// A new design from what the memory knows: many candidate designs of the prompt are made, each is scored (taste of this person for this kind of
// business, newness of its colour), the colours that were already made are thrown out, and one of the best few is taken.
import { hexToRgb, hslToRgb, rgbToHsl } from '../art/color'
import type { EditOp } from '../edit/edits'
import { sampleTopK } from '../creativity'
import { generateWebsite } from '../generateWebsite'
import { businessKey } from '../edit/imageRatings'
import { analyse, hueGap, hueName, minGapFor, nearestFreeHue, tasteScore, type Candidate, type Insights } from './designMemory'
import { newId, type DesignRecord, type DesignStore } from './designStore'

export type DesignPlan = {
  variation: number
  record: DesignRecord
  insights: Insights
  /** a change of the main colour that makes the colour new (when the design as it is would repeat an old one) */
  ops: EditOp[]
  /** what to tell the person */
  reasons: string[]
  /** how many candidates were made and how many had a colour that was new */
  tried: number
  fresh: number
}

const CANDIDATES = 16

const kindOf = (name: string) => (/evolved/.test(name) ? 'evolved' : / \+ /.test(name) ? 'formula' : 'curated')

/** the features of the design that a prompt and a variation give (the colours, the layout, the first line) */
export function describeDesign(prompt: string, variation: number, creativity: string, group: string): DesignRecord {
  const site = generateWebsite(prompt, variation)
  const hsl = rgbToHsl(hexToRgb(site.palette.light.accent))
  return {
    id: newId(),
    at: new Date().toISOString(),
    key: businessKey(prompt),
    group,
    prompt,
    variation,
    creativity,
    theme: site.themeKey,
    niche: site.niche ?? '',
    paletteName: site.palette.name,
    kind: kindOf(site.palette.name),
    accent: site.palette.light.accent.toLowerCase(),
    alt: site.palette.light.alt.toLowerCase(),
    hue: Math.round(hsl.h),
    sat: Math.round(hsl.s),
    light: Math.round(hsl.l),
    mode: site.initialMode === 'dark' ? 'dark' : 'light',
    tier: site.tier,
    heroLayout: site.layoutIds.find((id) => id.startsWith('hero')) ?? '',
    layouts: site.layoutIds,
    heroTitle: site.content.hero.title,
    verdict: 'unrated',
  }
}

export async function planDesign(prompt: string, store: DesignStore, options: { group: string; creativity: string; temperature: number; rand?: () => number; candidates?: number }): Promise<DesignPlan> {
  const rand = options.rand ?? Math.random
  const key = businessKey(prompt)
  const all = await store.list().catch(() => [] as DesignRecord[])
  const insights = analyse(all, key)
  // the hues of the other businesses made lately count a little too: two sites in a row should not look alike
  const recent = all.filter((r) => r.key !== key).slice(0, 4).map((r) => r.hue)
  const made = Array.from({ length: options.candidates ?? CANDIDATES }, () => describeDesign(prompt, 1 + Math.floor(rand() * 9000), options.creativity, options.group))
  // a design whose colour was already made keeps its look but gets the nearest colour that is new (the colour of a design is an edit like any other)
  let gap = minGapFor(insights.seenHues.length)
  const toHex = (h: number, sat: number, light: number) => `#${hslToRgb(h, sat, light).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
  const evaluate = (g: number) => made.flatMap((record) => {
    const free = nearestFreeHue(record.hue, insights.seenHues, g, 180)
    if (free === undefined || insights.seenAccents.has(record.accent)) return []
    const shifted = hueGap(free, record.hue) > 0
    const moved = hueGap(free, record.hue)
    const design = shifted ? { ...record, hue: free, accent: toHex(free, Math.min(record.sat, 62), Math.max(record.light, 36)), paletteName: `${hueName(free)} (recoloured from ${record.paletteName})` } : record
    const taste = tasteScore(design as Candidate, insights)
    const near = recent.length ? Math.min(...recent.map((h) => hueGap(design.hue, h))) : 180
    // a design that needed no change is worth a little more than one that was recoloured; far from the other businesses made lately, a little more
    const score = Math.max(0.01, taste * (shifted ? Math.max(0.3, 0.85 - moved / 300) : 1) * (near < 15 ? 0.9 : 1))
    return [{ record: design, shifted, score }]
  })
  let scored = evaluate(gap)
  // the wheel is crowded: the gap to the old colours is made smaller until a free place is found
  while (!scored.length && gap > 1) {
    gap = Math.max(1, Math.floor(gap / 2))
    scored = evaluate(gap)
  }
  const fresh = scored.filter((s) => !s.shifted)
  const winner = sampleTopK(scored.map((s) => ({ item: s, score: s.score })), options.temperature, rand)
  const ops: EditOp[] = winner.shifted ? [{ op: 'accent', hex: winner.record.accent }] : []
  const reasons = [...insights.summary, `New design: ${hueName(winner.record.hue)} colours (${winner.record.paletteName}${winner.shifted ? ', moved to a hue that was not used yet' : ''}), ${winner.record.mode} mode, first screen "${winner.record.heroLayout}". Chosen from ${made.length} designs.`]
  return { variation: winner.record.variation, record: winner.record, insights, ops, reasons, tried: made.length, fresh: fresh.length }
}


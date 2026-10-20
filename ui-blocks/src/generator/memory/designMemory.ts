// What the design memory teaches. Two things are kept apart:
//   TASTE   : the style of the designs the person kept or turned down (the first-screen layout, light or dark, the design level, how the colours
//             were made, how strong the colours are). The next design leans towards what was kept and away from what was turned down.
//   NEWNESS : the colour of a new design is never one of the colours already made for this kind of business: a hue is only used when it is
//             at least a few degrees away from every earlier one (the gap shrinks only when the colour wheel is full).
// The analysis is plain counting (Laplace-smoothed), so it works from the first design on and gets surer with every verdict.
import type { DesignRecord } from './designStore'

export type Candidate = Pick<DesignRecord, 'accent' | 'alt' | 'hue' | 'sat' | 'light' | 'mode' | 'tier' | 'heroLayout' | 'kind' | 'theme'>

export type Insights = {
  /** designs of this kind of business */
  forKey: DesignRecord[]
  good: DesignRecord[]
  bad: DesignRecord[]
  /** every hue already made for this kind of business */
  seenHues: number[]
  seenAccents: Set<string>
  /** the hues that were turned down */
  badHues: number[]
  /** (kept + 1) / (kept + turned down + 2) for each value of a feature */
  taste: Record<'heroLayout' | 'mode' | 'tier' | 'kind' | 'strength', Record<string, number>>
  summary: string[]
}

export const hueGap = (a: number, b: number) => {
  const d = Math.abs(((a % 360) + 360) % 360 - (((b % 360) + 360) % 360))
  return d > 180 ? 360 - d : d
}

const HUE_NAMES: [number, string][] = [[15, 'red'], [40, 'orange'], [65, 'yellow'], [95, 'lime'], [150, 'green'], [185, 'teal'], [205, 'sky blue'], [245, 'blue'], [275, 'violet'], [300, 'purple'], [335, 'pink'], [360, 'red']]
export const hueName = (hue: number) => HUE_NAMES.find(([limit]) => ((hue % 360) + 360) % 360 <= limit)?.[1] ?? 'red'

const strengthOf = (r: Pick<DesignRecord, 'sat' | 'light'>) => (r.sat >= 70 ? 'vivid' : r.sat >= 50 ? 'balanced' : 'soft')

export function analyse(records: DesignRecord[], key: string): Insights {
  const forKey = records.filter((r) => r.key === key)
  const good = forKey.filter((r) => r.verdict === 'good')
  const bad = forKey.filter((r) => r.verdict === 'bad')
  const features = ['heroLayout', 'mode', 'tier', 'kind'] as const
  const taste = { heroLayout: {}, mode: {}, tier: {}, kind: {}, strength: {} } as Insights['taste']
  const count = (feature: keyof Insights['taste'], value: string, up: number, down: number) => {
    const row = (taste[feature] as Record<string, number>)
    const prev = (row as Record<string, number>)[`${value}|up`] ?? 0
    const prevDown = (row as Record<string, number>)[`${value}|down`] ?? 0
    ;(row as Record<string, number>)[`${value}|up`] = prev + up
    ;(row as Record<string, number>)[`${value}|down`] = prevDown + down
  }
  for (const r of forKey) {
    if (r.verdict === 'unrated') continue
    const up = r.verdict === 'good' ? 1 : 0
    const down = r.verdict === 'bad' ? 1 : 0
    for (const f of features) count(f, String(r[f]).replace(/\|.*/, ''), up, down)
    count('strength', strengthOf(r), up, down)
  }
  // turn the counts into one number per value
  for (const f of Object.keys(taste) as (keyof Insights['taste'])[]) {
    const raw = taste[f] as Record<string, number>
    const values = new Set(Object.keys(raw).map((k) => k.split('|')[0]))
    const out: Record<string, number> = {}
    for (const v of values) out[v] = ((raw[`${v}|up`] ?? 0) + 1) / ((raw[`${v}|up`] ?? 0) + (raw[`${v}|down`] ?? 0) + 2)
    taste[f] = out
  }
  const insights: Insights = { forKey, good, bad, seenHues: forKey.map((r) => r.hue), seenAccents: new Set(forKey.map((r) => r.accent.toLowerCase())), badHues: bad.map((r) => r.hue), taste, summary: [] }
  insights.summary = describe(insights)
  return insights
}

function describe(ins: Insights): string[] {
  const lines: string[] = []
  const { forKey, good, bad } = ins
  if (!forKey.length) return ['No design of this kind of business was made before: every colour is new.']
  lines.push(`${forKey.length} design${forKey.length === 1 ? '' : 's'} made for this kind of business: ${good.length} kept, ${bad.length} turned down.`)
  const top = (rows: DesignRecord[], pick: (r: DesignRecord) => string) => {
    const counts = new Map<string, number>()
    for (const r of rows) counts.set(pick(r), (counts.get(pick(r)) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  }
  if (good.length) {
    const mode = top(good, (r) => r.mode)
    const layout = top(good, (r) => r.heroLayout)
    const strength = top(good, strengthOf)
    lines.push(`Kept designs: ${mode?.[0]} mode, first screen "${layout?.[0]}", ${strength?.[0]} colours (${good.map((r) => hueName(r.hue)).filter((v, i, a) => a.indexOf(v) === i).join(', ')}).`)
  }
  if (bad.length) {
    const badNames = [...new Set(bad.map((r) => hueName(r.hue)))]
    lines.push(`Turned down: ${badNames.join(', ')} colours${bad.length > 2 ? ' (the next design stays away from them)' : ''}.`)
  }
  lines.push(`The next colour will be new: not one of the ${forKey.length} already used (${[...new Set(forKey.map((r) => hueName(r.hue)))].join(', ')}).`)
  return lines
}

/** how well a candidate fits the taste of this person for this business, 0 to 1 (0.5 = nothing is known) */
export function tasteScore(c: Candidate, ins: Insights): number {
  // the first-screen layout and the mode show most; how the colours were made and how strong they are, least
  const parts: [number | undefined, number][] = [[ins.taste.heroLayout[c.heroLayout], 0.35], [ins.taste.mode[c.mode], 0.2], [ins.taste.tier[c.tier], 0.15], [ins.taste.kind[c.kind.replace(/\|.*/, '')], 0.15], [ins.taste.strength[strengthOf(c)], 0.15]]
  let score = parts.reduce((a, [v, w]) => a + (v ?? 0.5) * w, 0)
  // a hue that is close to one that was turned down is a poor choice
  const nearBad = ins.badHues.length ? Math.min(...ins.badHues.map((h) => hueGap(h, c.hue))) : 180
  if (nearBad < 30) score -= 0.25 * (1 - nearBad / 30)
  return Math.max(0, Math.min(1, score))
}

/** 0 when the colour was already made (or is too close to one), up to 1 for a hue far from all of them */
export function newness(c: Pick<Candidate, 'hue' | 'accent'>, ins: Insights, minGap: number): number {
  if (ins.seenAccents.has(c.accent.toLowerCase())) return 0
  if (!ins.seenHues.length) return 1
  const gap = Math.min(...ins.seenHues.map((h) => hueGap(h, c.hue)))
  return gap < minGap ? 0 : Math.min(1, gap / 90)
}

/** the smallest gap a new hue must keep to the old ones: it shrinks only as the wheel fills up */
export function minGapFor(count: number): number {
  return Math.max(6, 36 - Math.floor(count / 4) * 4)
}

/** the nearest hue (to `hue`) that keeps `gap` degrees to every hue already used, or undefined when none is within `reach` degrees */
export function nearestFreeHue(hue: number, used: number[], gap: number, reach = 70): number | undefined {
  if (!used.length || used.every((h) => hueGap(h, hue) >= gap)) return Math.round(hue) % 360
  for (let d = 2; d <= reach; d += 2) {
    for (const sign of [1, -1]) {
      const h = (((hue + sign * d) % 360) + 360) % 360
      if (used.every((u) => hueGap(u, h) >= gap)) return Math.round(h)
    }
  }
  return undefined
}

export type Scored = { candidate: Candidate; score: number; taste: number; fresh: number }

export function scoreCandidate(c: Candidate, ins: Insights): Scored {
  const fresh = newness(c, ins, minGapFor(ins.seenHues.length))
  const taste = tasteScore(c, ins)
  // a colour that is not new is out: its score is 0
  return { candidate: c, taste, fresh, score: fresh === 0 ? 0 : 0.55 * taste + 0.45 * fresh }
}

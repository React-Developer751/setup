// The generator's own idea of how a business should look: not the safe default of the learned designs (a blush pink for a cafe), but an idea that starts
// from what the business IS: coffee is brown and cream, a gym is black with a strike of lime, a clinic is clean teal. It knows families of palettes with a
// reason each (src/data/concepts.json), builds a whole palette from four colours (both modes, readable), and sometimes makes a BET: a bolder turn of the
// colours that is not on any list, said as a bet, so that the person can correct it. What the person corrects (they change the colour, they remove a part,
// they keep or turn down the design) is remembered (memory/correctionMemory.ts) and the next idea for that kind of business starts from it.
// It is plain arithmetic and a list of known palettes: no model, no network. The same prompt, variation and memory always give the same idea.
import data from '../data/concepts.json'
import { hexToRgb, hslToRgb, rgbToHsl } from './art/color'
import { contrast } from './colorBrain'
import { mixHex } from './edit/sectionColors'
import type { ConceptData, EditOp } from './edit/edits'
import type { PaletteMode } from './themes'

export type Seed = { name: string; why: string; bg: string; ink: string; accent: string; alt: string; font?: string; dark?: boolean }
type Family = { id: string; words: string; niches: string[]; themes: string[]; seeds: Seed[] }
const FAMILIES = (data as unknown as { families: Family[] }).families

/** what the person taught about this kind of business (memory/correctionMemory.ts) */
export type ConceptMemory = {
  /** ideas that were kept (the design was marked right) and turned down */
  liked: string[]
  disliked: string[]
  /** the colours they changed the accent TO (they are what they wanted) and the hues they changed it FROM (they did not want them) */
  chosenAccents: string[]
  rejectedHues: number[]
  /** parts they removed from pages of this kind of business */
  removed: string[]
}
export const noMemory = (): ConceptMemory => ({ liked: [], disliked: [], chosenAccents: [], rejectedHues: [], removed: [] })

export type Concept = { id: string; name: string; why: string; bold: boolean; learned: boolean; data: ConceptData; dark: boolean; hide: string[] }

// ───────────── colours ─────────────
const hex = ([r, g, b]: readonly [number, number, number]) => `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`
const hsl = (color: string) => rgbToHsl(hexToRgb(color))
const fromHsl = (h: number, s: number, l: number) => hex(hslToRgb(h, s, l))
const hueGap = (a: number, b: number) => {
  const d = Math.abs((((a % 360) + 360) % 360) - (((b % 360) + 360) % 360))
  return d > 180 ? 360 - d : d
}

/** the colour moved in lightness, in steps, until it reads against the background (towards light or towards dark) */
function reads(color: string, background: string, ratio: number, towards: 'light' | 'dark'): string {
  let c = color
  for (let i = 0; i < 40 && contrast(c, background) < ratio; i += 1) {
    const { h, s, l } = hsl(c)
    c = fromHsl(h, s, towards === 'light' ? Math.min(98, l + 2.5) : Math.max(4, l - 2.5))
  }
  return c
}

/** a whole palette (both modes) from four colours: the neutrals follow the background and the ink, the accents are moved only as far as they must to be seen */
export function buildPalette(seed: Seed): { light: PaletteMode; dark: PaletteMode } {
  const mode = (bg: string, ink: string, accent: string, alt: string, lighter: boolean): PaletteMode => {
    const text = reads(ink, bg, 9, lighter ? 'light' : 'dark')
    return {
      bg,
      surface: lighter ? mixHex('#ffffff', 7, bg) : mixHex('#ffffff', 55, bg),
      border: mixHex(text, 16, bg),
      text,
      muted: reads(mixHex(text, 62, bg), bg, 4.5, lighter ? 'light' : 'dark'),
      accent: reads(accent, bg, 3.2, lighter ? 'light' : 'dark'),
      alt: reads(alt, bg, 2.2, lighter ? 'light' : 'dark'),
    }
  }
  if (seed.dark) {
    // the idea is a dark one: its light twin is made from the light text colour
    const lightBg = mixHex(seed.ink, 90, '#ffffff')
    return { dark: mode(seed.bg, seed.ink, seed.accent, seed.alt, true), light: mode(lightBg, mixHex(seed.bg, 85, '#000000'), seed.accent, seed.alt, false) }
  }
  const darkBg = mixHex(seed.ink, 62, '#000000')
  return { light: mode(seed.bg, seed.ink, seed.accent, seed.alt, false), dark: mode(darkBg, mixHex(seed.bg, 92, '#ffffff'), seed.accent, seed.alt, true) }
}

// ───────────── which family fits ─────────────
const REGEX = new Map<string, RegExp>()
const wordsOf = (family: Family) => {
  let re = REGEX.get(family.id)
  if (!re) REGEX.set(family.id, (re = new RegExp(`(?:^|[^a-z])(?:${family.words})`, 'i')))
  return re
}

/** how well a family fits this business, 0 to 1.3: its words in the prompt, its niche packs, its kind of business */
export function relevance(family: Family, prompt: string, theme: string, niche: string): number {
  let score = 0
  if (wordsOf(family).test(prompt)) score = 1
  if (niche && family.niches.includes(niche)) score = Math.max(score, 1.2)
  if (family.themes.includes(theme)) score = Math.max(score, 0.35)
  return score
}

export const familiesOf = (prompt: string, theme: string, niche: string) =>
  FAMILIES.map((family) => ({ family, score: relevance(family, prompt, theme, niche) })).filter((f) => f.score >= 0.35).sort((a, b) => b.score - a.score)

/** a number between 0 and 1 that depends only on the text (the same prompt always ranks its ideas the same way) */
const hash01 = (text: string) => {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return ((h >>> 0) % 10000) / 10000
}

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const seedId = (family: Family, seed: Seed) => `${family.id}:${slug(seed.name)}`

export type ThinkOptions = {
  prompt: string
  theme: string
  niche?: string
  variation: number
  /** 'safe' only known palettes; 'balanced' now and then a bet; 'wild' often a bet */
  level: 'safe' | 'balanced' | 'wild'
  rand: () => number
  memory?: ConceptMemory
  /** the hues already used by designs of this business: an idea whose accent repeats one is avoided, and when every idea of the list does, a new bet is made */
  used?: number[]
  /** the hues this business may wear at all (a calm business is never moved into yellow-green; a jewellery shop keeps to its band): a bet stays inside them */
  allowed?: (hue: number) => boolean
}

/** the smallest gap a new idea keeps to the hues already used: 12 degrees at first, a few when the wheel is crowded */
const gapFor = (used: number) => Math.max(3, 12 - Math.floor(used / 3))

/**
 * A bolder turn of a known palette: the accent goes to another hue, the second colour moves the other way, saturation goes up; it is on no list.
 * The hue is chosen from the hues the business may wear that keep the widest gap to the hues already used (12 degrees at first, fewer as the wheel fills up),
 * and as far from the colour it started from as the room allows.
 */
function bet(seed: Seed, rand: () => number, avoid: number[] = [], allowed: (hue: number) => boolean = () => true): Seed {
  const a = hsl(seed.accent)
  const make = (hue: number) => fromHsl(hue, Math.min(88, a.s + 18), seed.dark ? Math.max(52, a.l) : Math.min(50, Math.max(34, a.l)))
  // the hues that are fine as the colour is written (8 bits move a hue a little)
  const fine: { hue: number; written: number }[] = []
  for (let h = 0; h < 360; h += 1) {
    const written = hsl(make(h)).h
    if (allowed(h) && allowed(written)) fine.push({ hue: h, written })
  }
  const pool = fine.length ? fine : [{ hue: a.h, written: a.h }]
  const gapTo = (written: number) => (avoid.length ? Math.min(...avoid.map((u) => hueGap(u, written))) : 180)
  let chosen = pool[0]
  for (let gap = gapFor(avoid.length); gap >= 1; gap -= 1) {
    const room = pool.filter((p) => gapTo(p.written) >= gap)
    if (!room.length) continue
    // a bolder turn: at least 30 degrees from where it started, when the room allows
    const far = room.filter((p) => hueGap(p.hue, a.h) >= 30)
    const from = far.length ? far : room
    chosen = from[Math.floor(rand() * from.length)]
    break
  }
  if (gapTo(chosen.written) < 1) chosen = pool.reduce((best, p) => (gapTo(p.written) > gapTo(best.written) ? p : best), pool[0])
  const turn = chosen.hue - a.h
  const accent = make(chosen.hue)
  const b = hsl(seed.alt)
  const alt = fromHsl(b.h - turn * 0.6, Math.min(80, b.s + 10), b.l)
  return { ...seed, name: `A bolder ${seed.name}`, accent, alt, why: `a bet, not from the safe list: ${seed.why}, with the accent turned ${Math.round(hueGap(chosen.hue, a.h))} degrees round the colour wheel` }
}

/**
 * The generator's idea for this business, or undefined when it knows nothing about its colours (the default look stays).
 * With memory: ideas that were turned down are avoided, kept ideas are preferred, and a colour the person changed the accent to becomes the accent of the idea.
 */
export function thinkConcept(o: ThinkOptions): Concept | undefined {
  const matches = familiesOf(o.prompt.toLowerCase(), o.theme, o.niche ?? '')
  if (!matches.length) return undefined
  const memory = o.memory ?? noMemory()
  // the closest family leads; a second one fills in when it is nearly as good (a coffee and bakery place)
  const lead = matches[0]
  const pool = matches.filter((m) => m.score >= lead.score - 0.25).flatMap((m) => m.family.seeds.map((seed) => ({ family: m.family, seed, id: seedId(m.family, seed) })))

  // the colours the person wanted: their accent becomes the accent of an idea that keeps the neutrals of the best-fitting palette
  const chosen = memory.chosenAccents[memory.chosenAccents.length - 1]
  const candidates: { family: Family; seed: Seed; id: string; learned: boolean; bold: boolean }[] = pool.map((c) => ({ ...c, learned: false, bold: false }))
  if (chosen) {
    const base = pool.find((c) => !memory.disliked.includes(c.id)) ?? pool[0]
    const c = hsl(chosen)
    const altHue = hueGap(hsl(base.seed.alt).h, c.h) < 28 ? c.h + 150 : hsl(base.seed.alt).h
    const alt = fromHsl(altHue, Math.max(35, hsl(base.seed.alt).s), base.seed.dark ? 60 : 55)
    const seed: Seed = { ...base.seed, name: 'Your colour', accent: chosen, alt, why: `on the neutrals of "${base.seed.name}"` }
    candidates.unshift({ family: base.family, seed, id: `${base.family.id}:yours`, learned: true, bold: false })
  }
  // a bet: a bolder turn of one of them (never at a safe creativity; never for the first idea of a business that is not known yet)
  const betChance = o.level === 'wild' ? 0.55 : o.level === 'balanced' ? 0.22 : 0
  if (betChance && o.rand() < betChance + (memory.rejectedHues.length >= 2 ? 0.2 : 0)) {
    const from = pool[Math.floor(o.rand() * pool.length)]
    candidates.push({ family: from.family, seed: bet(from.seed, o.rand, [], o.allowed), id: `${from.family.id}:bet${o.variation}`, learned: false, bold: true })
  }

  const used = o.used ?? []
  const isUsed = (hue: number) => used.some((h) => hueGap(h, hue) < Math.min(10, gapFor(used.length)))
  // every idea of the list was used already (a business that was made many times): a new bet takes its place, in a hue nobody used
  if (candidates.every((c) => isUsed(hsl(c.seed.accent).h))) {
    const from = pool[Math.floor(o.rand() * pool.length)]
    candidates.push({ family: from.family, seed: bet(from.seed, o.rand, used, o.allowed), id: `${from.family.id}:bet${o.variation}`, learned: false, bold: true })
  }

  // score: what the person kept is preferred, what they turned down avoided, hues they changed away from avoided, a little luck
  const scored = candidates.map((c) => {
    const h = hsl(c.seed.accent).h
    // (the luck depends on the prompt and the idea only, so the ideas keep their order and every variation walks one step down the list)
    // (the palettes of a family are listed from the most natural to the most surprising: the first ones lead)
    let s = 1 + hash01(`${o.prompt}|${c.id}`) * 0.12 + Math.max(0, 5 - c.family.seeds.indexOf(c.seed)) * 0.1
    if (memory.liked.includes(c.id)) s += 0.8
    if (memory.disliked.includes(c.id)) s -= 1.2
    if (c.learned) s += 1.3
    if (memory.rejectedHues.some((r) => hueGap(r, h) < 25)) s -= 0.9
    if (isUsed(h)) s -= 1.6
    // a bet that was drawn leads, unless the person has told what they want (their colour leads then): the freedom to try something that is on no list
    if (c.bold) s += chosen ? 0.4 : 3
    return { c, s }
  })
  scored.sort((a, b) => b.s - a.s)
  // (ideas whose colour was not used yet come first; when all of them were used, the list as it is)
  const exact = (hue: number) => used.some((h) => hueGap(h, hue) < 2)
  const fresh = scored.filter((x) => !exact(hsl(x.c.seed.accent).h))
  const list = fresh.length ? fresh : scored
  // the best idea whose colour was not used yet: what the person kept or chose leads, and every new design of the business takes the next one, so that they are all different
  const pick = list[0].c
  const palette = buildPalette(pick.seed)
  const why = pick.learned ? `I used the colour you chose before for this kind of business, ${pick.seed.why}.` : `${pick.seed.name}: ${pick.seed.why}.${pick.bold ? ' Tell me if it is wrong: I remember what you change.' : ''}`
  return {
    id: pick.id,
    name: pick.seed.name,
    why,
    bold: pick.bold,
    learned: pick.learned,
    dark: !!pick.seed.dark,
    hide: memory.removed,
    data: { id: pick.id, name: pick.seed.name, why, light: palette.light, dark: palette.dark, ...(pick.seed.font ? { font: pick.seed.font } : {}) },
  }
}

/** the operations that put an idea on a page: the palette and typeface, the mode when the idea is a dark one, and the parts the person always removes */
export function conceptOps(concept: Concept): EditOp[] {
  const ops: EditOp[] = [{ op: 'concept', data: concept.data }]
  if (concept.dark) ops.push({ op: 'mode', mode: 'dark' })
  else ops.push({ op: 'mode', mode: 'light' })
  return ops
}

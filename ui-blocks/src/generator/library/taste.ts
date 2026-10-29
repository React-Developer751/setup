// Taste: the generator chooses the parts of a page the way a designer would, not one at a time from a list.
//
// What it learned (scripts/learn-components.mjs -> src/data/models/component-taste.json): for each of the person's own components seven numbers between 0 and 1
// (how dense, loud, soft, dark, picture-led, centred and airy it is). From them:
//   * every kind of business has a target taste (a clinic is calm and soft, a gym is loud and quick, a fashion house is airy and picture-led), moved a
//     little by the design (a black design wants dark parts) and by the variation: variation 1, 2, 3 ... look at different places of the taste space, so
//     they are different designs, not draws from one list;
//   * each part is chosen by how close it is to that target AND how well it goes with the parts already chosen (a loud hero is not followed by a
//     sleepy footer); the hero is chosen first, the menu and the footer last;
//   * nothing is forbidden that the person's list allows: the stored list of a role only says what may be chosen, the taste says what is chosen, and
//     the parts of the design read from live sites (the kits) compete with the stored ones instead of being fixed;
//   * the page is drawn several times and the best-fitting whole is kept (a soft check: every role filled, no part twice, a balanced length), so a daring
//     mix that does not hang together is thrown away and a daring mix that does is kept.
// It is plain arithmetic on the numbers: no model of language, no network, and the same prompt and variation always give the same page.
import taste from '../../data/models/component-taste.json'
import { archetypeOf } from '../motionBrain'
import type { ThemeKey } from '../themes'
import type { Tier } from '../designBrain'
import { rolePools, tierPools, type Role } from './libraryRoles'

export type Axis = 'density' | 'weight' | 'soft' | 'dark' | 'image' | 'center' | 'airy'
export type Axes = Record<Axis, number>
export const AXES: Axis[] = ['density', 'weight', 'soft', 'dark', 'image', 'center', 'airy']

type Learned = { version: number; learnedFrom: number; components: Record<string, { axes: Axes; f: Record<string, number> }> }
const learned = taste as unknown as Learned

export const learnedCount = () => learned.learnedFrom
export const axesOf = (id: string): Axes | undefined => learned.components[id]?.axes

/** where a business of this feel wants its page to sit in the taste space */
const ANCHOR: Record<string, Axes> = {
  calm: { density: 0.5, weight: 0.35, soft: 0.75, dark: 0, image: 0.35, center: 0.4, airy: 0.45 },
  energetic: { density: 0.55, weight: 0.85, soft: 0.45, dark: 0.3, image: 0.5, center: 0.45, airy: 0.15 },
  elegant: { density: 0.25, weight: 0.6, soft: 0.35, dark: 0.35, image: 0.7, center: 0.7, airy: 0.6 },
  appetite: { density: 0.35, weight: 0.65, soft: 0.7, dark: 0.1, image: 0.8, center: 0.5, airy: 0.4 },
  tech: { density: 0.45, weight: 0.7, soft: 0.6, dark: 0.4, image: 0.3, center: 0.5, airy: 0.3 },
  playful: { density: 0.5, weight: 0.8, soft: 0.9, dark: 0, image: 0.4, center: 0.6, airy: 0.3 },
  creative: { density: 0.3, weight: 0.9, soft: 0.4, dark: 0.5, image: 0.7, center: 0.5, airy: 0.5 },
  wander: { density: 0.3, weight: 0.7, soft: 0.6, dark: 0.1, image: 0.9, center: 0.5, airy: 0.5 },
}

/** what each design read from a live site asks for on top of its business (a black design wants dark, picture-led parts) */
const NUDGE: Record<string, Partial<Axes>> = {
  'maison-noir': { dark: 0.45, airy: 0.2, soft: -0.2, image: 0.2 },
  'film-editorial': { dark: 0.3, image: 0.25, center: 0.15 },
  'atelier-3d': { dark: 0.2, weight: 0.15, image: 0.2 },
  'apple-tile': { density: -0.15, center: 0.3, airy: 0.2, weight: 0.1 },
  'techno-black': { dark: 0.5, soft: -0.2, density: 0.1 },
  'showroom-white': { dark: -0.3, airy: 0.25, image: 0.15 },
  'noir-lab': { dark: 0.5, density: -0.1, soft: -0.2 },
  'blush-serif': { soft: 0.25, airy: 0.25, density: -0.1 },
  'neon-arcade': { dark: 0.5, weight: 0.2, soft: 0.2 },
  'studio-index': { dark: -0.2, weight: 0.2, density: 0.1, soft: -0.2 },
  'clinic-mesh': { soft: 0.2, airy: 0.1 },
  'plum-ivory': { soft: 0.1, dark: 0.1 },
  'trust-navy': { soft: -0.1, density: 0.1 },
  'violet-glow': { weight: 0.15, soft: 0.15 },
  'cream-coral': { soft: 0.2, airy: 0.15 },
}

/** the n-th point of a low-discrepancy sequence (Halton): consecutive variations land far from each other instead of clumping like random draws */
const halton = (index: number, base: number) => {
  let f = 1
  let r = 0
  for (let i = index; i > 0; i = Math.floor(i / base)) {
    f /= base
    r += f * (i % base)
  }
  return r
}
const PRIMES = [2, 3, 5, 7, 11, 13, 17]
const clamp = (v: number) => Math.max(0, Math.min(1, v))

export type Level = 'balanced' | 'wild'

/** the target taste of one page */
export function targetFor(theme: ThemeKey, moodId: string | undefined, variation: number, level: Level): Axes {
  const base = ANCHOR[archetypeOf(theme)] ?? ANCHOR.calm
  const nudge = (moodId && NUDGE[moodId]) || {}
  // how far a variation may wander from the usual taste of the business: a little when balanced, a lot when wild
  const spread = level === 'wild' ? 0.42 : 0.2
  const out = {} as Axes
  AXES.forEach((axis, i) => {
    // variation 0 is the plain target; the others walk through the space (dark is moved least: a clinic does not turn black by chance)
    const walk = variation === 0 ? 0 : (halton(variation, PRIMES[i]) - 0.5) * 2 * spread * (axis === 'dark' ? 0.5 : 1)
    out[axis] = clamp(base[axis] + (nudge[axis] ?? 0) + walk)
  })
  return out
}

// ───────────── what is close to what ─────────────
const sdCache = new Map<string, Axes>()
/** how much the parts of a role differ in each axis (a role whose parts are all alike in an axis does not care about it) */
function spreadOf(role: string, ids: string[]): Axes {
  const key = `${role}|${ids.length}|${ids[0]}`
  const hit = sdCache.get(key)
  if (hit) return hit
  const rows = ids.map(axesOf).filter((a): a is Axes => !!a)
  const out = {} as Axes
  for (const axis of AXES) {
    const values = rows.map((r) => r[axis])
    const mean = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length)
    const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, values.length))
    // a floor: an axis that hardly varies in a role must not decide it
    out[axis] = Math.max(sd, 0.18)
  }
  sdCache.set(key, out)
  return out
}

/** how unlike two parts are (0 = the same) */
export const axesDistance = (a: Axes, b: Axes) => distance(a, b, UNIT)

const distance = (a: Axes, b: Axes, scale: Axes) => {
  let total = 0
  for (const axis of AXES) total += Math.min(((a[axis] - b[axis]) / scale[axis]) ** 2, 4)
  return Math.sqrt(total / AXES.length)
}
const NEUTRAL: Axes = { density: 0.5, weight: 0.5, soft: 0.5, dark: 0, image: 0.3, center: 0.5, airy: 0.3 }
const UNIT: Axes = { density: 0.3, weight: 0.3, soft: 0.3, dark: 0.3, image: 0.3, center: 0.3, airy: 0.3 }

const mean = (rows: Axes[]): Axes => {
  const out = {} as Axes
  for (const axis of AXES) out[axis] = rows.reduce((a, r) => a + r[axis], 0) / Math.max(1, rows.length)
  return out
}

/** the order the parts are chosen in: the ones that set the tone first, the menu and the footer after them */
const ORDER: Role[] = ['hero', 'features', 'about', 'gallery', 'stats', 'steps', 'testimonial', 'pricing', 'team', 'blog', 'faq', 'links', 'profile', 'cta', 'contact', 'banner', 'pagehead', 'nav', 'footer']
/** how much a role cares about the target taste (the menu and the footer follow the page more than they lead it) */
const CARE: Partial<Record<Role, number>> = { hero: 1.15, features: 1, about: 0.9, gallery: 1, nav: 0.55, footer: 0.5, banner: 0.4, contact: 0.7, cta: 0.8 }

export type ComposeOptions = {
  roles: Role[]
  theme: ThemeKey
  moodId?: string
  tier: Tier
  variation: number
  level: Level
  rand: () => number
  /** the parts of the design read from live sites, by role (they compete with the stored parts) */
  kit?: (role: Role) => string[] | undefined
  /** roles whose part is kept from the kit as it is */
  fixed?: Partial<Record<Role, string>>
  /** how much a part of the design is preferred over a stored one (0.5 is a mild preference, 1.5 almost always wins) */
  kitBonus?: number
}

const TEMPERATURE: Record<Level, number> = { balanced: 0.3, wild: 0.7 }

/** one whole page drawn once: the chosen part of each role and how well it hangs together (higher is better) */
function drawOnce(options: ComposeOptions, target: Axes, rand: () => number): { picks: Record<string, string>; score: number } {
  const picks: Record<string, string> = {}
  const chosen: Axes[] = []
  let score = 0
  const temperature = TEMPERATURE[options.level]
  const roles = [...options.roles].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
  for (const role of roles) {
    if (options.fixed?.[role]) {
      picks[role] = options.fixed[role]!
      const a = axesOf(picks[role])
      if (a) chosen.push(a)
      continue
    }
    const stored = rolePools[role] ?? []
    const kit = options.kit?.(role) ?? []
    const universe = [...new Set([...stored, ...kit])]
    const scale = spreadOf(role, universe)
    const care = CARE[role] ?? 0.8
    const premium = options.tier === 'normal' ? tierPools.normal[role] : options.tier === 'premium' ? tierPools.premium[role] : undefined
    const rows = universe.map((id) => {
      const a = axesOf(id) ?? NEUTRAL
      let s = -care * distance(a, target, scale)
      // goes with what is already on the page
      if (chosen.length) s -= 0.55 * distance(a, mean(chosen), UNIT)
      // the quiet or the rich parts of the person's own list are a little preferred at that design level
      if (premium?.includes(id)) s += 0.25
      // the parts of a design read from a live site: preferred, not forced
      if (kit.includes(id)) s += options.kitBonus ?? (options.level === 'wild' ? 0.15 : 0.5)
      return { id, s }
    })
    // a draw weighted by how well each part fits (softmax): the best fits are likely, a surprising one is possible
    const top = Math.max(...rows.map((r) => r.s))
    const weights = rows.map((r) => Math.exp((r.s - top) / temperature))
    const total = weights.reduce((a, b) => a + b, 0)
    let at = rand() * total
    let pick = rows[0]
    for (let i = 0; i < rows.length; i += 1) {
      at -= weights[i]
      if (at <= 0) {
        pick = rows[i]
        break
      }
    }
    picks[role] = pick.id
    score += pick.s
    const taken = axesOf(pick.id)
    if (taken) chosen.push(taken)
  }
  return { picks, score: roles.length ? score / roles.length : 0 }
}

/** how balanced the whole is: parts that agree (low spread of the taste) and a length that is neither a stub nor endless */
export function wholeScore(picks: Record<string, string>): number {
  const rows = Object.values(picks).map(axesOf).filter((a): a is Axes => !!a)
  if (rows.length < 3) return 0
  const centre = mean(rows)
  const spread = rows.reduce((a, r) => a + distance(r, centre, UNIT), 0) / rows.length
  const lines = Object.values(picks).reduce((a, id) => a + (learned.components[id]?.f.lines ?? 80), 0)
  // 600 to 3500 lines of markup is a page of a sensible length
  const lengthPenalty = lines < 600 ? (600 - lines) / 600 : lines > 3500 ? (lines - 3500) / 3500 : 0
  return -0.8 * spread - lengthPenalty
}

/** the soft validation of a drawn page: every role filled and no part used twice (a part drawn twice for two roles would repeat itself) */
const valid = (picks: Record<string, string>, roles: Role[]) => roles.every((role) => !!picks[role]) && new Set(Object.values(picks)).size === Object.values(picks).length

/**
 * The parts of a page. Several whole pages are drawn (each with its own luck) and the one that fits its business and hangs together best is kept; a
 * drawing that fails the soft check is thrown away. `tries` is how many are drawn.
 */
export function composePage(options: ComposeOptions, tries = 7): Record<string, string> {
  const target = targetFor(options.theme, options.moodId, options.variation, options.level)
  let best: { picks: Record<string, string>; total: number } | undefined
  for (let k = 0; k < tries; k += 1) {
    const draw = drawOnce(options, target, options.rand)
    if (!valid(draw.picks, options.roles)) continue
    const total = draw.score + wholeScore(draw.picks)
    if (!best || total > best.total) best = { picks: draw.picks, total }
  }
  // (every drawing failed the check: the last resort is the best single drawing without it)
  return best?.picks ?? drawOnce(options, target, options.rand).picks
}

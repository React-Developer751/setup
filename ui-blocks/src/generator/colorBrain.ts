// Colour brain: thinks up a palette for the prompt instead of picking one from a fixed list.
//
//   1. hue      : a colour named in the prompt ("red", "gold") wins, then business clues ("tea" -> green,
//                 "boxing" -> red), otherwise the theme's own hue range
//   2. harmony  : a second hue is chosen (analogous / complementary / triad / split) for gradients
//   3. mood     : the theme sets saturation and lightness, light and dark mode are both generated
//   4. safety   : lightness is adjusted until text, muted text, accent and button text pass WCAG contrast
//
// Everything is seeded, so the same prompt always gives the same palette.
import { CURATED, curatedFor } from './curatedPalettes'
import { sampleTopK, temperature } from './creativity'
import { fromKits } from './kits'
import { premiumFor, premiumToPalette } from './premiumPalettes'
import type { Tier } from './designBrain'
import { defaultMode, type ColorMode, type Palette, type PaletteMode, type ThemeKey } from './themes'

export type Mood = { range: [number, number]; saturation: number; neutralSaturation: number; accentLight: number; accentDark: number }

const MOODS: Record<ThemeKey, Mood> = {
  modern_tech: { range: [225, 275], saturation: 78, neutralSaturation: 40, accentLight: 42, accentDark: 70 },
  organic_nature: { range: [95, 165], saturation: 52, neutralSaturation: 14, accentLight: 30, accentDark: 62 },
  bold_fitness: { range: [-8, 25], saturation: 88, neutralSaturation: 6, accentLight: 42, accentDark: 58 },
  luxury_minimal: { range: [30, 50], saturation: 62, neutralSaturation: 8, accentLight: 32, accentDark: 78 },
  playful_vibrant: { range: [300, 345], saturation: 82, neutralSaturation: 22, accentLight: 42, accentDark: 68 },
  professional_services: { range: [205, 235], saturation: 58, neutralSaturation: 20, accentLight: 34, accentDark: 66 },
  healthcare: { range: [170, 200], saturation: 60, neutralSaturation: 15, accentLight: 30, accentDark: 62 },
  food_dining: { range: [5, 35], saturation: 75, neutralSaturation: 18, accentLight: 38, accentDark: 62 },
  education: { range: [215, 265], saturation: 70, neutralSaturation: 22, accentLight: 40, accentDark: 68 },
  creative_studio: { range: [270, 340], saturation: 80, neutralSaturation: 12, accentLight: 42, accentDark: 70 },
  general_business: { range: [195, 245], saturation: 62, neutralSaturation: 14, accentLight: 36, accentDark: 66 },
  ...fromKits((kit) => kit.mood),
}

// 1) colours named directly in the prompt
const COLOR_WORDS: Record<string, number> = {
  red: 2, orange: 24, yellow: 48, gold: 44, golden: 44, lime: 90, green: 140, emerald: 155, teal: 175, cyan: 190,
  aqua: 190, sky: 200, blue: 215, navy: 225, indigo: 245, violet: 265, purple: 280, magenta: 300, fuchsia: 300,
  pink: 330, rose: 345, brown: 28,
}

// 2) business clues
const HINTS: { hue: number; label: string; words: string[] }[] = [
  { hue: 145, label: 'greens', words: ['tea', 'leaf', 'herbal', 'organic', 'nature', 'garden', 'yoga', 'plant', 'eco', 'farm', 'vegan', 'wellness'] },
  { hue: 28, label: 'warm browns', words: ['coffee', 'roast', 'roastery', 'chocolate', 'cocoa', 'bakery', 'bread', 'pastry', 'cafe'] },
  { hue: 205, label: 'ocean blues', words: ['ocean', 'sea', 'water', 'marine', 'cloud', 'travel', 'swim', 'surf', 'beach'] },
  { hue: 5, label: 'energetic reds', words: ['fire', 'boxing', 'crossfit', 'gym', 'fitness', 'energy', 'racing', 'burger', 'spicy', 'protein'] },
  { hue: 325, label: 'playful pinks', words: ['kids', 'toys', 'toy', 'candy', 'party', 'ice', 'cream', 'circus', 'cute', 'baby'] },
  { hue: 44, label: 'golds', words: ['jewelry', 'jewellery', 'diamond', 'watch', 'watches', 'perfume', 'wedding', 'leather', 'wallet'] },
  { hue: 255, label: 'tech indigos', words: ['tech', 'ai', 'saas', 'crypto', 'software', 'cyber', 'code', 'data', 'startup', 'app'] },
  { hue: 190, label: 'clinical teals', words: ['medical', 'clinic', 'health', 'dental', 'hospital', 'pharmacy', 'care'] },
  { hue: 220, label: 'trust blues', words: ['finance', 'bank', 'legal', 'law', 'consulting', 'insurance', 'accounting'] },
  { hue: 285, label: 'creative purples', words: ['music', 'art', 'creative', 'studio', 'photo', 'design', 'gallery'] },
  { hue: 15, label: 'appetising oranges', words: ['food', 'restaurant', 'pizza', 'kitchen', 'grill', 'bistro', 'catering', 'sushi', 'dining'] },
  { hue: 235, label: 'school blues', words: ['school', 'academy', 'tutor', 'tutoring', 'courses', 'course', 'learning', 'teacher', 'college'] },
  { hue: 35, label: 'friendly oranges', words: ['pet', 'pets', 'dog', 'cat', 'plumber', 'plumbing', 'repair', 'cleaning', 'garage'] },
]

const HUE_NAMES: [number, string][] = [
  [0, 'Red'], [25, 'Orange'], [45, 'Amber'], [70, 'Lime'], [110, 'Green'], [155, 'Emerald'], [175, 'Teal'], [190, 'Cyan'],
  [205, 'Sky'], [220, 'Blue'], [245, 'Indigo'], [270, 'Violet'], [290, 'Purple'], [310, 'Fuchsia'], [335, 'Pink'], [350, 'Rose'], [360, 'Red'],
]

const HARMONIES = [
  { name: 'analogous', offset: 30 },
  { name: 'complementary', offset: 180 },
  { name: 'triad', offset: 120 },
  { name: 'split-complementary', offset: 150 },
] as const

// ───────────── colour maths ─────────────
const wrap = (hue: number) => ((hue % 360) + 360) % 360

function hslToHex(h: number, s: number, l: number) {
  const sat = Math.max(0, Math.min(100, s)) / 100
  const light = Math.max(0, Math.min(100, l)) / 100
  const a = sat * Math.min(light, 1 - light)
  const channel = (n: number) => {
    const k = (n + wrap(h) / 30) % 12
    const value = light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(value * 255).toString(16).padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

function luminance(hex: string) {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2)
}

/** WCAG contrast ratio between two #rrggbb colours (1 to 21). */
export function contrast(a: string, b: string) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

const bestOn = (background: string) => (contrast('#ffffff', background) >= contrast('#0a0a0a', background) ? '#ffffff' : '#0a0a0a')

function hueName(hue: number) {
  const h = wrap(hue)
  return HUE_NAMES.reduce((best, entry) => (Math.abs(entry[0] - h) < Math.abs(best[0] - h) ? entry : best))[1]
}

// ───────────── the brain ─────────────
function chooseHue(prompt: string, theme: ThemeKey, rand: () => number) {
  const words = prompt.toLowerCase().split(/[^a-z]+/).filter(Boolean)

  const named = words.find((w) => w in COLOR_WORDS)
  if (named) return { hue: COLOR_WORDS[named], reason: `colour named in the prompt ("${named}")` }

  // not every bakery is brown: four times in ten the business clue is dropped for one of the lively hues, so each site gets its own colours
  const LIVELY = [345, 330, 285, 262, 245, 205, 165, 25, 5, 150]
  if (rand() < 0.4) {
    // lively, but still a hue the business type can wear (a jewellery shop in lime was the case that showed it): within 70 degrees of the theme's own range
    const [low, high] = MOODS[theme].range
    const fits = LIVELY.filter((h) => hueGap(h, (low + high) / 2) <= (high - low) / 2 + 70)
    const pool = fits.length ? fits : LIVELY
    const hue = pool[Math.floor(rand() * pool.length)]
    return { hue: wrap(hue + Math.round((rand() - 0.5) * 24)), reason: 'a lively hue chosen for this site, so no two sites look alike' }
  }

  const scored = HINTS.map((hint) => ({ hint, hits: words.filter((w) => hint.words.includes(w)) })).filter((x) => x.hits.length)
  if (scored.length) {
    const best = scored.reduce((a, b) => (b.hits.length > a.hits.length ? b : a))
    const jitter = Math.round((rand() - 0.5) * 70)
    return { hue: wrap(best.hint.hue + jitter), reason: `"${best.hits[0]}" suggests ${best.hint.label}` }
  }

  const [low, high] = MOODS[theme].range
  return { hue: wrap(low - 20 + rand() * (high - low + 40)), reason: `no colour clue, using the ${theme.replace('_', ' ')} theme's own hue range` }
}

function buildMode(mode: ColorMode, hue: number, altHue: number, mood: Mood): PaletteMode {
  // the page itself is tinted with the main hue (a soft peach, mint or lilac; deep plum, forest or navy in the dark), never plain white or black
  const ns = mood.neutralSaturation
  const dark = mode === 'dark'
  const tint = Math.max(32, Math.min(60, 30 + ns * 0.8))
  const bg = dark ? hslToHex(hue, Math.min(55, tint), 9) : hslToHex(hue, tint, 95.5)
  const surface = dark ? hslToHex(hue, Math.min(50, tint - 4), 14) : hslToHex(hue, tint + 15, 99)
  const border = dark ? hslToHex(hue, Math.min(45, tint - 8), 25) : hslToHex(hue, tint - 4, 84)

  // text colours: nudge lightness until they are comfortably readable on both background and surface
  let text = dark ? hslToHex(hue, 15, 96) : hslToHex(hue, 35, 10)
  let muted = dark ? 68 : 36
  let mutedHex = hslToHex(hue, 12, muted)
  for (let i = 0; i < 20 && Math.min(contrast(mutedHex, bg), contrast(mutedHex, surface)) < 4.5; i++) {
    muted += dark ? 2 : -2
    mutedHex = hslToHex(hue, 12, muted)
  }
  if (Math.min(contrast(text, bg), contrast(text, surface)) < 7) text = dark ? '#ffffff' : '#0a0a0a'

  // accent: must read on the background, on cards, and carry readable button text
  let lightness = dark ? mood.accentDark : mood.accentLight
  let accent = hslToHex(hue, mood.saturation, lightness)
  const passes = (c: string) => Math.min(contrast(c, bg), contrast(c, surface), contrast(bestOn(c), c)) >= 4.5
  for (let i = 0; i < 30 && !passes(accent); i++) {
    lightness += dark ? 2 : -2
    accent = hslToHex(hue, mood.saturation, Math.max(18, Math.min(90, lightness)))
  }

  return { bg, surface, border, text, muted: mutedHex, accent, alt: hslToHex(altHue, mood.saturation, dark ? 58 : 52) }
}

// ───────────── evolved palettes (a genetic algorithm) ─────────────
// A genome is a main hue, a second hue, a saturation and a lightness. A population starts from the hand-picked palettes of the business type and
// some random ones; every generation the best are kept, mixed (crossover: the main hue of one with the second hue of another) and nudged
// (mutation); the fitness is: readable in both modes, a pleasing gap between the two hues, near the mood of the business type and unlike
// any hand-picked palette (so what comes out is new). The temperature decides how far down the final ranking the choice may go.
type Genome = { hue: number; altHue: number; sat: number; light: number }
const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n))
const hueGap = (a: number, b: number) => {
  const d = Math.abs(wrap(a) - wrap(b))
  return d > 180 ? 360 - d : d
}

const genomeOfCurated = (accent: string, alt: string): Genome => {
  const a = hexToHsl(accent)
  const b = hexToHsl(alt)
  return { hue: a.h, altHue: b.h, sat: a.s, light: a.l }
}

function express(g: Genome, mood: Mood) {
  const own: Mood = { ...mood, saturation: clamp(g.sat, 40, 92), accentLight: clamp(g.light, 28, 50), accentDark: Math.min(78, clamp(g.light, 28, 50) + 24) }
  const light = buildMode('light', g.hue, g.altHue, own)
  const dark = buildMode('dark', g.hue, g.altHue, own)
  const readable = (m: PaletteMode) => Math.min(contrast(m.text, m.bg), contrast(m.muted, m.bg), contrast(m.accent, m.bg), contrast(m.accent, m.surface), contrast(bestOn(m.accent), m.accent)) >= 4.5
  return { light, dark, valid: readable(light) && readable(dark) }
}

const CURATED_GENOMES = CURATED.map((p) => genomeOfCurated(p.accent, p.alt))

function fitness(g: Genome, mood: Mood): number {
  const { valid } = express(g, mood)
  const gap = hueGap(g.hue, g.altHue)
  // the gap: close neighbours (about 40) or far apart (about 150), not the dull middle
  const gapScore = Math.max(1 - Math.abs(gap - 150) / 150, 0.8 * (1 - Math.abs(gap - 40) / 40), 0)
  const moodScore = 1 - Math.min(1, Math.abs(g.sat - mood.saturation) / 50)
  const novelty = Math.min(1, Math.min(...CURATED_GENOMES.map((c) => hueGap(c.hue, g.hue) / 40 + Math.abs(c.sat - g.sat) / 30 + hueGap(c.altHue, g.altHue) / 60)))
  // dark yellow turns into a muddy olive: avoid it, and a second colour that is neon
  const muddy = (hue: number) => (hue >= 50 && hue <= 85 ? 0.12 : 0)
  const neon = g.altHue >= 90 && g.altHue <= 150 && g.sat > 75 ? 0.08 : 0
  return (valid ? 0.4 : 0) + 0.2 * gapScore + 0.15 * moodScore + 0.25 * novelty - muddy(g.hue) - muddy(g.altHue) * 0.5 - neon
}

export function evolvePalette(theme: ThemeKey, rand: () => number, temp: number, generations = 5): ColorPlan {
  const mood = MOODS[theme]
  const [low, high] = mood.range
  const randomGenome = (): Genome => {
    const hue = wrap(low - 40 + rand() * (high - low + 80))
    return { hue, altHue: wrap(hue + (rand() < 0.5 ? 25 + rand() * 30 : 120 + rand() * 60) * (rand() < 0.5 ? 1 : -1)), sat: mood.saturation - 12 + rand() * 24, light: mood.accentLight - 6 + rand() * 12 }
  }
  const pool = curatedFor(theme)
  let population: Genome[] = [
    ...pool.slice(0, 6).map((p) => genomeOfCurated(p.accent, p.alt)),
    ...Array.from({ length: 12 }, randomGenome),
  ].slice(0, 12)
  const mutate = (g: Genome): Genome => ({
    hue: wrap(g.hue + (rand() - 0.5) * 70),
    altHue: wrap(g.altHue + (rand() - 0.5) * 50),
    sat: clamp(g.sat + (rand() - 0.5) * 20, 40, 92),
    light: clamp(g.light + (rand() - 0.5) * 10, 28, 50),
  })
  const cross = (a: Genome, b: Genome): Genome => ({ hue: rand() < 0.5 ? a.hue : b.hue, altHue: rand() < 0.5 ? a.altHue : b.altHue, sat: (a.sat + b.sat) / 2, light: rand() < 0.5 ? a.light : b.light })
  const ranked = (list: Genome[]) => list.map((g) => ({ item: g, score: fitness(g, mood) })).sort((x, y) => y.score - x.score)
  for (let gen = 0; gen < generations; gen += 1) {
    const best = ranked(population)
    const elite = best.slice(0, 3).map((e) => e.item)
    const next = [...elite]
    while (next.length < 12) {
      // a tournament of three picks each parent
      const parent = () => ranked([0, 1, 2].map(() => population[Math.floor(rand() * population.length)]))[0].item
      next.push(mutate(cross(parent(), parent())))
    }
    population = next
  }
  const finalists = ranked(population).slice(0, 4)
  const chosen = sampleTopK(finalists, temp, rand)
  const { light, dark } = express(chosen, mood)
  // the evolved colours themselves, as far as they are readable on the page
  const exact = hslToHex(chosen.hue, chosen.sat, chosen.light)
  const fits = (c: string, m: PaletteMode) => Math.min(contrast(c, m.bg), contrast(c, m.surface), contrast(bestOn(c), c)) >= 4.5
  if (fits(exact, light)) light.accent = exact
  // a second colour that does not shout
  light.alt = hslToHex(chosen.altHue, Math.min(chosen.sat, 66), 47)
  dark.alt = hslToHex(chosen.altHue, Math.min(chosen.sat, 66), 62)
  const name = `${hueName(chosen.hue)} + ${hueName(chosen.altHue)} (evolved)`
  return {
    hue: Math.round(chosen.hue),
    harmony: 'evolved',
    palette: { name, light, dark },
    reasons: [`evolved colours: ${hueName(chosen.hue)} with ${hueName(chosen.altHue)} (${generations} generations of mixing and mutating, a palette that is on no list)`, `${defaultMode(theme)} first, contrast checked (WCAG AA) in both modes`],
  }
}

export type ColorPlan = { palette: Palette; hue: number; harmony: string; reasons: string[] }

/** how often the premium set is used: always a part of the sites, most of the premium ones (the normal colours stay beside it) */
const PREMIUM_SHARE: Record<Tier, number> = { normal: 0.2, better: 0.4, premium: 0.7 }

/** the prompt names a colour ("red", "gold"): that is the person's choice */
export const namesColor = (prompt: string): boolean => prompt.toLowerCase().split(/[^a-z]+/).some((w) => w in COLOR_WORDS)

export function thinkColors(prompt: string, theme: ThemeKey, rand: () => number, tier: Tier = 'normal'): ColorPlan {
  const mood = MOODS[theme]
  // a colour named in the prompt always wins; otherwise most sites get a hand-picked pair of colours (curatedPalettes.ts), the formula is the rest
  const named = prompt.toLowerCase().split(/[^a-z]+/).some((w) => w in COLOR_WORDS)
  // the premium set: a deep main colour with a metal or a soft neutral, on a calm page (premiumPalettes.ts)
  const premiumRoll = rand()
  if (!named && premiumRoll < PREMIUM_SHARE[tier]) {
    const options = premiumFor(theme, prompt)
    if (options.length) {
      let at = rand() * options.reduce((sum, o) => sum + o.weight, 0)
      const chosen = options.find((o) => (at -= o.weight) <= 0)?.palette ?? options[0].palette
      const palette = premiumToPalette(chosen)
      return {
        hue: Math.round(hexToHsl(chosen.accent).h),
        harmony: 'premium',
        palette,
        reasons: [`premium colours "${chosen.name}" (${hueName(hexToHsl(chosen.accent).h)} with ${hueName(hexToHsl(chosen.alt).h)}) on a calm ${chosen.neutral} page`, `${defaultMode(theme)} first, contrast checked (WCAG AA) in both modes`],
      }
    }
  }
  const temp = temperature()
  // the higher the creativity, the more often the colours are evolved instead of taken from the hand-picked list
  if (!named && rand() < 0.65 * temp) return evolvePalette(theme, rand, temp)
  const pool = curatedFor(theme)
  if (!named && pool.length && rand() < 0.8) {
    const pick = pool[Math.floor(rand() * pool.length)]
    const a = hexToHsl(pick.accent)
    const b = hexToHsl(pick.alt)
    const own: Mood = { ...mood, saturation: a.s, accentLight: a.l, accentDark: Math.min(78, a.l + 24) }
    const light = buildMode('light', a.h, b.h, own)
    const dark = buildMode('dark', a.h, b.h, own)
    // the hand-picked colours themselves, when they are readable on the page they are made for
    const fits = (c: string, m: PaletteMode) => Math.min(contrast(c, m.bg), contrast(c, m.surface), contrast(bestOn(c), c)) >= 4.5
    if (fits(pick.accent, light)) light.accent = pick.accent
    light.alt = pick.alt
    return {
      hue: Math.round(a.h),
      harmony: 'curated',
      palette: { name: pick.name, light, dark },
      reasons: [`hand-picked colours "${pick.name}" (${hueName(a.h)} with ${hueName(b.h)}), chosen for a ${theme.replace(/_/g, ' ')} site`, `${defaultMode(theme)} first, contrast checked (WCAG AA) in both modes`],
    }
  }
  const { hue, reason } = chooseHue(prompt, theme, rand)
  const harmony = HARMONIES[Math.floor(rand() * HARMONIES.length)]
  const altHue = wrap(hue + harmony.offset)
  const name = `${hueName(hue)} + ${hueName(altHue)} (${harmony.name})`

  return {
    hue: Math.round(hue),
    harmony: harmony.name,
    palette: { name, light: buildMode('light', hue, altHue, mood), dark: buildMode('dark', hue, altHue, mood) },
    reasons: [
      `hue ${Math.round(hue)}° ${hueName(hue)}: ${reason}`,
      `second colour ${hueName(altHue)}: ${harmony.name} harmony`,
      `${defaultMode(theme)} first, contrast checked (WCAG AA) in both modes`,
    ],
  }
}

// ───────────── changing a palette that already exists ─────────────
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l: l * 100 }
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: wrap(h * 60), s: s * 100, l: l * 100 }
}

/** the hue moves toward `target` by at most `step` degrees (the short way round) */
const hueToward = (hue: number, target: number, step: number) => {
  const diff = ((target - hue + 540) % 360) - 180
  return wrap(hue + Math.max(-step, Math.min(step, diff)))
}

export type PaletteChange = { accent?: string; alt?: string; harmony?: ('complementary' | 'analogous' | 'triadic' | 'split')[]; tones?: ('warmer' | 'cooler' | 'vibrant' | 'muted' | 'darker' | 'lighter')[] }

/**
 * The same palette with the person's changes: a new main colour (all the other colours follow its hue, contrast is checked again),
 * and tones: warmer / cooler turn the hue, vibrant / muted change the saturation, darker / lighter the lightness of the accent.
 */
export function recolor(palette: Palette, theme: ThemeKey, change: PaletteChange): Palette {
  if (!change.accent && !change.alt && !change.harmony?.length && !change.tones?.length) return palette
  const mood = { ...MOODS[theme] }
  const old = hexToHsl(palette.light.accent)
  const altOffset = wrap(hexToHsl(palette.light.alt).h - old.h)
  let hue = old.h
  let neutral = false
  if (change.accent) {
    const asked = hexToHsl(change.accent)
    hue = asked.h
    // grey, black and white have no hue: the palette keeps its own and the accent turns neutral
    neutral = asked.s < 12
    if (!neutral) mood.saturation = Math.max(35, Math.min(95, asked.s))
    else mood.saturation = 0
    // the lightness asked for counts too: navy is darker than sky blue
    if (!neutral) {
      mood.accentLight = Math.max(22, Math.min(55, asked.l))
      mood.accentDark = Math.max(52, Math.min(80, asked.l + 14))
    }
  }
  // a colour that goes with the main one: the hue turns round the colour wheel
  for (const kind of change.harmony ?? []) hue = wrap(hue + { complementary: 180, analogous: 30, triadic: 120, split: 150 }[kind])
  for (const tone of change.tones ?? []) {
    if (tone === 'warmer') hue = hueToward(hue, 28, 25)
    else if (tone === 'cooler') hue = hueToward(hue, 215, 25)
    else if (tone === 'vibrant') mood.saturation = Math.min(95, mood.saturation + 14)
    else if (tone === 'muted') mood.saturation = Math.max(18, mood.saturation - 18)
    else if (tone === 'darker') {
      mood.accentLight = Math.max(20, mood.accentLight - 8)
      mood.accentDark = Math.max(45, mood.accentDark - 8)
    } else if (tone === 'lighter') {
      mood.accentLight = Math.min(60, mood.accentLight + 8)
      mood.accentDark = Math.min(85, mood.accentDark + 8)
    }
  }
  const altHue = change.alt ? hexToHsl(change.alt).h : wrap(hue + altOffset)
  const next: Palette = { name: palette.name, light: buildMode('light', hue, altHue, mood), dark: buildMode('dark', hue, altHue, mood) }
  if (neutral && change.accent) {
    const { l } = hexToHsl(change.accent)
    // a neutral accent: near black on light backgrounds, near white on dark ones (decided by what was asked)
    const darkAccent = l < 50
    next.light.accent = darkAccent ? '#111827' : '#374151'
    next.dark.accent = darkAccent ? '#e5e7eb' : '#f9fafb'
  }
  next.name = `${hueName(hue)} + ${hueName(altHue)} (edited)`
  return next
}

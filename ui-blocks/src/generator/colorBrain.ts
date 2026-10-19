// Colour brain: thinks up a palette for the prompt instead of picking one from a fixed list.
//
//   1. hue      : a colour named in the prompt ("red", "gold") wins, then business clues ("tea" -> green,
//                 "boxing" -> red), otherwise the theme's own hue range
//   2. harmony  : a second hue is chosen (analogous / complementary / triad / split) for gradients
//   3. mood     : the theme sets saturation and lightness, light and dark mode are both generated
//   4. safety   : lightness is adjusted until text, muted text, accent and button text pass WCAG contrast
//
// Everything is seeded, so the same prompt always gives the same palette.
import { fromKits } from './kits'
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
    const hue = LIVELY[Math.floor(rand() * LIVELY.length)]
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

export type ColorPlan = { palette: Palette; hue: number; harmony: string; reasons: string[] }

export function thinkColors(prompt: string, theme: ThemeKey, rand: () => number): ColorPlan {
  const mood = MOODS[theme]
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

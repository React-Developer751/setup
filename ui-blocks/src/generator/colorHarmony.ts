// Does a pair of colours (the main colour and the second colour) look good together? The colour brain makes thousands of pairs; some of them
// are neon next to a saturated main colour, or two loud colours of the same lightness that vibrate, or an awkward in-between hue gap. This file
// finds those pairs and repairs them the way a designer would: the second colour gets quieter and lighter or darker than the main one.
//   pairIssues : what is wrong with a pair (a list of names, empty = fine)
//   harmonisePalette : the repaired palette (the main colour keeps its hue; the second colour is changed as little as possible)
//   pairScore : 0..1, used when several designs are compared
import { contrast, hexToHsl } from './colorBrain'
import type { Palette, PaletteMode } from './themes'

const wrap = (h: number) => ((h % 360) + 360) % 360
export const hueGap = (a: number, b: number) => {
  const d = Math.abs(wrap(a) - wrap(b))
  return d > 180 ? 360 - d : d
}

export function hslToHex(h: number, s: number, l: number): string {
  const sat = Math.max(0, Math.min(100, s)) / 100
  const light = Math.max(0, Math.min(100, l)) / 100
  const a = sat * Math.min(light, 1 - light)
  const channel = (n: number) => {
    const k = (n + wrap(h) / 30) % 12
    return Math.round((light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255).toString(16).padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

/** yellow-green: a muddy olive on a page, rarely a brand colour. Businesses that want calm, trust or luxury do not wear it (unless the person asks). */
export const LIME_BAND: [number, number] = [62, 118]
const CALM_THEMES = new Set(['luxury_minimal', 'professional_services', 'healthcare', 'real_estate', 'beauty_wellness', 'events_wedding', 'fashion_retail', 'education', 'general_business', 'modern_tech', 'travel_tourism', 'automotive', 'home_services', 'food_dining'])
export const avoidsLime = (theme: string): boolean => CALM_THEMES.has(theme)
export const inLimeBand = (hex: string): boolean => {
  const c = hexToHsl(hex)
  return c.s > 35 && c.h >= LIME_BAND[0] && c.h <= LIME_BAND[1]
}
/** the nearest hue outside the yellow-green band: gold below it, emerald above it */
const outOfLime = (h: number) => (h >= 92 ? 150 : 46)

export type PairIssue = 'neon' | 'vibrate' | 'awkward' | 'loud'

/** the problems of a pair of colours (main, second) */
export function pairIssues(accent: string, alt: string): PairIssue[] {
  const a = hexToHsl(accent)
  const b = hexToHsl(alt)
  const gap = hueGap(a.h, b.h)
  const issues: PairIssue[] = []
  // a second colour that shouts: neon yellow and green, or any colour near full saturation
  if ((b.s > 72 && b.l >= 42 && b.l <= 70 && b.h >= 48 && b.h <= 150) || (b.s > 88 && b.l > 45)) issues.push('neon')
  // two loud colours of the same lightness make the edge between them flicker
  if (a.s > 65 && b.s > 65 && Math.abs(a.l - b.l) < 12 && gap >= 40 && gap <= 200) issues.push('vibrate')
  // two strong colours a third of the wheel apart: neither a neighbour nor an opposite
  if (gap >= 55 && gap <= 115 && a.s > 70 && b.s > 70) issues.push('awkward')
  // a main colour at full strength (a light tint of the dark mode is not)
  if (a.s > 82 && a.l > 38 && a.l <= 58) issues.push('loud')
  return issues
}

/** 1 = a pair a designer would keep, lower = the more problems the lower */
export const pairScore = (accent: string, alt: string): number => Math.max(0.25, 1 - 0.25 * pairIssues(accent, alt).length)

/** the second colour of a pair, repaired (the hue stays unless it is the neon yellow-green) */
function repairAlt(accent: string, alt: string, mode: 'light' | 'dark', bg: string): string {
  if (!pairIssues(accent, alt).some((i) => i !== 'loud')) return alt
  const a = hexToHsl(accent)
  const b = hexToHsl(alt)
  const gap = hueGap(a.h, b.h)
  // a neighbour or an opposite may be strong; the awkward middle and the neon colours are quiet partners
  let sat = gap <= 45 ? Math.min(b.s, 64) : gap >= 140 ? Math.min(b.s, 62) : Math.min(b.s, 42)
  if (b.h >= 48 && b.h <= 150) sat = Math.min(sat, 52)
  // clear lightness gap to the main colour, in the direction the page needs
  let light = b.l
  if (Math.abs(light - a.l) < 14) light = mode === 'light' ? (a.l > 45 ? a.l - 16 : a.l + 18) : a.l > 60 ? a.l - 16 : a.l + 14
  light = mode === 'light' ? Math.max(34, Math.min(66, light)) : Math.max(50, Math.min(76, light))
  let hex = hslToHex(b.h, sat, light)
  // it still has to be seen on the page
  for (let i = 0; i < 12 && contrast(hex, bg) < 3; i += 1) {
    light += mode === 'light' ? -3 : 3
    hex = hslToHex(b.h, sat, Math.max(18, Math.min(88, light)))
  }
  return hex
}

function harmoniseMode(m: PaletteMode, mode: 'light' | 'dark'): PaletteMode {
  let accent = m.accent
  const a = hexToHsl(accent)
  // a main colour at full strength is toned down a little (it must stay readable with its button text)
  if (a.s > 82 && a.l > 38 && a.l <= 58) {
    const bestOn = (c: string) => (contrast('#ffffff', c) >= contrast('#0a0a0a', c) ? '#ffffff' : '#0a0a0a')
    const reads = (c: string) => Math.min(contrast(c, m.bg), contrast(c, m.surface), contrast(bestOn(c), c)) >= 4.5
    for (const sat of [76, 70]) {
      let light = a.l
      let quieter = hslToHex(a.h, sat, light)
      for (let i = 0; i < 10 && !reads(quieter); i += 1) {
        light += mode === 'light' ? -2 : 2
        quieter = hslToHex(a.h, sat, light)
      }
      if (reads(quieter)) {
        accent = quieter
        break
      }
    }
  }
  return { ...m, accent, alt: repairAlt(accent, m.alt, mode, m.bg) }
}

/** the second hue of a computed pair: a neighbour (about 30 degrees) or the opposite, never the awkward third of the wheel between them (pink with green, red with olive) */
function rotateAlt(m: PaletteMode): PaletteMode {
  const a = hexToHsl(m.accent)
  const b = hexToHsl(m.alt)
  const gap = hueGap(a.h, b.h)
  if (gap <= 50 || gap >= 160 || b.s < 25) return m
  const sign = wrap(b.h - a.h) < 180 ? 1 : -1
  // the nearer of the two good places
  const target = gap < 105 ? wrap(a.h + sign * 35) : wrap(a.h + sign * 180)
  return { ...m, alt: hslToHex(target, b.s, b.l) }
}

/** a palette whose pairs of colours are repaired (light and dark mode each) */
export function harmonisePalette(palette: Palette, options: { theme?: string; keepHue?: boolean; /** a pair chosen by a designer (curated, premium) keeps its second hue */ trusted?: boolean } = {}): Palette {
  let source = palette
  if (!options.trusted) source = { ...palette, light: rotateAlt(palette.light), dark: rotateAlt(palette.dark) }
  // yellow-green is moved to gold or emerald for the business types that want calm colours (not when the person named a colour)
  if (!options.keepHue && options.theme && avoidsLime(options.theme) && (inLimeBand(palette.light.accent) || inLimeBand(palette.dark.accent))) {
    const move = (m: PaletteMode): PaletteMode => {
      const c = hexToHsl(m.accent)
      const target = outOfLime(c.h)
      let light = c.l
      let accent = hslToHex(target, c.s, light)
      const bestOn = (x: string) => (contrast('#ffffff', x) >= contrast('#0a0a0a', x) ? '#ffffff' : '#0a0a0a')
      for (let i = 0; i < 14 && Math.min(contrast(accent, m.bg), contrast(accent, m.surface), contrast(bestOn(accent), accent)) < 4.5; i += 1) {
        light += c.l > 50 ? 2 : -2
        accent = hslToHex(target, c.s, Math.max(14, Math.min(88, light)))
      }
      const a = hexToHsl(m.alt)
      return { ...m, accent, alt: a.s > 35 && a.h >= LIME_BAND[0] && a.h <= LIME_BAND[1] ? hslToHex(outOfLime(a.h), a.s, a.l) : m.alt }
    }
    source = { ...palette, light: move(palette.light), dark: move(palette.dark) }
  }
  // the second colour in yellow-green is moved the same way (a retro bakery with a lime second colour was the case that showed it)
  if (!options.keepHue && options.theme && avoidsLime(options.theme)) {
    const fixAlt = (m: PaletteMode): PaletteMode => {
      const b = hexToHsl(m.alt)
      if (!(b.s > 35 && b.h >= LIME_BAND[0] && b.h <= LIME_BAND[1])) return m
      const accentHue = hexToHsl(m.accent).h
      const gold = hueGap(46, accentHue)
      const green = hueGap(150, accentHue)
      return { ...m, alt: hslToHex(gold <= green ? 46 : 150, Math.min(b.s, 56), b.l) }
    }
    source = { ...source, light: fixAlt(source.light), dark: fixAlt(source.dark) }
  }
  return { ...source, light: harmoniseMode(source.light, 'light'), dark: harmoniseMode(source.dark, 'dark') }
}

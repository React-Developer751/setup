// The premium colour set: refined pairs of colours, the way a luxury brand would choose them. A deep, quiet main colour (ink, emerald, burgundy,
// sapphire, plum ...) with a metal or a soft neutral as the second colour (gold, brass, copper, champagne, silver, rose gold), on near-neutral warm or
// cool pages instead of the tinted pages of the normal colours. The set is stored in src/data/premiumPalettes.json; palettes that people add (the
// server database, /api/palettes) join it at run time (registerPremium). Every palette is built for light and dark mode and checked for contrast.
import { contrast, hexToHsl } from './colorBrain'
import { hslToHex } from './colorHarmony'
import stored from '../data/premiumPalettes.json'
import type { Palette, PaletteMode, ThemeKey } from './themes'

export type PremiumNeutral = 'ivory' | 'pearl' | 'sand' | 'mist' | 'blush' | 'graphite'
export type PremiumPalette = { id: string; name: string; accent: string; alt: string; neutral: PremiumNeutral; themes: (ThemeKey | 'any')[]; tags: string[] }

/** the page colours of each neutral: background, cards, borders, text, quiet text (light mode, then dark mode) */
const NEUTRALS: Record<PremiumNeutral, { light: [string, string, string, string, string]; dark: [string, string, string, string, string] }> = {
  ivory: { light: ['#faf7f2', '#ffffff', '#e8e1d6', '#1c1917', '#5c554d'], dark: ['#100e0b', '#1a1713', '#2f2a23', '#f6f2ea', '#b8afa0'] },
  pearl: { light: ['#f6f7f9', '#ffffff', '#e2e6ec', '#0f172a', '#505a6b'], dark: ['#0a0d13', '#131722', '#252b39', '#f1f4f9', '#a6aebd'] },
  sand: { light: ['#f5f0e8', '#fdfbf7', '#e4dacb', '#26211b', '#5e5547'], dark: ['#14110d', '#1d1913', '#352e24', '#f3ede3', '#b5aa97'] },
  mist: { light: ['#f3f6f4', '#fcfdfc', '#dce4df', '#14201a', '#4c5b52'], dark: ['#0b100d', '#131a16', '#222d27', '#eef3f0', '#a2b1a8'] },
  blush: { light: ['#faf5f4', '#fffdfc', '#ecdcd9', '#2a1c1c', '#6a5252'], dark: ['#130d0d', '#1d1414', '#3a2a2a', '#f7eeed', '#bfa8a6'] },
  graphite: { light: ['#f4f4f5', '#ffffff', '#e0e0e3', '#18181b', '#52525b'], dark: ['#09090b', '#131315', '#27272a', '#f4f4f5', '#a1a1aa'] },
}

const bestOn = (bg: string) => (contrast('#ffffff', bg) >= contrast('#0a0a0a', bg) ? '#ffffff' : '#0a0a0a')

/** the main colour, moved (same hue, same strength) until it reads on the page, on the cards and carries its button text */
function readable(accent: string, bg: string, surface: string, dark: boolean): string {
  const { h, s, l } = hexToHsl(accent)
  let light = dark ? Math.max(l, 55) : l
  let hex = hslToHex(h, s, light)
  const passes = (c: string) => Math.min(contrast(c, bg), contrast(c, surface), contrast(bestOn(c), c)) >= 4.5
  for (let i = 0; i < 40 && !passes(hex); i += 1) {
    light += dark ? 2 : -2
    hex = hslToHex(h, s, Math.max(14, Math.min(88, light)))
  }
  return hex
}

function mode(def: PremiumPalette, which: 'light' | 'dark'): PaletteMode {
  const [bg, surface, border, text, muted] = NEUTRALS[def.neutral][which]
  const dark = which === 'dark'
  const accent = readable(def.accent, bg, surface, dark)
  // the second colour is a metal or a soft neutral: in the dark it is a little lighter, it only has to be seen (3:1)
  const alt0 = hexToHsl(def.alt)
  let alt = def.alt
  if (dark && alt0.l < 50) alt = hslToHex(alt0.h, alt0.s, 62)
  for (let i = 0; i < 14 && contrast(alt, bg) < 3; i += 1) alt = hslToHex(alt0.h, alt0.s, Math.max(10, Math.min(92, hexToHsl(alt).l + (dark ? 4 : -4))))
  return { bg, surface, border, text, muted, accent, alt }
}

/** the palette of the colour brain's format (light and dark mode) */
export function premiumToPalette(def: PremiumPalette): Palette {
  return { name: `${def.name} (premium)`, light: mode(def, 'light'), dark: mode(def, 'dark') }
}

const extra: PremiumPalette[] = []
export const premiumSet = (): PremiumPalette[] => [...(stored as PremiumPalette[]), ...extra]

const HEX = /^#[0-9a-f]{6}$/i
/** a palette that was added to the database (checked: colours, a neutral, a name) */
export function registerPremium(list: unknown): number {
  let added = 0
  if (!Array.isArray(list)) return 0
  for (const p of list as Partial<PremiumPalette>[]) {
    if (!p || typeof p.id !== 'string' || typeof p.name !== 'string' || !HEX.test(p.accent ?? '') || !HEX.test(p.alt ?? '') || !(p.neutral && p.neutral in NEUTRALS)) continue
    if (premiumSet().some((x) => x.id === p.id)) continue
    extra.push({ id: p.id, name: p.name.slice(0, 40), accent: p.accent!.toLowerCase(), alt: p.alt!.toLowerCase(), neutral: p.neutral, themes: Array.isArray(p.themes) && p.themes.length ? p.themes : ['any'], tags: Array.isArray(p.tags) ? p.tags.map(String).slice(0, 8) : [] })
    added += 1
  }
  return added
}

/** the premium palettes that suit a business type; the words of the prompt (jewellery, hotel ...) make some of them more likely */
export function premiumFor(theme: ThemeKey, prompt: string): { palette: PremiumPalette; weight: number }[] {
  const words = new Set(prompt.toLowerCase().split(/[^a-z]+/).filter(Boolean))
  return premiumSet()
    .filter((p) => p.themes.includes(theme) || p.themes.includes('any'))
    .map((p) => ({ palette: p, weight: 1 + 2.5 * p.tags.filter((t) => t.split(' ').every((w) => words.has(w))).length }))
}

/** the premium palettes in the server database join the set (once per page; without a server the shipped set is all there is) */
let loaded: Promise<number> | undefined
export function loadServerPalettes(): Promise<number> {
  loaded ??= (async () => {
    try {
      const res = await fetch('/api/palettes', { signal: AbortSignal.timeout(4000) })
      return res.ok ? registerPremium(((await res.json()) as { palettes: unknown }).palettes) : 0
    } catch {
      return 0
    }
  })()
  return loaded
}

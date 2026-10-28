// "Is this a good set of colours for this website?" Every palette is judged before a site uses it, the way a designer looks at a swatch:
// can the text be read, is the main colour neither neon nor muddy, do the two colours sit together, does the hue suit the business,
// is the page background clean. A palette that scores low is replaced by the best of several others (see generateWebsite.ts).
//   judgePalette : { score 0..1, problems[] }
import { allowedBand, contrast, hexToHsl, inBand, namesColor } from './colorBrain'
import { hueGap, pairIssues } from './colorHarmony'
import type { Palette, PaletteMode } from './themes'
import type { ThemeKey } from './themes'

export type Judgement = { score: number; problems: string[] }

/** serious businesses do not wear pink-purple; food does not wear violet or blue; (a colour named in the prompt overrides all of it) */
const CALM = new Set<string>(['healthcare', 'professional_services', 'real_estate', 'education', 'general_business', 'home_services', 'luxury_minimal'])
const FOOD = new Set<string>(['food_dining'])
const MAGENTA: [number, number] = [285, 345]
const COLD: [number, number] = [215, 290]
const PLAYFUL = new Set<string>(['playful_vibrant', 'creative_studio', 'bold_fitness'])
const VIOLET_OK = new Set<string>(['modern_tech', 'education', 'creative_studio', 'playful_vibrant'])
const within = (h: number, [lo, hi]: [number, number]) => h >= lo && h <= hi

const bestOn = (c: string) => (contrast('#ffffff', c) >= contrast('#0a0a0a', c) ? '#ffffff' : '#0a0a0a')

function judgeMode(m: PaletteMode, label: string, problems: string[]): number {
  let penalty = 0
  const note = (cost: number, text: string) => {
    penalty += cost
    problems.push(`${label}: ${text}`)
  }
  if (contrast(m.text, m.bg) < 7) note(0.3, 'the text is hard to read on the page')
  if (contrast(m.muted, m.bg) < 4.5) note(0.15, 'the grey text is too faint')
  if (contrast(m.text, m.surface) < 6) note(0.15, 'the text is hard to read on the cards')
  if (contrast(bestOn(m.accent), m.accent) < 4.5) note(0.2, 'the button text is hard to read on the main colour')
  if (contrast(m.accent, m.bg) < 3) note(0.2, 'the main colour almost vanishes on the page')
  const a = hexToHsl(m.accent)
  if (a.s > 88) note(0.15, 'the main colour is neon')
  if (a.s < 18 && label === 'light') note(0.05, 'the main colour is grey')
  const bg = hexToHsl(m.bg)
  // a page background that is a strong colour of its own (not white, not near-black, not a pale tint)
  if (bg.s > 38 && bg.l > 20 && bg.l < 80) note(0.15, 'the page background is muddy')
  const issues = pairIssues(m.accent, m.alt)
  if (issues.length) note(0.08 * issues.length, `the two colours do not sit well (${issues.join(', ')})`)
  return penalty
}

export function judgePalette(palette: Palette, theme: ThemeKey, prompt: string): Judgement {
  const problems: string[] = []
  let penalty = judgeMode(palette.light, 'light', problems) * 0.6 + judgeMode(palette.dark, 'dark', problems) * 0.4
  const a = hexToHsl(palette.light.accent)
  const b = hexToHsl(palette.light.alt)
  if (!namesColor(prompt)) {
    const wide = allowedBand(prompt, theme)
    // the range of a business type is widened by 35 degrees for the colour brain; the judge keeps closer to the type
    const band = wide.source.endsWith('range') ? { ...wide, lo: wide.lo + 27, hi: wide.hi - 27 } : wide
    if (a.s > 20 && !inBand(a.h, band)) {
      penalty += 0.45
      problems.push(`the main colour does not suit this business (${band.source})`)
    }
    if (a.s > 25 && CALM.has(theme) && within(a.h, MAGENTA)) {
      penalty += 0.4
      problems.push('pink-purple for a serious business')
    }
    if (b.s > 30 && CALM.has(theme) && within(b.h, MAGENTA) && hueGap(a.h, b.h) > 40) {
      penalty += 0.25
      problems.push('a pink-purple second colour for a serious business')
    }
    if (a.s > 25 && FOOD.has(theme) && within(a.h, COLD)) {
      penalty += 0.2
      problems.push('a cold blue-violet for a food business')
    }
    // a yellow-green second colour looks like a highlighter next to almost any main colour
    if (b.s > 35 && b.h >= 62 && b.h <= 125 && hueGap(a.h, b.h) > 40 && !PLAYFUL.has(theme)) {
      penalty += 0.2
      problems.push('a lime second colour')
    }
    // violet is for technology, schools and creative studios
    if (a.s > 30 && a.h >= 255 && a.h <= 290 && !VIOLET_OK.has(theme)) {
      penalty += 0.15
      problems.push('violet for a business that is not creative or technical')
    }
    // two strong colours that are far apart: a clash
    if (a.s > 60 && b.s > 60 && hueGap(a.h, b.h) > 60 && !(b.h >= 25 && b.h <= 55)) {
      penalty += 0.15
      problems.push('two strong colours far apart on the colour wheel')
    }
  }
  return { score: Math.max(0, 1 - penalty), problems }
}

/** below this a palette is replaced when a better one can be found */
export const GOOD_ENOUGH = 0.88

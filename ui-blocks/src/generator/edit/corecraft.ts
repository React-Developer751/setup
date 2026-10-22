// Core-Craft AI (the `cont` folder: a small Python Content AI trained on 172 real websites) as a second opinion for three texts of the first screen.
// It is an extra, never the default: its pages come from a coarse 7-niche model and often talk about something else than the business of the
// person ("Find rings you will love" for a hardware store), so every line passes this gate before it is offered:
//   - its niche must be one this business type belongs to (a "shop" page is not for a clinic),
//   - the line must name the business of the prompt (a line that could be on any page is no use),
//   - sizes, no numbers or links, no corporate button texts ("Learn more", "Download the app"), no lines that end on a group of people without "for".
import type { TextField } from './edits'
import type { ThemeKey } from '../themes'

export type CoreCandidate = { seed: number; niche: string; brand: string; hero_heading: string; tagline: string; cta_primary: string; cta_secondary: string; cta_text: string }
export type CoreSlot = Extract<TextField, 'heroTitle' | 'heroSubtitle' | 'heroButton'>
export type Suggestion = { slot: CoreSlot; text: string; niche: string }
export type Rejection = { slot: CoreSlot; text: string; reason: string }
export type GateContext = {
  theme: ThemeKey
  /** the business of the prompt ("pizza shop") */
  subject: string
  prompt: string
  /** what the page says now, and texts that were turned down */
  current: Partial<Record<CoreSlot, string>>
  avoid?: string[]
}

/** the business types a Core-Craft niche can talk about ("business" is its catch-all: it fits any type, the relevance check does the rest) */
export const NICHE_THEMES: Record<string, ThemeKey[] | 'any'> = {
  restaurant: ['food_dining', 'organic_nature'],
  fitness: ['bold_fitness', 'beauty_wellness'],
  tech: ['modern_tech'],
  portfolio: ['creative_studio'],
  education: ['education'],
  shop: ['fashion_retail', 'playful_vibrant', 'general_business'],
  business: 'any',
}

const GENERIC_WORDS = new Set(['shop', 'store', 'company', 'business', 'website', 'site', 'page', 'online', 'services', 'service', 'agency', 'studio', 'centre', 'center', 'firm', 'create', 'make', 'build', 'called', 'named', 'please', 'simple', 'modern', 'good', 'best', 'new'])
/** the content words of the prompt that a line has to name */
export function subjectWords(subject: string, prompt: string): string[] {
  const head = prompt.split(/\b(?:called|named|naam)\b/i)[0]
  return [...new Set(`${subject} ${head}`.toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 4 && !GENERIC_WORDS.has(w)))]
}
const mentions = (text: string, words: string[]) => {
  const t = text.toLowerCase().split(/[^a-z]+/).filter(Boolean)
  return words.some((w) => t.some((x) => x.startsWith(w.slice(0, Math.max(4, w.length - 2))) || w.startsWith(x.slice(0, Math.max(4, x.length - 2)))))
}

const PEOPLE_END = /\b(People|Families|Lifters|Growers|Tasters|Eaters|Athletes|Members|Patients|Lovers|Beginners|Pros|Owners|Kids|Students|Guests|users|customers|teams)[.!]?$/i
const CORPORATE_BUTTON = /learn more|read more|read (?:the )?story|watch|download|app\b|find (?:a|your)|view map|compare|sign|log ?in|help center|join (?:our|as)|see all|view all|explore \w+|get \w+ for free|nutrition|careers?/i
/** the action a button of a business type may start with (Core-Craft learned its buttons from big brands: "Start Free" for a dental clinic is no use) */
const THEME_VERBS: Partial<Record<ThemeKey, RegExp>> = {
  food_dining: /^(order|reserve|book|view|visit)\b/i, bold_fitness: /^(join|book|start|visit)\b/i, modern_tech: /^(get|start|try|request|book)\b/i, education: /^(enrol+|book|start|join|view)\b/i,
  healthcare: /^(book|call|contact|request)\b/i, beauty_wellness: /^(book|call|contact|reserve)\b/i, home_services: /^(book|call|contact|request|get a)\b/i, professional_services: /^(book|call|contact|request|get a)\b/i,
  fashion_retail: /^(shop|browse|view|buy|visit)\b/i, playful_vibrant: /^(shop|browse|view|buy|visit)\b/i, creative_studio: /^(see|view|start|book|contact)\b/i,
}
const DEFAULT_VERBS = /^(contact|call|visit|get a)\b/i
const AWKWARD_FRAME = /^(all about|made around)\b/i

const bounds: Record<CoreSlot, [number, number]> = { heroTitle: [12, 58], heroSubtitle: [30, 150], heroButton: [5, 26] }

/** why a line of Core-Craft is not offered; undefined when it is fine */
export function refuse(slot: CoreSlot, text: string, ctx: GateContext): string | undefined {
  const t = text.trim()
  const [min, max] = bounds[slot]
  if (t.length < min || t.length > max) return `the length is not right for this place (${t.length} letters)`
  if (/\d|%|https?:|@|www\./i.test(t)) return 'it has numbers or links'
  if (ctx.current[slot]?.toLowerCase() === t.toLowerCase() || (ctx.avoid ?? []).some((a) => a.toLowerCase() === t.toLowerCase())) return 'the page has this line already (or it was turned down)'
  if (PEOPLE_END.test(t) && !/\bfor\b/i.test(t)) return 'it ends on a group of people without "for"'
  if (slot === 'heroButton') {
    if (CORPORATE_BUTTON.test(t)) return 'a corporate button text (it fits a big brand, not a local business)'
    if (!(THEME_VERBS[ctx.theme] ?? DEFAULT_VERBS).test(t)) return `it does not start with an action that fits a "${ctx.theme.replace(/_/g, ' ')}" site`
    if (/\bfree\b/i.test(t) && ctx.theme !== 'modern_tech' && ctx.theme !== 'education') return 'it promises something free that this business did not say'
    return undefined
  }
  if (slot === 'heroTitle' && AWKWARD_FRAME.test(t)) return 'an awkward frame ("All about shoe")'
  const words = subjectWords(ctx.subject, ctx.prompt)
  if (!words.length) return 'nothing in the prompt to tie the line to'
  if (!mentions(t, words)) return `it does not name your business (${words.slice(0, 3).join(', ')}); it could be on any page`
  return undefined
}

/** which lines of Core-Craft's pages are offered for the first screen, and why the others are not */
export function gateCandidates(candidates: CoreCandidate[], ctx: GateContext): { accepted: Suggestion[]; rejected: Rejection[] } {
  const accepted: Suggestion[] = []
  const rejected: Rejection[] = []
  const seen = new Set<string>()
  for (const c of candidates) {
    const fits = NICHE_THEMES[c.niche]
    const lines: [CoreSlot, string][] = [['heroTitle', c.hero_heading], ['heroSubtitle', c.tagline], ['heroButton', c.cta_primary]]
    for (const [slot, text] of lines) {
      const key = `${slot}|${text.toLowerCase()}`
      if (!text || seen.has(key)) continue
      seen.add(key)
      const why = fits === undefined ? `Core-Craft read your business as "${c.niche}", which this project does not know` : fits !== 'any' && !fits.includes(ctx.theme) ? `Core-Craft read your business as "${c.niche}", but your site is "${ctx.theme.replace(/_/g, ' ')}"` : refuse(slot, text, ctx)
      if (why) rejected.push({ slot, text, reason: why })
      else accepted.push({ slot, text, niche: c.niche })
    }
  }
  return { accepted, rejected }
}

/** pages of copy from Core-Craft through the server of this project; undefined when it is not running */
export async function askCoreCraft(prompt: string, n = 8): Promise<CoreCandidate[] | undefined> {
  try {
    const res = await fetch(`/api/corecraft?prompt=${encodeURIComponent(prompt)}&n=${n}`, { signal: AbortSignal.timeout(25_000) })
    if (!res.ok) return undefined
    return ((await res.json()) as { candidates: CoreCandidate[] }).candidates
  } catch {
    return undefined
  }
}

export async function coreCraftUp(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(2500) })
    return res.ok && !!((await res.json()) as { corecraft?: boolean }).corecraft
  } catch {
    return false
  }
}

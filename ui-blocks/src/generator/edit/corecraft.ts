// Core-Craft AI (the `cont` folder: a small Python Content AI trained on 172 real websites) as a second opinion for three texts of the first screen.
// It is an extra, never the default: its pages come from a coarse 7-niche model and often talk about something else than the business of the
// person ("Find rings you will love" for a hardware store), so every line passes this gate before it is offered:
//   - its niche must be one this business type belongs to (a "shop" page is not for a clinic),
//   - the line must name the business of the prompt (a line that could be on any page is no use),
//   - sizes, no numbers or links, no corporate button texts ("Learn more", "Download the app"), no lines that end on a group of people without "for".
import type { CoreBlocks, EditOp, TextField } from './edits'
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
/** Core-Craft finds the place in English prompts ("... in Pune" at the end): "Pune mein" is moved there for it */
export const forCore = (prompt: string) => {
  const found = /\b([A-Z][\p{L}]+)\s+(?:mein|me|main|mai|ke\s+liye|ke\s+lie)\b/u.exec(prompt)
  return found ? `${prompt.replace(found[0], '').replace(/\s{2,}/g, ' ').trim()} in ${found[1]}` : prompt
}

export async function askCoreCraft(prompt: string, n = 8): Promise<CoreCandidate[] | undefined> {
  try {
    const res = await fetch(`/api/corecraft?prompt=${encodeURIComponent(forCore(prompt))}&n=${n}`, { signal: AbortSignal.timeout(25_000) })
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

// ───────────── a whole page from Core-Craft AI ─────────────
// Core-Craft's newer engine writes copy about what the person says: the services they list, their place, and Hindi for a Devanagari prompt (names and
// labels included). This project's own engine is better where a hand-written text pack exists, but it cannot write Hindi and, for a business without a
// pack, pads the page with texts of the business type next to it (a pottery studio with "Same-Day Car Care Plans"). decideCore says when the page is used.
export type CorePage = {
  brand: string
  lang: 'en' | 'hi'
  business_type: string
  type_label: string
  location: string
  hero_heading: string
  tagline: string
  about_title: string
  about: string[]
  features_title: string
  features: { title: string; text: string }[]
  highlights: { title: string; text: string }[]
  steps_title: string
  steps: { title: string; text: string }[]
  faq: { q: string; a: string }[]
  cta_primary: string
  cta_secondary: string
  cta_title: string
  faq_title?: string
  /** what Core-Craft did not invent (prices, phone, e-mail, address ...) */
  missing?: string[]
  prices?: { name: string; price: string }[]
  offers?: { id: string; text: string }[]
  hours?: string
  ui: Record<string, string>
  generated_by: { business_type: string; mode: string; items_from_prompt: string[] }
  needs_review: string[]
}

export type CoreOurs = { niche?: string; heroTitle: string; subject: string; theme: ThemeKey; prompt: string; brand: string }
export type CoreDecision = { use: boolean; reason: string; blocks?: CoreBlocks; /** the business name, when the prompt gave it in Devanagari */ rename?: string; /** sections that would stay in English (team, prices, reviews ...): a Hindi page does not show them */ hide?: EditOp[]; review: string[] }

const HI_NAV = { home: 'होम', services: 'सेवाएं', gallery: 'गैलरी', blog: 'ब्लॉग' }
const HI_LABELS = { learnMore: 'और जानें', welcome: 'आपका स्वागत है' }

/** a page of Core-Craft AI for one prompt (undefined when it is not running or cannot write one) */
export async function askCorePage(prompt: string): Promise<CorePage | undefined> {
  try {
    const res = await fetch(`/api/corecraft/page?prompt=${encodeURIComponent(forCore(prompt))}`, { signal: AbortSignal.timeout(25_000) })
    return res.ok ? ((await res.json()) as { page: CorePage }).page : undefined
  } catch {
    return undefined
  }
}

/** words that mark a name in a prompt (नाम "X", called X): Core-Craft sometimes takes them for a service */
const NAME_MARKERS = new Set(['नाम', 'naam', 'name', 'named', 'called', 'brand'])
/** a line that repeats a word group ("... में ब्रेसेज़ ... — दिल्ली में") or holds a name marker is a broken frame: the built-in line stays */
const garbled = (line: string) => {
  const words = line.toLowerCase().split(/[^\p{L}\p{M}]+/u).filter((w) => w.length > 1)
  return words.some((w) => NAME_MARKERS.has(w)) || /(.{6,}?)\s*—\s*.*\1/u.test(line)
}
/** an offer or a condition ("free shipping above 999", "7 day returns") is not a service: Core-Craft sometimes lists it as one */
const OFFER = /free (?:shipping|delivery|trial)|cash on delivery|\bcod\b|\d+[- ]?day|returns?\b|% off|above \d|over \d|discount/i
const cards = (page: CorePage) => [...page.features.filter((f) => !NAME_MARKERS.has(f.title.trim().toLowerCase()) && !OFFER.test(f.title) && !(page.type_label && page.type_label.trim().toLowerCase() === f.title.trim().toLowerCase())), ...page.highlights.filter((h) => !page.features.some((f) => f.title.toLowerCase() === h.title.toLowerCase()))].slice(0, 6)

export function decideCore(page: CorePage, ours: CoreOurs): CoreDecision {
  const review = page.needs_review ?? []
  const hindi = page.lang === 'hi'
  const strict = /^strict/i.test(page.generated_by?.mode ?? '')
  const items = (page.generated_by?.items_from_prompt ?? []).filter((i) => !OFFER.test(i))
  if (!page.features?.length || !page.about?.length) return { use: false, reason: 'Core-Craft returned an incomplete page', review }
  if (hindi) {
    const t = (en: string, hi: string) => (hi ? hi : en)
    const ui = page.ui ?? {}
    const blocks: CoreBlocks = {
      lang: 'hi',
      labels: HI_LABELS,
      hero: { title: garbled(page.hero_heading) ? [page.brand, page.location].filter(Boolean).join(' — ') : page.hero_heading, subtitle: garbled(page.tagline) ? [cards(page).slice(0, 4).map((f) => f.title).join(', '), page.location].filter(Boolean).join(' — ') : page.tagline, button: page.cta_primary },
      features: { title: page.features_title, items: cards(page) },
      about: { title: page.about_title, paragraphs: page.about, points: page.highlights.map((h) => h.title).slice(0, 3) },
      steps: { title: page.steps_title, items: page.steps },
      faq: page.faq,
      cta: { title: page.cta_title, button: page.cta_primary },
      titles: { features: page.features_title, steps: page.steps_title, faq: ui.faq_title, pricing: ui.pricing, team: ui.team, testimonials: ui.testimonials, contact: ui.contact, gallery: HI_NAV.gallery, blog: HI_NAV.blog, cta: page.cta_title },
      navLabels: { home: HI_NAV.home, about: t('About', ui.about), services: HI_NAV.services, pricing: ui.pricing, team: ui.team, gallery: HI_NAV.gallery, blog: HI_NAV.blog, faq: ui.faq, contact: ui.contact },
    }
    const named = /[ऀ-ॿ]/.test(page.brand) && page.brand !== ours.brand ? page.brand : undefined
    // the built-in AI has these only in English (names of a team, prices, reviews of sample customers): a Hindi page without them is better than a half English one
    const hide: EditOp[] = [...(['stats', 'gallery', 'pricing', 'team', 'testimonials', 'blog'] as const).map((section) => ({ op: 'remove', section }) as EditOp), ...(['pricing', 'team', 'gallery', 'blog'] as const).map((page) => ({ op: 'removePage', page }) as EditOp)]
    return { use: true, reason: 'the prompt is in Hindi: Core-Craft writes the page in Hindi', blocks, rename: named, hide, review }
  }
  // the newer Core-Craft writes about the services the person named, in the voice of the kind of business (a restaurant serves, a clinic treats), and says
  // what it did not invent: it writes the page whenever it could tie it to the person's own words; the built-in texts are the fallback
  if (!strict || items.length < 2) return { use: false, reason: 'Core-Craft could not tie the page to at least two services you named, so its text would be general', review }
  const ui = page.ui ?? {}
  const blocks: CoreBlocks = {
    lang: 'en',
    hero: { title: page.hero_heading, subtitle: page.tagline, button: page.cta_primary },
    features: { title: page.features_title, items: cards(page) },
    // a paragraph that treats an offer as a thing sold ("sells free shipping above 999") is a broken frame: the built-in paragraph stays
    ...(page.about.some((p) => OFFER.test(p)) ? {} : { about: { title: page.about_title, paragraphs: page.about, points: page.highlights.map((h) => h.title).slice(0, 3) } }),
    steps: { title: page.steps_title, items: page.steps },
    faq: page.faq,
    cta: { title: page.cta_title, button: page.cta_primary },
    ...((page.faq_title ?? ui.faq_title) ? { titles: { faq: page.faq_title ?? ui.faq_title } } : {}),
  }
  // its blog notes are general ("How long things really take"), and sample reviews and a team would carry invented names: they stay out
  // the prices of the kit would be made up too: a price list stays only when the person gave prices
  const hide: EditOp[] = ([...['blog', 'testimonials', 'team'], ...(page.prices?.length ? [] : ['pricing'])] as const).map((section) => ({ op: 'remove', section }) as EditOp)
  return { use: true, reason: `Core-Craft writes about your own services (${items.slice(0, 4).join(', ')}) in the voice of ${page.type_label || page.business_type}, and invents nothing${page.missing?.length ? ` (not given: ${page.missing.join(', ')})` : ''}`, blocks, hide, review }
}

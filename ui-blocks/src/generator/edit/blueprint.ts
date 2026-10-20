// The site as a small JSON document, the way a small model (or a person) can read and change it: the mood, the colours, the typeface and, for every
// panel, its heading, button text, background and the look of its buttons, headings and text. `toBlueprint` writes the document of a site;
// `fromBlueprint` compares a changed document with the one the site has and gives the EditOps that make the site match it (so a change of one
// word in the JSON is one small operation, never a new site, and undo, the exports and all engines work as for every other change).
import type { MoodChoice, Target, EditOp, TitleSection, StyleSet, SiteEdits } from './edits'
import { TITLE_SECTIONS } from './edits'
import type { WebsiteContent } from '../finalPrompt'
import { sectionOfLayout } from './applyEdits'
import { targetOfLayout } from './sectionColors'

export type BlueprintSection = {
  id: Target
  heading?: string
  subtitle?: string
  button_text?: string
  /** background colour of the panel (#rrggbb) or '' for none */
  background?: string
  button_color?: string
  heading_color?: string
  text_color?: string
  radius?: 'square' | 'rounded' | 'pill'
}

export type Blueprint = {
  version: 1
  brand: string
  /** a design mood, or "none" (the look of the business type) */
  mood: MoodChoice
  mode: 'light' | 'dark'
  palette: { accent: string; alt: string }
  /** serif | sans | mono | elegant | rounded | display, or "auto" (the typeface of the mood or the business type) */
  font: string
  /** the look of the whole page */
  page: { button_color?: string; heading_color?: string; text_color?: string; radius?: 'square' | 'rounded' | 'pill' }
  /** the panels, top to bottom */
  sections: BlueprintSection[]
}

type SiteLike = {
  content: WebsiteContent
  layoutIds: string[]
  palette: { light: { accent: string; alt: string }; dark: { accent: string; alt: string } }
  initialMode: 'light' | 'dark'
  mood?: { id: string }
}

const HEADING_OF: Partial<Record<Target, (c: WebsiteContent) => string | undefined>> = {
  hero: (c) => c.hero.title,
  features: (c) => c.features.title,
  about: (c) => c.about.title,
  steps: (c) => c.steps.title,
  gallery: (c) => c.gallery.title,
  pricing: (c) => c.pricing.title,
  team: (c) => c.team.title,
  testimonials: (c) => c.titles?.testimonials ?? 'What our customers say',
  blog: (c) => c.blog.title,
  faq: (c) => c.titles?.faq ?? 'Questions? Answers.',
  cta: (c) => c.cta.title,
  contact: (c) => c.contact.title,
}

export function toBlueprint(site: SiteLike, edits: SiteEdits | undefined, targetOf: (id: string) => Target | undefined, paintOf: (target: Target) => string | undefined): Blueprint {
  const mode = site.initialMode
  const seen = new Set<Target>()
  const sections: BlueprintSection[] = []
  for (const id of site.layoutIds) {
    const target = targetOf(id)
    if (!target || seen.has(target)) continue
    seen.add(target)
    const own = { ...(edits?.styles?.[target] ?? {}) } as StyleSet
    const section: BlueprintSection = { id: target }
    const heading = HEADING_OF[target]?.(site.content)
    if (heading) section.heading = heading
    if (target === 'hero') {
      section.subtitle = site.content.hero.subtitle
      section.button_text = site.content.hero.button
    }
    if (target === 'cta') section.button_text = site.content.cta.button
    section.background = paintOf(target) ?? ''
    if (own.buttonColor) section.button_color = own.buttonColor
    if (own.headingColor) section.heading_color = own.headingColor
    if (own.textColor) section.text_color = own.textColor
    if (own.radius) section.radius = own.radius as BlueprintSection['radius']
    sections.push(section)
  }
  const page = edits?.styles?.page ?? {}
  return {
    version: 1,
    brand: site.content.brandName,
    mood: (edits?.mood ?? (site.mood?.id as MoodChoice | undefined) ?? 'none') as MoodChoice,
    mode,
    palette: { accent: site.palette[mode].accent, alt: site.palette[mode].alt },
    font: page.font ?? 'auto',
    page: {
      ...(page.buttonColor ? { button_color: page.buttonColor } : {}),
      ...(page.headingColor ? { heading_color: page.headingColor } : {}),
      ...(page.textColor ? { text_color: page.textColor } : {}),
      ...(page.radius ? { radius: page.radius as 'square' | 'rounded' | 'pill' } : {}),
    },
    sections,
  }
}

export type BlueprintResult = { ops: EditOp[]; problems: string[] }

const HEX = /^#[0-9a-f]{6}$/i

/** the operations that turn the site of `before` into the site of `after` (a JSON text or an object) */
export function fromBlueprint(after: unknown, before: Blueprint): BlueprintResult {
  const ops: EditOp[] = []
  const problems: string[] = []
  const next = after as Partial<Blueprint> | null
  if (!next || typeof next !== 'object' || Array.isArray(next)) return { ops, problems: ['The JSON must be an object like the one shown.'] }
  const str = (v: unknown) => (typeof v === 'string' ? v : undefined)

  const brand = str(next.brand)
  if (brand !== undefined && brand.trim() && brand !== before.brand) ops.push({ op: 'rename', name: brand.trim() })
  if (next.mood !== undefined && next.mood !== before.mood) ops.push({ op: 'mood', mood: next.mood as MoodChoice })
  if (next.mode !== undefined && next.mode !== before.mode) ops.push({ op: 'mode', mode: next.mode as 'light' | 'dark' })
  const accent = str(next.palette?.accent)
  if (accent && accent.toLowerCase() !== before.palette.accent.toLowerCase()) {
    if (HEX.test(accent)) ops.push({ op: 'accent', hex: accent.toLowerCase() })
    else problems.push(`"palette.accent" must be a colour like #2563eb (got "${accent}").`)
  }
  const alt = str(next.palette?.alt)
  if (alt && alt.toLowerCase() !== before.palette.alt.toLowerCase()) {
    if (HEX.test(alt)) ops.push({ op: 'alt', hex: alt.toLowerCase() })
    else problems.push(`"palette.alt" must be a colour like #f59e0b (got "${alt}").`)
  }
  if (next.font !== undefined && next.font !== before.font) ops.push({ op: 'style', target: 'page', prop: 'font', value: next.font === 'auto' ? 'default' : String(next.font) })

  const pageProps: [keyof Blueprint['page'], 'buttonColor' | 'headingColor' | 'textColor' | 'radius'][] = [['button_color', 'buttonColor'], ['heading_color', 'headingColor'], ['text_color', 'textColor'], ['radius', 'radius']]
  for (const [key, prop] of pageProps) {
    const was = before.page?.[key]
    const now = next.page?.[key]
    if (now !== was) ops.push({ op: 'style', target: 'page', prop, value: now ? String(now).toLowerCase() : 'default' })
  }

  const sections = Array.isArray(next.sections) ? (next.sections as BlueprintSection[]) : undefined
  if (next.sections !== undefined && !sections) problems.push('"sections" must be a list.')
  if (sections) {
    const was = new Map(before.sections.map((s) => [s.id, s]))
    const ids = sections.map((s) => s?.id).filter((id): id is Target => typeof id === 'string')
    // sections taken out of the list are removed (the first screen, the navigation and the footer stay)
    for (const old of before.sections) if (!ids.includes(old.id) && !['hero', 'header', 'footer'].includes(old.id)) ops.push({ op: 'remove', section: old.id as never })
    // a new order is a few moves
    const movable = before.sections.map((s) => s.id).filter((id) => ids.includes(id) && !['hero', 'header', 'footer'].includes(id))
    const wanted = ids.filter((id) => movable.includes(id))
    const list = [...movable]
    for (let i = 0; i < wanted.length; i += 1) {
      if (list[i] === wanted[i]) continue
      ops.push({ op: 'move', section: wanted[i] as never, where: 'before', target: list[i] as never })
      list.splice(list.indexOf(wanted[i]), 1)
      list.splice(i, 0, wanted[i])
    }
    for (const section of sections) {
      const old = was.get(section.id)
      if (!old) continue
      const target = section.id
      const heading = str(section.heading)
      if (heading !== undefined && heading !== old.heading && heading.trim()) {
        if (target === 'hero') ops.push({ op: 'text', field: 'heroTitle', text: heading.trim() })
        else if ((TITLE_SECTIONS as readonly string[]).includes(target)) ops.push({ op: 'title', target: target as TitleSection, text: heading.trim() })
      }
      const subtitle = str(section.subtitle)
      if (target === 'hero' && subtitle !== undefined && subtitle !== old.subtitle && subtitle.trim()) ops.push({ op: 'text', field: 'heroSubtitle', text: subtitle.trim() })
      const button = str(section.button_text)
      if (target === 'hero' && button !== undefined && button !== old.button_text && button.trim()) ops.push({ op: 'text', field: 'heroButton', text: button.trim() })
      if (target === 'cta' && button !== undefined && button !== old.button_text && button.trim()) ops.push({ op: 'replace', from: old.button_text ?? '', to: button.trim() })
      const bg = str(section.background)
      if (bg !== undefined && bg.toLowerCase() !== (old.background ?? '').toLowerCase()) {
        if (!bg) ops.push({ op: 'clearSectionColor', target })
        else if (HEX.test(bg)) ops.push({ op: 'sectionColor', target, hex: bg.toLowerCase() })
        else problems.push(`"${target}.background" must be a colour like #16a34a or "" (got "${bg}").`)
      }
      const props: [keyof BlueprintSection, 'buttonColor' | 'headingColor' | 'textColor' | 'radius'][] = [['button_color', 'buttonColor'], ['heading_color', 'headingColor'], ['text_color', 'textColor'], ['radius', 'radius']]
      for (const [key, prop] of props) {
        if (section[key] !== old[key]) ops.push({ op: 'style', target, prop, value: section[key] ? String(section[key]).toLowerCase() : 'default' })
      }
    }
  }
  return { ops, problems }
}

/** the JSON document of a page made by generateWebsite */
export const blueprintOf = (site: SiteLike & { paintHex: Partial<Record<Target, string>> }, edits: SiteEdits | undefined): Blueprint =>
  toBlueprint(site, edits, (id) => targetOfLayout(id, sectionOfLayout as (id: string) => Target | undefined), (target) => site.paintHex[target])

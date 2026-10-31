// How the changes are applied while a site is built (see edits.ts): the layout, the text, the colours.
import { recolor } from '../colorBrain'
import type { LayoutChoice, LayoutId } from '../finalProductionTemplate'
import type { WebsiteContent } from '../finalPrompt'
import type { Palette } from '../themes'
import type { ThemeKey } from '../themes'
import type { OpeningHours } from '../siteTypes'
import { serviceText } from '../personalize'
import type { ItemEdit, SectionKey, SiteEdits } from './edits'
import { reorder } from './fit'

/** which section a layout block belongs to */
export function sectionOfLayout(id: LayoutId): SectionKey | undefined {
  if (id.startsWith('features-')) return 'features'
  if (id.startsWith('about-')) return 'about'
  if (id.startsWith('steps-')) return 'steps'
  if (id === 'testimonial' || id.startsWith('testimonials-')) return 'testimonials'
  if (id === 'stats' || id === 'marquee' || id === 'gallery' || id === 'pricing' || id === 'team' || id === 'blog' || id === 'faq' || id === 'cta' || id === 'contact') return id
  return undefined
}

/** the blocks of the page in the order the person asked for (navigation, first screen and footer stay where they are) */
export const orderLayout = <T extends string>(ids: T[], edits: SiteEdits | undefined, sectionOf: (id: T) => SectionKey | undefined = sectionOfLayout as (id: T) => SectionKey | undefined) => (edits?.moves.length ? reorder(ids, edits.moves, sectionOf) : ids)

/** removes the blocks of hidden sections (the navigation, hero and footer are never removed) */
export const filterLayout = <T extends string>(ids: T[], edits: SiteEdits | undefined, sectionOf: (id: T) => SectionKey | undefined = sectionOfLayout as (id: T) => SectionKey | undefined) =>
  edits?.hidden.length ? ids.filter((id) => !edits.hidden.includes(sectionOf(id) as SectionKey)) : ids

/** sections that only the long page has: asking for one of them turns a short page into the long one */
const LONG_ONLY: SectionKey[] = ['about', 'steps', 'gallery', 'pricing', 'team', 'blog', 'contact', 'marquee']
export const needsLongPage = (edits: SiteEdits | undefined) => !!edits?.added.some((s) => LONG_ONLY.includes(s))

/** the on/off choices of the layout, with the person's changes */
export function applyChoiceEdits(choice: LayoutChoice, edits: SiteEdits | undefined): LayoutChoice {
  if (!edits || (!edits.hidden.length && !edits.added.length)) return choice
  const next = { ...choice }
  const set = (section: SectionKey, on: boolean) => {
    if (section === 'stats' || section === 'faq' || section === 'gallery' || section === 'team' || section === 'blog') next[section] = on
    else if (section === 'marquee') next.marquee = on && next.size === 'full'
    else if (section === 'testimonials') next.testimonials = on ? (next.testimonials === 'none' ? 'single' : next.testimonials) : 'none'
  }
  for (const section of edits.added) set(section, true)
  for (const section of edits.hidden) set(section, false)
  return next
}

/** the palette with the new colour and tones */
export const applyColorEdits = (palette: Palette, theme: ThemeKey, edits: SiteEdits | undefined) => (edits ? recolor(palette, theme, { accent: edits.accent, alt: edits.alt, harmony: edits.harmony, tones: edits.tones }) : palette)

const replaceIn = (value: unknown, from: string, to: string): unknown => {
  if (typeof value === 'string') return value.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), to)
  if (Array.isArray(value)) return value.map((item) => replaceIn(item, from, to))
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, replaceIn(inner, from, to)]))
  return value
}

/** the texts the person set or replaced, and the contact details; safe to apply twice */
/** "Mon-Sat 9am-7pm, Sun 10am-2pm" -> one row per group; a single "9am to 7pm daily" is one row */
export function parseHours(text: string): OpeningHours[] {
  const groups = text.split(/\s*(?:;|,|\band\b|\|)\s*/i).map((g) => g.trim()).filter(Boolean)
  const rows = groups.map((group): OpeningHours => {
    const at = group.search(/\d|closed|24\s*hours|all day/i)
    if (at > 0) return { day: group.slice(0, at).replace(/[:\s-]+$/, '').replace(/\b(?:open|from|on)\b/gi, '').trim() || 'Open', time: group.slice(at).trim() }
    return { day: 'Open', time: group }
  })
  return rows.length ? rows.slice(0, 7) : [{ day: 'Open', time: text.trim() }]
}

/** "500" -> "₹500", "500/kg" -> price "₹500" and period "/kg"; a price that already has its symbol stays as typed */
const money = (price: string, currency: string): { price: string; period: string } => {
  const m = price.trim().match(/^(\d[\d,]*(?:\.\d+)?)\s*(?:\/-)?(\/[a-z]+)?$/i)
  return m ? { price: `${currency}${Number(m[1].replace(/,/g, '')).toLocaleString(currency === '₹' ? 'en-IN' : 'en-US')}`, period: m[2] ?? '' } : { price: price.trim(), period: '' }
}

/** Core-Craft's texts over a page: only about the services the person named (the page has no other claims) */
function mergeCore(content: WebsiteContent, core: NonNullable<SiteEdits['core']>): WebsiteContent {
  let next = content
  if (core.hero) next = { ...next, hero: { title: core.hero.title ?? next.hero.title, subtitle: core.hero.subtitle ?? next.hero.subtitle, button: core.hero.button ?? next.hero.button } }
  if (core.features) next = { ...next, features: { title: core.features.title ?? next.features.title, items: core.features.items }, marquee: core.features.items.map((i) => i.title.slice(0, 16)).slice(0, 8) }
  // the captions of the gallery name what the business does (the pack's own would talk about another cuisine or trade)
  if (core.features) next = { ...next, gallery: { ...next.gallery, captions: next.gallery.captions.map((_, n) => core.features!.items[n % core.features!.items.length].title) } }
  if (core.about) next = { ...next, about: { title: core.about.title ?? next.about.title, paragraphs: core.about.paragraphs, points: core.about.points?.length ? core.about.points : next.about.points } }
  if (core.steps) next = { ...next, steps: { title: core.steps.title ?? next.steps.title, items: core.steps.items } }
  if (core.faq) next = { ...next, faq: core.faq }
  if (core.labels) next = { ...next, labels: core.labels }
  if (core.cta) next = { ...next, cta: { title: core.cta.title ?? next.cta.title, button: core.cta.button ?? next.cta.button } }
  return next
}

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim()

/** the position (0-based) of the item a change is about: counted ("2nd", "last") or named (its words are in the item) */
function findItem<T>(items: T[], edit: ItemEdit, text: (item: T) => string): number {
  if (edit.index !== undefined) return edit.index === 0 ? items.length - 1 : edit.index - 1 < items.length ? edit.index - 1 : -1
  const words = norm(edit.match ?? '').split(' ').filter((w) => w.length >= 2)
  if (!words.length) return -1
  const scored = items.map((item, i) => ({ i, hits: words.filter((w) => norm(text(item)).includes(w.replace(/s$/, ''))).length }))
  const best = scored.reduce((a, b) => (b.hits > a.hits ? b : a), { i: -1, hits: 0 })
  return best.hits >= Math.max(1, Math.ceil(words.length / 2)) ? best.i : -1
}

const FIRST = new Set<ItemEdit['list']>(['faq', 'testimonials', 'stats', 'blog'])

/** one change of one item of a list (see ItemEdit): a card, a question, a step, a number, a review, a plan, a caption, a paragraph */
function applyItemTo(content: WebsiteContent, edit: ItemEdit): WebsiteContent {
  const f = edit.fields ?? {}
  const change = <T extends object>(items: T[], text: (item: T) => string, make: () => T, patch: (item: T) => T): T[] => {
    // a new question, review, number or note goes first: the parts show only the first few, and the person must see what they added (a step or a service goes last: the order means something)
    if (edit.action === 'add') return FIRST.has(edit.list) ? [make(), ...items].slice(0, 12) : [...items, make()].slice(0, 12)
    const at = findItem(items, edit, text)
    if (at < 0) return items
    return edit.action === 'remove' ? items.filter((_, i) => i !== at) : items.map((item, i) => (i === at ? patch(item) : item))
  }
  switch (edit.list) {
    case 'features': {
      const cards = change(content.features.items, (c) => `${c.title} ${c.text}`, () => ({ title: f.title ?? 'New service', text: f.text ?? serviceText(f.title ?? 'New service', content.features.items.length) }), (c) => ({ title: f.title ?? c.title, text: f.text ?? (f.title && !f.text ? serviceText(f.title, 0) : c.text) }))
      return { ...content, features: { ...content.features, items: cards }, marquee: cards.map((c) => c.title.slice(0, 16)).slice(0, 8) }
    }
    case 'faq':
      return { ...content, faq: change(content.faq, (q) => `${q.q} ${q.a}`, () => ({ q: f.q ?? 'Question', a: f.a ?? 'Please message us and we will answer.', own: true }), (q) => ({ ...q, q: f.q ?? q.q, a: f.a ?? q.a, own: true })) }
    case 'steps':
      return { ...content, steps: { ...content.steps, items: change(content.steps.items, (s) => `${s.title} ${s.text}`, () => ({ title: f.title ?? 'Step', text: f.text ?? '' }), (s) => ({ title: f.title ?? s.title, text: f.text ?? s.text })) } }
    case 'stats':
      return { ...content, stats: change(content.stats, (s) => `${s.value} ${s.label}`, () => ({ value: f.value ?? '', label: f.label ?? '', fact: true }), (s) => ({ ...s, value: f.value ?? s.value, label: f.label ?? s.label, fact: true })) }
    case 'testimonials': {
      const list = change(content.testimonials, (t) => `${t.author} ${t.quote} ${t.role}`, () => ({ quote: f.quote ?? '', author: f.author ?? 'A customer', role: f.role ?? '' }), (t) => ({ quote: f.quote ?? t.quote, author: f.author ?? t.author, role: f.role ?? t.role }))
      // the sample reviews of the pack are not kept next to the ones the person wrote
      const own = edit.action === 'add' ? list.filter((t) => !/sample/i.test(t.author)) : list
      return { ...content, testimonials: own, testimonial: own[0] ?? content.testimonial }
    }
    case 'plans':
      return { ...content, pricing: { ...content.pricing, fromPrompt: true, plans: change(content.pricing.plans, (p) => p.name, () => ({ name: f.name ?? 'Plan', price: f.price ?? '', period: f.period ?? '', perks: f.perks ? f.perks.split(/\s*[,;|]\s*/).filter(Boolean) : [] }), (p) => ({ name: f.name ?? p.name, price: f.price ?? p.price, period: f.period ?? p.period, perks: f.perks ? f.perks.split(/\s*[,;|]\s*/).filter(Boolean) : p.perks })) } }
    case 'gallery': {
      const captions = change(content.gallery.captions.map((c) => ({ c })), (x) => x.c, () => ({ c: f.caption ?? '' }), (x) => ({ c: f.caption ?? x.c })).map((x) => x.c)
      return { ...content, gallery: { ...content.gallery, captions } }
    }
    case 'paragraphs':
      return { ...content, about: { ...content.about, paragraphs: change(content.about.paragraphs.map((p) => ({ p })), (x) => x.p, () => ({ p: f.text ?? '' }), (x) => ({ p: f.text ?? x.p })).map((x) => x.p) } }
    case 'points':
      return { ...content, about: { ...content.about, points: change(content.about.points.map((p) => ({ p })), (x) => x.p, () => ({ p: f.text ?? '' }), (x) => ({ p: f.text ?? x.p })).map((x) => x.p) } }
    case 'blog':
      return { ...content, blog: { ...content.blog, posts: change(content.blog.posts, (p) => `${p.title} ${p.tag}`, () => ({ title: f.title ?? 'Note', tag: f.tag ?? '' }), (p) => ({ ...p, title: f.title ?? p.title, tag: f.tag ?? p.tag })) } }
  }
}

export function applyItem(content: WebsiteContent, edit: ItemEdit): WebsiteContent {
  const next = applyItemTo(content, edit)
  if (edit.action !== 'add') return next
  const k = edit.list
  return { ...next, added: { ...content.added, [k]: (content.added?.[k] ?? 0) + 1 } }
}

export function applyContentEdits(content: WebsiteContent, edits: SiteEdits | undefined, currency = '$'): WebsiteContent {
  if (!edits) return content
  let next: WebsiteContent = content
  // the texts of Core-Craft AI come first: what the person types afterwards (text, titles, services) wins over them
  if (edits.core) next = mergeCore(next, edits.core)
  const t = edits.text
  if (t.heroTitle) next = { ...next, hero: { ...next.hero, title: t.heroTitle } }
  if (t.heroSubtitle) next = { ...next, hero: { ...next.hero, subtitle: t.heroSubtitle } }
  if (t.heroButton) next = { ...next, hero: { ...next.hero, button: t.heroButton } }
  if (t.featuresTitle) next = { ...next, features: { ...next.features, title: t.featuresTitle } }
  if (t.aboutTitle) next = { ...next, about: { ...next.about, title: t.aboutTitle } }
  if (t.ctaTitle) next = { ...next, cta: { ...next.cta, title: t.ctaTitle } }
  if (t.contactTitle) next = { ...next, contact: { ...next.contact, title: t.contactTitle } }
  if (t.subject) next = { ...next, subject: t.subject }
  const { whatsapp, hours, ...basic } = edits.contact
  if (basic.email || basic.phone || basic.address) next = { ...next, contact: { ...next.contact, ...basic, ...(basic.address ? { showMap: true } : {}) } }
  if (whatsapp) next = { ...next, contact: { ...next.contact, whatsapp } }
  if (hours) next = { ...next, hours: parseHours(hours), contact: { ...next.contact, hoursText: hours } }
  if (edits.photos) next = { ...next, photos: edits.photos }
  if (edits.app !== undefined) next = { ...next, app: edits.app, appPages: edits.appPages }
  if (edits.widgets?.length) next = { ...next, widgets: edits.widgets }
  // new headings: the field the template reads, and `titles` for the headings that were fixed text before
  const T = { ...(edits.core?.titles ?? {}), ...edits.titles }
  if (Object.keys(T).length) {
    next = {
      ...next,
      titles: { ...next.titles, ...T },
      ...(T.features ? { features: { ...next.features, title: T.features } } : {}),
      ...(T.about ? { about: { ...next.about, title: T.about } } : {}),
      ...(T.steps ? { steps: { ...next.steps, title: T.steps } } : {}),
      ...(T.pricing ? { pricing: { ...next.pricing, title: T.pricing } } : {}),
      ...(T.gallery ? { gallery: { ...next.gallery, title: T.gallery } } : {}),
      ...(T.team ? { team: { ...next.team, title: T.team } } : {}),
      ...(T.blog ? { blog: { ...next.blog, title: T.blog } } : {}),
      ...(T.cta ? { cta: { ...next.cta, title: T.cta } } : {}),
      ...(T.contact ? { contact: { ...next.contact, title: T.contact } } : {}),
    }
  }
  const NL = { ...(edits.core?.navLabels ?? {}), ...edits.navLabels }
  if (Object.keys(NL).length) next = { ...next, navLabels: { ...next.navLabels, ...NL } }
  // the services the person listed are the feature cards; the priced ones are the price list
  if (edits.services?.length) {
    const items = edits.services
    const cards = items.map((item, i) => ({ title: item.name, text: item.text ?? serviceText(item.name, i) }))
    const priced = items.filter((item) => item.price)
    next = {
      ...next,
      features: { ...next.features, items: cards },
      marquee: items.map((item) => item.name.slice(0, 16)).slice(0, 8),
      pricing: priced.length ? { ...next.pricing, plans: priced.slice(0, 3).map((item) => ({ name: item.name.slice(0, 22), ...money(item.price as string, currency), perks: [item.text ?? 'Ask us for the details'] })) } : next.pricing,
    }
  }
  for (const { from, to } of edits.replace) next = replaceIn(next, from, to) as WebsiteContent
  for (const item of edits.items ?? []) next = applyItem(next, item)
  return next
}

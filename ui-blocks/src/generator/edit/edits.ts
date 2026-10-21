// Changes the person asks for after a site exists: "remove the FAQ", "rename it to Green Leaf", "make the buttons blue".
// A change is a small, plain JSON operation (EditOp). Operations are checked here (`cleanOp`), added up into one state
// (`SiteEdits`) and applied by the generators while they build the site, so a site is always: the prompt + the list of changes.
// That makes every change reversible (undo = drop the last operation), repeatable, and the same for the page, the exports and the
// understanding layers (rules, learned model, the optional AI server), which all only have to produce these operations.
import type { Tier } from '../designBrain'
import type { MotionSetting } from '../motionBrain'
import { THEME_KEYS, type ThemeKey } from '../themes'

/** parts of a page that can be removed or added */
export const SECTIONS = ['stats', 'marquee', 'features', 'about', 'steps', 'gallery', 'pricing', 'team', 'testimonials', 'blog', 'faq', 'cta', 'contact'] as const
export type SectionKey = (typeof SECTIONS)[number]

/** pages of a multi-page site that can be removed or added (Home and Contact stay) */
export const PAGES = ['about', 'services', 'pricing', 'team', 'gallery', 'blog', 'faq'] as const
export type PageKey = (typeof PAGES)[number]

/** texts that can be set directly */
export const TEXT_FIELDS = ['heroTitle', 'heroSubtitle', 'heroButton', 'featuresTitle', 'aboutTitle', 'ctaTitle', 'contactTitle', 'subject'] as const
export type TextField = (typeof TEXT_FIELDS)[number]

/** parts of the page that can get a colour of their own (the navigation bar, the first screen, the footer and every section) */
export const TARGETS = ['header', 'hero', 'footer', ...SECTIONS] as const
export type Target = (typeof TARGETS)[number]

/** design moods (moods.ts): a whole look, none (the look of the business type) or auto (the generator chooses) */
export const MOOD_CHOICES = ['minimal-light', 'minimal-dark', 'soft-neo', 'retro', 'cyberpunk', 'glass', 'bold-contrast', 'editorial', 'playful-pop', 'luxe-dark', 'none', 'auto'] as const
export type MoodChoice = (typeof MOOD_CHOICES)[number]

/** the look of one kind of thing on a part of the page (or the whole page): the colour of the buttons, of the headings, of the text, the roundness of corners, the typeface */
export const STYLE_PROPS = ['buttonColor', 'headingColor', 'textColor', 'radius', 'font', 'headingSize', 'textSize'] as const
/** headingSize / textSize are steps on the type scale (-3 .. 3) */
export const SIZE_PROPS = ['headingSize', 'textSize'] as const
export type StyleProp = (typeof STYLE_PROPS)[number]
export const RADIUS_CHOICES = ['square', 'rounded', 'pill'] as const
export const FONT_KEYS = ['serif', 'sans', 'mono', 'elegant', 'rounded', 'display'] as const
export type StyleSet = Partial<Record<StyleProp, string>>

/** a colour that goes with the main colour */
export const HARMONIES = ['complementary', 'analogous', 'triadic', 'split'] as const
export type Harmony = (typeof HARMONIES)[number]

/** sections that have a heading of their own, and pages of a multi-page site that have a label in the navigation */
export const TITLE_SECTIONS = ['features', 'about', 'steps', 'pricing', 'gallery', 'team', 'testimonials', 'blog', 'faq', 'cta', 'contact'] as const
export type TitleSection = (typeof TITLE_SECTIONS)[number]
export const NAV_PAGES = ['home', 'about', 'services', 'pricing', 'team', 'gallery', 'blog', 'faq', 'contact'] as const
export type NavPage = (typeof NAV_PAGES)[number]

/** where a section goes: to the top / bottom of the page, one step up / down, or right before / after another section */
export const MOVES = ['top', 'bottom', 'up', 'down', 'before', 'after'] as const
export type Move = (typeof MOVES)[number]

/** the part of the page a size or alignment change is about: a part, or the whole page */
export const FIT_TARGETS = ['page', 'header', 'hero', 'footer', ...SECTIONS] as const
export type FitTarget = (typeof FIT_TARGETS)[number]
export type Axis = 'height' | 'width'
export type Align = 'left' | 'center' | 'right'
/** a size change: a factor of the normal size (0.7 = 30% less), or an exact size in pixels */
export type SizeChange = { factor?: number; px?: number }

export const CONTACT_FIELDS = ['email', 'phone', 'address', 'whatsapp', 'hours'] as const
export type ContactField = (typeof CONTACT_FIELDS)[number]

/** real pictures for the first screen, the about section and the gallery (https addresses, or small data: pictures the person uploaded) */
export type PhotoSet = { hero?: string; about?: string; gallery?: string[]; /** who to thank, e.g. "Photos: Pexels" */ credit?: string }

export type ServiceItem = { name: string; price?: string; text?: string }

export type Tone = 'warmer' | 'cooler' | 'vibrant' | 'muted' | 'darker' | 'lighter'
export const TONES: Tone[] = ['warmer', 'cooler', 'vibrant', 'muted', 'darker', 'lighter']

export type EditOp =
  | { op: 'rename'; name: string }
  | { op: 'accent'; hex: string }
  | { op: 'tone'; tone: Tone }
  | { op: 'harmony'; kind: Harmony }
  | { op: 'alt'; hex: string }
  | { op: 'sectionColor'; target: Target; hex: string }
  | { op: 'mood'; mood: MoodChoice }
  | { op: 'style'; target: FitTarget; prop: StyleProp; /** a colour (#rrggbb), a radius, a font key, or 'default' */ value: string }
  | { op: 'clearSectionColor'; target: Target }
  | { op: 'mode'; mode: 'light' | 'dark' }
  | { op: 'remove'; section: SectionKey }
  | { op: 'add'; section: SectionKey }
  | { op: 'removePage'; page: PageKey }
  | { op: 'addPage'; page: PageKey }
  | { op: 'text'; field: TextField; text: string }
  | { op: 'replace'; from: string; to: string }
  | { op: 'contact'; field: ContactField; value: string }
  /** what the business offers, with prices when the person gives them: the feature cards, and the price list when prices are there */
  | { op: 'services'; items: ServiceItem[] }
  | { op: 'title'; target: TitleSection; text: string }
  | { op: 'navLabel'; target: NavPage; text: string }
  | { op: 'move'; section: SectionKey; where: Move; target?: SectionKey }
  | { op: 'movePage'; page: NavPage; where: Move; target?: NavPage }
  | { op: 'size'; target: FitTarget; axis: Axis; factor?: number; px?: number }
  | { op: 'align'; target: FitTarget; align: Align; /** only the buttons of that part */ part?: 'buttons' }
  | { op: 'resetLayout'; target?: FitTarget }
  | ({ op: 'photos' } & PhotoSet)
  | { op: 'clearPhotos' }
  | { op: 'tier'; tier: Tier }
  | { op: 'motion'; level: MotionSetting }
  | { op: 'theme'; theme: ThemeKey }

export type SiteEdits = {
  brand?: string
  /** a colour for the buttons, links and highlights */
  accent?: string
  /** adjustments made to the palette, in the order they were asked */
  tones: Tone[]
  /** colours that go with the main colour, in the order they were asked */
  harmony: Harmony[]
  /** the second colour of the palette */
  alt?: string
  /** background colour of single parts: the text on top follows automatically */
  sectionColors: Partial<Record<Target, string>>
  mode?: 'light' | 'dark'
  /** the design mood the person chose (or 'none') */
  mood?: MoodChoice
  /** the look of buttons, headings, text, corners and the typeface, per part (or 'page') */
  styles: Partial<Record<FitTarget, StyleSet>>
  hidden: SectionKey[]
  added: SectionKey[]
  hiddenPages: PageKey[]
  addedPages: PageKey[]
  text: Partial<Record<TextField, string>>
  replace: { from: string; to: string }[]
  contact: Partial<Record<ContactField, string>>
  services?: ServiceItem[]
  photos?: PhotoSet
  /** new headings of sections */
  titles: Partial<Record<TitleSection, string>>
  /** new labels of the pages in the navigation */
  navLabels: Partial<Record<NavPage, string>>
  /** moves of sections and pages, in the order they were asked */
  moves: { section: SectionKey; where: Move; target?: SectionKey }[]
  pageMoves: { page: NavPage; where: Move; target?: NavPage }[]
  /** size changes per part and direction (factors multiply when asked again) */
  sizes: Partial<Record<FitTarget, Partial<Record<Axis, SizeChange>>>>
  aligns: Partial<Record<FitTarget, Align>>
  /** alignment of the buttons alone */
  buttonAligns: Partial<Record<FitTarget, Align>>
  tier?: Tier
  motion?: MotionSetting
  theme?: ThemeKey
}

export const noEdits = (): SiteEdits => ({ titles: {}, navLabels: {}, moves: [], pageMoves: [], sizes: {}, aligns: {}, buttonAligns: {}, styles: {}, tones: [], harmony: [], sectionColors: {}, hidden: [], added: [], hiddenPages: [], addedPages: [], text: {}, replace: [], contact: {} })

const HEX = /^#[0-9a-f]{6}$/i
const clean = (text: unknown, max: number) => (typeof text === 'string' ? text.replace(/\p{Cc}+/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '')

/** Checks one operation that came from outside (a parser, a model, a file) and returns it cleaned, or undefined when it is not valid. */
export function cleanOp(raw: unknown): EditOp | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  switch (o.op) {
    case 'rename': {
      const name = clean(o.name, 40)
      return name.length >= 2 ? { op: 'rename', name } : undefined
    }
    case 'accent': {
      const hex = typeof o.hex === 'string' ? o.hex.trim().toLowerCase() : ''
      return HEX.test(hex) ? { op: 'accent', hex } : undefined
    }
    case 'tone':
      return TONES.includes(o.tone as Tone) ? { op: 'tone', tone: o.tone as Tone } : undefined
    case 'harmony':
      return (HARMONIES as readonly unknown[]).includes(o.kind) ? { op: 'harmony', kind: o.kind as Harmony } : undefined
    case 'alt': {
      const hex = typeof o.hex === 'string' ? o.hex.trim().toLowerCase() : ''
      return HEX.test(hex) ? { op: 'alt', hex } : undefined
    }
    case 'sectionColor': {
      const hex = typeof o.hex === 'string' ? o.hex.trim().toLowerCase() : ''
      return (TARGETS as readonly unknown[]).includes(o.target) && HEX.test(hex) ? { op: 'sectionColor', target: o.target as Target, hex } : undefined
    }
    case 'clearSectionColor':
      return (TARGETS as readonly unknown[]).includes(o.target) ? { op: 'clearSectionColor', target: o.target as Target } : undefined
    case 'style': {
      if (!(FIT_TARGETS as readonly unknown[]).includes(o.target) || !(STYLE_PROPS as readonly unknown[]).includes(o.prop)) return undefined
      const prop = o.prop as StyleProp
      const value = typeof o.value === 'string' ? o.value.trim().toLowerCase() : ''
      const ok = value === 'default' || ((SIZE_PROPS as readonly string[]).includes(prop) ? /^[+-][1-3]$/.test(value) : prop === 'radius' ? (RADIUS_CHOICES as readonly string[]).includes(value) : prop === 'font' ? (FONT_KEYS as readonly string[]).includes(value) : HEX.test(value))
      return ok ? { op: 'style', target: o.target as FitTarget, prop, value } : undefined
    }
    case 'mood':
      return (MOOD_CHOICES as readonly unknown[]).includes(o.mood) ? { op: 'mood', mood: o.mood as MoodChoice } : undefined
    case 'mode':
      return o.mode === 'light' || o.mode === 'dark' ? { op: 'mode', mode: o.mode } : undefined
    case 'remove':
    case 'add':
      return (SECTIONS as readonly unknown[]).includes(o.section) ? ({ op: o.op, section: o.section } as EditOp) : undefined
    case 'removePage':
    case 'addPage':
      return (PAGES as readonly unknown[]).includes(o.page) ? ({ op: o.op, page: o.page } as EditOp) : undefined
    case 'text': {
      const text = clean(o.text, 200)
      return (TEXT_FIELDS as readonly unknown[]).includes(o.field) && text ? { op: 'text', field: o.field as TextField, text } : undefined
    }
    case 'replace': {
      const from = clean(o.from, 120)
      const to = clean(o.to, 120)
      return from.length >= 2 && from !== to ? { op: 'replace', from, to } : undefined
    }
    case 'contact': {
      const value = clean(o.value, 120)
      return (CONTACT_FIELDS as readonly unknown[]).includes(o.field) && value ? { op: 'contact', field: o.field as ContactField, value } : undefined
    }
    case 'title': {
      const text = clean(o.text, 80)
      return (TITLE_SECTIONS as readonly unknown[]).includes(o.target) && text.length >= 2 ? { op: 'title', target: o.target as TitleSection, text } : undefined
    }
    case 'navLabel': {
      const text = clean(o.text, 24)
      return (NAV_PAGES as readonly unknown[]).includes(o.target) && text.length >= 2 ? { op: 'navLabel', target: o.target as NavPage, text } : undefined
    }
    case 'move': {
      if (!(SECTIONS as readonly unknown[]).includes(o.section) || !(MOVES as readonly unknown[]).includes(o.where)) return undefined
      const needsTarget = o.where === 'before' || o.where === 'after'
      if (needsTarget && (!(SECTIONS as readonly unknown[]).includes(o.target) || o.target === o.section)) return undefined
      return { op: 'move', section: o.section as SectionKey, where: o.where as Move, ...(needsTarget ? { target: o.target as SectionKey } : {}) }
    }
    case 'movePage': {
      if (!(NAV_PAGES as readonly unknown[]).includes(o.page) || !(MOVES as readonly unknown[]).includes(o.where)) return undefined
      const needsTarget = o.where === 'before' || o.where === 'after'
      if (needsTarget && (!(NAV_PAGES as readonly unknown[]).includes(o.target) || o.target === o.page)) return undefined
      return { op: 'movePage', page: o.page as NavPage, where: o.where as Move, ...(needsTarget ? { target: o.target as NavPage } : {}) }
    }
    case 'size': {
      if (!(FIT_TARGETS as readonly unknown[]).includes(o.target) || (o.axis !== 'height' && o.axis !== 'width')) return undefined
      const factor = typeof o.factor === 'number' && Number.isFinite(o.factor) ? Math.max(0.3, Math.min(2.5, Math.round(o.factor * 100) / 100)) : undefined
      const px = typeof o.px === 'number' && Number.isFinite(o.px) ? Math.max(60, Math.min(2400, Math.round(o.px))) : undefined
      return factor || px ? { op: 'size', target: o.target as FitTarget, axis: o.axis, ...(px ? { px } : { factor }) } : undefined
    }
    case 'align':
      return (FIT_TARGETS as readonly unknown[]).includes(o.target) && (o.align === 'left' || o.align === 'center' || o.align === 'right') ? { op: 'align', target: o.target as FitTarget, align: o.align, ...(o.part === 'buttons' ? { part: 'buttons' as const } : {}) } : undefined
    case 'resetLayout':
      return o.target === undefined ? { op: 'resetLayout' } : (FIT_TARGETS as readonly unknown[]).includes(o.target) ? { op: 'resetLayout', target: o.target as FitTarget } : undefined
    case 'photos': {
      const url = (v: unknown) => (typeof v === 'string' && (/^https:\/\/[^\s"'<>]{4,600}$/i.test(v) || /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]{20,450000}$/.test(v)) ? v : undefined)
      const gallery = (Array.isArray(o.gallery) ? o.gallery : []).map(url).filter((x): x is string => !!x).slice(0, 8)
      const out: PhotoSet = { ...(url(o.hero) ? { hero: url(o.hero) } : {}), ...(url(o.about) ? { about: url(o.about) } : {}), ...(gallery.length ? { gallery } : {}), ...(clean(o.credit, 120) ? { credit: clean(o.credit, 120) } : {}) }
      return out.hero || out.about || out.gallery ? { op: 'photos', ...out } : undefined
    }
    case 'clearPhotos':
      return { op: 'clearPhotos' }
    case 'services': {
      const items = (Array.isArray(o.items) ? o.items : [])
        .map((raw): ServiceItem | undefined => {
          const r = (raw ?? {}) as Record<string, unknown>
          const name = clean(r.name, 40)
          const price = clean(r.price, 14)
          const text = clean(r.text, 120)
          return name.length >= 2 ? { name, ...(price ? { price } : {}), ...(text ? { text } : {}) } : undefined
        })
        .filter((x): x is ServiceItem => !!x)
        .slice(0, 8)
      return items.length ? { op: 'services', items } : undefined
    }
    case 'tier':
      return o.tier === 'normal' || o.tier === 'better' || o.tier === 'premium' ? { op: 'tier', tier: o.tier } : undefined
    case 'motion':
      return o.level === 'auto' || o.level === 'off' || o.level === 'subtle' || o.level === 'rich' ? { op: 'motion', level: o.level } : undefined
    case 'theme':
      return (THEME_KEYS as readonly unknown[]).includes(o.theme) ? { op: 'theme', theme: o.theme as ThemeKey } : undefined
    default:
      return undefined
  }
}

const without = <T,>(list: T[], item: T) => list.filter((x) => x !== item)
const withItem = <T,>(list: T[], item: T) => (list.includes(item) ? list : [...list, item])

/** All operations, in order, added up into the state the generators read. */
export function editsFrom(ops: EditOp[]): SiteEdits {
  const e = noEdits()
  for (const op of ops) {
    switch (op.op) {
      case 'rename':
        e.brand = op.name
        break
      case 'accent':
        e.accent = op.hex
        break
      case 'tone':
        // warmer and cooler cancel each other, the same for darker / lighter and vibrant / muted
        e.tones = [...e.tones, op.tone].slice(-8)
        break
      case 'harmony':
        e.harmony = [...e.harmony, op.kind].slice(-6)
        break
      case 'alt':
        e.alt = op.hex
        break
      case 'sectionColor':
        e.sectionColors = { ...e.sectionColors, [op.target]: op.hex }
        break
      // '' = no colour of its own, not even the one the mood gives the part
      case 'clearSectionColor':
        e.sectionColors = { ...e.sectionColors, [op.target]: '' }
        break
      case 'mood':
        e.mood = op.mood === 'auto' ? undefined : op.mood
        break
      case 'style': {
        const current = { ...(e.styles[op.target] ?? {}) }
        if (op.value === 'default') delete current[op.prop]
        else if ((SIZE_PROPS as readonly string[]).includes(op.prop)) {
          // "bigger" twice is two steps: a size is relative to what was asked before
          const step = Math.max(-3, Math.min(3, Number(current[op.prop] ?? 0) + Number(op.value)))
          if (step === 0) delete current[op.prop]
          else current[op.prop] = `${step > 0 ? '+' : ''}${step}`
        } else current[op.prop] = op.value
        e.styles = { ...e.styles, [op.target]: current }
        break
      }
      case 'mode':
        e.mode = op.mode
        break
      case 'remove':
        e.hidden = withItem(e.hidden, op.section)
        e.added = without(e.added, op.section)
        break
      case 'add':
        e.added = withItem(e.added, op.section)
        e.hidden = without(e.hidden, op.section)
        break
      case 'removePage':
        e.hiddenPages = withItem(e.hiddenPages, op.page)
        e.addedPages = without(e.addedPages, op.page)
        break
      case 'addPage':
        e.addedPages = withItem(e.addedPages, op.page)
        e.hiddenPages = without(e.hiddenPages, op.page)
        break
      case 'text':
        e.text = { ...e.text, [op.field]: op.text }
        break
      case 'replace':
        e.replace = [...e.replace, { from: op.from, to: op.to }]
        break
      case 'contact':
        e.contact = { ...e.contact, [op.field]: op.value }
        break
      case 'services':
        e.services = op.items
        break
      case 'title':
        e.titles = { ...e.titles, [op.target]: op.text }
        break
      case 'navLabel':
        e.navLabels = { ...e.navLabels, [op.target]: op.text }
        break
      case 'move':
        e.moves = [...e.moves, { section: op.section, where: op.where, target: op.target }].slice(-24)
        break
      case 'movePage':
        e.pageMoves = [...e.pageMoves, { page: op.page, where: op.where, target: op.target }].slice(-24)
        break
      case 'size': {
        const now = e.sizes[op.target]?.[op.axis]
        // an exact size replaces; a factor multiplies what was asked before (so "less" twice is less than once)
        const next: SizeChange = op.px ? { px: op.px } : { factor: Math.max(0.3, Math.min(2.5, (now?.px ? 1 : (now?.factor ?? 1)) * (op.factor ?? 1))) }
        e.sizes = { ...e.sizes, [op.target]: { ...e.sizes[op.target], [op.axis]: next } }
        break
      }
      case 'align':
        if (op.part === 'buttons') e.buttonAligns = { ...e.buttonAligns, [op.target]: op.align }
        else e.aligns = { ...e.aligns, [op.target]: op.align }
        break
      case 'resetLayout':
        if (!op.target) {
          e.sizes = {}
          e.aligns = {}
          e.buttonAligns = {}
          e.styles = {}
          e.moves = []
          e.pageMoves = []
        } else {
          const { [op.target]: _s, ...sizes } = e.sizes
          const { [op.target]: _a, ...aligns } = e.aligns
          const { [op.target]: _b, ...buttonAligns } = e.buttonAligns
          const { [op.target]: _st, ...styles } = e.styles
          e.styles = styles
          e.sizes = sizes
          e.aligns = aligns
          e.buttonAligns = buttonAligns
        }
        break
      case 'photos': {
        const { op: _op, ...set } = op
        e.photos = { ...e.photos, ...set }
        break
      }
      case 'clearPhotos':
        e.photos = undefined
        break
      case 'tier':
        e.tier = op.tier
        break
      case 'motion':
        e.motion = op.level
        break
      case 'theme':
        e.theme = op.theme
        break
    }
  }
  return e
}

export const isHidden = (edits: SiteEdits | undefined, section: SectionKey) => !!edits?.hidden.includes(section)
export const isAdded = (edits: SiteEdits | undefined, section: SectionKey) => !!edits?.added.includes(section)

/** one short sentence for what an operation does (shown in the chat and in the list of changes) */
export function describeOp(op: EditOp): string {
  switch (op.op) {
    case 'rename':
      return `Renamed the business to "${op.name}"`
    case 'accent':
      return `Changed the main colour to ${op.hex}`
    case 'tone':
      return `Made the colours ${op.tone}`
    case 'harmony':
      return `Used a ${op.kind} colour`
    case 'alt':
      return `Changed the second colour to ${op.hex}`
    case 'sectionColor':
      return `Made the ${op.target} ${op.hex}`
    case 'clearSectionColor':
      return `The ${op.target} has the normal colours again`
    case 'style': {
      if (op.prop === 'headingSize' || op.prop === 'textSize') {
        const noun = op.prop === 'headingSize' ? 'headings' : 'text'
        const where = op.target === 'page' ? 'the page' : `the ${op.target}`
        return op.value === 'default' ? `The ${noun} of ${where} have the normal size again` : `The ${noun} of ${where} are ${op.value.startsWith('+') ? 'bigger' : 'smaller'}`
      }
      const what = { buttonColor: 'buttons', headingColor: 'headings', textColor: 'text', radius: 'corners', font: 'typeface' }[op.prop]
      return op.value === 'default' ? `The ${what} of ${op.target === 'page' ? 'the page' : `the ${op.target}`} are back to normal` : `${op.target === 'page' ? 'All' : `The ${op.target}`} ${what}: ${op.value}`
    }
    case 'mood':
      return op.mood === 'none' ? 'Back to the look of the business type' : op.mood === 'auto' ? 'The design mood is chosen by the generator again' : `Design mood: ${op.mood}`
    case 'mode':
      return `Started in ${op.mode} mode`
    case 'remove':
      return `Removed the ${op.section} section`
    case 'add':
      return `Added the ${op.section} section`
    case 'removePage':
      return `Removed the ${op.page} page`
    case 'addPage':
      return `Added the ${op.page} page`
    case 'text':
      return `Changed the ${op.field.replace(/([A-Z])/g, ' $1').toLowerCase()} to "${op.text}"`
    case 'replace':
      return `Replaced "${op.from}" with "${op.to}"`
    case 'contact':
      return `Set the ${op.field} to ${op.value}`
    case 'title':
      return `Renamed the ${op.target} section to "${op.text}"`
    case 'navLabel':
      return `The ${op.target} page is called "${op.text}" in the menu`
    case 'move':
      return `Moved the ${op.section} section ${op.where === 'before' || op.where === 'after' ? `${op.where} ${op.target}` : op.where === 'top' ? 'to the top' : op.where === 'bottom' ? 'to the bottom' : op.where}`
    case 'movePage':
      return `Moved the ${op.page} page ${op.where === 'before' || op.where === 'after' ? `${op.where} ${op.target}` : op.where === 'top' ? 'to the front of the menu' : op.where === 'bottom' ? 'to the end of the menu' : op.where} in the menu`
    case 'size':
      return `${op.axis === 'height' ? 'Height' : 'Width'} of ${op.target === 'page' ? 'the whole page' : `the ${op.target}`}: ${op.px ? `${op.px}px` : `${Math.round((op.factor ?? 1) * 100)}%`}`
    case 'align':
      return `Aligned ${op.part === 'buttons' ? 'the buttons of ' : ''}${op.target === 'page' ? 'the whole page' : `the ${op.target}`} to the ${op.align}`
    case 'resetLayout':
      return op.target ? `The ${op.target} has its normal size and place again` : 'All sizes, alignments and moves are back to normal'
    case 'photos':
      return `Added photos: ${[op.hero ? 'first screen' : '', op.about ? 'about' : '', op.gallery ? `${op.gallery.length} in the gallery` : ''].filter(Boolean).join(', ')}`
    case 'clearPhotos':
      return 'Removed the photos'
    case 'services':
      return `Listed ${op.items.length} service${op.items.length === 1 ? '' : 's'}: ${op.items.map((i) => i.name).join(', ')}`
    case 'tier':
      return `Design level: ${op.tier}`
    case 'motion':
      return `Animations: ${op.level}`
    case 'theme':
      return `Treated the business as ${op.theme.replace(/_/g, ' ')}`
  }
}

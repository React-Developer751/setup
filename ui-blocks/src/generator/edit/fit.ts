// Size, alignment and order of the parts of a page ("make the pricing section shorter", "narrower", "center the gallery", "put FAQ above pricing").
// A size is worked out on the markup of a block: the vertical padding and the tall fixed boxes scale with the height factor, the widest
// container with the width factor (or an exact pixel size). Nothing in the templates has to know about it.
import type { Align, Axis, FitTarget, Move, SectionKey, SiteEdits, SizeChange, Target } from './edits'

export type Fit = { height?: SizeChange; width?: SizeChange; align?: Align; /** the buttons alone */ buttons?: Align }
export type Fits = Partial<Record<Target, Fit>>

const MERGE = (page: SizeChange | undefined, own: SizeChange | undefined): SizeChange | undefined => {
  if (own?.px) return own
  if (!own) return page
  if (page?.px) return page
  return { factor: (page?.factor ?? 1) * (own.factor ?? 1) }
}

/** the fit of every part that was changed (the whole-page change is merged into each part) */
export function fitsFrom(edits: SiteEdits | undefined, targets: readonly Target[]): Fits | undefined {
  if (!edits || (!Object.keys(edits.sizes).length && !Object.keys(edits.aligns).length && !Object.keys(edits.buttonAligns ?? {}).length)) return undefined
  const out: Fits = {}
  for (const target of targets) {
    const page = edits.sizes.page
    const own = edits.sizes[target as FitTarget]
    const height = MERGE(page?.height, own?.height)
    const width = MERGE(page?.width, own?.width)
    const align = edits.aligns[target as FitTarget] ?? edits.aligns.page
    const buttons = edits.buttonAligns?.[target as FitTarget] ?? edits.buttonAligns?.page
    if (height || width || align || buttons) out[target] = { ...(height ? { height } : {}), ...(width ? { width } : {}), ...(align ? { align } : {}), ...(buttons ? { buttons } : {}) }
  }
  return Object.keys(out).length ? out : undefined
}

// ───────────── markup ─────────────
const REM = 4 // Tailwind: n * 0.25rem
const MAXW: Record<string, number> = { xs: 20, sm: 24, md: 28, lg: 32, xl: 36, '2xl': 42, '3xl': 48, '4xl': 56, '5xl': 64, '6xl': 72, '7xl': 80 }
const rem = (n: number) => `${Math.round(n * 100) / 100}rem`

type Tag = { start: number; end: number; name: string; attrs: string }
const TAG = /<([a-zA-Z][\w-]*)((?:\s+[^\s=>/"']+(?:\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\}))?)*)\s*(\/?)>/g

const tagsOf = (html: string): Tag[] => [...html.matchAll(TAG)].map((m) => ({ start: m.index, end: m.index + m[0].length, name: m[1], attrs: m[2] }))

const classAttr = (attrs: string, mode: 'html' | 'jsx') => attrs.match(new RegExp(`\\s${mode === 'jsx' ? 'className' : 'class'}="([^"]*)"`))

function rebuild(tag: Tag, mode: 'html' | 'jsx', mutate: (classes: string[]) => string[], style: string): string {
  const cname = mode === 'jsx' ? 'className' : 'class'
  const m = classAttr(tag.attrs, mode)
  let attrs = tag.attrs
  const classes = mutate((m?.[1] ?? '').split(/\s+/).filter(Boolean))
  if (m) attrs = attrs.replace(m[0], ` ${cname}="${classes.join(' ')}"`)
  else if (classes.length) attrs += ` ${cname}="${classes.join(' ')}"`
  if (style && mode === 'html') {
    const s = attrs.match(/\sstyle="([^"]*)"/)
    attrs = s ? attrs.replace(s[0], ` style="${s[1].replace(/;?$/, ';')}${style}"`) : `${attrs} style="${style}"`
  }
  return `<${tag.name}${attrs}>`
}

/** scales the vertical padding and the tall fixed boxes of a block; with `px` the block gets that minimum height instead */
function heightOf(html: string, change: SizeChange, mode: 'html' | 'jsx', tags: Tag[]): string {
  const root = tags[0]
  if (!root) return html
  const out: [Tag, string][] = []
  const f = change.px ? 1 : (change.factor ?? 1)
  // padding of the block itself
  const scalePad = (tag: Tag, minimum = 0) => {
    const classes = (classAttr(tag.attrs, mode)?.[1] ?? '').split(/\s+/).filter(Boolean)
    const base = classes.find((c) => /^py-\d+$/.test(c)) ?? classes.find((c) => /^pt-\d+$/.test(c))
    const baseB = classes.find((c) => /^py-\d+$/.test(c)) ?? classes.find((c) => /^pb-\d+$/.test(c))
    const md = classes.find((c) => /^md:py-\d+$/.test(c))
    if (!base && !baseB && !md) return
    // inner boxes only count when they are roomy (a hero card, a big band), not small card padding
    if (minimum && Number((base ?? baseB ?? md ?? '').replace(/^.*-/, '')) < minimum) return
    const num = (c: string | undefined) => (c ? Number(c.replace(/^.*-/, '')) : 0)
    const top = num(base)
    const bottom = num(baseB)
    const mdv = md ? Number(md.replace(/^md:py-/, '')) : undefined
    const keep = (c: string) => !/^(?:md:|lg:)?p[ytb]-\d+$/.test(c)
    // Tailwind sizes are quarter rems (py-20 = 5rem)
    const q = (n: number) => rem((n / REM) * f)
    const styleVal = (a: number, b?: number) => (b !== undefined && b !== a ? `clamp(${q(a)}, 6vw, ${q(b)})` : q(a))
    if (mode === 'html') {
      const style = `padding-top:${styleVal(top / 1, mdv !== undefined ? mdv : undefined)};padding-bottom:${styleVal(bottom, mdv !== undefined ? mdv : undefined)}`
      out.push([tag, rebuild(tag, mode, (cs) => cs.filter(keep), style)])
    } else {
      out.push([tag, rebuild(tag, mode, (cs) => [...cs.filter(keep), `pt-[${q(top)}]`, `pb-[${q(bottom)}]`, ...(mdv !== undefined ? [`md:pt-[${q(mdv)}]`, `md:pb-[${q(mdv)}]`] : [])], '')])
    }
  }
  if (!change.px) {
    scalePad(root)
    for (const tag of tags.slice(1)) scalePad(tag, 10)
  }
  // tall fixed boxes (pictures, cards): h-40 md:h-52, h-72 md:h-96, min-h-72 ...
  for (const tag of tags.slice(1)) {
    const classes = (classAttr(tag.attrs, mode)?.[1] ?? '').split(/\s+/).filter(Boolean)
    const tall = classes.filter((c) => /^(?:md:|lg:)?(?:min-)?h-(?:\d+)$/.test(c) && Number(c.replace(/^.*h-/, '')) >= 12)
    if (!tall.length || change.px) continue
    const prefixFree = tall.find((c) => /^(?:min-)?h-\d+$/.test(c))
    const mdv = tall.find((c) => /^md:(?:min-)?h-\d+$/.test(c))
    const minOnly = tall.some((c) => /min-h-/.test(c))
    const a = prefixFree ? Number(prefixFree.replace(/^.*h-/, '')) : Number(mdv?.replace(/^.*h-/, ''))
    const b = mdv ? Number(mdv.replace(/^.*h-/, '')) : undefined
    const prop = minOnly ? 'min-height' : 'height'
    if (mode === 'html') {
      const qh = (n: number) => rem((n / REM) * f)
      const style = `${prop}:${b !== undefined && b !== a ? `clamp(${qh(a)}, 22vw, ${qh(b)})` : qh(a)}`
      out.push([tag, rebuild(tag, mode, (cs) => cs.filter((c) => !tall.includes(c)), style)])
    } else {
      const pre = minOnly ? 'min-h' : 'h'
      out.push([tag, rebuild(tag, mode, (cs) => [...cs.filter((c) => !tall.includes(c)), `${pre}-[${rem((a / REM) * f)}]`, ...(b !== undefined ? [`md:${pre}-[${rem((b / REM) * f)}]`] : [])], '')])
    }
  }
  if (change.px) {
    out.push([root, rebuild(root, mode, (cs) => (mode === 'jsx' ? [...cs, `min-h-[${change.px}px]`] : cs), mode === 'html' ? `min-height:${change.px}px` : '')])
  }
  return replaceTags(html, out)
}

function replaceTags(html: string, changes: [Tag, string][]): string {
  const merged = new Map<number, [Tag, string]>()
  for (const [tag, text] of changes) merged.set(tag.start, [tag, text])
  let result = ''
  let at = 0
  for (const [start, [tag, text]] of [...merged.entries()].sort((a, b) => a[0] - b[0])) {
    result += html.slice(at, start) + text
    at = tag.end
  }
  return result + html.slice(at)
}

/** the widest container of the block gets the new maximum width */
function widthOf(html: string, change: SizeChange, mode: 'html' | 'jsx', tags: Tag[]): string {
  for (const tag of tags) {
    const classes = (classAttr(tag.attrs, mode)?.[1] ?? '').split(/\s+/).filter(Boolean)
    const maxw = classes.find((c) => /^max-w-(?:xs|sm|md|lg|xl|[2-7]xl)$/.test(c))
    if (!maxw) continue
    const base = MAXW[maxw.replace('max-w-', '')]
    const target = change.px ? `${change.px}px` : rem(base * (change.factor ?? 1))
    const replaced = mode === 'html' ? replaceTags(html, [[tag, rebuild(tag, mode, (cs) => cs.filter((c) => c !== maxw), `max-width:min(100%,${target})`)]]) : replaceTags(html, [[tag, rebuild(tag, mode, (cs) => [...cs.filter((c) => c !== maxw), `max-w-[${target}]`], '')]])
    return replaced
  }
  return html
}

const alignWords = { left: 'text-left', center: 'text-center', right: 'text-right' } as const

const JUSTIFY = { left: 'justify-start', center: 'justify-center', right: 'justify-end' } as const
const ITEMS = { left: 'items-start', center: 'items-center', right: 'items-end' } as const
const AUTO_MARGIN = { left: ['mr-auto'], center: ['mx-auto'], right: ['ml-auto'] } as const

/** a row of flex items (buttons, badges ...) and a centred column move with the alignment, not only the text of a block */
const flexAlign = (classes: string[], align: Align, onlyAnchors: boolean): string[] | undefined => {
  const isFlex = classes.includes('flex') || classes.includes('inline-flex')
  const justify = classes.filter((c) => /^(?:(?:sm|md|lg):)?justify-(?:center|start|end)$/.test(c))
  const items = classes.filter((c) => /^(?:(?:sm|md|lg):)?items-(?:center|start|end)$/.test(c))
  const auto = classes.filter((c) => /^(?:mx-auto|ml-auto|mr-auto)$/.test(c))
  if (onlyAnchors) {
    if (!isFlex || !justify.length) return isFlex ? [...classes, JUSTIFY[align]] : undefined
  }
  if (!justify.length && !(items.length && classes.includes('flex-col')) && !auto.length) return undefined
  let out = classes.filter((c) => !justify.includes(c) && !(classes.includes('flex-col') && items.includes(c)) && !auto.includes(c))
  if (justify.length) out = [...out, JUSTIFY[align]]
  if (items.length && classes.includes('flex-col')) out = [...out, ITEMS[align]]
  if (auto.length) out = [...out, ...AUTO_MARGIN[align]]
  return out
}

function alignOf(html: string, align: Align, mode: 'html' | 'jsx', tags: Tag[]): string {
  const out: [Tag, string][] = []
  tags.forEach((tag, i) => {
    const classes = (classAttr(tag.attrs, mode)?.[1] ?? '').split(/\s+/).filter(Boolean)
    const has = classes.some((c) => /^text-(?:left|center|right)$/.test(c))
    const moved = flexAlign(classes, align, false)
    if (!has && !moved && i > 0) return
    out.push([tag, rebuild(tag, mode, (cs) => {
      const base = moved && cs.length === classes.length ? moved : cs
      return [...base.filter((c) => !/^text-(?:left|center|right)$/.test(c)), alignWords[align]]
    }, i === 0 && mode === 'html' ? `text-align:${align}` : '')])
  })
  return replaceTags(html, out)
}

/** the rows that hold the buttons of a block (a flex row whose first child is a link or a button) */
function buttonsAlignOf(html: string, align: Align, mode: 'html' | 'jsx', tags: Tag[]): string {
  const out: [Tag, string][] = []
  for (const tag of tags) {
    if (!/^(?:div|p|nav)$/.test(tag.name)) continue
    if (!/^\s*<(?:a|button)\b/.test(html.slice(tag.end, tag.end + 80))) continue
    const classes = (classAttr(tag.attrs, mode)?.[1] ?? '').split(/\s+/).filter(Boolean)
    if (!classes.includes('flex')) continue
    const moved = flexAlign(classes, align, true)
    if (moved) out.push([tag, rebuild(tag, mode, () => moved, '')])
  }
  return replaceTags(html, out)
}

/** applies a fit to the markup of one block (html for the preview, jsx for the React export) */
export function fitMarkup(markup: string, fit: Fit, mode: 'html' | 'jsx'): string {
  let html = markup
  const axes: [Axis, SizeChange | undefined][] = [['height', fit.height], ['width', fit.width]]
  for (const [axis, change] of axes) {
    if (!change) continue
    const tags = tagsOf(html)
    html = axis === 'height' ? heightOf(html, change, mode, tags) : widthOf(html, change, mode, tags)
  }
  if (fit.align) html = alignOf(html, fit.align, mode, tagsOf(html))
  if (fit.buttons) html = buttonsAlignOf(html, fit.buttons, mode, tagsOf(html))
  return html
}

// ───────────── order ─────────────
/** moves the sections of a list: items without a section (navigation, first screen, footer ...) stay where they are */
export function reorder<T extends string>(ids: T[], moves: { section: SectionKey; where: Move; target?: SectionKey }[], sectionOf: (id: T) => SectionKey | undefined): T[] {
  if (!moves.length) return ids
  const slots = ids.map((id, i) => (sectionOf(id) ? i : -1)).filter((i) => i >= 0)
  let list = slots.map((i) => ids[i])
  const keyOf = (id: T) => sectionOf(id)
  for (const move of moves) {
    const from = list.findIndex((id) => keyOf(id) === move.section)
    if (from < 0) continue
    const [item] = list.splice(from, 1)
    let to: number
    if (move.where === 'top') to = 0
    else if (move.where === 'bottom') to = list.length
    else if (move.where === 'up') to = Math.max(0, from - 1)
    else if (move.where === 'down') to = Math.min(list.length, from + 1)
    else {
      const at = list.findIndex((id) => keyOf(id) === move.target)
      if (at < 0) {
        list.splice(from, 0, item)
        continue
      }
      to = move.where === 'before' ? at : at + 1
    }
    list.splice(to, 0, item)
  }
  const out = [...ids]
  slots.forEach((slot, i) => (out[slot] = list[i]))
  return out
}

/** the same for the pages of the navigation (the Home page always stays first) */
export function reorderPages<T extends { id: string; inNav?: boolean }>(pages: T[], moves: { page: string; where: Move; target?: string }[]): T[] {
  if (!moves.length) return pages
  const movable = (p: T) => p.inNav !== false && p.id !== 'home' && !['privacy', 'terms', 'post', 'notfound'].includes(p.id)
  const slots = pages.map((p, i) => (movable(p) ? i : -1)).filter((i) => i >= 0)
  const list = slots.map((i) => pages[i])
  for (const move of moves) {
    const from = list.findIndex((p) => p.id === move.page)
    if (from < 0) continue
    const [item] = list.splice(from, 1)
    let to: number
    if (move.where === 'top') to = 0
    else if (move.where === 'bottom') to = list.length
    else if (move.where === 'up') to = Math.max(0, from - 1)
    else if (move.where === 'down') to = Math.min(list.length, from + 1)
    else {
      const at = list.findIndex((p) => p.id === move.target)
      if (at < 0) {
        list.splice(from, 0, item)
        continue
      }
      to = move.where === 'before' ? at : at + 1
    }
    list.splice(to, 0, item)
  }
  const out = [...pages]
  slots.forEach((slot, i) => (out[slot] = list[i]))
  return out
}

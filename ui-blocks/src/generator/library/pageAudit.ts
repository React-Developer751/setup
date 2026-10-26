// Looks at a page that is drawn (in a browser): can every text be read on what is behind it?
// The palette judge (colorJudge.ts) checks the colours as a set; this checks the page itself, with the panels, the bands, the cards and the buttons on top of each other.
export type ContrastFailure = { role: string; text: string; ratio: number; need: number; classes?: string; fg?: string; bg?: string }
export type PageAudit = { checked: number; failures: ContrastFailure[]; sections: number; badSections: number }

type Rgba = [number, number, number, number]

/** the style of an element, also of one that lives in another document (a preview frame) */
const cs = (el: Element) => (el.ownerDocument.defaultView ?? window).getComputedStyle(el)

let canvas: CanvasRenderingContext2D | null | undefined
/** any CSS colour (rgb, oklab, color-mix ...) as red, green, blue, alpha */
function parse(css: string): Rgba | undefined {
  if (canvas === undefined) canvas = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!canvas || !css || css === 'transparent') return css === 'transparent' ? [0, 0, 0, 0] : undefined
  canvas.clearRect(0, 0, 1, 1)
  canvas.fillStyle = '#010203'
  canvas.fillStyle = css
  canvas.fillRect(0, 0, 1, 1)
  const d = canvas.getImageData(0, 0, 1, 1).data
  return [d[0], d[1], d[2], d[3] / 255]
}
const lin = (v: number) => {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
const lum = ([r, g, b]: Rgba) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const ratio = (a: Rgba, b: Rgba) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const over = (top: Rgba, under: Rgba): Rgba => {
  const a = top[3]
  return [top[0] * a + under[0] * (1 - a), top[1] * a + under[1] * (1 - a), top[2] * a + under[2] * (1 - a), 1]
}

/** the colour behind an element: the backgrounds of its parents laid over each other; undefined when a picture or a gradient is behind it */
function backdrop(el: Element): Rgba | undefined {
  const layers: Rgba[] = []
  for (let node: Element | null = el; node; node = node.parentElement) {
    const style = cs(node)
    if (style.backgroundImage && style.backgroundImage !== 'none') return undefined
    const color = parse(style.backgroundColor)
    if (color && color[3] > 0) layers.push(color)
    if (color && color[3] >= 0.99) break
  }
  let result: Rgba = [255, 255, 255, 1]
  for (const layer of layers.reverse()) result = over(layer, result)
  return result
}

export function auditPage(root: Element): PageAudit {
  const failures: ContrastFailure[] = []
  let checked = 0
  const bad = new Set<Element>()
  const sections = [...root.querySelectorAll('[data-role]')]
  for (const section of sections) {
    const walker = section.ownerDocument.createTreeWalker(section, NodeFilter.SHOW_TEXT)
    const seen = new Set<Element>()
    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      const el = node.parentElement
      if (!el || seen.has(el) || !node.textContent?.trim() || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(el.tagName)) continue
      seen.add(el)
      const style = cs(el)
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) < 0.3 || el.closest('.sr-only')) continue
      const fg = parse(style.color)
      const bg = backdrop(el)
      if (!fg || !bg) continue
      checked += 1
      const size = parseFloat(style.fontSize)
      const bold = Number(style.fontWeight) >= 700
      const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5
      const flat = over(fg, bg)
      const r = ratio(flat, bg)
      if (r < need - 0.01) {
        const hex = (c: Rgba) => `#${c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
        failures.push({ role: (section as HTMLElement).dataset.role ?? '', text: node.textContent.trim().slice(0, 40), ratio: Math.round(r * 10) / 10, need, classes: `${el.tagName.toLowerCase()}.${(el.getAttribute('class') ?? '').slice(0, 110)}`, fg: hex(flat), bg: hex(bg) })
        bad.add(section)
      }
    }
  }
  return { checked, failures, sections: sections.length, badSections: bad.size }
}

const toHex = (c: Rgba) => `#${c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`
const mixRgb = (a: Rgba, b: Rgba, p: number): Rgba => [a[0] * (1 - p) + b[0] * p, a[1] * (1 - p) + b[1] * p, a[2] * (1 - p) + b[2] * p, 1]
const BLACK: Rgba = [10, 10, 10, 1]
const WHITE: Rgba = [255, 255, 255, 1]

/** the colour of the text, moved towards black or white (whichever reads better) until it can be read on `bg`; the hue stays as long as possible */
function readableOn(fg: Rgba, bg: Rgba, need: number): Rgba {
  const target = ratio(BLACK, bg) >= ratio(WHITE, bg) ? BLACK : WHITE
  for (let p = 0.1; p <= 1.001; p += 0.1) {
    const c = mixRgb(fg, target, Math.min(1, p))
    if (ratio(c, bg) >= need + 0.15) return c
  }
  return target
}

/**
 * Repairs the page: every text that cannot be read on what is behind it (in the light page or in the dark one) gets a colour that can.
 * The two colours are written on the element (--fx-l, --fx-d) and LIBRARY_CSS picks the one of the mode, so the light / dark switch of the finished page keeps working.
 * `setMode` puts the page into a mode (its colours and its "dark" class); the page is drawn in a browser, attached to the document.
 */
export function repairContrast(root: Element, setMode: (mode: 'light' | 'dark') => void, modes: ('light' | 'dark')[] = ['light', 'dark']): number {
  const colours = new Map<Element, { light?: string; dark?: string; fixed: boolean }>()
  for (const mode of modes) {
    setMode(mode)
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const seen = new Set<Element>()
    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      const el = node.parentElement
      if (!el || seen.has(el) || !node.textContent?.trim() || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(el.tagName)) continue
      seen.add(el)
      const style = cs(el)
      if (style.visibility === 'hidden' || style.display === 'none') continue
      const fg = parse(style.color)
      const bg = backdrop(el)
      if (!fg || !bg) continue
      const size = parseFloat(style.fontSize)
      const need = size >= 24 || (Number(style.fontWeight) >= 700 && size >= 18.66) ? 3 : 4.5
      const flat = over(fg, bg)
      const entry = colours.get(el) ?? { fixed: false }
      if (ratio(flat, bg) < need) {
        entry[mode] = toHex(readableOn(flat, bg, need))
        entry.fixed = true
      } else entry[mode] = toHex(flat)
      colours.set(el, entry)
    }
  }
  let fixed = 0
  for (const [el, entry] of colours) {
    if (!entry.fixed) continue
    fixed += 1
    const html = el as HTMLElement
    html.setAttribute('data-fx', '')
    if (entry.light) html.style.setProperty('--fx-l', entry.light)
    if (entry.dark) html.style.setProperty('--fx-d', entry.dark)
    // a mode that was not looked at keeps the colour of the other
    if (!entry.light && entry.dark) html.style.setProperty('--fx-l', entry.dark)
    if (!entry.dark && entry.light) html.style.setProperty('--fx-d', entry.light)
  }
  return fixed
}

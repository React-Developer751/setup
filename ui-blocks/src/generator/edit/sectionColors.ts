// A colour for one part of the page ("header red, footer green"): the part gets that background, and the text, borders, cards and the
// accent on top of it are worked out so that everything stays readable. The same tokens are used by all engines.
import { onColor, type Palette } from '../themes'
import type { SiteEdits, Target } from './edits'

const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`

export const luminance = (hex: string) => {
  const [r, g, b] = [0, 1, 2].map((i) => channel(hex, i) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
/** `percent` of a, the rest b */
export const mixHex = (a: string, percent: number, b: string) => toHex(...([0, 1, 2].map((i) => (channel(a, i) * percent + channel(b, i) * (100 - percent)) / 100) as [number, number, number]))

/** the CSS variables of a part with this background colour (the same names the page uses: --g-bg, --g-text ...) */
export function sectionTokens(bg: string, palette: Palette): Record<string, string> {
  // whichever of dark or light text reads better on this background (mid tones like green need a check, not a guess)
  const text = contrast('#111827', bg) >= contrast('#f9fafb', bg) ? '#111827' : '#f9fafb'
  // the accent of the page, if it can be seen on this background; else the text colour
  const accent = [palette.light.accent, palette.dark.accent].find((c) => contrast(c, bg) >= 3) ?? text
  const onAccent = contrast('#111827', accent) >= contrast('#ffffff', accent) ? '#111827' : '#ffffff'
  const surface = mixHex(text, 9, bg)
  return {
    '--g-bg': bg,
    '--g-surface': surface,
    '--g-border': mixHex(text, 20, bg),
    '--g-text': text,
    '--g-muted': mixHex(text, 72, bg),
    '--g-accent': accent,
    '--g-on-accent': onAccent,
    '--g-grad-a': mixHex(accent, 38, bg),
    '--g-grad-b': surface,
    '--g-grad-c': mixHex(accent, 24, bg),
    '--g-badge': mixHex(accent, 16, bg),
  }
}

/** the part of the page a layout block is: the navigation bar, the first screen, the footer or a section */
export function targetOfLayout(id: string, sectionOf: (id: string) => Target | undefined): Target | undefined {
  if (id.startsWith('navbar') || id.startsWith('nav-')) return 'header'
  if (id.startsWith('hero')) return 'hero'
  if (id.startsWith('footer')) return 'footer'
  return sectionOf(id)
}

export type Paints = Partial<Record<Target, Record<string, string>>>

/** the tokens of every part that has its own colour */
export function paintsFrom(edits: SiteEdits | undefined, palette: Palette, auto?: Partial<Record<Target, string>>): Paints | undefined {
  // the colours of the mood first; what the person asked for wins ('' = no colour of its own)
  const entries = Object.entries({ ...auto, ...edits?.sectionColors }).filter(([, hex]) => !!hex) as [Target, string][]
  const paints: Paints = Object.fromEntries(entries.map(([target, hex]) => [target, sectionTokens(hex, palette)]))
  // the colour of the buttons of one part ("hero button green"): two more tokens on the part
  for (const [target, style] of Object.entries(edits?.styles ?? {}) as [string, { buttonColor?: string }][]) {
    if (target === 'page' || !style?.buttonColor) continue
    paints[target as Target] = { ...paints[target as Target], '--g-btn': style.buttonColor, '--g-on-btn': onColor(style.buttonColor) }
  }
  return Object.keys(paints).length ? paints : undefined
}

/** puts the tokens on the first element of a block: inline style for HTML, Tailwind property classes for JSX */
export function paintMarkup(markup: string, tokens: Record<string, string>, mode: 'html' | 'jsx'): string {
  const m = /^(\s*)<([a-zA-Z][\w-]*)((?:\s[^>]*?)?)(\/?)>/.exec(markup)
  if (!m) return markup
  const [whole, space, tag, attrs, selfClose] = m
  let nextAttrs = attrs
  if (mode === 'html') {
    const declarations = Object.entries(tokens).map(([k, v]) => `${k}:${v}`).join(';')
    nextAttrs = /\sstyle="([^"]*)"/.test(attrs) ? attrs.replace(/\sstyle="([^"]*)"/, (_x, old: string) => ` style="${old.replace(/;?$/, ';')}${declarations}"`) : `${attrs} style="${declarations}"`
  } else {
    const classes = Object.entries(tokens).map(([k, v]) => `[${k}:${v}]`).join(' ')
    if (/\sclassName="/.test(attrs)) nextAttrs = attrs.replace(/\sclassName="/, ` className="${classes} `)
    else if (/\sclassName=\{/.test(attrs)) return `<div className="${classes} contents">${markup}</div>`
    else nextAttrs = `${attrs} className="${classes}"`
  }
  return markup.replace(whole, `${space}<${tag}${nextAttrs}${selfClose}>`)
}

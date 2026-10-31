// The about part (gen/About_...): the story of the business, its points and a picture. See partKit.ts.
import { definePart } from './partKit'
import { ARRIVES, BGS, DECORS, FONTS, arriveCss, baseCss, decorCss, fxNode, surface } from './partCommon'
import { h, type Node } from './heroTree'

export type AboutSpec = {
  layout: 'image-left' | 'image-right' | 'centered' | 'columns' | 'wide-image' | 'lead'
  media: 'plain' | 'rounded' | 'frame' | 'tall'
  points: 'ticks' | 'cards' | 'numbers' | 'chips'
  bg: (typeof BGS)[number]
  font: (typeof FONTS)[number]
  size: 'm' | 'l' | 'xl'
  radius: 0 | 10 | 22
  head: 'left' | 'center'
  decor: (typeof DECORS)[number]
  arrives: (typeof ARRIVES)[number]
}

export const about = definePart<AboutSpec>({
  prefix: 'About',
  axes: { layout: ['image-left', 'image-right', 'centered', 'columns', 'wide-image', 'lead'], media: ['plain', 'rounded', 'frame', 'tall'], points: ['ticks', 'cards', 'numbers', 'chips'], bg: BGS, font: FONTS, size: ['m', 'l', 'xl'], radius: [0, 10, 22], head: ['left', 'center'], decor: DECORS, arrives: ARRIVES },
  valid: (s) => {
    if (s.layout === 'centered' && s.head === 'left') return false
    if (s.layout === 'centered' && s.media === 'tall') return false
    if (s.layout === 'wide-image' && s.media === 'tall') return false
    if (s.font === 'serif' && s.size === 'm') return false
    if (s.bg === 'accent' && (s.decor === 'blob' || s.points === 'cards')) return false
    if (s.bg === 'ink' && s.decor === 'grain') return false
    if (s.media === 'frame' && s.radius === 22) return false
    return true
  },
  fit: (s) => {
    const f = { ...s }
    if (f.layout === 'centered') { f.head = 'center'; if (f.media === 'tall') f.media = 'rounded' }
    if (f.layout === 'wide-image' && f.media === 'tall') f.media = 'rounded'
    if (f.font === 'serif' && f.size === 'm') f.size = 'l'
    if (f.bg === 'accent' && f.points === 'cards') f.points = 'ticks'
    if (f.media === 'frame' && f.radius === 22) f.radius = 10
    return f
  },
  lean: {
    calm: { layout: ['image-left', 'image-right', 'columns'], bg: ['plain', 'band'], points: ['ticks', 'chips'], media: ['rounded', 'plain'] },
    bold: { layout: ['lead', 'wide-image', 'image-left'], size: ['xl', 'l'], bg: ['ink', 'accent', 'plain'], font: ['display', 'sans'], points: ['numbers', 'chips'] },
    soft: { radius: [22], media: ['rounded', 'tall'], font: ['serif', 'sans'], bg: ['band', 'glow', 'plain'], points: ['ticks', 'cards'] },
    dark: { bg: ['ink', 'glow'], points: ['cards', 'chips'], decor: ['grid', 'dots', 'none'] },
    playful: { radius: [22], bg: ['accent', 'band', 'glow'], media: ['frame', 'rounded'], points: ['chips', 'numbers'], decor: ['dots', 'blob'] },
  },
  fallback: { layout: 'image-left', media: 'rounded', points: 'ticks', bg: 'plain', font: 'sans', size: 'l', radius: 10, head: 'left', decor: 'none', arrives: 'none' },
  alike: (a, b) => a.layout === b.layout && a.bg === b.bg,
  describe: (s) => `${s.layout} about, ${s.media} picture, ${s.points} points, ${s.bg} background${s.decor === 'none' ? '' : ` with ${s.decor}`}, ${s.size} heading`,
})

export function aboutCss(s: AboutSpec, p: string): string {
  const sf = surface(s.bg)
  const css = baseCss(p, { bg: s.bg, font: s.font, head: s.size, center: s.head === 'center', pad: 'clamp(3.5rem,8vw,6.5rem)', wide: '72rem' })
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))
  const split = s.layout === 'image-left' || s.layout === 'image-right'
  c(`& .gp-title{margin-bottom:1.25rem}`)
  if (split) c(`& .gp-in{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:2.5rem clamp(2rem,6vw,5rem);align-items:center}${s.layout === 'image-left' ? '& .gp-pic{order:-1}' : ''}`)
  if (s.layout === 'centered') c(`& .gp-in{max-width:48rem;text-align:center}& .gp-points{justify-content:center}`)
  if (s.layout === 'columns') c(`& .gp-in{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:1.5rem clamp(2rem,6vw,5rem);align-items:start}& .gp-title{position:sticky;top:6rem}& .gp-pic{grid-column:1/-1}& .gp-body{columns:2 16rem;column-gap:2.5rem}& .gp-body p{break-inside:avoid}`)
  if (s.layout === 'wide-image') c(`& .gp-pic{margin-bottom:2.5rem}& .gp-img{aspect-ratio:21/9}& .gp-body{max-width:46rem}`)
  if (s.layout === 'lead') c(`& .gp-body p:first-child{font-size:clamp(1.3rem,2.6vw,2rem);line-height:1.3;font-weight:${s.font === 'display' ? 700 : 500};letter-spacing:-.02em;opacity:1}& .gp-in{display:grid;grid-template-columns:minmax(0,1fr);gap:2rem}& .gp-body{max-width:54rem}`)
  c(`& .gp-body p{margin:0 0 1.1rem;font-size:1.05rem;line-height:1.7;opacity:.82;color:inherit}`)
  const img = { plain: '', rounded: `border-radius:${s.radius}px;`, frame: `border-radius:${Math.min(s.radius, 10)}px;box-shadow:.9rem .9rem 0 -.1rem var(--g-accent);`, tall: `border-radius:${Math.max(s.radius, 10)}px;aspect-ratio:3/4;` }[s.media]
  c(`& .gp-pic{margin:0}& .gp-img{display:block;width:100%;height:100%;max-height:34rem;object-fit:cover;${img}}`)
  const pts = { ticks: `& .gp-points{list-style:none;margin:1.5rem 0 0;padding:0;display:flex;flex-direction:column;gap:.7rem}& .gp-point{display:flex;gap:.7rem;align-items:baseline;font-weight:600}& .gp-point::before{content:'✓';color:${s.bg === 'ink' || s.bg === 'accent' ? 'inherit' : 'var(--g-accent)'};font-weight:800}`,
    cards: `& .gp-points{list-style:none;margin:1.75rem 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.9rem}& .gp-point{padding:1.1rem 1.2rem;border-radius:${Math.min(s.radius, 16)}px;background:color-mix(in srgb,currentColor 8%,transparent);font-weight:600;line-height:1.35}`,
    numbers: `& .gp-points{list-style:none;margin:1.75rem 0 0;padding:0;display:flex;flex-direction:column;gap:.9rem;counter-reset:pt}& .gp-point{counter-increment:pt;display:flex;gap:1rem;align-items:baseline;padding-bottom:.9rem;border-bottom:1px solid color-mix(in srgb,currentColor 16%,transparent);font-weight:600}& .gp-point::before{content:counter(pt,decimal-leading-zero);font-size:.8rem;opacity:.55;letter-spacing:.08em}`,
    chips: `& .gp-points{list-style:none;margin:1.5rem 0 0;padding:0;display:flex;flex-wrap:wrap;gap:.6rem}& .gp-point{padding:.5rem 1rem;border-radius:999px;border:1px solid color-mix(in srgb,currentColor 30%,transparent);font-size:.92rem;font-weight:600}`,
  }[s.points]
  c(pts)
  void sf
  css.push(...decorCss(p, s.decor, s.bg), ...arriveCss(p, s.arrives, '.gp-in > *'))
  css.push(`@media (max-width:820px){.${p} .gp-in{display:block}.${p} .gp-title{position:static}.${p} .gp-pic{margin-bottom:1.75rem}.${p} .gp-img{aspect-ratio:4/3;max-height:22rem}.${p} .gp-body{columns:1}}`)
  return css.join('\n')
}

export function aboutTree(s: AboutSpec, p: string): Node {
  const body = h('div', { className: 'gp-body' }, h('p', { 'data-slot': 'para' }, 'Paragraph'), h('p', { 'data-slot': 'para' }, 'Paragraph'))
  const points = h('ul', { className: 'gp-points' }, ...[0, 1, 2, 3].map(() => h('li', { 'data-slot': 'point', className: 'gp-point' }, 'Point')))
  const pic = h('figure', { className: 'gp-pic' }, h('img', { 'data-slot': 'image', className: 'gp-img', alt: '', loading: 'lazy' }))
  const title = h('h2', { 'data-slot': 'title', className: 'gp-title' }, 'Title')
  const text = h('div', { className: 'gp-text' }, title, body, points)
  const inner = s.layout === 'columns' ? [title, h('div', {}, body, points), pic] : s.layout === 'wide-image' ? [pic, text] : s.layout === 'centered' ? [text, pic] : s.layout === 'lead' ? [title, body, points, pic] : [text, pic]
  return h('section', { 'data-ref': 'show-about', 'data-gen': 'about', className: p }, h('style', {}, aboutCss(s, p)), ...fxNode(s.decor), h('div', { className: 'gp-in' }, ...inner))
}

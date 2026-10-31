// The footer (gen/Footer_...): the brand, the pages, what the business offers, how to reach it, the small print. See partKit.ts.
import { definePart } from './partKit'
import { BGS, FONTS, SANS, SERIF, surface } from './partCommon'
import { h, type Node } from './heroTree'

export type FooterSpec = {
  layout: 'columns' | 'bar' | 'centered' | 'big-brand' | 'split'
  bg: (typeof BGS)[number]
  line: 'none' | 'line'
  link: 'plain' | 'arrow' | 'underline'
  font: (typeof FONTS)[number]
  size: 's' | 'm' | 'l'
  cols: 2 | 3
  tag: 'yes' | 'no'
  radius: 0 | 10 | 24
  small: 'split' | 'center'
  gap: 'tight' | 'airy'
}

export const footer = definePart<FooterSpec>({
  prefix: 'Footer',
  axes: { layout: ['columns', 'bar', 'centered', 'big-brand', 'split'], bg: BGS, line: ['none', 'line'], link: ['plain', 'arrow', 'underline'], font: FONTS, size: ['s', 'm', 'l'], cols: [2, 3], tag: ['yes', 'no'], radius: [0, 10, 24], small: ['split', 'center'], gap: ['tight', 'airy'] },
  valid: (s) => {
    if (s.bg === 'glow') return false
    if (s.layout === 'big-brand' && s.size === 's') return false
    if (s.layout === 'bar' && s.cols === 3) return false
    return true
  },
  fit: (s) => {
    const f = { ...s }
    if (f.bg === 'glow') f.bg = 'band'
    if (f.layout === 'big-brand' && f.size === 's') f.size = 'm'
    if (f.layout === 'bar') f.cols = 2
    return f
  },
  lean: {
    calm: { layout: ['columns', 'split', 'centered'], bg: ['plain', 'band'], line: ['line'] },
    bold: { layout: ['big-brand', 'columns'], bg: ['ink', 'accent'], size: ['l', 'm'], font: ['display', 'sans'], link: ['arrow', 'underline'] },
    soft: { layout: ['centered', 'columns'], bg: ['band', 'plain'], font: ['serif', 'sans'] },
    dark: { bg: ['ink'], line: ['line', 'none'] },
    playful: { layout: ['big-brand', 'centered'], bg: ['accent', 'band'], link: ['arrow'] },
  },
  fallback: { layout: 'columns', bg: 'band', line: 'line', link: 'plain', font: 'sans', size: 'm', cols: 3, tag: 'yes', radius: 0, small: 'split', gap: 'airy' },
  alike: (a, b) => a.layout === b.layout && a.bg === b.bg,
  describe: (s) => `${s.layout} footer, ${s.bg} background, ${s.link} links${s.cols === 3 ? ', three columns' : ''}, ${s.size} brand`,
})

export function footerCss(s: FooterSpec, p: string): string {
  const sf = surface(s.bg)
  const css: string[] = []
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))
  const brandSize = { s: '1.2rem', m: '1.5rem', l: s.layout === 'big-brand' ? 'clamp(3rem,13vw,10rem)' : '2rem' }[s.size]
  c(`&{position:relative;background:${sf.bg};color:${sf.fg};padding:${s.gap === 'tight' ? 'clamp(2rem,4vw,3rem)' : 'clamp(2.5rem,6vw,4.5rem)'} 1.5rem 1.5rem;${s.radius ? `border-radius:${s.radius}px ${s.radius}px 0 0;` : ''}${s.line === 'line' ? 'border-top:1px solid color-mix(in srgb,currentColor 14%,transparent);' : ''}}`)
  c(`& *{box-sizing:border-box}`)
  c(`& .gf-in{max-width:72rem;margin:0 auto}`)
  c(`& .gf-brand{font-family:${s.font === 'serif' ? SERIF : SANS};font-size:${brandSize};font-weight:${s.font === 'display' ? 800 : 700};letter-spacing:${s.layout === 'big-brand' ? '-.05em' : '-.02em'};line-height:${s.layout === 'big-brand' ? 0.9 : 1.1};text-decoration:none;color:inherit;display:inline-block;${s.font === 'display' ? 'text-transform:uppercase;' : ''}overflow-wrap:anywhere}`)
  c(`& .gf-tag{margin:.7rem 0 0;max-width:24rem;font-size:.95rem;line-height:1.55;opacity:.72;${s.tag === 'no' ? 'display:none;' : ''}color:inherit}`)
  c(`& .gf-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:2rem}`)
  c(`& .gf-col-title{margin:0 0 .9rem;font-size:.75rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;opacity:.6;color:inherit}`)
  c(`& .gf-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.55rem}`)
  const link = { plain: 'opacity:.8;', arrow: 'opacity:.8;', underline: 'opacity:.8;text-decoration:underline;text-underline-offset:.25em;text-decoration-color:color-mix(in srgb,currentColor 35%,transparent);' }[s.link]
  c(`& .gf-link{font-size:.95rem;color:inherit;text-decoration:none;${link}transition:opacity .2s ease}& .gf-link:hover{opacity:1;${s.link === 'plain' ? 'text-decoration:underline;' : ''}}${s.link === 'arrow' ? '& a.gf-link::after{content:" →";opacity:0;transition:opacity .2s ease}& a.gf-link:hover::after{opacity:1}' : ''}`)
  c(`& .gf-small{margin-top:2.5rem;padding-top:1.25rem;border-top:1px solid color-mix(in srgb,currentColor 16%,transparent);display:flex;flex-wrap:wrap;gap:.5rem 1.5rem;justify-content:${s.small === 'center' ? 'center;text-align:center' : 'space-between'};font-size:.85rem;opacity:.7}`)
  const hideThird = s.cols === 2 ? '& .gf-col:nth-child(3){display:none}' : ''
  c(hideThird)
  switch (s.layout) {
    case 'columns':
      c(`& .gf-top{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,2.2fr);gap:2.5rem 4rem}`)
      break
    case 'split':
      c(`& .gf-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:2.5rem 4rem;align-items:start}& .gf-cols{grid-template-columns:repeat(2,minmax(0,1fr))}`)
      break
    case 'centered':
      c(`& .gf-top{text-align:center;display:flex;flex-direction:column;align-items:center;gap:2rem}& .gf-tag{margin-inline:auto}& .gf-cols{justify-items:center;text-align:center;width:100%}& .gf-small{justify-content:center;text-align:center}`)
      break
    case 'big-brand':
      c(`& .gf-top{display:flex;flex-direction:column;gap:2.25rem}& .gf-brand{order:3;margin-top:1rem}`)
      break
    case 'bar':
      c(`& .gf-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1.25rem 2rem}& .gf-cols{display:flex;flex-wrap:wrap;gap:.5rem 1.5rem}& .gf-col{display:contents}& .gf-col-title{display:none}& .gf-list{flex-direction:row;flex-wrap:wrap;gap:.4rem 1.4rem}& .gf-tag{display:none}& .gf-small{margin-top:1.5rem}`)
      break
  }
  css.push(`@media (max-width:820px){.${p} .gf-top{display:flex!important;flex-direction:column;gap:2rem}.${p} .gf-cols{grid-template-columns:repeat(2,minmax(0,1fr))!important}${s.layout === 'big-brand' ? `.${p} .gf-brand{order:0}` : ''}}`)
  return css.join('\n')
}

export function footerTree(s: FooterSpec, p: string): Node {
  const col = (kind: string) => h('div', { 'data-slot': 'col', 'data-kind': kind, className: 'gf-col' }, h('h3', { 'data-slot': 'col-title', className: 'gf-col-title' }, 'Title'), h('ul', { className: 'gf-list' }, ...[0, 1, 2, 3, 4, 5].map(() => h('li', {}, h('a', { 'data-slot': 'link', href: '#', className: 'gf-link' }, 'Link')))))
  const brand = h('div', { className: 'gf-id' }, h('a', { 'data-slot': 'brand', href: '#home', className: 'gf-brand' }, 'Brand'), h('p', { 'data-slot': 'tagline', className: 'gf-tag' }, 'Tagline'))
  const cols = h('div', { className: 'gf-cols' }, col('pages'), col('offer'), col('contact'))
  const small = h('div', { className: 'gf-small' }, h('span', { 'data-slot': 'rights' }, 'Rights'), h('span', { 'data-slot': 'place' }, 'Place'))
  return h('footer', { 'data-ref': 'show-footer', 'data-gen': 'footer', className: p }, h('style', {}, footerCss(s, p)), h('div', { className: 'gf-in' }, h('div', { className: 'gf-top' }, brand, cols), small))
}

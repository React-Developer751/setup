// The testimonials part (gen/Quotes_...): what customers say. Method of the other generators; see partKit.ts.
import { definePart } from './partKit'
import { ARRIVES, BGS, CARDS, DECORS, FONTS, arriveCss, baseCss, cardCss, decorCss, fxNode, surface } from './partCommon'
import { h, type Node } from './heroTree'

export type QuotesSpec = {
  layout: 'single' | 'grid' | 'stack' | 'wall' | 'slider' | 'split'
  card: (typeof CARDS)[number]
  mark: 'glyph' | 'bar' | 'none'
  avatar: 'round' | 'square' | 'none'
  stars: 'yes' | 'no'
  text: 'm' | 'l' | 'xl'
  bg: (typeof BGS)[number]
  font: (typeof FONTS)[number]
  radius: 0 | 10 | 22
  head: 'left' | 'center'
  decor: (typeof DECORS)[number]
  arrives: (typeof ARRIVES)[number]
}

export const quotes = definePart<QuotesSpec>({
  prefix: 'Quotes',
  axes: { layout: ['single', 'grid', 'stack', 'wall', 'slider', 'split'], card: CARDS, mark: ['glyph', 'bar', 'none'], avatar: ['round', 'square', 'none'], stars: ['yes', 'no'], text: ['m', 'l', 'xl'], bg: BGS, font: FONTS, radius: [0, 10, 22], head: ['left', 'center'], decor: DECORS, arrives: ARRIVES },
  valid: (s) => {
    if ((s.layout === 'grid' || s.layout === 'wall' || s.layout === 'slider') && s.text === 'xl') return false
    if (s.layout === 'single' && s.text === 'm') return false
    if (s.layout === 'split' && s.head === 'center') return false
    if (s.font === 'serif' && s.text === 'm') return false
    if (s.bg === 'accent' && s.decor === 'blob') return false
    if (s.bg === 'ink' && s.decor === 'grain') return false
    return true
  },
  fit: (s) => {
    const f = { ...s }
    if ((f.layout === 'grid' || f.layout === 'wall' || f.layout === 'slider') && f.text === 'xl') f.text = 'l'
    if (f.layout === 'single' && f.text === 'm') f.text = 'l'
    if (f.layout === 'split') f.head = 'left'
    if (f.font === 'serif' && f.text === 'm') f.text = 'l'
    return f
  },
  lean: {
    calm: { layout: ['grid', 'stack', 'single'], bg: ['plain', 'band'], card: ['bordered', 'flat', 'filled'], mark: ['glyph', 'none'] },
    bold: { layout: ['single', 'split', 'wall'], text: ['xl', 'l'], bg: ['ink', 'accent', 'plain'], font: ['display', 'sans'], mark: ['glyph', 'bar'] },
    soft: { radius: [22], card: ['shadow', 'filled'], font: ['serif', 'sans'], bg: ['band', 'glow', 'plain'], avatar: ['round'] },
    dark: { bg: ['ink', 'glow'], card: ['bordered', 'filled'], decor: ['grid', 'dots', 'none'] },
    playful: { radius: [22], bg: ['accent', 'band', 'glow'], avatar: ['round'], decor: ['dots', 'blob'], layout: ['wall', 'grid', 'slider'] },
  },
  fallback: { layout: 'grid', card: 'bordered', mark: 'glyph', avatar: 'round', stars: 'no', text: 'm', bg: 'plain', font: 'sans', radius: 10, head: 'center', decor: 'none', arrives: 'none' },
  alike: (a, b) => a.layout === b.layout && a.bg === b.bg,
  describe: (s) => `${s.layout} quotes, ${s.card} cards, ${s.avatar === 'none' ? 'no avatar' : `${s.avatar} initial`}, ${s.stars === 'yes' ? 'stars, ' : ''}${s.bg} background${s.decor === 'none' ? '' : ` with ${s.decor}`}`,
})

const TEXT = { m: 'clamp(1rem,1.5vw,1.12rem)', l: 'clamp(1.15rem,2vw,1.4rem)', xl: 'clamp(1.5rem,3.4vw,2.5rem)' } as const

export function quotesCss(s: QuotesSpec, p: string): string {
  const sf = surface(s.bg)
  const css = baseCss(p, { bg: s.bg, font: s.font, head: 'l', center: s.head === 'center', pad: 'clamp(3.5rem,8vw,6rem)', wide: s.layout === 'single' ? '52rem' : '72rem' })
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))
  const lay: Record<QuotesSpec['layout'], string> = {
    single: 'display:flex;flex-direction:column;gap:1.5rem',
    grid: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr));gap:1.25rem',
    stack: 'display:flex;flex-direction:column;gap:1rem;max-width:48rem;margin-inline:auto',
    wall: 'columns:18rem;column-gap:1.25rem',
    slider: 'display:flex;gap:1.25rem;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:1rem;scrollbar-width:thin',
    split: 'display:flex;flex-direction:column;gap:1.25rem',
  }
  c(`& .gp-quotes{${lay[s.layout]}}`)
  if (s.layout === 'split') c(`& .gp-in{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.5fr);gap:2rem 4rem;align-items:start}& .gp-title{margin:0}`)
  const boxed = s.layout !== 'single' && s.layout !== 'stack' || s.card !== 'flat'
  c(`& .gp-quote{margin:0;display:flex;flex-direction:column;gap:1rem;padding:${s.layout === 'single' ? '0' : '1.6rem'};${s.layout === 'single' ? '' : cardCss(s.card, s.radius)}${s.layout === 'wall' ? 'break-inside:avoid;margin-bottom:1.25rem;' : ''}${s.layout === 'slider' ? 'flex:0 0 min(86%,22rem);scroll-snap-align:start;' : ''}${s.mark === 'bar' ? `border-left:4px solid ${s.bg === 'ink' || s.bg === 'accent' ? 'currentColor' : 'var(--g-accent)'};${s.layout === 'single' ? 'padding-left:1.5rem;' : ''}` : ''}}`)
  void boxed
  if (s.mark === 'glyph') c(`& .gp-quote::before{content:'“';font-family:${s.font === 'serif' ? 'var(--font-serif, Georgia, serif)' : 'Georgia, serif'};font-size:${s.layout === 'single' ? '5rem' : '3.2rem'};line-height:.6;height:${s.layout === 'single' ? '2.4rem' : '1.4rem'};color:${s.bg === 'ink' || s.bg === 'accent' ? 'inherit' : 'var(--g-accent)'};opacity:.9}`)
  if (s.stars === 'yes') c(`& .gp-quote .gp-text::before{content:'★★★★★';display:block;letter-spacing:.2em;font-size:.9rem;margin-bottom:.6rem;color:${s.bg === 'ink' || s.bg === 'accent' ? 'inherit' : 'var(--g-accent)'}}`)
  c(`& .gp-text{margin:0;flex:1;font-family:${s.font === 'serif' ? 'var(--font-serif, Georgia, serif)' : 'inherit'};font-size:${TEXT[s.text]};line-height:${s.text === 'xl' ? 1.25 : 1.55};font-weight:${s.text === 'xl' ? (s.font === 'display' ? 700 : 500) : 400};letter-spacing:${s.text === 'xl' ? '-0.02em' : '0'};text-wrap:pretty;color:inherit}`)
  c(`& .gp-by{display:flex;align-items:center;gap:.8rem}`)
  c(`& .gp-initial{display:${s.avatar === 'none' ? 'none' : 'flex'};flex:none;width:2.6rem;height:2.6rem;align-items:center;justify-content:center;border-radius:${s.avatar === 'round' ? '999px' : `${Math.min(s.radius, 10)}px`};font-weight:700;${sf.solid}}`)
  c(`& .gp-author{display:block;font-weight:600;font-size:.95rem;color:inherit}& .gp-role{display:block;font-size:.85rem;opacity:.65;color:inherit}`)
  css.push(...decorCss(p, s.decor, s.bg), ...arriveCss(p, s.arrives, '.gp-quote'))
  css.push(`@media (max-width:820px){.${p} .gp-in{display:block}.${p} .gp-title{margin-bottom:2rem}}`)
  return css.join('\n')
}

export function quotesTree(s: QuotesSpec, p: string): Node {
  const quote = () => h('figure', { 'data-slot': 'quote', className: 'gp-quote' }, h('blockquote', { 'data-slot': 'quote-text', className: 'gp-text' }, 'Quote'), h('figcaption', { className: 'gp-by' }, h('span', { 'data-slot': 'quote-initial', className: 'gp-initial' }, 'A'), h('span', {}, h('span', { 'data-slot': 'quote-author', className: 'gp-author' }, 'Author'), h('span', { 'data-slot': 'quote-role', className: 'gp-role' }, 'Role'))))
  return h('section', { 'data-ref': 'show-quotes', 'data-gen': 'quotes', className: p }, h('style', {}, quotesCss(s, p)), ...fxNode(s.decor), h('div', { className: 'gp-in' }, h('h2', { 'data-slot': 'title', className: 'gp-title' }, 'Title'), h('div', { className: 'gp-quotes' }, ...[0, 1, 2, 3, 4, 5].map(quote))))
}

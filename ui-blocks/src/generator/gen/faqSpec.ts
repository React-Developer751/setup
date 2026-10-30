// The FAQ part (gen/Faq_...): questions and answers. Method of the other generators; see partKit.ts.
import { definePart } from './partKit'
import { ARRIVES, BGS, CARDS, DECORS, FONTS, arriveCss, baseCss, cardCss, decorCss, fxNode } from './partCommon'
import { h, type Node } from './heroTree'

export type FaqSpec = {
  layout: 'accordion' | 'two-col' | 'grid' | 'list' | 'narrow'
  marker: 'plus' | 'chevron' | 'number' | 'none'
  card: (typeof CARDS)[number]
  q: 'm' | 'l'
  bg: (typeof BGS)[number]
  font: (typeof FONTS)[number]
  radius: 0 | 10 | 22
  head: 'left' | 'center'
  size: 'm' | 'l' | 'xl'
  decor: (typeof DECORS)[number]
  open: 'first' | 'closed'
  arrives: (typeof ARRIVES)[number]
}

export const faq = definePart<FaqSpec>({
  prefix: 'Faq',
  axes: { layout: ['accordion', 'two-col', 'grid', 'list', 'narrow'], marker: ['plus', 'chevron', 'number', 'none'], card: CARDS, q: ['m', 'l'], bg: BGS, font: FONTS, radius: [0, 10, 22], head: ['left', 'center'], size: ['m', 'l', 'xl'], decor: DECORS, open: ['first', 'closed'], arrives: ARRIVES },
  valid: (s) => {
    if ((s.layout === 'grid' || s.layout === 'list') && s.marker !== 'number' && s.marker !== 'none') return false
    if (s.layout === 'two-col' && s.head === 'center') return false
    if (s.font === 'serif' && s.size === 'm') return false
    if (s.bg === 'accent' && s.decor === 'blob') return false
    if (s.bg === 'ink' && s.decor === 'grain') return false
    if ((s.layout === 'grid' || s.layout === 'list') && s.open === 'closed') return false
    return true
  },
  fit: (s) => {
    const f = { ...s }
    if (f.layout === 'grid' || f.layout === 'list') { if (f.marker !== 'number') f.marker = 'none'; f.open = 'first' }
    if (f.layout === 'two-col') f.head = 'left'
    if (f.font === 'serif' && f.size === 'm') f.size = 'l'
    return f
  },
  lean: {
    calm: { layout: ['accordion', 'narrow', 'two-col'], bg: ['plain', 'band'], card: ['flat', 'bordered'], marker: ['plus', 'chevron'] },
    bold: { size: ['xl', 'l'], layout: ['two-col', 'accordion'], bg: ['ink', 'accent', 'plain'], marker: ['number', 'plus'], font: ['display', 'sans'] },
    soft: { radius: [22], card: ['filled', 'shadow'], font: ['serif', 'sans'], bg: ['band', 'glow', 'plain'] },
    dark: { bg: ['ink', 'glow'], card: ['bordered', 'filled'], decor: ['grid', 'dots', 'none'] },
    playful: { radius: [22], bg: ['accent', 'band', 'glow'], marker: ['plus', 'number'], decor: ['dots', 'blob'] },
  },
  fallback: { layout: 'accordion', marker: 'plus', card: 'bordered', q: 'm', bg: 'plain', font: 'sans', radius: 10, head: 'center', size: 'l', decor: 'none', open: 'first', arrives: 'none' },
  alike: (a, b) => a.layout === b.layout && a.bg === b.bg,
  describe: (s) => `${s.layout} questions, ${s.marker} marker, ${s.card} cards, ${s.bg} background${s.decor === 'none' ? '' : ` with ${s.decor}`}, ${s.open === 'first' ? 'first answer open' : 'all closed'}`,
})

export function faqCss(s: FaqSpec, p: string): string {
  const css = baseCss(p, { bg: s.bg, font: s.font, head: s.size, center: s.head === 'center', pad: 'clamp(3.5rem,8vw,6rem)', wide: s.layout === 'narrow' ? '46rem' : '68rem' })
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))
  const boxed = s.card !== 'flat'
  const list: Record<FaqSpec['layout'], string> = {
    accordion: 'display:flex;flex-direction:column;gap:.75rem;max-width:50rem;margin-inline:auto',
    narrow: 'display:flex;flex-direction:column;gap:.75rem',
    'two-col': 'display:flex;flex-direction:column;gap:.75rem',
    grid: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));gap:1.25rem',
    list: 'display:flex;flex-direction:column;gap:0',
  }
  c(`& .gp-list{${list[s.layout]}}`)
  if (s.layout === 'two-col') c(`& .gp-in{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.5fr);gap:2rem 4rem;align-items:start}& .gp-title{margin:0;position:sticky;top:6rem}`)
  c(`& .gp-qa{${s.layout === 'list' ? 'padding:1.4rem 0;border-top:1px solid color-mix(in srgb,currentColor 20%,transparent);' : boxed ? `padding:1.15rem 1.4rem;${cardCss(s.card, s.radius)}` : 'padding:1rem 0;border-bottom:1px solid color-mix(in srgb,currentColor 18%,transparent);'}${s.layout === 'grid' ? `padding:1.5rem;${boxed ? '' : `border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:${s.radius}px;`}` : ''}}`)
  c(`& .gp-q{display:flex;align-items:baseline;gap:.9rem;margin:0;font-family:${s.font === 'serif' ? 'var(--font-serif, Georgia, serif)' : 'inherit'};font-size:${s.q === 'l' ? '1.2rem' : '1.05rem'};font-weight:600;line-height:1.35;color:inherit;list-style:none;cursor:pointer}`)
  c(`& summary.gp-q::-webkit-details-marker{display:none}& .gp-q::marker{content:''}`)
  const num = s.marker === 'number'
  if (s.layout === 'accordion' || s.layout === 'narrow' || s.layout === 'two-col') {
    if (s.marker === 'plus') c(`& summary.gp-q::after{content:'+';margin-left:auto;font-size:1.5rem;line-height:1;font-weight:400;transition:transform .2s ease}& details[open]>summary.gp-q::after{transform:rotate(45deg)}`)
    if (s.marker === 'chevron') c(`& summary.gp-q::after{content:'';margin-left:auto;width:.55rem;height:.55rem;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);transition:transform .2s ease;flex:none}& details[open]>summary.gp-q::after{transform:rotate(-135deg)}`)
  }
  if (num) {
    c(`& .gp-list{counter-reset:faq}& .gp-qa{counter-increment:faq}& .gp-q::before{content:counter(faq,decimal-leading-zero);font-size:.8rem;font-weight:700;letter-spacing:.08em;opacity:.55;flex:none;font-variant-numeric:tabular-nums}`)
  }
  c(`& .gp-a{margin:.8rem 0 0;font-size:1rem;line-height:1.65;opacity:.8;color:inherit;${num ? 'padding-left:2.1rem;' : ''}}`)
  css.push(...decorCss(p, s.decor, s.bg), ...arriveCss(p, s.arrives, '.gp-qa'))
  css.push(`@media (max-width:820px){.${p} .gp-in{display:block}.${p} .gp-title{position:static;margin-bottom:2rem}}`)
  return css.join('\n')
}

export function faqTree(s: FaqSpec, p: string): Node {
  const folding = s.layout === 'accordion' || s.layout === 'narrow' || s.layout === 'two-col'
  const item = (i: number) =>
    folding
      ? h('details', { 'data-slot': 'qa', className: 'gp-qa', ...(s.open === 'first' && i === 0 ? { open: '' } : {}) }, h('summary', { 'data-slot': 'q', className: 'gp-q' }, 'Question'), h('p', { 'data-slot': 'a', className: 'gp-a' }, 'Answer'))
      : h('div', { 'data-slot': 'qa', className: 'gp-qa' }, h('h3', { 'data-slot': 'q', className: 'gp-q' }, 'Question'), h('p', { 'data-slot': 'a', className: 'gp-a' }, 'Answer'))
  return h('section', { 'data-ref': 'show-faq', 'data-gen': 'faq', className: p }, h('style', {}, faqCss(s, p)), ...fxNode(s.decor), h('div', { className: 'gp-in' }, h('h2', { 'data-slot': 'title', className: 'gp-title' }, 'Title'), h('div', { className: 'gp-list' }, ...[0, 1, 2, 3, 4, 5].map(item))))
}

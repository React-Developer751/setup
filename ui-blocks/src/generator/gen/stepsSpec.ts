// The "how it works" part (gen/Steps_...): numbered steps. See partKit.ts.
import { definePart } from './partKit'
import { ARRIVES, BGS, CARDS, DECORS, FONTS, arriveCss, baseCss, cardCss, decorCss, fxNode } from './partCommon'
import { h, type Node } from './heroTree'

export type StepsSpec = {
  layout: 'row' | 'vertical' | 'cards' | 'zigzag' | 'split' | 'compact'
  marker: 'number' | 'circle' | 'big' | 'line'
  card: (typeof CARDS)[number]
  bg: (typeof BGS)[number]
  font: (typeof FONTS)[number]
  size: 'm' | 'l' | 'xl'
  radius: 0 | 10 | 22
  head: 'left' | 'center'
  decor: (typeof DECORS)[number]
  arrives: (typeof ARRIVES)[number]
}

export const steps = definePart<StepsSpec>({
  prefix: 'Steps',
  axes: { layout: ['row', 'vertical', 'cards', 'zigzag', 'split', 'compact'], marker: ['number', 'circle', 'big', 'line'], card: CARDS, bg: BGS, font: FONTS, size: ['m', 'l', 'xl'], radius: [0, 10, 22], head: ['left', 'center'], decor: DECORS, arrives: ARRIVES },
  valid: (s) => {
    if (s.layout !== 'cards' && s.card !== 'flat') return false
    if (s.layout === 'split' && s.head === 'center') return false
    if ((s.layout === 'row' || s.layout === 'cards') && s.head === 'left' && s.size === 'xl') return false
    if (s.marker === 'big' && s.layout === 'compact') return false
    if (s.font === 'serif' && s.size === 'm') return false
    if (s.bg === 'accent' && (s.decor === 'blob' || s.card === 'shadow')) return false
    if (s.bg === 'ink' && s.decor === 'grain') return false
    return true
  },
  fit: (s) => {
    const f = { ...s }
    if (f.layout !== 'cards') f.card = 'flat'
    if (f.layout === 'split') f.head = 'left'
    if ((f.layout === 'row' || f.layout === 'cards') && f.head === 'left' && f.size === 'xl') f.size = 'l'
    if (f.marker === 'big' && f.layout === 'compact') f.marker = 'number'
    if (f.font === 'serif' && f.size === 'm') f.size = 'l'
    if (f.bg === 'accent' && f.card === 'shadow') f.card = 'bordered'
    return f
  },
  lean: {
    calm: { layout: ['row', 'vertical', 'compact'], bg: ['plain', 'band'], marker: ['circle', 'number', 'line'], size: ['m', 'l'] },
    bold: { layout: ['row', 'zigzag', 'split'], size: ['xl', 'l'], bg: ['ink', 'accent', 'plain'], marker: ['big'], font: ['display', 'sans'] },
    soft: { layout: ['cards', 'vertical'], radius: [22], card: ['shadow', 'filled'], font: ['serif', 'sans'], bg: ['band', 'glow', 'plain'], marker: ['circle'] },
    dark: { bg: ['ink', 'glow'], marker: ['circle', 'line'], decor: ['grid', 'dots', 'none'] },
    playful: { layout: ['cards', 'zigzag'], radius: [22], bg: ['accent', 'band', 'glow'], marker: ['circle', 'big'], decor: ['dots', 'blob'] },
  },
  fallback: { layout: 'row', marker: 'circle', card: 'flat', bg: 'plain', font: 'sans', size: 'l', radius: 10, head: 'center', decor: 'none', arrives: 'none' },
  alike: (a, b) => a.layout === b.layout && a.bg === b.bg,
  describe: (s) => `${s.layout} steps, ${s.marker} numbers, ${s.card} cards, ${s.bg} background${s.decor === 'none' ? '' : ` with ${s.decor}`}`,
})

export function stepsCss(s: StepsSpec, p: string): string {
  const css = baseCss(p, { bg: s.bg, font: s.font, head: s.size, center: s.head === 'center', pad: 'clamp(3.5rem,8vw,6rem)', wide: '70rem' })
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))
  const onColor = s.bg === 'ink' || s.bg === 'accent'
  const lay: Record<StepsSpec['layout'], string> = {
    row: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:2rem',
    vertical: 'display:flex;flex-direction:column;gap:1.75rem;max-width:44rem',
    cards: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:1.25rem',
    zigzag: 'display:flex;flex-direction:column;gap:2rem',
    split: 'display:flex;flex-direction:column;gap:1.5rem',
    compact: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:1rem 2.5rem',
  }
  c(`& .gp-steps{${lay[s.layout]};${s.head === 'center' && (s.layout === 'vertical') ? 'margin-inline:auto' : ''}}`)
  if (s.layout === 'split') c(`& .gp-in{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.4fr);gap:2rem 4rem;align-items:start}& .gp-title{margin:0;position:sticky;top:6rem}`)
  c(`& .gp-steps{counter-reset:st}& .gp-step{counter-increment:st;display:flex;flex-direction:${s.layout === 'row' || s.layout === 'cards' ? 'column' : 'row'};gap:${s.layout === 'row' || s.layout === 'cards' ? '.8rem' : '1.25rem'};align-items:${s.layout === 'row' || s.layout === 'cards' ? 'flex-start' : 'baseline'};${s.layout === 'cards' ? `padding:1.5rem;${cardCss(s.card, s.radius)}` : ''}${s.layout === 'zigzag' ? 'max-width:34rem;' : ''}}`)
  if (s.layout === 'zigzag') c(`& .gp-step:nth-child(even){align-self:flex-end;flex-direction:row-reverse;text-align:right}`)
  const mark: Record<StepsSpec['marker'], string> = {
    number: `& .gp-num::before{content:counter(st,decimal-leading-zero);font-size:.85rem;font-weight:700;letter-spacing:.08em;opacity:.6}`,
    circle: `& .gp-num{display:flex;flex:none;width:2.6rem;height:2.6rem;align-items:center;justify-content:center;border-radius:999px;background:${onColor ? 'var(--g-on-accent,#fff)' : 'var(--g-accent)'};color:${onColor ? (s.bg === 'ink' ? '#111216' : 'var(--g-accent)') : 'var(--g-on-accent)'};font-weight:700}& .gp-num::before{content:counter(st)}`,
    big: `& .gp-num::before{content:counter(st,decimal-leading-zero);font-size:clamp(2.6rem,6vw,4.2rem);font-weight:800;line-height:.9;letter-spacing:-.05em;opacity:.22}`,
    line: `& .gp-num{flex:none;width:2.4rem;height:2px;background:currentColor;opacity:.5;margin-top:.7rem}& .gp-num::before{content:''}`,
  }
  c(mark[s.marker])
  c(`& .gp-step-title{margin:0 0 .35rem;font-size:1.15rem;font-weight:700;line-height:1.25;color:inherit;font-family:${s.font === 'serif' ? 'var(--font-serif, Georgia, serif)' : 'inherit'}}& .gp-step-text{margin:0;font-size:1rem;line-height:1.6;opacity:.8;color:inherit}`)
  css.push(...decorCss(p, s.decor, s.bg), ...arriveCss(p, s.arrives, '.gp-step'))
  css.push(`@media (max-width:820px){.${p} .gp-in{display:block}.${p} .gp-title{position:static;margin-bottom:2rem}.${p} .gp-step:nth-child(even){flex-direction:row!important;text-align:left!important;align-self:auto!important}}`)
  return css.join('\n')
}

export function stepsTree(s: StepsSpec, p: string): Node {
  const step = () => h('div', { 'data-slot': 'step', className: 'gp-step' }, h('span', { className: 'gp-num', 'aria-hidden': 'true' }), h('div', {}, h('h3', { 'data-slot': 'step-title', className: 'gp-step-title' }, 'Step'), h('p', { 'data-slot': 'step-text', className: 'gp-step-text' }, 'Text')))
  return h('section', { 'data-ref': 'show-steps', 'data-gen': 'steps', className: p }, h('style', {}, stepsCss(s, p)), ...fxNode(s.decor), h('div', { className: 'gp-in' }, h('h2', { 'data-slot': 'title', className: 'gp-title' }, 'Title'), h('div', { className: 'gp-steps' }, ...[0, 1, 2, 3, 4].map(step))))
}

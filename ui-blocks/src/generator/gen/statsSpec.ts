// The numbers / highlights strip (gen/Stats_...): three or four short facts. See partKit.ts.
import { definePart } from './partKit'
import { ARRIVES, BGS, CARDS, DECORS, FONTS, arriveCss, baseCss, cardCss, decorCss, fxNode } from './partCommon'
import { h, type Node } from './heroTree'

export type StatsSpec = {
  layout: 'row' | 'cards' | 'divided' | 'band' | 'grid' | 'left'
  card: (typeof CARDS)[number]
  size: 'm' | 'l' | 'xl'
  bg: (typeof BGS)[number]
  font: (typeof FONTS)[number]
  radius: 0 | 10 | 22
  label: 'under' | 'over' | 'caps'
  decor: (typeof DECORS)[number]
  arrives: (typeof ARRIVES)[number]
  pad: 'snug' | 'roomy'
}

export const stats = definePart<StatsSpec>({
  prefix: 'Stats',
  axes: { layout: ['row', 'cards', 'divided', 'band', 'grid', 'left'], card: CARDS, size: ['m', 'l', 'xl'], bg: BGS, font: FONTS, radius: [0, 10, 22], label: ['under', 'over', 'caps'], decor: DECORS, arrives: ARRIVES, pad: ['snug', 'roomy'] },
  valid: (s) => {
    if (s.layout !== 'cards' && s.card !== 'flat') return false
    if (s.layout === 'band' && (s.bg === 'plain' || s.bg === 'glow')) return false
    if (s.size === 'xl' && s.layout === 'grid') return false
    if (s.bg === 'accent' && (s.decor === 'blob' || s.card === 'shadow')) return false
    if (s.bg === 'ink' && s.decor === 'grain') return false
    if (s.font === 'serif' && s.size === 'm') return false
    return true
  },
  fit: (s) => {
    const f = { ...s }
    if (f.layout !== 'cards') f.card = 'flat'
    if (f.layout === 'band' && (f.bg === 'plain' || f.bg === 'glow')) f.bg = 'accent'
    if (f.size === 'xl' && f.layout === 'grid') f.size = 'l'
    if (f.bg === 'accent' && f.card === 'shadow') f.card = 'bordered'
    if (f.font === 'serif' && f.size === 'm') f.size = 'l'
    return f
  },
  lean: {
    calm: { layout: ['row', 'divided', 'left'], bg: ['plain', 'band'], size: ['m', 'l'], label: ['under', 'caps'] },
    bold: { layout: ['band', 'divided', 'row'], size: ['xl', 'l'], bg: ['accent', 'ink'], font: ['display', 'sans'], label: ['caps'] },
    soft: { layout: ['cards', 'row'], radius: [22], card: ['shadow', 'filled'], font: ['serif', 'sans'], bg: ['band', 'glow', 'plain'] },
    dark: { bg: ['ink', 'glow'], layout: ['divided', 'cards', 'row'], decor: ['grid', 'dots', 'none'] },
    playful: { layout: ['cards', 'grid'], radius: [22], bg: ['accent', 'band', 'glow'], decor: ['dots', 'blob'] },
  },
  fallback: { layout: 'row', card: 'flat', size: 'l', bg: 'plain', font: 'sans', radius: 10, label: 'under', decor: 'none', arrives: 'none', pad: 'snug' },
  alike: (a, b) => a.layout === b.layout && a.bg === b.bg,
  describe: (s) => `${s.layout} highlights, ${s.size} figures, ${s.label} labels, ${s.bg} background${s.decor === 'none' ? '' : ` with ${s.decor}`}`,
})

const SIZE = { m: 'clamp(1.5rem,3vw,2rem)', l: 'clamp(1.9rem,4.2vw,3rem)', xl: 'clamp(2.4rem,6vw,4.6rem)' } as const

export function statsCss(s: StatsSpec, p: string): string {
  const css = baseCss(p, { bg: s.bg, font: s.font, head: 'm', center: true, pad: s.pad === 'snug' ? 'clamp(2rem,5vw,3.25rem)' : 'clamp(3rem,7vw,5rem)', wide: '68rem' })
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))
  const grid: Record<StatsSpec['layout'], string> = {
    row: 'display:flex;flex-wrap:wrap;justify-content:center;gap:1.5rem 4rem',
    cards: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1rem',
    divided: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))',
    band: 'display:flex;flex-wrap:wrap;justify-content:space-around;gap:1.5rem 2rem',
    grid: 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.5rem 2rem;max-width:34rem;margin-inline:auto',
    left: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1.5rem 3rem;text-align:left',
  }
  c(`& .gp-stats{${grid[s.layout]}}`)
  c(`& .gp-stat{display:flex;flex-direction:${s.label === 'over' ? 'column-reverse' : 'column'};gap:.35rem;text-align:${s.layout === 'left' ? 'left' : 'center'};${s.layout === 'cards' ? `padding:1.5rem 1rem;${cardCss(s.card, s.radius)}` : ''}${s.layout === 'divided' ? 'padding:.5rem 1rem;border-left:1px solid color-mix(in srgb,currentColor 22%,transparent)' : ''}}`)
  if (s.layout === 'divided') c(`& .gp-stat:first-child{border-left:0}`)
  c(`& .gp-value{font-family:${s.font === 'serif' ? 'var(--font-serif, Georgia, serif)' : 'inherit'};font-size:${SIZE[s.size]};font-weight:${s.font === 'display' ? 800 : 700};line-height:1.05;letter-spacing:-.03em;overflow-wrap:anywhere;color:${s.bg === 'plain' || s.bg === 'band' || s.bg === 'glow' ? 'var(--g-accent)' : 'inherit'}}`)
  c(`& .gp-label{font-size:${s.label === 'caps' ? '.74rem' : '.95rem'};${s.label === 'caps' ? 'letter-spacing:.14em;text-transform:uppercase;font-weight:600;' : ''}opacity:.75;color:inherit}`)
  css.push(...decorCss(p, s.decor, s.bg), ...arriveCss(p, s.arrives, '.gp-stat'))
  css.push(`@media (max-width:640px){.${p} .gp-stats{gap:1.25rem 1.5rem}.${p} .gp-stat{border-left:0!important}}`)
  return css.join('\n')
}

export function statsTree(s: StatsSpec, p: string): Node {
  const stat = () => h('div', { 'data-slot': 'stat', className: 'gp-stat' }, h('span', { 'data-slot': 'stat-value', className: 'gp-value' }, '0'), h('span', { 'data-slot': 'stat-label', className: 'gp-label' }, 'Label'))
  return h('section', { 'data-ref': 'show-stats', 'data-gen': 'stats', className: p }, h('style', {}, statsCss(s, p)), ...fxNode(s.decor), h('div', { className: 'gp-in' }, h('div', { className: 'gp-stats' }, ...[0, 1, 2, 3].map(stat))))
}

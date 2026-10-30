// The pricing part (gen/Pricing_...): plans with a name, a price, a few perks and a button. Method of the other generators; see partKit.ts.
import { definePart } from './partKit'
import { ARRIVES, BGS, CARDS, DECORS, FONTS, arriveCss, baseCss, cardCss, decorCss, fxNode, surface } from './partCommon'
import { h, type Node } from './heroTree'

export type PricingSpec = {
  layout: 'cols' | 'featured' | 'rows' | 'split' | 'menu'
  card: (typeof CARDS)[number]
  hot: 'fill' | 'outline' | 'badge' | 'none'
  price: 'm' | 'l' | 'xl'
  bg: (typeof BGS)[number]
  font: (typeof FONTS)[number]
  radius: 0 | 10 | 22
  mark: 'tick' | 'dot' | 'dash' | 'none'
  button: 'solid' | 'outline' | 'pill' | 'link'
  head: 'left' | 'center'
  decor: (typeof DECORS)[number]
  hover: 'none' | 'lift' | 'tint'
  arrives: (typeof ARRIVES)[number]
}

export const pricing = definePart<PricingSpec>({
  prefix: 'Pricing',
  axes: { layout: ['cols', 'featured', 'rows', 'split', 'menu'], card: CARDS, hot: ['fill', 'outline', 'badge', 'none'], price: ['m', 'l', 'xl'], bg: BGS, font: FONTS, radius: [0, 10, 22], mark: ['tick', 'dot', 'dash', 'none'], button: ['solid', 'outline', 'pill', 'link'], head: ['left', 'center'], decor: DECORS, hover: ['none', 'lift', 'tint'], arrives: ARRIVES },
  valid: (s) => {
    if (s.layout === 'menu' && (s.hot === 'fill' || s.card === 'shadow' || s.button === 'solid' || s.button === 'pill')) return false
    if (s.layout === 'rows' && s.price === 'xl') return false
    if (s.hot === 'fill' && s.bg === 'accent') return false
    if (s.bg === 'accent' && s.decor === 'blob') return false
    if (s.bg === 'ink' && s.decor === 'grain') return false
    if (s.font === 'serif' && s.price === 'm') return false
    return true
  },
  fit: (s) => {
    const f = { ...s }
    if (f.layout === 'menu') { f.hot = f.hot === 'fill' ? 'badge' : f.hot; f.card = f.card === 'shadow' ? 'flat' : f.card; if (f.button === 'solid' || f.button === 'pill') f.button = 'link' }
    if (f.layout === 'rows' && f.price === 'xl') f.price = 'l'
    if (f.hot === 'fill' && f.bg === 'accent') f.hot = 'outline'
    if (f.font === 'serif' && f.price === 'm') f.price = 'l'
    return f
  },
  lean: {
    calm: { layout: ['cols', 'split', 'menu', 'rows'], bg: ['plain', 'band'], card: ['bordered', 'flat', 'filled'], hot: ['badge', 'outline'] },
    bold: { layout: ['featured', 'cols'], bg: ['ink', 'accent', 'plain'], price: ['xl', 'l'], hot: ['fill', 'badge'], font: ['display', 'sans'] },
    soft: { radius: [22], card: ['shadow', 'filled'], button: ['pill', 'solid'], font: ['serif', 'sans'], bg: ['band', 'glow', 'plain'] },
    dark: { bg: ['ink', 'glow'], card: ['bordered', 'filled'], decor: ['grid', 'dots', 'none'] },
    playful: { radius: [22], bg: ['accent', 'band', 'glow'], button: ['pill'], decor: ['dots', 'blob'], hot: ['badge', 'fill'] },
  },
  fallback: { layout: 'cols', card: 'bordered', hot: 'badge', price: 'l', bg: 'plain', font: 'sans', radius: 10, mark: 'tick', button: 'outline', head: 'center', decor: 'none', hover: 'lift', arrives: 'none' },
  alike: (a, b) => a.layout === b.layout && a.bg === b.bg,
  describe: (s) => `${s.layout} plans, ${s.card} cards, ${s.hot === 'none' ? 'no highlight' : `${s.hot} highlight`}, ${s.price} prices, ${s.bg} background${s.decor === 'none' ? '' : ` with ${s.decor}`}, ${s.button} buttons`,
})

const MARK = { tick: "'✓'", dot: "'•'", dash: "'–'", none: "''" } as const
const PRICE = { m: 'clamp(1.7rem,3vw,2.2rem)', l: 'clamp(2.1rem,4vw,3rem)', xl: 'clamp(2.7rem,6vw,4.4rem)' } as const

export function pricingCss(s: PricingSpec, p: string): string {
  const sf = surface(s.bg)
  const css = baseCss(p, { bg: s.bg, font: s.font, head: 'l', center: s.head === 'center', pad: 'clamp(3.5rem,8vw,6rem)', wide: s.layout === 'menu' ? '52rem' : s.layout === 'split' ? '66rem' : '72rem' })
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))
  const grid: Record<PricingSpec['layout'], string> = {
    cols: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,15.5rem),1fr));gap:1.25rem;align-items:stretch',
    featured: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,15.5rem),1fr));gap:1.25rem;align-items:center',
    rows: 'display:flex;flex-direction:column;gap:1rem',
    split: 'display:flex;flex-direction:column;gap:1rem',
    menu: 'display:flex;flex-direction:column;gap:2.25rem',
  }
  c(`& .gp-plans{${grid[s.layout]};max-width:${s.layout === 'cols' || s.layout === 'featured' ? '64rem' : '100%'};margin-inline:auto}`)
  if (s.layout === 'split') {
    c(`& .gp-in{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.4fr);gap:2rem 4rem;align-items:start}& .gp-title{margin:0;position:sticky;top:6rem}`)
  }
  c(`& .gp-plan{position:relative;padding:${s.layout === 'menu' ? '0' : '1.75rem'};display:flex;flex-direction:column;gap:.9rem;${s.layout === 'menu' ? '' : cardCss(s.card, s.radius)}${s.hover === 'lift' ? 'transition:transform .25s ease,box-shadow .25s ease;' : s.hover === 'tint' ? 'transition:background .25s ease;' : ''}}`)
  if (s.hover === 'lift') c(`& .gp-plan:hover{transform:translateY(-4px)}`)
  if (s.hover === 'tint') c(`& .gp-plan:hover{background:color-mix(in srgb,currentColor 11%,transparent)}`)
  if (s.layout === 'rows') c(`& .gp-plan{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr) auto;gap:1rem 2rem;align-items:center}& .gp-head{display:block}`)
  if (s.layout === 'split') c(`& .gp-plan{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.6rem 1.5rem;align-items:center}& .gp-perks{grid-column:1/-1}`)
  c(`& .gp-name{margin:0;font-size:1.05rem;font-weight:700;letter-spacing:${s.font === 'display' ? '.02em' : '0'};${s.font === 'display' ? 'text-transform:uppercase;font-size:.85rem;' : ''}color:inherit}`)
  c(`& .gp-priceline{display:flex;align-items:baseline;gap:.35rem;flex-wrap:wrap}`)
  c(`& .gp-price{font-family:${s.font === 'serif' ? 'var(--font-serif, Georgia, serif)' : 'inherit'};font-size:${PRICE[s.price]};font-weight:${s.font === 'display' ? 800 : 700};line-height:1;letter-spacing:-.03em}`)
  c(`& .gp-period{font-size:.9rem;opacity:.7}`)
  c(`& .gp-perks{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.55rem;font-size:.95rem;line-height:1.45;flex:1}`)
  c(`& .gp-perk{display:flex;gap:.6rem;align-items:baseline}& .gp-perk::before{content:${MARK[s.mark]};flex:none;font-weight:700;color:${s.bg === 'ink' || s.bg === 'accent' ? 'inherit' : 'var(--g-accent)'};min-width:${s.mark === 'none' ? '0' : '1rem'}}`)
  // buttons
  const rb = s.button === 'pill' ? '999px' : `${Math.min(s.radius, 12)}px`
  const btn = 'display:inline-flex;align-items:center;justify-content:center;min-height:2.75rem;padding:.7rem 1.4rem;font-weight:600;font-size:.95rem;text-decoration:none;cursor:pointer;'
  if (s.button === 'link') c(`& .gp-button{${btn}padding-inline:0;justify-content:flex-start;color:inherit;border-bottom:2px solid currentColor;align-self:flex-start;min-height:2.25rem}`)
  else if (s.button === 'outline') c(`& .gp-button{${btn}border:2px solid currentColor;border-radius:${rb};color:inherit;background:transparent}`)
  else c(`& .gp-button{${btn}border:2px solid transparent;border-radius:${rb};${sf.solid}}`)
  // the highlighted plan (the second of three, else the first)
  if (s.hot === 'fill') c(`& .gp-plan[data-hot]{${sf.solid.replace('background:var(--g-accent);color:var(--g-on-accent);', 'background:var(--g-accent);color:var(--g-on-accent);')}border-color:transparent}& .gp-plan[data-hot] .gp-perk::before{color:inherit}& .gp-plan[data-hot] .gp-button{background:var(--g-on-accent);color:var(--g-accent);border-color:transparent}`)
  if (s.hot === 'outline') c(`& .gp-plan[data-hot]{border:2px solid var(--g-accent)!important}`)
  if (s.hot === 'badge') c(`& .gp-plan[data-hot]::after{content:'★';position:absolute;top:-.8rem;right:1.25rem;width:2rem;height:2rem;border-radius:999px;display:flex;align-items:center;justify-content:center;background:var(--g-accent);color:var(--g-on-accent);font-size:.9rem}`)
  if (s.layout === 'featured') c(`& .gp-plan[data-hot]{transform:scale(1.04);z-index:2}${s.hover === 'lift' ? '& .gp-plan[data-hot]:hover{transform:scale(1.04) translateY(-4px)}' : ''}`)
  if (s.layout === 'menu') {
    c(`& .gp-plan{gap:.7rem}& .gp-head{display:flex;align-items:baseline;gap:.8rem}& .gp-head::after{content:'';order:2;flex:1;border-bottom:2px dotted color-mix(in srgb,currentColor 35%,transparent);transform:translateY(-.3rem)}& .gp-name{order:1;font-size:1.2rem}& .gp-priceline{order:3}& .gp-price{font-size:1.5rem}& .gp-plan .gp-button{display:none!important}`)
  }
  css.push(...decorCss(p, s.decor, s.bg), ...arriveCss(p, s.arrives, '.gp-plan'))
  css.push(`@media (max-width:820px){.${p} .gp-in{display:block}.${p} .gp-title{position:static;margin-bottom:2rem}.${p} .gp-plan{display:flex!important;align-items:stretch!important}.${p} .gp-plan[data-hot]{transform:none!important}}`)
  return css.join('\n')
}

export function pricingTree(s: PricingSpec, p: string): Node {
  const plan = h('article', { 'data-slot': 'plan', className: 'gp-plan' },
    h('div', { className: 'gp-head' }, h('h3', { 'data-slot': 'plan-name', className: 'gp-name' }, 'Plan'), h('div', { className: 'gp-priceline' }, h('span', { 'data-slot': 'plan-price', className: 'gp-price' }, '0'), h('span', { 'data-slot': 'plan-period', className: 'gp-period' }, '/ month'))),
    h('ul', { className: 'gp-perks' }, ...[0, 1, 2, 3].map(() => h('li', { 'data-slot': 'perk', className: 'gp-perk' }, 'Perk'))),
    h('a', { 'data-slot': 'plan-button', href: '#contact', className: 'gp-button' }, 'Choose'))
  const plans = h('div', { className: 'gp-plans' }, ...[0, 1, 2, 3].map(() => structuredClone(plan)))
  return h('section', { 'data-ref': 'show-plans', 'data-gen': 'pricing', className: p }, h('style', {}, pricingCss(s, p)), ...fxNode(s.decor), h('div', { className: 'gp-in' }, h('h2', { 'data-slot': 'title', className: 'gp-title' }, 'Title'), plans))
}

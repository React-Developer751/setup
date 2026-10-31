// A features spec (featuresSpec.ts) as a tree and its CSS (see heroTree.ts: one tree, drawn by React and printed as TSX; no Tailwind class, only the page's colour variables).
// It carries the slots of the showcase kit's tiles (title, lead, tile > tile-image / tile-title / tile-text): the page's own filler puts the services of the business in by name and removes the tiles that
// have no service. The numbers and letters are CSS counters, so a removed tile does not leave a gap in them.
import type { FeaturesSpec } from './featuresSpec'
import { h, type Node } from './heroTree'

const FONT = { sans: "var(--font-sans, system-ui, -apple-system, 'Segoe UI', sans-serif)", serif: "var(--font-serif, Georgia, 'Times New Roman', serif)", display: "var(--font-sans, system-ui, -apple-system, 'Segoe UI', sans-serif)" } as const
const SIZE = { m: 'clamp(1.6rem,3vw,2.3rem)', l: 'clamp(1.9rem,4vw,3.1rem)', xl: 'clamp(2.2rem,5.5vw,4.4rem)' } as const

export function featuresCss(s: FeaturesSpec, p: string): string {
  const ink = s.bg === 'ink'
  const onAccent = s.bg === 'accent'
  const r = s.radius
  const css: string[] = []
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))
  const bg = { plain: 'transparent', band: 'var(--g-band)', ink: '#111216', accent: 'var(--g-accent)' }[s.bg]
  const fg = ink ? '#f4f4f5' : onAccent ? 'var(--g-on-accent)' : 'inherit'
  const mark = ink ? '#f4f4f5' : onAccent ? 'var(--g-on-accent)' : 'var(--g-accent)'
  const pad = `calc(${s.gap === 'tight' ? '3.75rem' : '5.5rem'} * var(--gp-scale,1))`
  const line = ink ? 'rgba(255,255,255,.18)' : onAccent ? 'rgba(255,255,255,.4)' : 'var(--color-gray-200, rgba(0,0,0,.1))'
  c(`&{position:relative;background:${bg};color:${fg};padding:${pad} 1.5rem;min-height:var(--gp-min,0px);overflow:hidden}`)
  c(`& *{box-sizing:border-box}`)
  c(`& .gf-in{max-width:76rem;margin:0 auto}`)
  c(`& .gf-head{${s.head === 'center' ? 'text-align:center;margin:0 auto 3rem;max-width:44rem' : 'max-width:44rem;margin:0 0 3rem'}}`)
  c(`& .gf-title{margin:0;font-family:${FONT[s.font]};font-size:${SIZE[s.size]};font-weight:${s.font === 'serif' ? 600 : s.font === 'display' ? 800 : 700};line-height:1.08;letter-spacing:${s.size === 'xl' ? '-0.03em' : '-0.02em'};text-wrap:balance;color:inherit}`)
  c(`& .gf-lead{margin:1rem 0 0;font-size:1.05rem;line-height:1.6;opacity:.75;color:inherit}`)
  c(`& .gf-list{counter-reset:gfn;display:grid;gap:${s.gap === 'tight' ? '1rem' : '1.5rem'}}`)
  // a service
  const card: Record<FeaturesSpec['card'], string> = {
    flat: 'padding:.25rem 0;',
    bordered: `padding:1.6rem;border:1px solid ${line};border-radius:${r}px;`,
    filled: `padding:1.6rem;background:${ink ? 'rgba(255,255,255,.06)' : 'var(--g-band)'};border-radius:${r}px;`,
    shadow: `padding:1.6rem;background:var(--color-white,#fff);border-radius:${r}px;box-shadow:0 18px 40px -24px rgba(0,0,0,.35);color:inherit;`,
    accent: `padding:1.6rem;background:${ink ? 'rgba(255,255,255,.05)' : 'var(--color-white,#fff)'};border-radius:${r}px;border-top:3px solid ${ink ? '#f4f4f5' : 'var(--g-accent)'};box-shadow:0 14px 30px -22px rgba(0,0,0,.3);`,
  }
  c(`& .gf-tile{counter-increment:gfn;position:relative;min-width:0;${card[s.card]}transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease,background .25s ease}`)
  c(`& .gf-tile h3{margin:0;font-family:${FONT[s.font]};font-size:1.2rem;font-weight:${s.font === 'display' ? 800 : 650};line-height:1.25;color:inherit}`)
  c(`& .gf-tile p{margin:.55rem 0 0;font-size:.97rem;line-height:1.6;opacity:.78;color:inherit}`)
  // the marker
  const markers: Record<FeaturesSpec['marker'], string> = {
    number: `& .gf-tile::before{content:counter(gfn,decimal-leading-zero);display:block;margin-bottom:.8rem;font-size:.82rem;font-weight:700;letter-spacing:.14em;color:${mark}}`,
    letter: `& .gf-tile::before{content:counter(gfn,upper-alpha);display:flex;align-items:center;justify-content:center;width:2.4rem;height:2.4rem;margin-bottom:1rem;border-radius:50%;font-weight:700;font-size:.95rem;background:${ink ? '#f4f4f5' : onAccent ? 'var(--g-on-accent)' : 'var(--g-accent)'};color:${ink ? '#111216' : onAccent ? 'var(--g-accent)' : 'var(--g-on-accent)'}}`,
    dot: `& .gf-tile::before{content:'';display:block;width:.7rem;height:.7rem;margin-bottom:1rem;border-radius:50%;background:${mark}}`,
    bar: `& .gf-tile::before{content:'';display:block;width:3rem;height:3px;margin-bottom:1rem;background:${mark}}`,
    none: '',
  }
  if (markers[s.marker]) c(markers[s.marker])
  // a picture
  if (s.image !== 'none') {
    c(`& .gf-img{overflow:hidden;background:var(--g-band);border-radius:${Math.max(0, r - 4)}px}`)
    c(`& .gf-img img{display:block;width:100%;height:100%;object-fit:cover}`)
    if (s.image === 'top') c(`& .gf-img{aspect-ratio:4/3;margin-bottom:1.1rem}`)
  }
  // the layouts
  switch (s.layout) {
    case 'grid-3':
      c(`& .gf-list{grid-template-columns:repeat(3,minmax(0,1fr))}`)
      break
    case 'grid-2':
      c(`& .gf-list{grid-template-columns:repeat(2,minmax(0,1fr))}`)
      break
    case 'rows':
      c(`& .gf-list{gap:0}& .gf-tile{display:grid;grid-template-columns:3.5rem minmax(0,1fr) minmax(0,1.4fr);gap:1rem 2rem;align-items:start;border-radius:${s.card === 'flat' ? 0 : r}px;${s.card === 'flat' ? `border-top:1px solid ${line};padding:1.6rem .25rem;` : 'margin-bottom:.9rem;'}}& .gf-tile::before{margin:0}& .gf-tile p{margin:0}${s.image === 'side' ? '& .gf-tile{grid-template-columns:3.5rem 9rem minmax(0,1fr) minmax(0,1.3fr)}& .gf-img{width:9rem;aspect-ratio:1}' : ''}`)
      break
    case 'bento':
      c(`& .gf-list{grid-template-columns:repeat(12,minmax(0,1fr))}& .gf-tile{grid-column:span 4;min-height:11rem}& .gf-tile:nth-child(1){grid-column:span 7;min-height:15rem}& .gf-tile:nth-child(2){grid-column:span 5}& .gf-tile:nth-child(6){grid-column:span 12}& .gf-tile:nth-child(1) h3{font-size:1.7rem}`)
      break
    case 'zigzag':
      c(`& .gf-list{gap:3.5rem}& .gf-tile{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1.5rem,4vw,3.5rem);align-items:center}& .gf-tile::before{grid-column:2}& .gf-tile .gf-img{grid-row:1/span 3;grid-column:1;aspect-ratio:4/3}& .gf-tile:nth-child(even) .gf-img{grid-column:2;order:2}& .gf-tile:nth-child(even)::before,& .gf-tile:nth-child(even) h3,& .gf-tile:nth-child(even) p{grid-column:1}& .gf-tile h3,& .gf-tile p{grid-column:2}`)
      break
    case 'columns':
      c(`& .gf-list{grid-template-columns:repeat(3,minmax(0,1fr));gap:2.5rem}& .gf-tile{border-top:1px solid ${line};padding-top:1.4rem}`)
      break
    case 'strip':
      c(`& .gf-list{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:1rem;padding-bottom:1rem;scrollbar-width:thin}& .gf-tile{flex:0 0 min(20rem,82%);scroll-snap-align:start}`)
      break
    case 'split':
      c(`& .gf-in{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(2rem,6vw,5rem);align-items:start}& .gf-head{margin:0;position:sticky;top:6rem}& .gf-list{gap:0}& .gf-tile{border-radius:0;padding:1.4rem 0;border-top:1px solid ${line};background:none;box-shadow:none;border-left:0;border-right:0;border-bottom:0;${s.image === 'side' ? 'display:grid;grid-template-columns:7rem minmax(0,1fr);gap:0 1.2rem;' : ''}}& .gf-tile .gf-img{grid-row:1/span 3;aspect-ratio:1}`)
      break
  }
  // how it answers a hover and how it arrives
  if (s.hover === 'lift') c(`& .gf-tile:hover{transform:translateY(-5px);box-shadow:0 22px 44px -22px rgba(0,0,0,.4)}`)
  if (s.hover === 'border') c(`& .gf-tile:hover{border-color:${mark}}`)
  if (s.hover === 'tint') c(`& .gf-tile:hover{background:${ink ? 'rgba(255,255,255,.1)' : 'var(--g-band)'}}`)
  if (s.arrives !== 'none') {
    css.push(`@keyframes gfRise{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}`)
    if (s.arrives === 'rise') css.push(`@media (prefers-reduced-motion:no-preference){.${p} .gf-tile{animation:gfRise .6s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0)*80ms)}}`)
    // arrives as it is scrolled to (where the browser can do it; elsewhere the cards are simply there)
    else css.push(`@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){.${p} .gf-tile{animation:gfRise linear both;animation-timeline:view();animation-range:entry 0% entry 55%}}}`)
  }
  css.push(`@media (max-width:860px){.${p} .gf-list{grid-template-columns:1fr!important}.${p} .gf-tile{grid-column:auto!important;${s.layout === 'rows' ? 'display:block!important' : ''}}.${p} .gf-in{display:block}.${p} .gf-head{position:static;margin-bottom:2rem}${s.layout === 'strip' ? `.${p} .gf-list{display:flex!important}.${p} .gf-tile{flex-basis:82%}` : ''}${s.layout === 'zigzag' ? `.${p} .gf-tile{display:block!important}.${p} .gf-img{margin-bottom:1rem}` : ''}${s.layout === 'rows' && s.image === 'side' ? `.${p} .gf-img{width:100%;aspect-ratio:16/9;margin-bottom:1rem}` : ''}}`)
  return css.join('\n')
}

export function featuresTree(s: FeaturesSpec, p: string): Node {
  const tile = (i: number) =>
    h('div', { 'data-slot': 'tile', className: 'gf-tile', ...(s.arrives === 'rise' ? { style: { '--i': i } } : {}) },
      ...(s.image !== 'none' ? [h('div', { className: 'gf-img' }, h('img', { 'data-slot': 'tile-image', alt: '' }))] : []),
      h('h3', { 'data-slot': 'tile-title' }, 'Service'),
      h('p', { 'data-slot': 'tile-text' }, 'What it is'),
    )
  const head = h('div', { className: 'gf-head' }, h('h2', { 'data-slot': 'title', className: 'gf-title' }, 'What we offer'), h('p', { 'data-slot': 'lead', className: 'gf-lead' }, 'Lead'))
  const list = h('div', { className: 'gf-list' }, ...[0, 1, 2, 3, 4, 5].map(tile))
  return h('section', { 'data-ref': 'show-tiles', 'data-gen': 'features', className: p }, h('style', {}, featuresCss(s, p)), h('div', { className: 'gf-in' }, head, list))
}

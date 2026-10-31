// A call-to-action spec (ctaSpec.ts) as a tree and its CSS (see heroTree.ts). Slots of the showcase kit's closing part: title, lead, button, button2.
import type { CtaSpec } from './ctaSpec'
import { h, type Node } from './heroTree'

const FONT = { sans: "var(--font-sans, system-ui, -apple-system, 'Segoe UI', sans-serif)", serif: "var(--font-serif, Georgia, 'Times New Roman', serif)", display: "var(--font-sans, system-ui, -apple-system, 'Segoe UI', sans-serif)" } as const
const SIZE = { m: 'clamp(1.7rem,3.2vw,2.5rem)', l: 'clamp(2.1rem,4.6vw,3.6rem)', xl: 'clamp(2.5rem,6.4vw,5rem)', xxl: 'clamp(2.8rem,9vw,7.5rem)' } as const

export function ctaCss(s: CtaSpec, p: string): string {
  const ink = s.bg === 'ink'
  const acc = s.bg === 'accent'
  const css: string[] = []
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))
  const bg = { plain: 'transparent', band: 'var(--g-band)', ink: '#111216', accent: 'var(--g-accent)', glow: 'radial-gradient(ellipse 80% 80% at 50% 0%, var(--g-glow), transparent 70%)' }[s.bg]
  const fg = ink ? '#f4f4f5' : acc ? 'var(--g-on-accent)' : 'inherit'
  const pad = `calc(${s.pad === 'snug' ? '2.75rem' : '5.5rem'} * var(--gp-scale,1))`
  const framed = s.layout === 'card'
  c(`&{position:relative;overflow:hidden;isolation:isolate;padding:${framed ? `calc(3rem * var(--gp-scale,1)) 1.25rem` : `${pad} 1.5rem`};min-height:var(--gp-min,0px);${framed ? '' : `background:${bg};color:${fg};`}}`)
  c(`& *{box-sizing:border-box}`)
  c(`& .gc-in{position:relative;z-index:2;max-width:${s.layout === 'giant' ? '90rem' : '66rem'};margin:0 auto;${framed ? `background:${bg};color:${fg};border-radius:${s.radius}px;padding:clamp(2rem,6vw,4.5rem);${s.bg === 'plain' ? 'border:1px solid var(--color-gray-200,rgba(0,0,0,.1));' : ''}` : ''}}`)
  c(`& .gc-title{margin:0;font-family:${FONT[s.font]};font-size:${SIZE[s.size]};font-weight:${s.font === 'serif' ? 600 : s.font === 'display' ? 800 : 700};line-height:${s.size === 'xxl' ? 0.95 : 1.06};letter-spacing:${s.size === 'xxl' || s.size === 'xl' ? '-0.04em' : '-0.02em'};text-wrap:balance;overflow-wrap:break-word;color:inherit}`)
  c(`& .gc-lead{margin:1rem 0 0;font-size:1.05rem;line-height:1.6;opacity:.8;max-width:36rem;color:inherit}`)
  c(`& .gc-actions{display:flex;flex-wrap:wrap;gap:.9rem 1.1rem;align-items:center;margin-top:2rem}`)
  const rb = s.button === 'pill' ? '999px' : `${Math.min(s.radius, 14)}px`
  const solid = ink ? 'background:#f4f4f5;color:#111216;' : acc ? 'background:var(--g-on-accent);color:var(--g-accent);' : 'background:var(--g-accent);color:var(--g-on-accent);'
  const base = 'display:inline-flex;align-items:center;justify-content:center;min-height:2.75rem;text-decoration:none;font-weight:600;font-size:.98rem;cursor:pointer;'
  if (s.button === 'link') {
    c(`& .gc-b1,& .gc-b2{${base}padding:.35rem 0;border-bottom:2px solid currentColor;color:inherit;background:none}& .gc-b2{opacity:.7;border-bottom-color:transparent}`)
  } else {
    c(`& .gc-b1{${base}padding:.8rem 1.7rem;border-radius:${rb};border:2px solid ${s.button === 'outline' ? 'currentColor' : 'transparent'};${s.button === 'outline' ? 'background:transparent;color:inherit;' : solid}}`)
    c(`& .gc-b2{${base}padding:.8rem 1.4rem;border-radius:${rb};border:2px solid currentColor;background:transparent;color:inherit;opacity:.9}`)
  }
  c(`& .gc-b1,& .gc-b2{transition:transform .2s ease,filter .2s ease}& .gc-b1:hover,& .gc-b2:hover{filter:brightness(1.08);transform:translateY(-1px)}`)
  switch (s.layout) {
    case 'center':
    case 'card':
      c(`& .gc-in{text-align:center}& .gc-lead{margin-inline:auto}& .gc-actions{justify-content:center}`)
      break
    case 'giant':
      c(`& .gc-in{text-align:left}& .gc-lead{max-width:30rem}`)
      break
    case 'split':
      c(`& .gc-in{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,.9fr);gap:2rem 4rem;align-items:center}& .gc-actions{margin-top:0;justify-content:flex-start}& .gc-side{display:flex;flex-direction:column;gap:1.4rem}& .gc-side .gc-lead{margin:0}`)
      break
    case 'bar':
      c(`& .gc-in{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1.25rem 2.5rem}& .gc-actions{margin-top:0}& .gc-lead{margin-top:.4rem}`)
      break
    case 'left':
      c(`& .gc-in{max-width:52rem;margin-left:max(0px,calc((100% - 66rem)/2))}`)
      break
  }
  if (s.decor !== 'none') {
    const fx: Record<string, string> = {
      blob: 'background:radial-gradient(circle at 88% 20%,var(--g-glow),transparent 42%),radial-gradient(circle at 8% 90%,var(--g-glow),transparent 38%);',
      grid: 'background-image:linear-gradient(currentColor 1px,transparent 1px),linear-gradient(90deg,currentColor 1px,transparent 1px);background-size:52px 52px;opacity:.08;',
      dots: 'background-image:radial-gradient(currentColor 1.3px,transparent 1.6px);background-size:22px 22px;opacity:.14;',
      ring: 'border:2px solid currentColor;border-radius:50%;opacity:.12;width:38rem;height:38rem;right:-12rem;top:-14rem;box-shadow:0 0 0 5rem rgba(127,127,127,.05);',
      stripes: 'background-image:repeating-linear-gradient(135deg,currentColor 0 1px,transparent 1px 14px);opacity:.07;',
      grain: "background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='.55'/></svg>\");opacity:.09;",
    }
    c(`& .gc-fx{position:absolute;z-index:1;pointer-events:none;color:${ink ? '#f4f4f5' : acc ? 'var(--g-on-accent)' : 'inherit'};${s.decor === 'ring' ? '' : 'inset:0;'}${fx[s.decor]}}`)
  }
  if (s.arrives !== 'none') {
    css.push(`@keyframes gcRise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}`)
    if (s.arrives === 'rise') css.push(`@media (prefers-reduced-motion:no-preference){.${p} .gc-in{animation:gcRise .7s cubic-bezier(.2,.7,.2,1) both}}`)
    else css.push(`@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){.${p} .gc-in{animation:gcRise linear both;animation-timeline:view();animation-range:entry 0% entry 60%}}}`)
  }
  css.push(`@media (max-width:820px){.${p} .gc-in{grid-template-columns:1fr!important;text-align:${s.layout === 'center' || s.layout === 'card' ? 'center' : 'left'}}.${p}{padding-block:3.25rem}${s.layout === 'bar' ? `.${p} .gc-in{display:block}.${p} .gc-actions{margin-top:1.4rem}` : ''}}`)
  return css.join('\n')
}

export function ctaTree(s: CtaSpec, p: string): Node {
  const title = h('h2', { 'data-slot': 'title', className: 'gc-title' }, 'Title')
  const lead = h('p', { 'data-slot': 'lead', className: 'gc-lead' }, 'Lead')
  const actions = h('div', { className: 'gc-actions' }, h('a', { 'data-slot': 'button', href: '#contact', className: 'gc-b1' }, 'Button'), h('a', { 'data-slot': 'button2', href: '#features', className: 'gc-b2' }, 'Second button'))
  const inner = s.layout === 'split' ? [title, h('div', { className: 'gc-side' }, lead, actions)] : s.layout === 'bar' ? [h('div', {}, title, lead), actions] : [title, lead, actions]
  return h('section', { 'data-ref': 'show-cta', 'data-gen': 'cta', className: p }, h('style', {}, ctaCss(s, p)), ...(s.decor !== 'none' ? [h('div', { className: 'gc-fx', 'aria-hidden': 'true' })] : []), h('div', { className: 'gc-in' }, ...inner))
}

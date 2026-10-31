// The navigation bar (gen/Nav_...): the brand, the pages of the site, one button. The menu of a phone opens with a plain checkbox (no script), so it works in an exported site too. See partKit.ts.
import { definePart } from './partKit'
import { BGS, FONTS, SANS, SERIF, surface } from './partCommon'
import { h, type Node } from './heroTree'

export type NavSpec = {
  layout: 'bar' | 'center' | 'split' | 'pill' | 'stack' | 'minimal'
  bg: (typeof BGS)[number] | 'glass'
  line: 'none' | 'line' | 'shadow'
  link: 'plain' | 'underline' | 'pill' | 'dot'
  sticky: 'yes' | 'no'
  font: (typeof FONTS)[number]
  size: 's' | 'm' | 'l'
  radius: 0 | 10 | 24
  button: 'solid' | 'outline' | 'pill' | 'none'
}

export const nav = definePart<NavSpec>({
  prefix: 'Nav',
  axes: { layout: ['bar', 'center', 'split', 'pill', 'stack', 'minimal'], bg: [...BGS, 'glass'] as never, line: ['none', 'line', 'shadow'], link: ['plain', 'underline', 'pill', 'dot'], sticky: ['yes', 'no'], font: FONTS, size: ['s', 'm', 'l'], radius: [0, 10, 24], button: ['solid', 'outline', 'pill', 'none'] },
  valid: (s) => {
    if (s.layout === 'pill' && (s.bg === 'plain' || s.bg === 'glow')) return false
    if (s.layout === 'pill' && s.radius === 0) return false
    if (s.bg === 'glow') return false
    if (s.bg === 'accent' && s.button === 'solid') return false
    if (s.layout === 'minimal' && s.link === 'dot') return false
    if (s.layout === 'center' && s.size === 'l') return false
    return true
  },
  fit: (s) => {
    const f = { ...s }
    if (f.bg === 'glow') f.bg = 'plain'
    if (f.layout === 'pill') { if (f.bg === 'plain') f.bg = 'glass'; if (f.radius === 0) f.radius = 24 }
    if (f.bg === 'accent' && f.button === 'solid') f.button = 'outline'
    if (f.layout === 'minimal' && f.link === 'dot') f.link = 'plain'
    if (f.layout === 'center' && f.size === 'l') f.size = 'm'
    return f
  },
  lean: {
    calm: { layout: ['bar', 'split', 'center'], bg: ['plain', 'band'], line: ['line', 'none'], link: ['plain', 'underline'] },
    bold: { layout: ['split', 'stack', 'bar'], bg: ['ink', 'accent', 'plain'], size: ['l', 'm'], font: ['display', 'sans'], link: ['pill', 'underline'] },
    soft: { layout: ['pill', 'bar'], radius: [24], bg: ['glass', 'band', 'plain'], button: ['pill'], font: ['serif', 'sans'] },
    dark: { bg: ['ink', 'glass'], line: ['line', 'none'] },
    playful: { layout: ['pill', 'bar'], radius: [24], bg: ['accent', 'band', 'glass'], link: ['pill', 'dot'], button: ['pill'] },
  },
  fallback: { layout: 'bar', bg: 'plain', line: 'line', link: 'plain', sticky: 'yes', font: 'sans', size: 'm', radius: 10, button: 'solid' },
  alike: (a, b) => a.layout === b.layout && a.bg === b.bg,
  describe: (s) => `${s.layout} menu, ${s.bg} background, ${s.link} links, ${s.sticky === 'yes' ? 'sticky' : 'static'}, ${s.button === 'none' ? 'no button' : `${s.button} button`}, ${s.size} size`,
})

export function navCss(s: NavSpec, p: string): string {
  const sf = surface(s.bg === 'glass' ? 'plain' : s.bg)
  const glass = s.bg === 'glass'
  const bg = glass ? 'color-mix(in srgb,var(--color-white,#fff) 72%,transparent)' : sf.bg
  const fg = glass ? 'inherit' : sf.fg
  const css: string[] = []
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))
  const pad = { s: '.6rem', m: '.95rem', l: '1.3rem' }[s.size]
  const fs = { s: '.88rem', m: '.95rem', l: '1.02rem' }[s.size]
  const pill = s.layout === 'pill'
  const edge = s.line === 'line' ? 'border-bottom:1px solid color-mix(in srgb,currentColor 16%,transparent);' : s.line === 'shadow' ? 'box-shadow:0 8px 24px -16px rgba(0,0,0,.35);' : ''
  if (s.sticky === 'yes') css.push(`[data-role="nav"]:has(> .${p}){position:sticky;top:0;z-index:60}`)
  c(`&{position:relative;z-index:60;color:${fg};${pill ? 'padding:.75rem 1rem;' : `background:${bg};${edge}`}${glass && !pill ? 'backdrop-filter:blur(14px);' : ''}}`)
  c(`& *{box-sizing:border-box}`)
  c(`& .gn-in{display:flex;align-items:center;gap:1rem 2rem;max-width:${pill ? '62rem' : '76rem'};margin:0 auto;padding:${pad} ${pill ? '1.25rem' : '1.5rem'};${pill ? `background:${bg};${glass ? 'backdrop-filter:blur(14px);' : ''}border-radius:${Math.max(s.radius, 16)}px;${s.line === 'shadow' ? 'box-shadow:0 12px 30px -14px rgba(0,0,0,.35);' : 'border:1px solid color-mix(in srgb,currentColor 14%,transparent);'}` : ''}}`)
  c(`& .gn-brand{font-family:${s.font === 'serif' ? SERIF : SANS};font-size:${{ s: '1.1rem', m: '1.25rem', l: '1.5rem' }[s.size]};font-weight:${s.font === 'display' ? 800 : 700};letter-spacing:${s.font === 'display' ? '-.03em' : '-.01em'};text-decoration:none;color:inherit;white-space:nowrap;${s.font === 'display' ? 'text-transform:uppercase;' : ''}}`)
  c(`& .gn-links{display:flex;align-items:center;gap:.35rem 1.4rem;flex-wrap:wrap}`)
  const linkBase = `font-size:${fs};font-weight:500;text-decoration:none;color:inherit;opacity:.82;padding:.45rem .1rem;transition:opacity .2s ease,background .2s ease;`
  const look: Record<NavSpec['link'], string> = {
    plain: `& .gn-links a{${linkBase}}& .gn-links a:hover,& .gn-links a[aria-current="page"]{opacity:1}`,
    underline: `& .gn-links a{${linkBase}background:linear-gradient(currentColor,currentColor) 0 100%/0 2px no-repeat;transition:background-size .25s ease,opacity .2s ease}& .gn-links a:hover,& .gn-links a[aria-current="page"]{opacity:1;background-size:100% 2px}`,
    pill: `& .gn-links a{${linkBase}padding:.45rem .9rem;border-radius:999px}& .gn-links a:hover{background:color-mix(in srgb,currentColor 10%,transparent);opacity:1}& .gn-links a[aria-current="page"]{opacity:1;${sf.solid}}`,
    dot: `& .gn-links a{${linkBase}position:relative}& .gn-links a[aria-current="page"]{opacity:1}& .gn-links a[aria-current="page"]::after{content:'';position:absolute;left:50%;bottom:-.2rem;width:.3rem;height:.3rem;margin-left:-.15rem;border-radius:50%;background:var(--g-accent)}& .gn-links a:hover{opacity:1}`,
  }
  c(look[s.link])
  const rb = s.button === 'pill' ? '999px' : `${Math.min(s.radius, 12)}px`
  const btn = `display:${s.button === 'none' ? 'none' : 'inline-flex'};align-items:center;justify-content:center;min-height:2.6rem;padding:.55rem 1.2rem;font-size:${fs};font-weight:600;text-decoration:none;white-space:nowrap;border-radius:${rb};`
  c(`& .gn-action{${btn}${s.button === 'outline' ? 'border:2px solid currentColor;color:inherit;background:transparent;' : `border:2px solid transparent;${sf.solid}`}transition:filter .2s ease}& .gn-action:hover{filter:brightness(1.08)}`)
  // the menu button of a phone: a checkbox and its label
  c(`& .gn-check{position:absolute;opacity:0;pointer-events:none}& .gn-burger{display:none;flex-direction:column;justify-content:center;gap:.28rem;width:2.6rem;height:2.6rem;padding:.7rem;margin-left:auto;cursor:pointer;border-radius:${Math.min(s.radius, 12)}px}& .gn-burger span{display:block;height:2px;background:currentColor;border-radius:2px;transition:transform .2s ease,opacity .2s ease}& .gn-check:focus-visible + .gn-burger{outline:2px solid var(--g-accent);outline-offset:2px}& .gn-check:checked + .gn-burger span:nth-child(1){transform:translateY(.4rem) rotate(45deg)}& .gn-check:checked + .gn-burger span:nth-child(2){opacity:0}& .gn-check:checked + .gn-burger span:nth-child(3){transform:translateY(-.4rem) rotate(-45deg)}`)
  const panel = `position:absolute;left:0;right:0;top:100%;flex-direction:column;align-items:stretch;gap:0;padding:.75rem 1.25rem 1.25rem;background:${glass ? 'var(--color-white,#fff)' : bg === 'transparent' ? 'var(--color-white,#fff)' : bg};color:${fg};box-shadow:0 18px 30px -18px rgba(0,0,0,.35);`
  switch (s.layout) {
    case 'bar':
      c(`& .gn-links{margin-left:auto}`)
      break
    case 'split':
      c(`& .gn-links{flex:1;justify-content:center}`)
      break
    case 'center':
      c(`& .gn-in{flex-wrap:wrap;justify-content:center;text-align:center}& .gn-brand{flex-basis:100%}& .gn-links{justify-content:center;flex:0 1 auto}`)
      break
    case 'stack':
      c(`& .gn-in{flex-wrap:wrap}& .gn-links{order:3;flex-basis:100%;border-top:1px solid color-mix(in srgb,currentColor 14%,transparent);padding-top:.5rem}& .gn-action{margin-left:auto}`)
      break
    case 'pill':
      c(`& .gn-links{margin-left:auto}`)
      break
    case 'minimal':
      c(`& .gn-links{${panel};display:none}& .gn-burger{display:flex}& .gn-check:checked ~ .gn-links{display:flex}& .gn-links a{padding:.8rem .2rem}& .gn-action{margin-left:0}`)
      break
  }
  if (s.layout !== 'minimal') {
    css.push(`@media (max-width:900px){.${p} .gn-in{flex-wrap:wrap}.${p} .gn-burger{display:flex}.${p} .gn-links{${panel};display:none}.${p} .gn-check:checked ~ .gn-links{display:flex}.${p} .gn-links a{padding:.8rem .2rem}.${p} .gn-action{order:2;margin-left:0}.${p} .gn-brand{flex-basis:auto}}`)
  }
  return css.join('\n')
}

export function navTree(s: NavSpec, p: string): Node {
  const toggle = `${p}-t`
  return h('header', { 'data-ref': 'show-nav', 'data-gen': 'nav', className: p },
    h('style', {}, navCss(s, p)),
    h('div', { className: 'gn-in' },
      h('a', { 'data-slot': 'brand', href: '#home', className: 'gn-brand' }, 'Brand'),
      h('input', { type: 'checkbox', id: toggle, className: 'gn-check', 'aria-label': 'Menu' }),
      h('label', { htmlFor: toggle, className: 'gn-burger', 'aria-hidden': 'true' }, h('span'), h('span'), h('span')),
      h('nav', { className: 'gn-links', 'aria-label': 'Main' }, ...[0, 1, 2, 3, 4, 5, 6].map(() => h('a', { 'data-slot': 'link', href: '#' }, 'Link'))),
      h('a', { 'data-slot': 'button', href: '#contact', className: 'gn-action' }, 'Contact')))
}

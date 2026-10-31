// The announcement bar at the top (gen/Banner_...): an offer the person named, with a button. Without an offer there is nothing to announce and the bar is not shown. See partKit.ts.
import { definePart } from './partKit'
import { BGS, FONTS, SANS, SERIF, surface } from './partCommon'
import { h, type Node } from './heroTree'

export type BannerSpec = {
  layout: 'bar' | 'pill' | 'ticker' | 'split'
  bg: (typeof BGS)[number]
  font: (typeof FONTS)[number]
  size: 's' | 'm'
  button: 'link' | 'solid' | 'arrow'
  radius: 0 | 10 | 24
  line: 'none' | 'line'
  icon: 'none' | 'dot' | 'spark' | 'tag'
  weight: 'regular' | 'bold'
  align: 'center' | 'left'
}

export const banner = definePart<BannerSpec>({
  prefix: 'Banner',
  axes: { layout: ['bar', 'pill', 'ticker', 'split'], bg: BGS, font: FONTS, size: ['s', 'm'], button: ['link', 'solid', 'arrow'], radius: [0, 10, 24], line: ['none', 'line'], icon: ['none', 'dot', 'spark', 'tag'], weight: ['regular', 'bold'], align: ['center', 'left'] },
  valid: (s) => {
    if (s.bg === 'glow' || s.bg === 'plain' && s.layout === 'pill') return false
    if (s.layout === 'pill' && s.radius === 0) return false
    if (s.bg === 'accent' && s.button === 'solid') return false
    return true
  },
  fit: (s) => {
    const f = { ...s }
    if (f.bg === 'glow') f.bg = 'band'
    if (f.layout === 'pill' && f.bg === 'plain') f.bg = 'band'
    if (f.layout === 'pill' && f.radius === 0) f.radius = 24
    if (f.bg === 'accent' && f.button === 'solid') f.button = 'link'
    return f
  },
  lean: {
    calm: { layout: ['bar', 'split'], bg: ['band', 'plain'], button: ['link', 'arrow'], line: ['line'] },
    bold: { layout: ['bar', 'ticker'], bg: ['ink', 'accent'], size: ['m'], font: ['display', 'sans'], button: ['solid', 'arrow'] },
    soft: { layout: ['pill', 'bar'], radius: [24], bg: ['band', 'accent'], font: ['serif', 'sans'], button: ['link'] },
    dark: { bg: ['ink'], layout: ['bar', 'split', 'ticker'] },
    playful: { layout: ['pill', 'ticker'], radius: [24], bg: ['accent', 'band'], button: ['solid', 'arrow'] },
  },
  fallback: { layout: 'bar', bg: 'ink', font: 'sans', size: 's', button: 'arrow', radius: 0, line: 'none', icon: 'none', weight: 'regular', align: 'center' },
  alike: (a, b) => a.layout === b.layout && a.bg === b.bg,
  describe: (s) => `${s.layout} announcement, ${s.bg} background, ${s.button} button, ${s.size} size`,
})

export function bannerCss(s: BannerSpec, p: string): string {
  const sf = surface(s.bg === 'glow' ? 'band' : s.bg)
  const css: string[] = []
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))
  const fs = s.size === 's' ? '.88rem' : '1rem'
  const pill = s.layout === 'pill'
  c(`&{position:relative;${pill ? 'padding:.6rem 1rem;' : `background:${sf.bg};${s.line === 'line' ? 'border-bottom:1px solid color-mix(in srgb,currentColor 16%,transparent);' : ''}`}color:${sf.fg};font-family:${s.font === 'serif' ? SERIF : SANS};overflow:hidden}`)
  c(`& *{box-sizing:border-box}`)
  c(`& .gb-in{display:flex;align-items:center;justify-content:${s.layout === 'split' ? 'space-between' : s.align === 'left' && s.layout !== 'ticker' ? 'flex-start' : 'center'};gap:.6rem 1.25rem;flex-wrap:wrap;max-width:${pill ? '48rem' : '76rem'};margin:0 auto;padding:${s.size === 's' ? '.5rem' : '.8rem'} 1.25rem;${pill ? `background:${sf.bg};border-radius:${s.radius}px;` : ''}font-size:${fs};text-align:center}`)
  c(`& .gb-text{margin:0;font-weight:${s.font === 'display' || s.weight === 'bold' ? 700 : 500};${s.font === 'display' ? 'text-transform:uppercase;letter-spacing:.06em;font-size:.82em;' : ''}color:inherit}`)
  if (s.icon !== 'none') c(`& .gb-text::before{content:'${{ dot: '●', spark: '✦', tag: '◆' }[s.icon]}';margin-right:.55rem;font-size:.8em;opacity:.85}`)
  const btn = { link: 'text-decoration:underline;text-underline-offset:.2em;font-weight:600;color:inherit', solid: `${sf.solid}padding:.3rem .9rem;border-radius:${Math.min(s.radius, 12) || 4}px;font-weight:600;text-decoration:none`, arrow: 'font-weight:600;text-decoration:none;color:inherit' }[s.button]
  c(`& .gb-button{${btn};white-space:nowrap}${s.button === 'arrow' ? '& .gb-button::after{content:" →"}' : ''}& .gb-button:hover{opacity:.85}`)
  if (s.layout === 'ticker') c(`& .gb-in{flex-wrap:nowrap;justify-content:flex-start;width:max-content;animation:gbTick 22s linear infinite}@keyframes gbTick{from{transform:translateX(100vw)}to{transform:translateX(-100%)}}@media (prefers-reduced-motion:reduce){.${p} .gb-in{animation:none;width:auto;flex-wrap:wrap;justify-content:center}}`)
  return css.join('\n')
}

export function bannerTree(s: BannerSpec, p: string): Node {
  return h('aside', { 'data-ref': 'show-banner', 'data-gen': 'banner', className: p, 'aria-label': 'Announcement' }, h('style', {}, bannerCss(s, p)), h('div', { className: 'gb-in' }, h('p', { 'data-slot': 'text', className: 'gb-text' }, 'Offer'), h('a', { 'data-slot': 'button', href: '#contact', className: 'gb-button' }, 'Button')))
}

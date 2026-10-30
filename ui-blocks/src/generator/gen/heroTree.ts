// A hero spec (heroSpec.ts) as a TREE of elements and the CSS that goes with it. The tree is the one source of the hero: it is drawn by React directly (heroEmit.ts: no compiling needed,
// so the preview and the exports can draw it at once) and printed as the TSX text of a component (the Code tab and the project export show that text). Only plain data here.
// The parts carry the data-slot names of the showcase kit (eyebrow, meta, title, subtitle, button, button2, image): the page's own filler puts the business's texts and pictures in by name.
// Colours are the page's variables (--g-accent, --g-on-accent, --g-band, --g-glow, --color-white, --color-gray-200), so one hero follows every palette and the light / dark switch. No Tailwind class is
// used (a class that was not in the built stylesheet would be missing from an exported site): the look is the scoped <style> of the hero itself.
import type { HeroSpec } from './heroSpec'

export type Node = { tag: string; props: Record<string, string | number | Record<string, string | number>>; children: (Node | string)[] }
export const h = (tag: string, props: Node['props'] = {}, ...children: (Node | string)[]): Node => ({ tag, props, children })

const FONT: Record<HeroSpec['font'], string> = { sans: "var(--font-sans, system-ui, -apple-system, 'Segoe UI', sans-serif)", serif: "var(--font-serif, Georgia, 'Times New Roman', serif)", display: "var(--font-sans, system-ui, -apple-system, 'Segoe UI', sans-serif)" }
const SIZE: Record<HeroSpec['scale'], string> = { m: 'clamp(2rem,4.2vw,3.25rem)', l: 'clamp(2.35rem,5.4vw,4.5rem)', xl: 'clamp(2.6rem,7vw,6rem)', xxl: 'clamp(2.9rem,8vw,6.5rem)' }
const LEADING: Record<HeroSpec['scale'], string> = { m: '1.12', l: '1.06', xl: '1', xxl: '0.94' }
const TRACK: Record<HeroSpec['scale'], string> = { m: '-0.015em', l: '-0.025em', xl: '-0.035em', xxl: '-0.045em' }

/** the CSS of one hero, every rule under its own class (`p`) */
export function heroCss(s: HeroSpec, p: string): string {
  const r = s.radius
  const dark = s.bg === 'ink'
  const onAccent = s.bg === 'accent'
  const bleed = s.layout === 'bleed-overlay'
  const light = bleed ? '#fff' : dark ? '#f4f4f5' : onAccent ? 'var(--g-on-accent)' : 'inherit'
  const bg: Record<HeroSpec['bg'], string> = { plain: 'transparent', band: 'var(--g-band)', glow: 'radial-gradient(ellipse 70% 60% at 75% 0%, var(--g-glow), transparent 70%)', accent: 'var(--g-accent)', ink: '#111216' }
  const stacked = s.layout === 'center-stack' || s.layout === 'stack-wide' || s.layout === 'type-led'
  // (416 thumbs: the full ones are the least disliked, 1 of 115; compact 7 of 138, tall 13 of 163: the heights are the first ones again)
  const pad = s.height === 'compact' ? '3rem' : s.height === 'tall' ? (stacked ? '4rem' : '5.5rem') : stacked ? '4.75rem' : '7rem'
  const minH = s.height === 'full' && !stacked ? 'min-height:88vh;' : ''
  const wide = s.layout === 'type-led' ? '110rem' : '76rem'
  const css: string[] = []
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))

  c(`&{position:relative;overflow:hidden;isolation:isolate;background:${bg[s.bg]};color:${light};${minH}${bleed ? 'display:flex;align-items:flex-end;' : ''}}`)
  c(`& *{box-sizing:border-box}`)
  c(`& .gh-in{position:relative;z-index:2;width:100%;max-width:${wide};margin:0 auto;padding:${pad} 1.5rem}`)
  // the parts
  c(`& .gh-eyebrow{display:inline-block;font-size:.75rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;opacity:.85;${s.eyebrow === 'chip' ? `padding:.35rem .9rem;border:1px solid currentColor;border-radius:999px;` : ''}}`)
  if (s.eyebrow === 'line') c(`& .gh-eyebrow::before{content:'';display:inline-block;width:2.2rem;height:2px;background:currentColor;margin-right:.7rem;vertical-align:middle}`)
  c(`& .gh-title{margin:1rem 0 0;font-family:${FONT[s.font]};font-size:${SIZE[s.scale]};font-weight:${s.weight};line-height:${LEADING[s.scale]};letter-spacing:${TRACK[s.scale]};text-wrap:balance;overflow-wrap:break-word;hyphens:auto;color:inherit}`)
  c(`& .gh-sub{margin:1.25rem 0 0;font-size:clamp(1rem,1.4vw,1.2rem);line-height:1.6;opacity:.8;max-width:38rem;color:inherit}`)
  c(`& .gh-meta{font-size:.74rem;font-weight:500;letter-spacing:.16em;text-transform:uppercase;opacity:.7}`)
  c(`& .gh-actions{display:flex;flex-wrap:wrap;align-items:center;gap:.9rem 1.1rem;margin-top:2rem}`)
  // the buttons: the first is the main one, the second a quieter one of the same family
  const rb = s.button === 'pill' ? '999px' : `${Math.min(r, 14)}px`
  const solid = dark || bleed ? `background:${bleed ? '#fff' : '#f4f4f5'};color:#111216;` : onAccent ? 'background:var(--g-on-accent);color:var(--g-accent);' : 'background:var(--g-accent);color:var(--g-on-accent);'
  const base = `display:inline-flex;align-items:center;justify-content:center;min-height:2.75rem;text-decoration:none;font-weight:600;font-size:.98rem;cursor:pointer;`
  if (s.button === 'link') {
    c(`& .gh-btn{${base}padding:.35rem 0;border-bottom:2px solid currentColor;border-radius:0;background:none;color:inherit}`)
    c(`& .gh-b2{opacity:.7;border-bottom-color:transparent}`)
  } else {
    c(`& .gh-b1{${base}padding:.8rem 1.6rem;border-radius:${rb};border:2px solid transparent;${s.button === 'outline' ? 'background:transparent;color:inherit;border-color:currentColor;' : solid}}`)
    c(`& .gh-b2{${base}padding:.8rem 1.4rem;border-radius:${rb};border:2px solid transparent;background:transparent;color:inherit;${s.button === 'outline' ? 'border-color:transparent;border-bottom:2px solid currentColor;border-radius:0;padding-inline:.2rem;' : 'border-color:currentColor;opacity:.9;'}}`)
  }
  c(`& .gh-b1:hover,& .gh-b2:hover{filter:brightness(1.08);transform:translateY(-1px)}`)
  c(`& .gh-btn{transition:transform .2s ease,filter .2s ease}`)
  // the picture and its shape
  const shape: Record<HeroSpec['media'], string> = {
    rect: `border-radius:${r}px;`,
    arch: `border-radius:999px 999px ${Math.max(r, 10)}px ${Math.max(r, 10)}px;`,
    circle: 'aspect-ratio:1;border-radius:50%;',
    tilt: `border-radius:${Math.max(r, 6)}px;transform:rotate(-2.5deg);border:6px solid var(--color-white, #fff);box-shadow:0 28px 60px -24px rgba(0,0,0,.4);`,
    blob: 'border-radius:58% 42% 55% 45% / 48% 58% 42% 52%;',
  }
  c(`& .gh-media{position:relative;overflow:hidden;background:var(--g-band);${shape[s.media]}}`)
  c(`& .gh-media img{display:block;width:100%;height:100%;object-fit:cover}`)
  // the layouts
  switch (s.layout) {
    case 'split-right':
    case 'split-left':
      c(`& .gh-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(2rem,5vw,4.5rem);align-items:center}`)
      c(`& .gh-media{aspect-ratio:${s.media === 'circle' ? '1' : '4/5'};max-height:36rem;width:100%;justify-self:center}`)
      if (s.layout === 'split-left') c(`& .gh-text{order:2}`)
      break
    case 'center-stack':
      c(`& .gh-grid{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2.2rem}`)
      c(`& .gh-text{max-width:52rem;display:flex;flex-direction:column;align-items:center}`)
      c(`& .gh-sub{margin-inline:auto}& .gh-actions{justify-content:center}`)
      c(`& .gh-media{width:100%;height:clamp(12rem,32vh,22rem)}`)
      break
    case 'type-led':
      c(`& .gh-top{display:flex;justify-content:space-between;gap:1.5rem;align-items:flex-start}`)
      c(`& .gh-title{margin-top:1.4rem}`)
      c(`& .gh-row{display:grid;grid-template-columns:1fr minmax(0,28rem);gap:2rem;align-items:end;margin-top:2.5rem}& .gh-row .gh-actions{margin-top:0}& .gh-row .gh-sub{margin:0}`)
      c(`& .gh-media{margin-top:2.2rem;width:100%;height:clamp(12rem,34vh,24rem)}`)
      break
    case 'bleed-overlay':
      c(`& .gh-media{position:absolute;inset:0;z-index:0;border-radius:0;aspect-ratio:auto;transform:none;border:0;box-shadow:none}`)
      c(`& .gh-scrim{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.58),rgba(0,0,0,.22) 62%,rgba(0,0,0,.04)),linear-gradient(0deg,rgba(0,0,0,.42),transparent 55%)}`)
      c(`& .gh-text{max-width:42rem}`)
      c(`& .gh-in{padding-top:${s.height === 'full' ? '8rem' : '6.5rem'}}`)
      c(`&{min-height:${s.height === 'full' ? '86vh' : '70vh'}}`)
      break
    case 'offset-card':
      c(`& .gh-stage{position:relative}`)
      c(`& .gh-media{width:68%;margin-left:auto;aspect-ratio:5/4}`)
      c(`& .gh-text{position:absolute;left:0;top:50%;transform:translateY(-50%);width:min(34rem,54%);background:var(--color-white,#fff);color:inherit;padding:2.4rem;border-radius:${Math.max(r, 8)}px;box-shadow:0 30px 70px -30px rgba(0,0,0,.35);border:1px solid var(--color-gray-200,rgba(0,0,0,.08))}`)
      break
    case 'bento':
      c(`& .gh-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:1rem}`)
      c(`& .gh-cell1{grid-column:span 7;background:var(--g-band);border-radius:${Math.max(r, 12)}px;padding:clamp(1.5rem,4vw,3rem)}`)
      c(`& .gh-cell2{grid-column:span 7;background:var(--color-white,#fff);border:1px solid var(--color-gray-200,rgba(0,0,0,.08));border-radius:${Math.max(r, 12)}px;padding:clamp(1.25rem,3vw,2rem)}& .gh-cell2 .gh-sub{margin-top:0}`)
      c(`& .gh-media{grid-column:span 5;grid-row:span 2;min-height:22rem;border-radius:${Math.max(r, 12)}px}`)
      break
    case 'stack-wide':
      c(`& .gh-head{display:grid;grid-template-columns:1.2fr .8fr;gap:clamp(1.5rem,5vw,4rem);align-items:end}`)
      c(`& .gh-head .gh-actions{margin-top:1.5rem}`)
      c(`& .gh-media{margin-top:2.2rem;width:100%;height:clamp(12rem,32vh,22rem)}`)
      break
  }
  // behind the headline
  if (s.decor !== 'none') {
    const fx: Record<string, string> = {
      blob: 'background:radial-gradient(circle at 88% 12%,var(--g-glow),transparent 42%),radial-gradient(circle at 8% 92%,var(--g-glow),transparent 38%);',
      grid: 'background-image:linear-gradient(currentColor 1px,transparent 1px),linear-gradient(90deg,currentColor 1px,transparent 1px);background-size:56px 56px;opacity:.07;-webkit-mask-image:radial-gradient(ellipse at 50% 30%,#000 25%,transparent 75%);mask-image:radial-gradient(ellipse at 50% 30%,#000 25%,transparent 75%);',
      dots: 'background-image:radial-gradient(currentColor 1.3px,transparent 1.6px);background-size:22px 22px;opacity:.14;-webkit-mask-image:radial-gradient(ellipse at 70% 30%,#000 20%,transparent 72%);mask-image:radial-gradient(ellipse at 70% 30%,#000 20%,transparent 72%);',
      grain: "background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='.55'/></svg>\");opacity:.09;",
      ring: 'border:2px solid currentColor;border-radius:50%;opacity:.12;width:46rem;height:46rem;left:auto;right:-14rem;top:-16rem;inset-inline-end:-14rem;box-shadow:0 0 0 6rem rgba(127,127,127,.05);',
      stripes: 'background-image:repeating-linear-gradient(135deg,currentColor 0 1px,transparent 1px 14px);opacity:.06;',
    }
    c(`& .gh-fx{position:absolute;z-index:1;pointer-events:none;${s.decor === 'ring' ? '' : 'inset:0;'}${fx[s.decor]}}`)
  }
  // how it moves (only for people who have not asked for less motion)
  if (s.motion !== 'none') {
    const m: string[] = []
    if (s.motion === 'rise' || s.motion === 'stagger') m.push(`& .gh-a{animation:ghRise .6s cubic-bezier(.2,.7,.2,1) both;${s.motion === 'stagger' ? 'animation-delay:calc(var(--i,0)*90ms);' : ''}}`)
    if (s.motion === 'float') m.push(`& .gh-media{animation:ghFloat 7s ease-in-out infinite}`)
    if (s.motion === 'kenburns') m.push(`& .gh-media img{animation:ghKen 22s ease-in-out infinite alternate}`)
    css.push(`@keyframes ghRise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}@keyframes ghFloat{0%,100%{translate:0 0}50%{translate:0 -10px}}@keyframes ghKen{from{transform:scale(1)}to{transform:scale(1.08)}}`)
    css.push(`@media (prefers-reduced-motion:no-preference){${m.map((x) => x.replaceAll('&', `.${p}`)).join('')}}`)
  }
  // a phone
  css.push(`@media (max-width:820px){.${p} .gh-grid,.${p} .gh-row,.${p} .gh-head{grid-template-columns:1fr}.${p} .gh-in{padding-top:calc(${pad} * .62);padding-bottom:calc(${pad} * .62)}.${p} .gh-media{max-height:none}${s.layout === 'offset-card' ? `.${p} .gh-media{width:100%}.${p} .gh-text{position:relative;left:auto;top:auto;transform:none;width:auto;margin:-3rem 1rem 0}` : ''}${s.layout === 'bento' ? `.${p} .gh-cell1,.${p} .gh-cell2,.${p} .gh-media{grid-column:1/-1}` : ''}${s.layout === 'type-led' ? `.${p} .gh-top{flex-direction:column;gap:.75rem}` : ''}${s.layout === 'split-left' ? `.${p} .gh-text{order:0}` : ''}}`)
  return css.join('\n')
}

/** the elements of one hero */
export function heroTree(s: HeroSpec, p: string): Node {
  const anim = (i: number) => (s.motion === 'rise' || s.motion === 'stagger' ? { className: 'gh-a', style: { '--i': i } } : { className: '' })
  const withClass = (base: string, i: number): Node['props'] => {
    const a = anim(i)
    return { className: `${base} ${a.className}`.trim(), ...('style' in a ? { style: a.style as Record<string, string | number> } : {}) }
  }
  const eyebrow = h('span', { 'data-slot': 'eyebrow', ...withClass('gh-eyebrow', 0) }, 'Eyebrow')
  const title = h('h1', { 'data-slot': 'title', ...withClass('gh-title', 1) }, 'Headline')
  const subtitle = h('p', { 'data-slot': 'subtitle', ...withClass('gh-sub', 2) }, 'Subtitle')
  const actions = h('div', withClass('gh-actions', 3), h('a', { 'data-slot': 'button', href: '#contact', className: 'gh-btn gh-b1' }, 'Button'), h('a', { 'data-slot': 'button2', href: '#features', className: 'gh-btn gh-b2' }, 'Second button'))
  const meta = h('span', { 'data-slot': 'meta', className: 'gh-meta' }, 'Meta')
  const media = h('div', { className: `gh-media ${s.motion === 'rise' || s.motion === 'stagger' ? 'gh-a' : ''}`.trim(), ...(s.motion === 'stagger' ? { style: { '--i': 4 } } : {}) }, h('img', { 'data-slot': 'image', alt: '' }))
  const text = h('div', { className: 'gh-text' }, eyebrow, title, subtitle, actions)
  let body: Node
  switch (s.layout) {
    case 'split-right':
    case 'split-left':
      body = h('div', { className: 'gh-in' }, h('div', { className: 'gh-grid' }, text, media))
      break
    case 'center-stack':
      body = h('div', { className: 'gh-in' }, h('div', { className: 'gh-grid' }, text, media))
      break
    case 'type-led':
      body = h('div', { className: 'gh-in' }, h('div', { className: 'gh-top' }, eyebrow, meta), title, h('div', { className: 'gh-row' }, actions, subtitle), media)
      break
    case 'bleed-overlay':
      return h('section', { 'data-ref': 'show-type-hero', 'data-gen': 'hero', className: `${p}` }, h('style', {}, heroCss(s, p)), media, h('div', { className: 'gh-scrim', 'data-veil': '', 'aria-hidden': 'true' }), h('div', { className: 'gh-in' }, h('div', { className: 'gh-text' }, eyebrow, title, subtitle, actions)))
    case 'offset-card':
      body = h('div', { className: 'gh-in' }, h('div', { className: 'gh-stage' }, media, text))
      break
    case 'bento':
      body = h('div', { className: 'gh-in' }, h('div', { className: 'gh-grid' }, h('div', { className: 'gh-cell1' }, eyebrow, title), media, h('div', { className: 'gh-cell2' }, subtitle, actions)))
      break
    case 'stack-wide':
      body = h('div', { className: 'gh-in' }, h('div', { className: 'gh-head' }, h('div', {}, eyebrow, title), h('div', {}, subtitle, actions)), media)
      break
  }
  return h('section', { 'data-ref': 'show-type-hero', 'data-gen': 'hero', className: p }, h('style', {}, heroCss(s, p)), ...(s.decor !== 'none' ? [h('div', { className: 'gh-fx', 'aria-hidden': 'true' })] : []), body)
}

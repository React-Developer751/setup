// CSS pieces the later generators share (pricing, FAQ, testimonials, gallery): the surface (background and ink), the heading, a decor layer, the arrival motion, the look of a card.
// Colours are the page's variables (--g-accent, --g-on-accent, --g-band, --g-glow); no Tailwind class (an exported site only holds the classes of the built stylesheet).
import { h, type Node } from './heroTree'

export const SANS = "var(--font-sans, system-ui, -apple-system, 'Segoe UI', sans-serif)"
export const SERIF = "var(--font-serif, Georgia, 'Times New Roman', serif)"
export const BGS = ['plain', 'band', 'ink', 'accent', 'glow'] as const
export const FONTS = ['sans', 'serif', 'display'] as const
export const HEAD_SIZES = { m: 'clamp(1.7rem,3vw,2.4rem)', l: 'clamp(2rem,4.2vw,3.3rem)', xl: 'clamp(2.3rem,5.8vw,4.6rem)' } as const
export const CARDS = ['flat', 'bordered', 'filled', 'shadow'] as const
export const ARRIVES = ['none', 'rise', 'scroll'] as const
export const DECORS = ['none', 'blob', 'grid', 'dots', 'grain'] as const

export type Bg = (typeof BGS)[number]
export const surface = (bg: Bg) => ({
  bg: { plain: 'transparent', band: 'var(--g-band)', ink: '#111216', accent: 'var(--g-accent)', glow: 'radial-gradient(ellipse 80% 70% at 50% 0%, var(--g-glow), transparent 70%)' }[bg],
  fg: bg === 'ink' ? '#f4f4f5' : bg === 'accent' ? 'var(--g-on-accent)' : 'inherit',
  /** the colour of a solid button / highlighted card on this surface */
  solid: bg === 'ink' ? 'background:#f4f4f5;color:#111216;' : bg === 'accent' ? 'background:var(--g-on-accent);color:var(--g-accent);' : 'background:var(--g-accent);color:var(--g-on-accent);',
})

/** the section, the container and the heading; `p` is the scoped class */
export function baseCss(p: string, o: { bg: Bg; font: (typeof FONTS)[number]; head: keyof typeof HEAD_SIZES; center: boolean; pad: string; wide?: string }): string[] {
  const s = surface(o.bg)
  const css: string[] = []
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))
  c(`&{position:relative;overflow:hidden;isolation:isolate;padding:${o.pad} 1.5rem;background:${s.bg};color:${s.fg}}`)
  c(`& *{box-sizing:border-box}`)
  c(`& .gp-in{position:relative;z-index:2;max-width:${o.wide ?? '72rem'};margin:0 auto}`)
  c(`& .gp-title{margin:0 0 ${o.center ? '3rem' : '2.5rem'};font-family:${o.font === 'serif' ? SERIF : SANS};font-size:${HEAD_SIZES[o.head]};font-weight:${o.font === 'serif' ? 600 : o.font === 'display' ? 800 : 700};line-height:1.08;letter-spacing:${o.head === 'xl' ? '-0.035em' : '-0.02em'};text-wrap:balance;overflow-wrap:break-word;color:inherit;${o.center ? 'text-align:center;' : ''}}`)
  return css
}

export function decorCss(p: string, decor: (typeof DECORS)[number], bg: Bg): string[] {
  if (decor === 'none') return []
  const fx: Record<string, string> = {
    blob: 'background:radial-gradient(circle at 90% 10%,var(--g-glow),transparent 40%),radial-gradient(circle at 5% 95%,var(--g-glow),transparent 38%);',
    grid: 'background-image:linear-gradient(currentColor 1px,transparent 1px),linear-gradient(90deg,currentColor 1px,transparent 1px);background-size:52px 52px;opacity:.07;',
    dots: 'background-image:radial-gradient(currentColor 1.3px,transparent 1.6px);background-size:22px 22px;opacity:.13;',
    grain: "background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='.55'/></svg>\");opacity:.09;",
  }
  return [`.${p} .gp-fx{position:absolute;inset:0;z-index:1;pointer-events:none;color:${surface(bg).fg};${fx[decor]}}`]
}

/** a card's surface: flat (none), a thin line, a tint, a soft shadow; `r` is the radius */
export function cardCss(look: (typeof CARDS)[number], r: number): string {
  const base = `border-radius:${r}px;`
  if (look === 'bordered') return `${base}border:1px solid color-mix(in srgb,currentColor 22%,transparent);`
  if (look === 'filled') return `${base}background:color-mix(in srgb,currentColor 8%,transparent);`
  if (look === 'shadow') return `${base}background:color-mix(in srgb,currentColor 5%,transparent);box-shadow:0 14px 34px -14px rgba(0,0,0,.28);`
  return base
}

/** the arrival motion of the items (`sel` is what moves) */
export function arriveCss(p: string, arrives: (typeof ARRIVES)[number], sel: string): string[] {
  if (arrives === 'none') return []
  const rise = `@keyframes gpRise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}`
  if (arrives === 'rise') return [rise, `@media (prefers-reduced-motion:no-preference){.${p} ${sel}{animation:gpRise .65s cubic-bezier(.2,.7,.2,1) both}.${p} ${sel}:nth-child(2){animation-delay:.08s}.${p} ${sel}:nth-child(3){animation-delay:.16s}.${p} ${sel}:nth-child(4){animation-delay:.24s}}`]
  return [rise, `@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){.${p} ${sel}{animation:gpRise linear both;animation-timeline:view();animation-range:entry 0% entry 55%}}}`]
}

export const fxNode = (decor: string): Node[] => (decor === 'none' ? [] : [h('div', { className: 'gp-fx', 'aria-hidden': 'true' })])

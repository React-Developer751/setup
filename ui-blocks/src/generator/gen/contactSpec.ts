// The contact part (gen/Contact_...): the ways to reach the business and a form. The form is a plain form (the page's runtime sends it, see library/widgetRuntime.ts). See partKit.ts.
import { definePart } from './partKit'
import { ARRIVES, BGS, CARDS, DECORS, FONTS, arriveCss, baseCss, cardCss, decorCss, fxNode, surface } from './partCommon'
import { h, type Node } from './heroTree'

export type ContactSpec = {
  layout: 'split' | 'form-left' | 'centered' | 'cards' | 'stack'
  fields: 'outlined' | 'filled' | 'underline'
  card: (typeof CARDS)[number]
  rows: 'list' | 'tiles' | 'big'
  button: 'solid' | 'pill' | 'outline' | 'wide'
  bg: (typeof BGS)[number]
  font: (typeof FONTS)[number]
  size: 'm' | 'l' | 'xl'
  radius: 0 | 10 | 22
  head: 'left' | 'center'
  decor: (typeof DECORS)[number]
  arrives: (typeof ARRIVES)[number]
}

export const contact = definePart<ContactSpec>({
  prefix: 'Contact',
  axes: { layout: ['split', 'form-left', 'centered', 'cards', 'stack'], fields: ['outlined', 'filled', 'underline'], card: CARDS, rows: ['list', 'tiles', 'big'], button: ['solid', 'pill', 'outline', 'wide'], bg: BGS, font: FONTS, size: ['m', 'l', 'xl'], radius: [0, 10, 22], head: ['left', 'center'], decor: DECORS, arrives: ARRIVES },
  valid: (s) => {
    if ((s.layout === 'centered' || s.layout === 'cards' || s.layout === 'stack') && s.head === 'left') return false
    if ((s.layout === 'split' || s.layout === 'form-left') && s.head === 'center') return false
    if (s.layout === 'cards' && s.rows === 'list') return false
    if (s.font === 'serif' && s.size === 'm') return false
    if (s.bg === 'accent' && (s.decor === 'blob' || s.card === 'shadow')) return false
    if (s.bg === 'ink' && s.decor === 'grain') return false
    if (s.fields === 'filled' && s.card === 'filled') return false
    return true
  },
  fit: (s) => {
    const f = { ...s }
    if (f.layout === 'centered' || f.layout === 'cards' || f.layout === 'stack') f.head = 'center'
    if (f.layout === 'split' || f.layout === 'form-left') f.head = 'left'
    if (f.layout === 'cards' && f.rows === 'list') f.rows = 'tiles'
    if (f.font === 'serif' && f.size === 'm') f.size = 'l'
    if (f.bg === 'accent' && f.card === 'shadow') f.card = 'bordered'
    if (f.fields === 'filled' && f.card === 'filled') f.card = 'bordered'
    return f
  },
  lean: {
    calm: { layout: ['split', 'form-left', 'centered'], bg: ['plain', 'band'], fields: ['outlined', 'underline'], card: ['flat', 'bordered'] },
    bold: { layout: ['split', 'stack'], size: ['xl', 'l'], bg: ['ink', 'accent', 'plain'], font: ['display', 'sans'], rows: ['big'], button: ['wide', 'solid'] },
    soft: { radius: [22], card: ['shadow', 'filled'], font: ['serif', 'sans'], bg: ['band', 'glow', 'plain'], button: ['pill'], fields: ['filled', 'outlined'] },
    dark: { bg: ['ink', 'glow'], card: ['bordered', 'filled'], fields: ['outlined', 'underline'] },
    playful: { radius: [22], bg: ['accent', 'band', 'glow'], button: ['pill'], rows: ['tiles'], decor: ['dots', 'blob'] },
  },
  fallback: { layout: 'split', fields: 'outlined', card: 'bordered', rows: 'list', button: 'solid', bg: 'plain', font: 'sans', size: 'l', radius: 10, head: 'left', decor: 'none', arrives: 'none' },
  alike: (a, b) => a.layout === b.layout && a.bg === b.bg,
  describe: (s) => `${s.layout} contact, ${s.rows} details, ${s.fields} fields, ${s.card} card, ${s.bg} background${s.decor === 'none' ? '' : ` with ${s.decor}`}, ${s.button} button`,
})

export function contactCss(s: ContactSpec, p: string): string {
  const sf = surface(s.bg)
  const css = baseCss(p, { bg: s.bg, font: s.font, head: s.size, center: s.head === 'center', pad: 'clamp(3.5rem,8vw,6rem)', wide: '72rem' })
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))
  c(`& .gp-title{margin-bottom:.9rem}& .gp-lead{margin:0 0 2rem;font-size:1.05rem;line-height:1.6;opacity:.8;max-width:34rem;${s.head === 'center' ? 'margin-inline:auto;text-align:center;' : ''}color:inherit}`)
  const two = s.layout === 'split' || s.layout === 'form-left'
  if (two) c(`& .gp-cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:2.5rem clamp(2rem,6vw,5rem);align-items:start}${s.layout === 'form-left' ? '& .gp-form{order:-1}' : ''}`)
  if (s.layout === 'centered') c(`& .gp-cols{max-width:40rem;margin:0 auto}& .gp-rows{margin-bottom:2rem}`)
  if (s.layout === 'cards') c(`& .gp-cols{display:flex;flex-direction:column;gap:2rem}& .gp-rows{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:1rem}`)
  if (s.layout === 'stack') c(`& .gp-cols{max-width:44rem;margin:0 auto;display:flex;flex-direction:column;gap:2.5rem}`)
  // the ways to reach
  c(`& .gp-rows{display:flex;flex-direction:column;gap:${s.rows === 'big' ? '1.5rem' : '1rem'}}& .gp-row{display:flex;flex-direction:column;gap:.15rem}`)
  c(`& .gp-label{font-size:.75rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;opacity:.6}& .gp-value{font-size:${s.rows === 'big' ? 'clamp(1.25rem,2.6vw,1.9rem)' : '1.05rem'};font-weight:${s.rows === 'big' ? 600 : 500};letter-spacing:${s.rows === 'big' ? '-.02em' : '0'};color:inherit;text-decoration:none;overflow-wrap:anywhere}& a.gp-value:hover{text-decoration:underline}`)
  if (s.rows === 'tiles') c(`& .gp-row{padding:1.1rem 1.25rem;${cardCss(s.card === 'flat' ? 'filled' : s.card, Math.min(s.radius, 16))}}`)
  if (s.rows === 'list') c(`& .gp-row{padding-bottom:1rem;border-bottom:1px solid color-mix(in srgb,currentColor 16%,transparent)}`)
  // the form
  c(`& .gp-form{display:flex;flex-direction:column;gap:.9rem;padding:${s.card === 'flat' ? '0' : 'clamp(1.25rem,3vw,2rem)'};${cardCss(s.card, s.radius)}}`)
  c(`& .gp-form label{display:flex;flex-direction:column;gap:.35rem;font-size:.85rem;font-weight:600}`)
  const field = { outlined: `border:1.5px solid color-mix(in srgb,currentColor 28%,transparent);background:transparent;border-radius:${Math.min(s.radius, 12)}px;padding:.8rem 1rem;`, filled: `border:1.5px solid transparent;background:color-mix(in srgb,currentColor 9%,transparent);border-radius:${Math.min(s.radius, 12)}px;padding:.8rem 1rem;`, underline: 'border:0;border-bottom:1.5px solid color-mix(in srgb,currentColor 35%,transparent);background:transparent;border-radius:0;padding:.7rem 0;' }[s.fields]
  c(`& .gp-form input,& .gp-form textarea{width:100%;font:inherit;font-size:1rem;color:inherit;${field}}& .gp-form textarea{min-height:8rem;resize:vertical}& .gp-form input::placeholder,& .gp-form textarea::placeholder{color:inherit;opacity:.5}& .gp-form input:focus,& .gp-form textarea:focus{outline:2px solid var(--g-accent);outline-offset:1px}`)
  const rb = s.button === 'pill' ? '999px' : `${Math.min(s.radius, 12)}px`
  const btn = `display:inline-flex;align-items:center;justify-content:center;min-height:2.9rem;padding:.75rem 1.6rem;font:inherit;font-weight:600;cursor:pointer;border-radius:${rb};${s.button === 'wide' ? 'width:100%;' : 'align-self:flex-start;'}`
  c(`& .gp-send{${btn}${s.button === 'outline' ? 'border:2px solid currentColor;background:transparent;color:inherit;' : `border:2px solid transparent;${sf.solid}`}transition:filter .2s ease}& .gp-send:hover{filter:brightness(1.08)}`)
  css.push(...decorCss(p, s.decor, s.bg), ...arriveCss(p, s.arrives, '.gp-cols > *'))
  css.push(`@media (max-width:820px){.${p} .gp-cols{display:flex;flex-direction:column;gap:2rem}.${p} .gp-form{order:2}}`)
  return css.join('\n')
}

export function contactTree(s: ContactSpec, p: string): Node {
  const rows = h('div', { className: 'gp-rows' }, ...[0, 1, 2, 3, 4].map(() => h('div', { 'data-slot': 'row', className: 'gp-row' }, h('span', { 'data-slot': 'row-label', className: 'gp-label' }, 'Label'), h('a', { 'data-slot': 'row-value', className: 'gp-value', href: '#' }, 'Value'))))
  const form = h('form', { className: 'gp-form', 'data-slot': 'form' },
    h('label', {}, 'Name', h('input', { type: 'text', name: 'name', autoComplete: 'name', placeholder: 'Your name' })),
    h('label', {}, 'Email', h('input', { type: 'email', name: 'email', autoComplete: 'email', placeholder: 'you@example.com' })),
    h('label', {}, 'Message', h('textarea', { name: 'message', placeholder: 'How can we help?' })),
    h('button', { 'data-slot': 'button', type: 'submit', className: 'gp-send' }, 'Send message'))
  const head = [h('h2', { 'data-slot': 'title', className: 'gp-title' }, 'Title'), h('p', { 'data-slot': 'lead', className: 'gp-lead' }, 'Lead')]
  const two = s.layout === 'split' || s.layout === 'form-left'
  const inner = two ? [h('div', { className: 'gp-cols' }, h('div', {}, ...head, rows), form)] : [...head, h('div', { className: 'gp-cols' }, rows, form)]
  return h('section', { 'data-ref': 'show-contact', 'data-gen': 'contact', className: p }, h('style', {}, contactCss(s, p)), ...fxNode(s.decor), h('div', { className: 'gp-in' }, ...inner))
}

// The blog / notes part (gen/Blog_...): the titles of articles. The page has titles and tags only (no articles are written), so the cards are not links. See partKit.ts.
import { definePart } from './partKit'
import { ARRIVES, BGS, CARDS, DECORS, FONTS, arriveCss, baseCss, cardCss, decorCss, fxNode } from './partCommon'
import { h, type Node } from './heroTree'

export type BlogSpec = {
  layout: 'grid' | 'list' | 'featured' | 'text' | 'columns'
  card: (typeof CARDS)[number]
  image: 'top' | 'none' | 'side'
  tag: 'chip' | 'plain' | 'caps'
  bg: (typeof BGS)[number]
  font: (typeof FONTS)[number]
  size: 'm' | 'l'
  radius: 0 | 10 | 22
  head: 'left' | 'center'
  decor: (typeof DECORS)[number]
  arrives: (typeof ARRIVES)[number]
}

export const blog = definePart<BlogSpec>({
  prefix: 'Blog',
  axes: { layout: ['grid', 'list', 'featured', 'text', 'columns'], card: CARDS, image: ['top', 'none', 'side'], tag: ['chip', 'plain', 'caps'], bg: BGS, font: FONTS, size: ['m', 'l'], radius: [0, 10, 22], head: ['left', 'center'], decor: DECORS, arrives: ARRIVES },
  valid: (s) => {
    if ((s.layout === 'text' || s.layout === 'list') && s.image === 'top') return false
    if (s.layout === 'text' && s.image !== 'none') return false
    if ((s.layout === 'grid' || s.layout === 'columns' || s.layout === 'featured') && s.image === 'side') return false
    if (s.layout !== 'grid' && s.layout !== 'featured' && s.card !== 'flat' && s.layout === 'text') return false
    if (s.bg === 'accent' && (s.decor === 'blob' || s.card === 'shadow')) return false
    if (s.bg === 'ink' && s.decor === 'grain') return false
    if (s.font === 'serif' && s.size === 'm') return false
    return true
  },
  fit: (s) => {
    const f = { ...s }
    if (f.layout === 'text') { f.image = 'none'; f.card = 'flat' }
    if (f.layout === 'list' && f.image === 'top') f.image = 'side'
    if ((f.layout === 'grid' || f.layout === 'columns' || f.layout === 'featured') && f.image === 'side') f.image = 'top'
    if (f.bg === 'accent' && f.card === 'shadow') f.card = 'bordered'
    if (f.font === 'serif' && f.size === 'm') f.size = 'l'
    return f
  },
  lean: {
    calm: { layout: ['grid', 'list', 'text'], bg: ['plain', 'band'], card: ['flat', 'bordered'], tag: ['plain', 'caps'] },
    bold: { layout: ['featured', 'list', 'grid'], size: ['l'], bg: ['ink', 'accent', 'plain'], font: ['display', 'sans'], tag: ['caps', 'chip'] },
    soft: { layout: ['grid', 'featured'], radius: [22], card: ['shadow', 'filled'], font: ['serif', 'sans'], bg: ['band', 'glow', 'plain'], tag: ['chip'] },
    dark: { bg: ['ink', 'glow'], card: ['bordered', 'filled'], decor: ['grid', 'dots', 'none'] },
    playful: { layout: ['grid', 'columns'], radius: [22], bg: ['accent', 'band', 'glow'], tag: ['chip'], decor: ['dots', 'blob'] },
  },
  fallback: { layout: 'grid', card: 'bordered', image: 'top', tag: 'chip', bg: 'plain', font: 'sans', size: 'm', radius: 10, head: 'center', decor: 'none', arrives: 'none' },
  alike: (a, b) => a.layout === b.layout && a.bg === b.bg,
  describe: (s) => `${s.layout} notes, ${s.image === 'none' ? 'no pictures' : `${s.image} pictures`}, ${s.tag} tags, ${s.card} cards, ${s.bg} background${s.decor === 'none' ? '' : ` with ${s.decor}`}`,
})

export function blogCss(s: BlogSpec, p: string): string {
  const css = baseCss(p, { bg: s.bg, font: s.font, head: s.size === 'l' ? 'l' : 'm', center: s.head === 'center', pad: 'clamp(3.5rem,8vw,6rem)', wide: '72rem' })
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))
  const lay: Record<BlogSpec['layout'], string> = {
    grid: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:1.5rem',
    list: 'display:flex;flex-direction:column;gap:1rem;max-width:50rem',
    featured: 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.25rem',
    text: 'display:flex;flex-direction:column;max-width:46rem',
    columns: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:2rem',
  }
  c(`& .gp-posts{${lay[s.layout]};${s.head === 'center' && (s.layout === 'list' || s.layout === 'text') ? 'margin-inline:auto' : ''}}`)
  if (s.layout === 'featured') c(`& .gp-post:first-child{grid-row:span 2}& .gp-post:first-child .gp-pimg{aspect-ratio:4/5}& .gp-post:nth-child(n+4){display:none}`)
  c(`& .gp-post{display:flex;flex-direction:${s.image === 'side' ? 'row' : 'column'};gap:1rem;overflow:hidden;${s.layout === 'text' ? 'padding:1.1rem 0;border-bottom:1px solid color-mix(in srgb,currentColor 18%,transparent);' : cardCss(s.card, s.radius)}${s.image === 'side' ? 'align-items:stretch;' : ''}}`)
  c(`& .gp-pimg{display:${s.image === 'none' ? 'none' : 'block'};${s.image === 'side' ? 'width:34%;min-width:7rem;' : 'width:100%;'}${s.image === 'top' ? 'aspect-ratio:16/10;' : ''}object-fit:cover}`)
  c(`& .gp-pbody{display:flex;flex-direction:column;gap:.55rem;padding:${s.image === 'none' && s.layout !== 'text' ? '1.4rem' : s.image === 'top' ? '0 1.25rem 1.25rem' : s.layout === 'text' ? '0' : '1.1rem 1.1rem 1.1rem 0'}}`)
  const tag = { chip: 'align-self:flex-start;padding:.2rem .7rem;border-radius:999px;background:color-mix(in srgb,currentColor 10%,transparent);font-size:.74rem;font-weight:600', plain: 'font-size:.85rem;opacity:.65;font-weight:500', caps: 'font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700;opacity:.65' }[s.tag]
  c(`& .gp-tag{${tag};color:inherit}`)
  c(`& .gp-ptitle{margin:0;font-family:${s.font === 'serif' ? 'var(--font-serif, Georgia, serif)' : 'inherit'};font-size:${s.size === 'l' ? '1.35rem' : '1.1rem'};font-weight:${s.font === 'display' ? 800 : 650};line-height:1.25;letter-spacing:-.01em;text-wrap:balance;color:inherit}`)
  css.push(...decorCss(p, s.decor, s.bg), ...arriveCss(p, s.arrives, '.gp-post'))
  css.push(`@media (max-width:700px){.${p} .gp-posts{grid-template-columns:1fr!important}.${p} .gp-post:first-child{grid-row:auto!important}.${p} .gp-post{flex-direction:column!important}.${p} .gp-pimg{width:100%!important;aspect-ratio:16/10!important}.${p} .gp-pbody{padding:${s.image === 'none' ? '1.2rem' : '0 1.1rem 1.1rem'}!important}}`)
  return css.join('\n')
}

export function blogTree(s: BlogSpec, p: string): Node {
  const post = () => h('article', { 'data-slot': 'post', className: 'gp-post' }, h('img', { 'data-slot': 'post-image', className: 'gp-pimg', alt: '', loading: 'lazy' }), h('div', { className: 'gp-pbody' }, h('span', { 'data-slot': 'post-tag', className: 'gp-tag' }, 'Tag'), h('h3', { 'data-slot': 'post-title', className: 'gp-ptitle' }, 'Title')))
  return h('section', { 'data-ref': 'show-blog', 'data-gen': 'blog', className: p }, h('style', {}, blogCss(s, p)), ...fxNode(s.decor), h('div', { className: 'gp-in' }, h('h2', { 'data-slot': 'title', className: 'gp-title' }, 'Title'), h('div', { className: 'gp-posts' }, ...[0, 1, 2, 3].map(post))))
}

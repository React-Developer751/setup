// The gallery part (gen/Gallery_...): pictures with captions. Method of the other generators; see partKit.ts.
import { definePart } from './partKit'
import { ARRIVES, BGS, DECORS, FONTS, arriveCss, baseCss, decorCss, fxNode } from './partCommon'
import { h, type Node } from './heroTree'

export type GallerySpec = {
  layout: 'grid' | 'masonry' | 'mosaic' | 'strip' | 'featured' | 'wide' | 'polaroid'
  caption: 'below' | 'overlay' | 'hover' | 'none'
  ratio: 'square' | 'landscape' | 'portrait'
  radius: 0 | 10 | 22
  gap: 'tight' | 'airy'
  hover: 'zoom' | 'lift' | 'none'
  bg: (typeof BGS)[number]
  font: (typeof FONTS)[number]
  head: 'left' | 'center'
  decor: (typeof DECORS)[number]
  arrives: (typeof ARRIVES)[number]
}

export const gallery = definePart<GallerySpec>({
  prefix: 'Gallery',
  axes: { layout: ['grid', 'masonry', 'mosaic', 'strip', 'featured', 'wide', 'polaroid'], caption: ['below', 'overlay', 'hover', 'none'], ratio: ['square', 'landscape', 'portrait'], radius: [0, 10, 22], gap: ['tight', 'airy'], hover: ['zoom', 'lift', 'none'], bg: BGS, font: FONTS, head: ['left', 'center'], decor: DECORS, arrives: ARRIVES },
  valid: (s) => {
    if (s.layout === 'polaroid' && (s.caption === 'overlay' || s.caption === 'hover' || s.radius === 22)) return false
    if ((s.layout === 'mosaic' || s.layout === 'masonry') && s.ratio !== 'square') return false
    if (s.layout === 'wide' && s.ratio !== 'landscape') return false
    if ((s.layout === 'mosaic' || s.layout === 'featured') && s.caption === 'below') return false
    if (s.bg === 'accent' && s.decor === 'blob') return false
    if (s.bg === 'ink' && s.decor === 'grain') return false
    return true
  },
  fit: (s) => {
    const f = { ...s }
    if (f.layout === 'polaroid') { if (f.caption === 'overlay' || f.caption === 'hover') f.caption = 'below'; if (f.radius === 22) f.radius = 10 }
    if (f.layout === 'mosaic' || f.layout === 'masonry') f.ratio = 'square'
    if (f.layout === 'wide') f.ratio = 'landscape'
    if ((f.layout === 'mosaic' || f.layout === 'featured') && f.caption === 'below') f.caption = 'overlay'
    return f
  },
  lean: {
    calm: { layout: ['grid', 'featured', 'wide'], bg: ['plain', 'band'], caption: ['below', 'hover'], gap: ['airy'] },
    bold: { layout: ['mosaic', 'masonry', 'wide'], gap: ['tight'], caption: ['overlay', 'none'], bg: ['ink', 'plain'], radius: [0] },
    soft: { radius: [22, 10], layout: ['grid', 'polaroid', 'featured'], bg: ['band', 'glow', 'plain'], font: ['serif', 'sans'] },
    dark: { bg: ['ink', 'glow'], caption: ['overlay', 'hover'], decor: ['grid', 'none'] },
    playful: { layout: ['polaroid', 'masonry', 'mosaic'], radius: [22], bg: ['accent', 'band', 'glow'], decor: ['dots', 'blob'] },
  },
  fallback: { layout: 'grid', caption: 'below', ratio: 'square', radius: 10, gap: 'airy', hover: 'zoom', bg: 'plain', font: 'sans', head: 'center', decor: 'none', arrives: 'none' },
  alike: (a, b) => a.layout === b.layout && a.bg === b.bg,
  describe: (s) => `${s.layout} gallery, ${s.caption === 'none' ? 'no captions' : `${s.caption} captions`}, ${s.ratio} pictures, ${s.bg} background${s.decor === 'none' ? '' : ` with ${s.decor}`}, hover ${s.hover}`,
})

const RATIO = { square: '1/1', landscape: '4/3', portrait: '3/4' } as const

export function galleryCss(s: GallerySpec, p: string): string {
  const css = baseCss(p, { bg: s.bg, font: s.font, head: 'l', center: s.head === 'center', pad: 'clamp(3.5rem,8vw,6rem)', wide: '76rem' })
  const c = (rule: string) => css.push(rule.replaceAll('&', `.${p}`))
  const gap = s.gap === 'tight' ? '.5rem' : '1.25rem'
  const lay: Record<GallerySpec['layout'], string> = {
    grid: `display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,15rem),1fr));gap:${gap}`,
    masonry: `columns:15rem;column-gap:${gap}`,
    mosaic: `display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(8rem,14vw);grid-auto-flow:dense;gap:${gap}`,
    strip: `display:flex;gap:${gap};overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:.75rem;scrollbar-width:thin`,
    featured: `display:grid;grid-template-columns:repeat(4,1fr);gap:${gap}`,
    wide: `display:flex;flex-direction:column;gap:${gap}`,
    polaroid: `display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,14rem),1fr));gap:2rem 1.5rem;padding:1rem 0`,
  }
  c(`& .gp-shots{${lay[s.layout]}}`)
  if (s.layout === 'mosaic') c(`& .gp-shot:nth-child(1){grid-column:span 2;grid-row:span 2}& .gp-shot:nth-child(4){grid-row:span 2}& .gp-shot:nth-child(5){grid-column:span 2}& .gp-shot{aspect-ratio:auto!important}& .gp-pic{height:100%}`)
  if (s.layout === 'featured') c(`& .gp-shot:nth-child(1){grid-column:span 2;grid-row:span 2}& .gp-shot:nth-child(n+6){display:none}& .gp-shot:nth-child(n+2){aspect-ratio:1/1}`)
  if (s.layout === 'strip') c(`& .gp-shot{flex:0 0 min(78%,19rem);scroll-snap-align:start}`)
  if (s.layout === 'polaroid') c(`& .gp-shot{background:var(--color-white,#fff);color:#27272a;padding:.7rem .7rem 0;box-shadow:0 10px 26px -12px rgba(0,0,0,.35);border-radius:3px}& .gp-shot:nth-child(odd){transform:rotate(-1.6deg)}& .gp-shot:nth-child(even){transform:rotate(1.4deg)}& .gp-cap{padding:.7rem 0 .9rem;text-align:center;font-size:.9rem}`)
  c(`& .gp-shot{position:relative;margin:0;overflow:hidden;${s.layout === 'polaroid' ? '' : `border-radius:${s.radius}px;`}${s.layout === 'masonry' ? `break-inside:avoid;margin-bottom:${gap};` : ''}${s.layout === 'wide' ? 'aspect-ratio:21/9;' : s.layout === 'mosaic' || s.layout === 'featured' ? '' : `aspect-ratio:${RATIO[s.ratio]};`}${s.caption === 'below' && s.layout !== 'polaroid' ? 'aspect-ratio:auto;' : ''}${s.hover === 'lift' ? 'transition:transform .25s ease;' : ''}}`)
  c(`& .gp-pic{display:block;width:100%;${s.caption === 'below' && s.layout !== 'polaroid' ? `aspect-ratio:${s.layout === 'wide' ? '21/9' : RATIO[s.ratio]};` : 'height:100%;'}object-fit:cover;${s.hover === 'zoom' ? 'transition:transform .5s ease;' : ''}${s.layout === 'masonry' ? 'height:auto;' : ''}}`)
  if (s.layout === 'masonry') c(`& .gp-shot:nth-child(3n+1) .gp-pic{aspect-ratio:3/4}& .gp-shot:nth-child(3n+2) .gp-pic{aspect-ratio:1/1}& .gp-shot:nth-child(3n) .gp-pic{aspect-ratio:4/5}`)
  if (s.hover === 'zoom') c(`& .gp-shot:hover .gp-pic{transform:scale(1.06)}`)
  if (s.hover === 'lift') c(`& .gp-shot:hover{transform:translateY(-5px)}`)
  const over = 'position:absolute;left:0;right:0;bottom:0;padding:2.2rem 1rem .9rem;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.65));font-size:.92rem;font-weight:600;'
  if (s.layout !== 'polaroid') {
    if (s.caption === 'overlay') c(`& .gp-cap{${over}}`)
    if (s.caption === 'hover') c(`& .gp-cap{${over}opacity:0;transform:translateY(8px);transition:opacity .25s ease,transform .25s ease}& .gp-shot:hover .gp-cap,& .gp-shot:focus-within .gp-cap{opacity:1;transform:none}@media (hover:none){.${p} .gp-cap{opacity:1;transform:none}}`)
    if (s.caption === 'below') c(`& .gp-cap{padding:.7rem .1rem 0;font-size:.92rem;font-weight:600;color:inherit}`)
    if (s.caption === 'none') c(`& .gp-cap{display:none}`)
  }
  css.push(...decorCss(p, s.decor, s.bg), ...arriveCss(p, s.arrives, '.gp-shot'))
  css.push(`@media (max-width:820px){.${p} .gp-shots{${s.layout === 'mosaic' ? 'grid-template-columns:repeat(2,1fr);' : s.layout === 'featured' ? 'grid-template-columns:repeat(2,1fr);' : ''}}.${p} .gp-shot{${s.layout === 'wide' ? 'aspect-ratio:4/3;' : ''}}.${p} .gp-shot:nth-child(n){${s.layout === 'mosaic' || s.layout === 'featured' ? 'grid-column:auto;grid-row:auto;' : ''}}}`)
  if (s.layout === 'mosaic') css.push(`@media (max-width:820px){.${p} .gp-shot:nth-child(1){grid-column:span 2}}`)
  return css.join('\n')
}

export function galleryTree(s: GallerySpec, p: string): Node {
  const shot = () => h('figure', { 'data-slot': 'shot', className: 'gp-shot' }, h('img', { 'data-slot': 'shot-image', className: 'gp-pic', alt: '', loading: 'lazy' }), h('figcaption', { 'data-slot': 'shot-caption', className: 'gp-cap' }, 'Caption'))
  return h('section', { 'data-ref': 'show-gallery', 'data-gen': 'gallery', className: p }, h('style', {}, galleryCss(s, p)), ...fxNode(s.decor), h('div', { className: 'gp-in' }, h('h2', { 'data-slot': 'title', className: 'gp-title' }, 'Title'), h('div', { className: 'gp-shots' }, ...[0, 1, 2, 3, 4, 5, 6, 7].map(shot))))
}

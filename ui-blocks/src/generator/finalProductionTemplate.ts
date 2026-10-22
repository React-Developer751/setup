// Turns theme + content + layout into a single-page website.
// Section markup is written once and rendered in two flavours: "html" (live preview) and
// "jsx" (the React file the user can copy/download), so the two can never drift apart.
import type { WebsiteContent } from './finalPrompt'
import { sectionOfLayout } from './edit/applyEdits'
import type { Target } from './edit/edits'
import { fitMarkup, type Fits } from './edit/fit'
import { paintMarkup, targetOfLayout, type Paints } from './edit/sectionColors'
import { art, logoMark, toJsx, type ArtKind } from './artBrain'
import { tierSwaps, type Tier } from './designBrain'
import { noMotion, type MotionFeatures, type MotionPlan } from './motionBrain'
import type { PageId, PagePlan, Post } from './siteTypes'
import { seededRandom } from './random'
import type { ColorMode, Theme, ThemeKey } from './themes'

export type LayoutId =
  | 'navbar-left'
  | 'navbar-center'
  | 'hero-split'
  | 'hero-split-reverse'
  | 'hero-centered'
  | 'features-cards'
  | 'features-list'
  | 'features-rows'
  | 'stats'
  | 'testimonial'
  | 'faq'
  | 'cta'
  | 'footer'
  // long-page sections
  | 'about-left'
  | 'about-right'
  | 'steps-grid'
  | 'steps-timeline'
  | 'gallery'
  | 'pricing'
  | 'team'
  | 'testimonials-grid'
  | 'blog'
  | 'contact'
  | 'footer-rich'
  // animated extras
  | 'marquee'
  | 'testimonials-carousel'
  // multi-page sites
  | 'page-header'
  | 'timeline'
  | 'map-block'
  | 'not-found'
  | 'legal-body'
  | 'blog-list'
  | 'post-body'
  | 'blog-related'

export type Mode = 'html' | 'jsx'

const esc = (s: string) =>
  // quotes too: the same text is also used inside attributes (action="mailto:...", aria-label="..."), where a quote would end the value
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')

/** wa.me link of a WhatsApp number: digits only; a 10 digit number is taken as Indian (+91) */
export const whatsappHref = (number: string, brand: string) => {
  const digits = number.replace(/\D/g, '').replace(/^0+/, '')
  const full = digits.length === 10 ? `91${digits}` : digits
  return `https://wa.me/${full}?text=${encodeURIComponent(`Hello ${brand}`)}`
}

/** the round WhatsApp button in the corner of every page, when the person gave a number */
const WHATSAPP_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'
const whatsappButton = (c: WebsiteContent, k: string) =>
  c.contact.whatsapp
    ? `\n<a href="${esc(whatsappHref(c.contact.whatsapp, c.brandName))}" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" ${k}="fixed bottom-5 left-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-105"><svg ${k === 'className' ? 'className="size-7"' : 'class="size-7"'} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${WHATSAPP_PATH}"></path></svg></a>`
    : ''

const sentence = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

/** Adds animation hooks to the markup. Every method returns '' when that kind of motion is switched off. */
type Fx = 'lift' | 'press' | 'float' | 'floatSlow' | 'gradient' | 'shimmer' | 'glow'
type Motion = {
  /** data-reveal / data-delay attributes (leading space included) */
  rv: (kind?: string, delay?: number) => string
  /** extra CSS class (leading space included) */
  fx: (name: Fx) => string
  /** `text` only when the given feature is on */
  on: (feature: keyof MotionFeatures, text: string) => string
}

const FX_FEATURE: Record<Fx, { feature: keyof MotionFeatures; className: string }> = {
  lift: { feature: 'hover', className: 'm-lift' },
  press: { feature: 'hover', className: 'm-press' },
  float: { feature: 'blobs', className: 'm-float' },
  floatSlow: { feature: 'blobs', className: 'm-float-slow' },
  gradient: { feature: 'blobs', className: 'm-gradient' },
  shimmer: { feature: 'shimmer', className: 'm-shimmer' },
  glow: { feature: 'shimmer', className: 'm-glow' },
}

const makeMotion = (plan: MotionPlan): Motion => ({
  rv: (kind = 'up', delay = 0) => (plan.features.reveal ? ` data-reveal="${kind}"${delay ? ` data-delay="${Math.min(delay, 8)}"` : ''}` : ''),
  fx: (name) => (plan.features[FX_FEATURE[name].feature] ? ` ${FX_FEATURE[name].className}` : ''),
  on: (feature, text) => (plan.features[feature] ? text : ''),
})

type Ctx = {
  t: Theme
  c: WebsiteContent
  k: string
  m: Motion
  mode: Mode
  /** true on the long page (has its own contact section) */
  full: boolean
  links: { href: string; label: string }[]
  /** set when the markup belongs to a multi-page site */
  site?: { pages: PagePlan[]; current: string }
  /** heading data of the page being rendered (multi-page sites) */
  page?: PageInfo
  /** the blog: every post, and the one this page shows (post pages) */
  posts?: Post[]
  post?: Post
  /** what the pictures are drawn from; without it the page has no drawn pictures */
  v?: Visuals
  /** true when the page being made has a block that starts with this text ("pricing", "gallery" ...) */
  has: (prefix: string) => boolean
}

/** The business type and a number that makes this site's pictures different from other sites'. */
export type Visuals = { themeKey: ThemeKey; seed: number }

export type PageInfo = {
  id: string
  title: string
  subtitle: string
  label: string
  crumbs: { label: string; href?: string }[]
  headerStyle: 'center' | 'left'
}

// ───────────── multi-page helpers ─────────────
/** "/blog/some-post" highlights the "Blog" link */
const activePath = (path: string) => (path.startsWith('/blog/') ? '/blog' : path)

/** aria-current for the link to `href`: a literal in the preview, an expression in the React export (Layout has `active`) */
const currentAttr = (ctx: Ctx, href: string) => {
  if (!ctx.site) return ''
  const target = href.replace(/^#/, '')
  if (ctx.mode === 'jsx') return ` aria-current={active === '${target}' ? 'page' : undefined}`
  return activePath(ctx.site.current) === target ? ' aria-current="page"' : ''
}

// the in-page anchors the single-page templates use, and the page that replaces each of them
const ANCHOR_ROUTE: Record<string, PageId> = {
  home: 'home', about: 'about', features: 'services', services: 'services', pricing: 'pricing',
  team: 'team', gallery: 'gallery', blog: 'blog', faq: 'faq', contact: 'contact', privacy: 'privacy', terms: 'terms',
}
// where a link goes when the site has no page for it
const ROUTE_FALLBACK: Record<PageId, PageId> = {
  home: 'home', about: 'home', services: 'home', contact: 'home', pricing: 'contact', team: 'about', gallery: 'home', blog: 'home', faq: 'contact', privacy: 'home', terms: 'home',
}

/** Turns href="#contact" style anchors into the site's own routes (href="#/contact"). */
function routeLinks(html: string, pages: PagePlan[]) {
  const paths = new Map(pages.map((p) => [p.id, p.path]))
  return html.replace(/href="#([a-z]+)"/g, (match, name: string) => {
    const id = ANCHOR_ROUTE[name]
    if (!id) return match
    return `href="#${paths.get(id) ?? paths.get(ROUTE_FALLBACK[id]) ?? '/'}"`
  })
}

// Tailwind only generates classes it can see written out in full, so every direction is listed here.
const GRADIENT_DIRECTIONS = ['bg-linear-to-br', 'bg-linear-to-tr', 'bg-linear-to-bl', 'bg-linear-to-tl']
export const gradientAt = (gradient: string, i: number) => gradient.replace('bg-linear-to-br', GRADIENT_DIRECTIONS[i % 4])

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

/**
 * A static page cannot store a message, so the form hands it to the visitor's email program (mailto:).
 * It works anywhere with no server; connect a form service later by changing the action address.
 */
const formTag = ({ k, c }: Ctx, cls: string, extra = '') =>
  `<form action="mailto:${esc(c.contact.email)}" method="post" enctype="text/plain" ${k}="${cls}"${extra}>`

const inputClass = ({ t }: Ctx) =>
  `w-full ${t.surface} ${t.border} ${t.radius} border px-4 py-3 text-sm ${t.text_main} placeholder:text-gray-400 focus:outline-none`

const check = ({ t, k }: Ctx) =>
  `<span ${k}="${t.badge} flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">&#10003;</span>`


// ───────────── shared pieces ─────────────
const navLinks = (ctx: Ctx, gap: string) =>
  ctx.links
    .map((l) => `<a href="${l.href}"${currentAttr(ctx, l.href)} ${ctx.k}="${ctx.t.hover_accent} whitespace-nowrap transition ${gap}">${l.label}</a>`)
    .join('\n        ')

// ───────────── drawn pictures (see artBrain.ts) ─────────────
/** One picture, as markup in the preview and as JSX in the React export. '' when the page has no `visuals`. */
export const picture = (ctx: Ctx, kind: ArtKind, n = 0) => {
  // a real photo (from the photo search or an upload) wins over the drawing
  const photos = ctx.c.photos
  const photo = kind === 'hero' ? photos?.hero : kind === 'about' ? photos?.about : kind === 'tile' && photos?.gallery?.length ? photos.gallery[n % photos.gallery.length] : undefined
  if (photo) {
    const alt = kind === 'tile' ? (ctx.c.gallery.captions[n] ?? ctx.c.brandName) : kind === 'about' ? `${ctx.c.brandName}: ${ctx.c.about.title}` : ctx.c.brandName
    return `<img src="${esc(photo)}" alt="${esc(alt)}" loading="${kind === 'hero' ? 'eager' : 'lazy'}" decoding="async" ${ctx.k}="absolute inset-0 size-full object-cover" />`
  }
  if (!ctx.v) return ''
  // covers must look the same on every page (the React export keeps one COVER_ART list); other pictures differ per page
  const where = ctx.site && kind !== 'cover' ? [...ctx.site.current].reduce((h, ch) => h + ch.charCodeAt(0), 0) : 0
  const svg = art(kind, ctx.v.themeKey, seededRandom(ctx.v.seed + kind.length * 131 + n * 7919 + where * 31), n)
  return ctx.mode === 'jsx' ? toJsx(svg) : svg
}

/** The article cover with number `n`, as JSX (the React export lists a few of them and picks one per article). */
export const coverJsx = (v: Visuals, n: number) => toJsx(art('cover', v.themeKey, seededRandom(v.seed + 'cover'.length * 131 + n * 7919), n))

/** The brand's round mark, the same on every page. */
const logo = (ctx: Ctx, size = 32) => {
  if (!ctx.v) return ''
  const svg = logoMark(ctx.v.themeKey, ctx.c.brandName, seededRandom(ctx.v.seed + 17), size)
  return ctx.mode === 'jsx' ? toJsx(svg) : svg
}

const heroText = ({ t, c, k, m }: Ctx, align: string, buttons: string) => `
          <span ${k}="${t.badge} inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"${m.rv('fade')}>${esc(sentence(c.subject) || c.brandName)}</span>
          <h1 ${k}="text-4xl font-extrabold break-words ${t.heading} md:text-5xl lg:text-6xl ${t.text_main}"${m.on('split', ' data-split') || m.rv('up', 1)}>
            ${esc(c.hero.title)}
          </h1>
          <p ${k}="text-lg ${t.text_muted} ${align}"${m.rv('up', 2)}>
            ${esc(c.hero.subtitle)}
          </p>
          <div ${k}="flex flex-wrap gap-3 ${buttons}"${m.rv('up', 3)}>
            <a href="#contact" ${k}="${t.primary_btn} ${t.radius} px-6 py-3 font-medium transition${m.fx('shimmer')}${m.fx('press')}">${esc(c.hero.button)}</a>
            <a href="#features" ${k}="${t.secondary_btn} ${t.radius} px-6 py-3 font-medium transition${m.fx('press')}">${esc(c.labels?.learnMore ?? 'Learn more')}</a>
          </div>`

const heroVisual = (ctx: Ctx, order: string) => {
  const { t, c, k, m } = ctx
  return `
        <div ${k}="${t.gradient}${m.fx('gradient')} ${t.border} ${t.radius} relative h-64 overflow-hidden border md:h-96 ${order}"${m.rv('scale', 2)}>
          ${picture(ctx, 'hero')}
          <div ${k}="absolute -right-10 -top-10 size-48 rounded-full bg-white/20 blur-2xl${m.fx('float')}"></div>
          <div ${k}="absolute -bottom-12 -left-8 size-56 rounded-full bg-black/20 blur-2xl${m.fx('floatSlow')}"></div>
          <div ${k}="${t.surface} ${t.border} ${t.radius} absolute bottom-6 left-6 border px-5 py-4 shadow-xl">
            <div ${k}="text-xs ${t.text_muted}">${esc(c.labels?.welcome ?? 'Welcome to')}</div>
            <div ${k}="text-lg font-bold ${t.text_main}">${esc(c.brandName)}</div>
          </div>
        </div>`
}

const sectionTitle = ({ t, k, m }: Ctx, text: string, align = 'text-center') =>
  `<h2 ${k}="mb-12 text-2xl font-bold sm:text-3xl break-words ${t.heading} md:text-4xl ${t.text_main} ${align}"${m.rv('up')}>${esc(text)}</h2>`

const numberBadge = ({ t, k }: Ctx, n: number) =>
  `<div ${k}="${t.badge} flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">${n}</div>`

const aboutSection = (ctx: Ctx, order: string) => {
  const { t, c, k, m } = ctx
  return `
    <section id="about" ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12">
      <div ${k}="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2">
        <div ${k}="${t.gradient} ${t.border} ${t.radius} relative flex h-72 items-end overflow-hidden border p-6 md:h-96 ${order}"${m.rv('scale')}>
          ${picture(ctx, 'about')}
          <div ${k}="absolute -right-10 -top-10 size-48 rounded-full bg-white/20 blur-2xl${m.fx('float')}"></div>
          <div ${k}="${t.surface} ${t.border} ${t.radius} relative border px-5 py-4 shadow-xl">
            <div ${k}="text-xs ${t.text_muted}">Our story</div>
            <div ${k}="text-lg font-bold ${t.text_main}">${esc(c.brandName)}</div>
          </div>
        </div>
        <div ${k}="space-y-5"${m.rv('up', 1)}>
          <h2 ${k}="text-2xl font-bold sm:text-3xl ${t.heading} md:text-4xl ${t.text_main}">${esc(c.about.title)}</h2>${c.about.paragraphs
            .map((p) => `
          <p ${k}="${t.text_muted}">${esc(p)}</p>`)
            .join('')}
          <ul ${k}="space-y-3">${c.about.points
            .map((pt) => `
            <li ${k}="flex items-center gap-3 ${t.text_main}">${check(ctx)}${esc(pt)}</li>`)
            .join('')}
          </ul>
        </div>
      </div>
    </section>`
}

// ───────────── theme toggle + mobile menu ─────────────
const svgAttrs = (k: string) =>
  k === 'className'
    ? 'viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"'
    : 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'

const sunIcon = (k: string) =>
  `<svg ${k}="size-5" ${svgAttrs(k)}><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>`
const moonIcon = (k: string) => `<svg ${k}="size-5" ${svgAttrs(k)}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>`
const menuIcon = (k: string) => `<svg ${k}="size-5" ${svgAttrs(k)}><path d="M4 6h16M4 12h16M4 18h16"></path></svg>`

/**
 * Light / dark switch. In the JSX file it flips a React state; in the live preview it carries a
 * data attribute that the preview flips (both icons are rendered, CSS shows the right one).
 */
const themeToggle = ({ t, k, mode }: Ctx, extra = '') => {
  const cls = `${t.border} ${t.text_main} flex size-9 shrink-0 items-center justify-center rounded-full border transition hover:bg-(--g-surface) ${extra}`
  return mode === 'jsx'
    ? `<button type="button" aria-label="Toggle dark mode" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} ${k}="${cls}">{mode === 'dark' ? (${sunIcon(k)}) : (${moonIcon(k)})}</button>`
    : `<button type="button" aria-label="Toggle dark mode" data-theme-toggle ${k}="${cls}"><span ${k}="g-sun">${sunIcon(k)}</span><span ${k}="g-moon">${moonIcon(k)}</span></button>`
}

/** Hamburger menu for small screens: a plain <details>, no JavaScript needed. */
const mobileMenu = (ctx: Ctx) => {
  const { t, c, k, mode, links } = ctx
  const close = mode === 'jsx' ? ` onClick={(e) => e.currentTarget.parentElement?.removeAttribute('open')}` : ''
  return `<details data-menu ${k}="relative lg:hidden">
          <summary aria-label="Open menu" ${k}="${t.border} ${t.text_main} flex size-9 cursor-pointer list-none items-center justify-center rounded-full border [&::-webkit-details-marker]:hidden">${menuIcon(k)}</summary>
          <div${close} ${k}="${t.surface} ${t.border} ${t.radius} absolute right-0 top-full z-50 mt-3 flex w-56 flex-col gap-1 border p-3 shadow-xl">${links
            .map((l) => `
            <a href="${l.href}"${currentAttr(ctx, l.href)} ${k}="${t.text_main} ${t.radius} px-3 py-2 transition hover:bg-(--g-bg)">${l.label}</a>`)
            .join('')}
            <a href="#contact" ${k}="${t.primary_btn} ${t.radius} mt-1 px-3 py-2 text-center font-medium transition">${esc(c.hero.button)}</a>
          </div>
        </details>`
}


// ───────────── blog posts: literal values in the preview, data.ts + .map in the React export ─────────────
type PostField = 'title' | 'tag' | 'excerpt' | 'author' | 'role' | 'date' | 'readTime'

/** How to write one field of a post: its text in the preview, a `{post.field}` expression in the React export. */
const postFields = (ctx: Ctx, post: Post | undefined) => ({
  f: (field: PostField) => (ctx.mode === 'jsx' ? `{post.${field}}` : esc(String(post?.[field] ?? ''))),
  href: ctx.mode === 'jsx' ? 'href={`#/blog/${post.slug}`}' : `href="#/blog/${post?.slug ?? ''}"`,
  key: ctx.mode === 'jsx' ? ' key={post.slug}' : '',
})

/** The card gradient: fixed in the preview, picked from the page's COVERS list in the React export. */
const coverClass = (ctx: Ctx, index: string, extra: string) =>
  ctx.mode === 'jsx'
    ? `${ctx.k}={\`${extra} relative overflow-hidden \${COVERS[${index} % COVERS.length]}\`}`
    : `${ctx.k}="${extra} relative overflow-hidden ${gradientAt(ctx.t.gradient, Number(index))}"`

/** The drawing on a cover: fixed in the preview, picked from the page's COVER_ART list in the React export. */
const coverArt = (ctx: Ctx, index: string) => (ctx.mode === 'jsx' ? `{COVER_ART[${index} % COVER_ART.length]}` : picture(ctx, 'cover', Number(index)))

/** Staggered reveal for a list item whose index is only known at run time in the React export. */
const revealAt = (ctx: Ctx, index: string) => {
  if (!ctx.m.rv()) return ''
  return ctx.mode === 'jsx' ? ` data-reveal="up" data-delay={(${index} % 4) + 1}` : ctx.m.rv('up', (Number(index) % 4) + 1)
}

const initialsOf = (ctx: Ctx, post: Post | undefined) =>
  ctx.mode === 'jsx'
    ? "{post.author.split(' ').map((w) => w[0]).join('').slice(0, 2)}"
    : (post?.author ?? '').split(' ').map((w) => w[0]).join('').slice(0, 2)

const postCard = (ctx: Ctx, post: Post | undefined, index: string) => {
  const { t, k, m } = ctx
  const { f, href, key } = postFields(ctx, post)
  return `
          <a${key} ${href} ${k}="${t.surface} ${t.border} ${t.radius} group flex flex-col overflow-hidden border${m.fx('lift')}"${revealAt(ctx, index)}>
            <div ${coverClass(ctx, index, 'h-44')}>${coverArt(ctx, index)}</div>
            <div ${k}="flex flex-1 flex-col space-y-3 p-6">
              <div ${k}="flex items-center gap-3 text-xs ${t.text_muted}"><span ${k}="${t.badge} rounded-full px-3 py-1 font-semibold">${f('tag')}</span><span>${f('date')}</span></div>
              <h3 ${k}="text-lg font-semibold ${t.text_main}">${f('title')}</h3>
              <p ${k}="flex-1 text-sm ${t.text_muted}">${f('excerpt')}</p>
              <div ${k}="flex items-center justify-between text-xs ${t.text_muted}"><span>${f('author')}</span><span>${f('readTime')}</span></div>
            </div>
          </a>`
}

const featuredPost = (ctx: Ctx, post: Post | undefined) => {
  const { t, k, m } = ctx
  const { f, href, key } = postFields(ctx, post)
  return `
        <a${key} ${href} ${k}="${t.surface} ${t.border} ${t.radius} group grid overflow-hidden border md:grid-cols-2${m.fx('lift')}"${m.rv('scale')}>
          <div ${coverClass(ctx, '9', 'min-h-56 md:min-h-72')}>${coverArt(ctx, '9')}</div>
          <div ${k}="flex flex-col justify-center space-y-4 p-8 md:p-10">
            <div ${k}="flex items-center gap-3 text-xs ${t.text_muted}"><span ${k}="${t.badge} rounded-full px-3 py-1 font-semibold">${f('tag')}</span><span>${f('date')}</span></div>
            <h2 ${k}="text-2xl font-bold break-words ${t.heading} md:text-3xl ${t.text_main}">${f('title')}</h2>
            <p ${k}="${t.text_muted}">${f('excerpt')}</p>
            <div ${k}="text-sm ${t.text_muted}"><span ${k}="font-semibold ${t.text_main}">${f('author')}</span> &middot; ${f('readTime')}</div>
          </div>
        </a>`
}

/** Related posts: the three other posts. */
const relatedCards = (ctx: Ctx) => {
  const { posts = [], post, mode } = ctx
  if (mode === 'jsx') return `{posts.filter((p) => p.slug !== post.slug).slice(0, 3).map((post, i) => (${postCard(ctx, undefined, 'i')}\n          ))}`
  return posts
    .filter((p) => p.slug !== post?.slug)
    .slice(0, 3)
    .map((p, i) => postCard(ctx, p, String(i)))
    .join('')
}

// ───────────── sections ─────────────
const sections: Record<LayoutId, (ctx: Ctx) => string> = {
  'navbar-left': (ctx) => {
    const { t, c, k, m } = ctx
    return `
    <nav ${k}="${t.bg} ${t.font} ${t.border} sticky top-0 z-50 flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur sm:px-6 md:px-12">
      <a href="#home" ${k}="flex min-w-0 items-center gap-2.5 text-xl font-bold ${t.accent}">${logo(ctx)}<span ${k}="truncate">${esc(c.brandName)}</span></a>
      <div ${k}="hidden space-x-6 whitespace-nowrap lg:flex ${t.text_muted}">
        ${navLinks(ctx, '')}
      </div>
      <div ${k}="flex items-center gap-2">
        ${themeToggle(ctx)}
        <a href="#contact" ${k}="${t.primary_btn} ${t.radius} hidden px-4 py-2 text-sm font-medium transition sm:inline-block${m.fx('press')}">
          ${esc(c.hero.button)}
        </a>
        ${mobileMenu(ctx)}
      </div>
    </nav>`
  },

  'navbar-center': (ctx) => {
    const { t, c, k } = ctx
    return `
    <nav ${k}="${t.bg} ${t.font} ${t.border} sticky top-0 z-50 flex flex-col items-center gap-3 border-b px-6 py-4 backdrop-blur">
      <a href="#home" ${k}="flex items-center gap-3 text-2xl font-bold ${t.heading} ${t.accent}">${logo(ctx, 36)}${esc(c.brandName)}</a>
      <div ${k}="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm ${t.text_muted}">
        ${navLinks(ctx, '')}
      </div>
      ${themeToggle(ctx, 'absolute right-4 top-3')}
    </nav>`
  },

  'hero-split': (ctx) => {
    const { t, k } = ctx
    return `
    <section id="home" ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12 md:py-28">
      <div ${k}="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2">
        <div ${k}="space-y-6 text-center md:text-left">${heroText(ctx, '', 'justify-center md:justify-start')}
        </div>${heroVisual(ctx, '')}
      </div>
    </section>`
  },

  'hero-split-reverse': (ctx) => {
    const { t, k } = ctx
    return `
    <section id="home" ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12 md:py-28">
      <div ${k}="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2">
        <div ${k}="space-y-6 text-center md:order-last md:text-right">${heroText(ctx, '', 'justify-center md:justify-end')}
        </div>${heroVisual(ctx, 'md:order-first')}
      </div>
    </section>`
  },

  'hero-centered': (ctx) => {
    const { t, k, m } = ctx
    return `
    <section id="home" ${k}="${t.bg} ${t.font} relative isolate overflow-hidden px-6 py-24 text-center md:px-12 md:py-32">${ctx.c.photos?.hero ? `
      <img src="${esc(ctx.c.photos.hero)}" alt="${esc(ctx.c.brandName)}" decoding="async" ${k}="absolute inset-0 -z-10 size-full object-cover opacity-30" />` : ''}
      <div ${k}="${t.gradient}${m.fx('gradient')} mx-auto max-w-4xl rounded-3xl p-1"${m.rv('scale')}>
        <div ${k}="${t.bg} space-y-6 rounded-3xl px-6 py-14 md:px-16">${heroText(ctx, 'mx-auto max-w-2xl', 'justify-center')}
        </div>
      </div>
    </section>`
  },

  'features-cards': (ctx) => {
    const { t, c, k, m } = ctx
    return `
    <section id="features" ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12">
      <div ${k}="mx-auto max-w-6xl">
        ${sectionTitle(ctx, c.features.title)}
        <div ${k}="grid grid-cols-1 gap-6 md:grid-cols-3">${c.features.items
          .map(
            (item, i) => `
          <div ${k}="${t.surface} ${t.border} ${t.radius} border p-8${m.fx('lift')}"${m.rv('up', (i % 3) + 1)}>
            <div ${k}="mb-5">${numberBadge(ctx, i + 1)}</div>
            <h3 ${k}="mb-2 text-xl font-semibold ${t.text_main}">${esc(item.title)}</h3>
            <p ${k}="${t.text_muted}">${esc(item.text)}</p>
          </div>`,
          )
          .join('')}
        </div>
      </div>
    </section>`
  },

  'features-list': (ctx) => {
    const { t, c, k, m } = ctx
    return `
    <section id="features" ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12">
      <div ${k}="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-3">
        <div ${k}="md:col-span-1">
          <h2 ${k}="text-2xl font-bold sm:text-3xl ${t.heading} md:text-4xl ${t.text_main}">${esc(c.features.title)}</h2>
          <p ${k}="mt-4 ${t.text_muted}">${esc(sentence(c.subject) || c.brandName)}</p>
        </div>
        <div ${k}="md:col-span-2">${c.features.items
          .map(
            (item, i) => `
          <div ${k}="${t.border} flex gap-5 border-b py-6 first:pt-0 last:border-b-0"${m.rv('up', (i % 4) + 1)}>
            ${numberBadge(ctx, i + 1)}
            <div>
              <h3 ${k}="mb-1 text-xl font-semibold ${t.text_main}">${esc(item.title)}</h3>
              <p ${k}="${t.text_muted}">${esc(item.text)}</p>
            </div>
          </div>`,
          )
          .join('')}
        </div>
      </div>
    </section>`
  },

  'features-rows': (ctx) => {
    const { t, c, k, m } = ctx
    return `
    <section id="features" ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12">
      <div ${k}="mx-auto max-w-5xl">
        ${sectionTitle(ctx, c.features.title)}
        <div ${k}="space-y-12">${c.features.items
          .slice(0, 4)
          .map(
            (item, i) => `
          <div ${k}="flex flex-col items-center gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}"${m.rv('up')}>
            <div ${k}="${t.gradient}${m.fx('gradient')} ${t.border} ${t.radius} flex h-44 w-full items-center justify-center border text-6xl font-extrabold ${t.text_main} md:w-1/2">${i + 1}</div>
            <div ${k}="md:w-1/2">
              <h3 ${k}="mb-2 text-2xl font-semibold ${t.text_main}">${esc(item.title)}</h3>
              <p ${k}="${t.text_muted}">${esc(item.text)}</p>
            </div>
          </div>`,
          )
          .join('')}
        </div>
      </div>
    </section>`
  },

  stats: ({ t, c, k, m }) => `
    <section ${k}="${t.surface} ${t.font} ${t.border} border-y px-6 py-14 md:px-12">
      <div ${k}="mx-auto grid max-w-5xl grid-cols-1 gap-8 text-center sm:grid-cols-3">${c.stats
        .map(
          (s, i) => `
        <div${m.rv('up', i + 1)}>
          <div ${k}="text-4xl font-extrabold ${t.heading} ${t.accent}"${m.on('countUp', ' data-count')}>${esc(s.value)}</div>
          <div ${k}="mt-1 text-sm ${t.text_muted}">${esc(s.label)}</div>
        </div>`,
        )
        .join('')}
      </div>
    </section>`,

  testimonial: ({ t, c, k, m }) => `
    <section ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12">
      <figure ${k}="${t.surface} ${t.border} ${t.radius} mx-auto max-w-3xl border px-8 py-12 text-center"${m.rv('scale')}>
        <div ${k}="text-5xl font-serif leading-none ${t.accent}">&ldquo;</div>
        <blockquote ${k}="mt-2 text-xl font-medium ${t.text_main} md:text-2xl">${esc(c.testimonial.quote)}</blockquote>
        <figcaption ${k}="mt-6 text-sm ${t.text_muted}">
          <span ${k}="font-semibold ${t.text_main}">${esc(c.testimonial.author)}</span>, ${esc(c.testimonial.role)}
        </figcaption>
      </figure>
    </section>`,

  faq: (ctx) => {
    const { t, c, k, m } = ctx
    return `
    <section id="faq" ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12">
      <div ${k}="mx-auto max-w-3xl">
        ${sectionTitle(ctx, c.titles?.faq ?? 'Questions? Answers.')}
        <div ${k}="space-y-3">${c.faq
          .map(
            (item, i) => `
          <details ${k}="${t.surface} ${t.border} ${t.radius} border px-6 py-4"${m.rv('up', (i % 4) + 1)}>
            <summary ${k}="cursor-pointer font-semibold ${t.text_main}">${esc(item.q)}</summary>
            <p ${k}="mt-3 ${t.text_muted}">${esc(item.a)}</p>
          </details>`,
          )
          .join('')}
        </div>
      </div>
    </section>`
  },

  cta: ({ t, c, k, m, full }) => `
    <section${full ? '' : ' id="contact"'} ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12">
      <div ${k}="${t.gradient}${m.fx('gradient')} ${t.radius} mx-auto max-w-4xl space-y-6 px-6 py-16 text-center"${m.rv('scale')}>
        <h2 ${k}="text-2xl font-bold sm:text-3xl ${t.heading} md:text-4xl ${t.text_main}">${esc(c.cta.title)}</h2>
        <a href="${full ? '#pricing' : '#home'}" ${k}="${t.primary_btn} ${t.radius} inline-block px-8 py-3 font-medium transition${m.fx('shimmer')}${m.fx('press')}">${esc(c.cta.button)}</a>
      </div>
    </section>`,

  'about-left': (ctx) => aboutSection(ctx, ''),
  'about-right': (ctx) => aboutSection(ctx, 'md:order-last'),

  'steps-grid': (ctx) => {
    const { t, c, k, m } = ctx
    return `
    <section ${k}="${t.surface} ${t.font} ${t.border} border-y px-6 py-20 md:px-12">
      <div ${k}="mx-auto max-w-6xl">
        ${sectionTitle(ctx, c.steps.title)}
        <div ${k}="grid grid-cols-1 gap-8 md:grid-cols-3">${c.steps.items
          .map(
            (item, i) => `
          <div ${k}="text-center"${m.rv('up', i + 1)}>
            <div ${k}="text-6xl font-extrabold ${t.heading} ${t.accent}">0${i + 1}</div>
            <h3 ${k}="mt-3 text-xl font-semibold ${t.text_main}">${esc(item.title)}</h3>
            <p ${k}="mt-2 ${t.text_muted}">${esc(item.text)}</p>
          </div>`,
          )
          .join('')}
        </div>
      </div>
    </section>`
  },

  'steps-timeline': (ctx) => {
    const { t, c, k, m } = ctx
    return `
    <section ${k}="${t.surface} ${t.font} ${t.border} border-y px-6 py-20 md:px-12">
      <div ${k}="mx-auto max-w-3xl">
        ${sectionTitle(ctx, c.steps.title)}
        <div>${c.steps.items
          .map(
            (item, i) => `
          <div ${k}="flex gap-5"${m.rv('up', i + 1)}>
            <div ${k}="flex flex-col items-center">
              ${numberBadge(ctx, i + 1)}
              <div ${k}="${t.border} w-px flex-1 border-s ${i === c.steps.items.length - 1 ? 'opacity-0' : ''}"${m.on('draw', ' data-draw')}></div>
            </div>
            <div ${k}="pb-10">
              <h3 ${k}="text-xl font-semibold ${t.text_main}">${esc(item.title)}</h3>
              <p ${k}="mt-1 ${t.text_muted}">${esc(item.text)}</p>
            </div>
          </div>`,
          )
          .join('')}
        </div>
      </div>
    </section>`
  },

  gallery: (ctx) => {
    const { t, c, k, m } = ctx
    return `
    <section id="gallery" ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12">
      <div ${k}="mx-auto max-w-6xl">
        ${sectionTitle(ctx, c.gallery.title)}
        <div ${k}="grid grid-cols-2 gap-4 md:grid-cols-4">${c.gallery.captions
          .map(
            (caption, i) => `
          <div ${k}="${gradientAt(t.gradient, i)} ${t.border} ${t.radius} relative flex h-40 items-end overflow-hidden border p-3 md:h-52 ${i % 6 === 0 || i % 6 === 5 ? 'md:col-span-2' : ''}${m.fx('lift')}"${m.rv('scale', (i % 4) + 1)}>
            ${picture(ctx, 'tile', i)}
            <div ${k}="absolute -right-6 -top-6 size-24 rounded-full bg-white/20 blur-xl"></div>
            <span ${k}="${t.surface} ${t.text_main} ${t.radius} relative px-3 py-1 text-xs font-semibold shadow">${esc(caption)}</span>
          </div>`,
          )
          .join('')}
        </div>
      </div>
    </section>`
  },

  pricing: (ctx) => {
    const { t, c, k, m } = ctx
    return `
    <section id="pricing" ${k}="${t.surface} ${t.font} ${t.border} border-y px-6 py-20 md:px-12">
      <div ${k}="mx-auto max-w-6xl">
        ${sectionTitle(ctx, c.pricing.title)}
        <div ${k}="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">${c.pricing.plans
          .map((plan, i) => {
            const popular = i === 1
            return `
          <div ${k}="${popular ? `${t.gradient} md:scale-105${m.fx('glow')}` : t.bg} ${t.border} ${t.radius} relative flex flex-col border p-8${m.fx('lift')}"${m.rv('up', i + 1)}>${
            popular
              ? `
            <span ${k}="${t.primary_btn} absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold">Popular</span>`
              : ''
          }
            <h3 ${k}="text-lg font-semibold ${t.text_main}">${esc(plan.name)}</h3>
            <div ${k}="mt-4 flex items-baseline gap-1">
              <span ${k}="text-4xl font-extrabold ${t.heading} ${t.text_main}">${esc(plan.price)}</span>
              <span ${k}="text-sm ${t.text_muted}">${/^[a-z]/i.test(plan.period) ? '&nbsp;' : ''}${esc(plan.period)}</span>
            </div>
            <ul ${k}="my-6 flex-1 space-y-3">${plan.perks
              .map((perk) => `
              <li ${k}="flex items-center gap-3 text-sm ${t.text_main}">${check(ctx)}${esc(perk)}</li>`)
              .join('')}
            </ul>
            <a href="#contact" ${k}="${popular ? t.primary_btn : t.secondary_btn} ${t.radius} block px-6 py-3 text-center font-medium transition">${esc(c.hero.button)}</a>
          </div>`
          })
          .join('')}
        </div>
      </div>
    </section>`
  },

  team: (ctx) => {
    const { t, c, k, m } = ctx
    return `
    <section id="team" ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12">
      <div ${k}="mx-auto max-w-5xl">
        ${sectionTitle(ctx, c.team.title)}
        <div ${k}="grid grid-cols-1 gap-8 sm:grid-cols-3">${c.team.members
          .map(
            (member, i) => `
          <div ${k}="text-center${m.fx('lift')}"${m.rv('up', i + 1)}>
            <div ${k}="${gradientAt(t.gradient, i)} ${t.text_main} mx-auto flex size-28 items-center justify-center rounded-full text-2xl font-bold sm:text-3xl">${esc(initials(member.name))}</div>
            <h3 ${k}="mt-4 text-lg font-semibold ${t.text_main}">${esc(member.name)}</h3>
            <p ${k}="text-sm ${t.text_muted}">${esc(member.role)}</p>${member.bio ? `
            <p ${k}="mt-2 text-sm ${t.text_muted}">${esc(member.bio)}</p>` : ''}
          </div>`,
          )
          .join('')}
        </div>
      </div>
    </section>`
  },

  'testimonials-grid': (ctx) => {
    const { t, c, k, m } = ctx
    return `
    <section ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12">
      <div ${k}="mx-auto max-w-6xl">
        ${sectionTitle(ctx, c.titles?.testimonials ?? 'Loved by our customers')}
        <div ${k}="grid grid-cols-1 gap-6 md:grid-cols-3">${c.testimonials
          .map(
            (q, i) => `
          <figure ${k}="${t.surface} ${t.border} ${t.radius} flex flex-col border p-8${m.fx('lift')}"${m.rv('up', i + 1)}>
            <div ${k}="text-4xl font-serif leading-none ${t.accent}">&ldquo;</div>
            <blockquote ${k}="mt-2 flex-1 ${t.text_main}">${esc(q.quote)}</blockquote>
            <figcaption ${k}="mt-6 text-sm ${t.text_muted}">
              <span ${k}="font-semibold ${t.text_main}">${esc(q.author)}</span>, ${esc(q.role)}
            </figcaption>
          </figure>`,
          )
          .join('')}
        </div>
      </div>
    </section>`
  },

  blog: (ctx) => {
    const { t, c, k, m } = ctx
    return `
    <section id="blog" ${k}="${t.surface} ${t.font} ${t.border} border-y px-6 py-20 md:px-12">
      <div ${k}="mx-auto max-w-6xl">
        ${sectionTitle(ctx, c.blog.title)}
        <div ${k}="grid grid-cols-1 gap-6 md:grid-cols-3">${c.blog.posts
          .map(
            (post, i) => `
          <article ${k}="${t.bg} ${t.border} ${t.radius} overflow-hidden border${m.fx('lift')}"${m.rv('up', i + 1)}>
            <div ${k}="${gradientAt(t.gradient, i + 1)}${m.fx('gradient')} relative h-40 overflow-hidden">${picture(ctx, 'cover', i + 1)}</div>
            <div ${k}="space-y-3 p-6">
              <span ${k}="${t.badge} inline-block rounded-full px-3 py-1 text-xs font-semibold">${esc(post.tag)}</span>
              <h3 ${k}="text-lg font-semibold ${t.text_main}">${esc(post.title)}</h3>
              <a href="${post.slug ? `#/blog/${post.slug}` : '#blog'}" ${k}="${t.accent} inline-block text-sm font-medium">Read more &rarr;</a>
            </div>
          </article>`,
          )
          .join('')}
        </div>
      </div>
    </section>`
  },

  contact: (ctx) => {
    const { t, c, k, m } = ctx
    const info = [
      { label: 'Email', value: c.contact.email },
      { label: 'Phone', value: c.contact.phone },
      ...(c.contact.whatsapp ? [{ label: 'WhatsApp', value: c.contact.whatsapp }] : []),
      { label: 'Address', value: c.contact.address },
      ...(c.contact.hoursText ? [{ label: 'Hours', value: c.contact.hoursText }] : []),
    ]
    return `
    <section id="contact" ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12">
      <div ${k}="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-2">
        <div ${k}="space-y-6"${m.rv('up')}>
          <h2 ${k}="text-2xl font-bold sm:text-3xl ${t.heading} md:text-4xl ${t.text_main}">${esc(c.contact.title)}</h2>
          <p ${k}="${t.text_muted}">${esc(c.contact.text)}</p>
          <div ${k}="space-y-4">${info
            .map(
              (i) => `
            <div>
              <div ${k}="text-xs font-semibold uppercase tracking-widest ${t.accent}">${i.label}</div>
              <div ${k}="${t.text_main}">${esc(i.value)}</div>
            </div>`,
            )
            .join('')}
          </div>
        </div>
        ${formTag(ctx, `${t.surface} ${t.border} ${t.radius} space-y-4 border p-8`, m.rv('up', 2))}
          <input type="text" name="name" required aria-label="Your name" placeholder="Your name" ${k}="${inputClass(ctx)}" />
          <input type="email" name="email" required aria-label="Your email" placeholder="Your email" ${k}="${inputClass(ctx)}" />
          <textarea name="message" required aria-label="Your message" placeholder="Your message" ${k}="${inputClass(ctx)} h-32"></textarea>
          <button type="submit" ${k}="${t.primary_btn} ${t.radius} w-full px-6 py-3 font-medium transition${m.fx('press')}">Send message</button>
        </form>
      </div>${
        c.contact.showMap
          ? `
      <div ${k}="${t.border} ${t.radius} relative mx-auto mt-10 h-72 max-w-6xl overflow-hidden border"><iframe title="Map: ${esc(c.contact.address)}" src="https://www.google.com/maps?q=${encodeURIComponent(c.contact.address)}&amp;output=embed" loading="lazy" ${ctx.mode === 'jsx' ? 'referrerPolicy' : 'referrerpolicy'}="no-referrer-when-downgrade" ${k}="size-full border-0"></iframe></div>`
          : ''
      }
    </section>`
  },

  'footer-rich': (ctx) => {
    const { t, c, k, m } = ctx
    const pageLinks = (ids: PageId[]) =>
      ids.flatMap((id) => ctx.site?.pages.filter((p) => p.id === id).map((p) => [p.label, `#${p.path}`]) ?? [])
    const columns = ctx.site
      ? [
          { title: 'Company', links: pageLinks(['about', 'team', 'blog']) },
          { title: 'Explore', links: pageLinks(['services', 'pricing', 'gallery']) },
          { title: 'Support', links: pageLinks(['faq', 'contact', 'privacy', 'terms']) },
        ].filter((column) => column.links.length)
      : [
          { title: 'Company', links: ([['About', '#about', 'about'], ['Our team', '#team', 'team'], ['Contact', '#contact', 'contact']] as const).filter(([, , id]) => ctx.has(id)).map(([label, href]) => [label, href]) },
          { title: 'Explore', links: ([['Features', '#features', 'features'], ['Pricing', '#pricing', 'pricing'], ['Gallery', '#gallery', 'gallery']] as const).filter(([, , id]) => ctx.has(id)).map(([label, href]) => [label, href]) },
          { title: 'Support', links: ctx.has('contact') ? [['Contact', '#contact']] : [] },
        ].filter((column) => column.links.length)
    return `
    <footer ${k}="${t.surface} ${t.font} ${t.border} border-t px-6 pt-16 pb-8 md:px-12"${m.rv('fade')}>
      <div ${k}="mx-auto grid max-w-6xl grid-cols-2 gap-10 md:grid-cols-5">
        <div ${k}="col-span-2">
          <div ${k}="flex items-center gap-2.5 text-xl font-bold ${t.accent}">${logo(ctx)}${esc(c.brandName)}</div>
          <p ${k}="mt-3 max-w-xs text-sm ${t.text_muted}">${esc(sentence(c.subject) || c.hero.subtitle)}</p>
          ${formTag(ctx, 'mt-5 flex max-w-sm gap-2')}
            <input type="email" name="newsletter" required aria-label="Email address" placeholder="Your email" ${k}="${inputClass(ctx)}" />
            <button type="submit" ${k}="${t.primary_btn} ${t.radius} shrink-0 px-4 py-3 text-sm font-medium transition${m.fx('press')}">Subscribe</button>
          </form>
        </div>${columns
          .map(
            (col) => `
        <div>
          <div ${k}="text-sm font-semibold ${t.text_main}">${col.title}</div>
          <ul ${k}="mt-4 space-y-2 text-sm ${t.text_muted}">${col.links
            .map(([label, href]) => `
            <li><a href="${href}" ${k}="${t.hover_accent} transition">${label}</a></li>`)
            .join('')}
          </ul>
        </div>`,
          )
          .join('')}
      </div>
      <div ${k}="${t.border} ${t.text_muted} mx-auto mt-12 max-w-6xl border-t pt-6 text-center text-xs">
        &copy; ${new Date().getFullYear()} ${esc(c.brandName)}. All rights reserved.${c.photos?.credit ? ` &middot; ${esc(c.photos.credit)}` : ''}
      </div>
    </footer>`
  },

  'page-header': (ctx) => {
    const { t, k, m, page } = ctx
    if (!page) return ''
    const center = page.headerStyle === 'center'
    const crumbs = page.crumbs
      .map((crumb) =>
        crumb.href
          ? `<a href="${crumb.href}" ${k}="${t.hover_accent} transition">${esc(crumb.label)}</a>`
          : `<span ${k}="${t.text_main}">${esc(crumb.label)}</span>`,
      )
      .join(`<span ${k}="mx-2 opacity-50" aria-hidden="true">/</span>`)
    return `
    <section ${k}="${t.surface} ${t.font} ${t.border} relative overflow-hidden border-b px-6 py-16 md:px-12 md:py-24 ${center ? 'text-center' : ''}">
      <div ${k}="${t.gradient} absolute -right-20 -top-24 size-72 rounded-full opacity-60 blur-3xl${m.fx('float')}" aria-hidden="true"></div>
      <div ${k}="relative mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" ${k}="mb-5 flex flex-wrap ${center ? 'justify-center' : ''} text-sm ${t.text_muted}"${m.rv('fade')}>${crumbs}</nav>
        <h1 ${k}="text-3xl font-extrabold break-words sm:text-4xl ${t.heading} md:text-6xl ${t.text_main}"${m.rv('up', 1)}>${esc(page.title)}</h1>
        <p ${k}="mt-5 max-w-2xl text-lg ${t.text_muted} ${center ? 'mx-auto' : ''}"${m.rv('up', 2)}>${esc(page.subtitle)}</p>
      </div>
    </section>`
  },

  timeline: (ctx) => {
    const { t, c, k, m } = ctx
    return `
    <section ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12">
      <div ${k}="mx-auto max-w-4xl">
        ${sectionTitle(ctx, 'Our journey')}
        <div ${k}="space-y-2">${(c.timeline ?? [])
          .map(
            (item, i) => `
          <div ${k}="flex gap-4 sm:gap-6"${m.rv('up', (i % 4) + 1)}>
            <div ${k}="w-16 shrink-0 pt-0.5 text-lg font-extrabold sm:w-20 sm:text-xl ${t.accent}">${esc(item.year)}</div>
            <div ${k}="${t.border} relative border-s pb-8 ps-6">
              <span ${k}="absolute -start-[7px] top-2 size-3 rounded-full bg-(--g-accent)" aria-hidden="true"></span>
              <h3 ${k}="text-lg font-semibold ${t.text_main}">${esc(item.title)}</h3>
              <p ${k}="mt-1 ${t.text_muted}">${esc(item.text)}</p>
            </div>
          </div>`,
          )
          .join('')}
        </div>
      </div>
    </section>`
  },

  'map-block': (ctx) => {
    const { t, c, k, m, mode } = ctx
    const pin =
      mode === 'jsx'
        ? `<svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>`
        : `<svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>`
    return `
    <section ${k}="${t.bg} ${t.font} px-6 pb-20 md:px-12">
      <div ${k}="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        <div ${k}="${t.surface} ${t.border} ${t.radius} relative min-h-72 overflow-hidden border bg-[linear-gradient(var(--g-border)_1px,transparent_1px),linear-gradient(90deg,var(--g-border)_1px,transparent_1px)] bg-size-[36px_36px] md:col-span-2"${m.rv('scale')}>
          ${
            c.contact.showMap
              ? `<iframe title="Map: ${esc(c.contact.address)}" src="https://www.google.com/maps?q=${encodeURIComponent(c.contact.address)}&amp;output=embed" loading="lazy" ${mode === 'jsx' ? 'referrerPolicy' : 'referrerpolicy'}="no-referrer-when-downgrade" ${k}="absolute inset-0 size-full border-0"></iframe>`
              : `<div ${k}="absolute inset-0 flex items-center justify-center">
            <div ${k}="${t.primary_btn} flex size-14 items-center justify-center rounded-full shadow-xl${m.fx('float')}">${pin}</div>
          </div>`
          }
          <div ${k}="${t.surface} ${t.border} ${t.radius} absolute bottom-4 left-4 right-4 border px-5 py-4 shadow-xl sm:right-auto">
            <div ${k}="text-xs font-semibold uppercase tracking-widest ${t.accent}">Visit us</div>
            <div ${k}="font-semibold ${t.text_main}">${esc(c.contact.address)}</div>
          </div>
        </div>
        <div ${k}="${t.surface} ${t.border} ${t.radius} border p-8"${m.rv('up', 1)}>
          <h3 ${k}="text-lg font-semibold ${t.text_main}">Opening hours</h3>
          <ul ${k}="mt-4 space-y-3">${(c.hours ?? [])
            .map(
              (h) => `
            <li ${k}="flex justify-between gap-4 text-sm"><span ${k}="${t.text_muted}">${esc(h.day)}</span><span ${k}="font-medium ${t.text_main}">${esc(h.time)}</span></li>`,
            )
            .join('')}
          </ul>
        </div>
      </div>
    </section>`
  },

  'legal-body': ({ t, c, k, page }) => {
    const doc = c.legal ? (page?.id === 'terms' ? c.legal.terms : c.legal.privacy) : []
    const blocks = doc
      .map(
        (block) => `
        <h2 ${k}="mt-8 text-xl font-bold ${t.heading} ${t.text_main}">${esc(block.heading)}</h2>${block.text
          .map((text) => `
        <p ${k}="leading-7 ${t.text_muted}">${esc(text)}</p>`)
          .join('')}`,
      )
      .join('')
    return `
    <section ${k}="${t.bg} ${t.font} px-6 py-14 md:px-12">
      <article ${k}="mx-auto max-w-3xl space-y-3">
        <p ${k}="text-sm ${t.text_muted}">Last updated: ${esc(c.legal?.updated ?? '')}</p>${blocks}
        <a href="#home" ${k}="${t.accent} mt-8 inline-block font-medium">&larr; Back to home</a>
      </article>
    </section>`
  },

  'not-found': ({ t, c, k, m }) => `
    <section ${k}="${t.bg} ${t.font} px-6 py-28 text-center md:px-12">
      <div ${k}="${t.gradient}${m.fx('gradient')} ${t.radius} mx-auto max-w-2xl space-y-5 px-6 py-16">
        <div ${k}="text-7xl font-extrabold ${t.heading} ${t.text_main}">404</div>
        <h1 ${k}="text-2xl font-bold ${t.text_main}">This page does not exist</h1>
        <p ${k}="${t.text_muted}">The link may be old, or the page may have moved. ${esc(c.brandName)} is still right here.</p>
        <a href="#home" ${k}="${t.primary_btn} ${t.radius} inline-block px-6 py-3 font-medium transition${m.fx('press')}">Back to home</a>
      </div>
    </section>`,

  'blog-list': (ctx) => {
    const { t, k, mode, posts = [] } = ctx
    const featured = mode === 'jsx' ? `{posts.slice(0, 1).map((post) => (${featuredPost(ctx, undefined)}\n        ))}` : featuredPost(ctx, posts[0])
    const rest =
      mode === 'jsx'
        ? `{posts.slice(1).map((post, i) => (${postCard(ctx, undefined, 'i')}\n          ))}`
        : posts.slice(1).map((p, i) => postCard(ctx, p, String(i))).join('')
    return `
    <section ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12">
      <div ${k}="mx-auto max-w-6xl">${featured}
        <div ${k}="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">${rest}
        </div>
      </div>
    </section>`
  },

  'post-body': (ctx) => {
    const { t, k, m, mode, post } = ctx
    const { f } = postFields(ctx, post)
    const blocks =
      mode === 'jsx'
        ? `{post.body.map((block, i) =>
            block.type === 'h2' ? (
              <h2 key={i} ${k}="mt-10 text-2xl font-bold ${t.heading} ${t.text_main}">{block.text}</h2>
            ) : block.type === 'quote' ? (
              <blockquote key={i} ${k}="my-8 border-s-4 border-(--g-accent) ps-6 text-xl font-medium italic ${t.text_main}">{block.text}</blockquote>
            ) : block.type === 'list' ? (
              <ul key={i} ${k}="my-6 space-y-3">
                {block.items.map((item) => (
                  <li key={item} ${k}="flex items-center gap-3 ${t.text_main}">${check(ctx)}{item}</li>
                ))}
              </ul>
            ) : (
              <p key={i} ${k}="text-lg leading-8 ${t.text_muted}">{block.text}</p>
            ),
          )}`
        : (post?.body ?? [])
            .map((block) =>
              block.type === 'h2'
                ? `\n          <h2 ${k}="mt-10 text-2xl font-bold ${t.heading} ${t.text_main}">${esc(block.text)}</h2>`
                : block.type === 'quote'
                  ? `\n          <blockquote ${k}="my-8 border-s-4 border-(--g-accent) ps-6 text-xl font-medium italic ${t.text_main}">${esc(block.text)}</blockquote>`
                  : block.type === 'list'
                    ? `\n          <ul ${k}="my-6 space-y-3">${block.items.map((item) => `\n            <li ${k}="flex items-center gap-3 ${t.text_main}">${check(ctx)}${esc(item)}</li>`).join('')}\n          </ul>`
                    : `\n          <p ${k}="text-lg leading-8 ${t.text_muted}">${esc(block.text)}</p>`,
            )
            .join('')
    return `
    <section ${k}="${t.surface} ${t.font} ${t.border} relative overflow-hidden border-b px-6 py-14 md:px-12 md:py-20">
      <div ${k}="${t.gradient} absolute -right-20 -top-24 size-72 rounded-full opacity-60 blur-3xl${m.fx('float')}" aria-hidden="true"></div>
      <div ${k}="relative mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" ${k}="mb-5 text-sm ${t.text_muted}"${m.rv('fade')}><a href="#home" ${k}="${t.hover_accent} transition">Home</a><span ${k}="mx-2 opacity-50" aria-hidden="true">/</span><a href="#blog" ${k}="${t.hover_accent} transition">Blog</a></nav>
        <span ${k}="${t.badge} inline-block rounded-full px-3 py-1 text-xs font-semibold"${m.rv('fade')}>${f('tag')}</span>
        <h1 ${k}="mt-4 text-3xl font-extrabold break-words sm:text-4xl ${t.heading} md:text-5xl ${t.text_main}"${m.rv('up', 1)}>${f('title')}</h1>
        <div ${k}="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm ${t.text_muted}"${m.rv('up', 2)}>
          <span ${k}="${t.badge} flex size-10 items-center justify-center rounded-full text-xs font-bold">${initialsOf(ctx, post)}</span>
          <span><span ${k}="font-semibold ${t.text_main}">${f('author')}</span>, ${f('role')}</span>
          <span>${f('date')}</span>
          <span>${f('readTime')}</span>
        </div>
      </div>
    </section>
    <section ${k}="${t.bg} ${t.font} px-6 py-14 md:px-12">
      <article ${k}="mx-auto max-w-3xl space-y-5">${blocks}
        <a href="#blog" ${k}="${t.accent} mt-8 inline-block font-medium">&larr; All articles</a>
      </article>
    </section>`
  },

  'blog-related': (ctx) => {
    const { t, k } = ctx
    return `
    <section ${k}="${t.surface} ${t.font} ${t.border} border-y px-6 py-20 md:px-12">
      <div ${k}="mx-auto max-w-6xl">
        ${sectionTitle(ctx, 'Keep reading')}
        <div ${k}="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">${relatedCards(ctx)}
        </div>
      </div>
    </section>`
  },

  marquee: ({ t, c, k }) => `
    <section aria-label="Highlights" ${k}="${t.surface} ${t.font} ${t.border} m-marquee border-y py-5">
      <div ${k}="m-marquee-track flex w-max items-center gap-10 whitespace-nowrap px-5 text-base font-semibold uppercase tracking-widest sm:text-lg ${t.text_muted}">${[...c.marquee, ...c.marquee]
        .map(
          (word, i) => `
        <span${i >= c.marquee.length ? ' aria-hidden="true"' : ''}>${esc(word)}</span><span ${k}="${t.accent}" aria-hidden="true">&#10022;</span>`,
        )
        .join('')}
      </div>
    </section>`,

  'testimonials-carousel': ({ t, c, k }) => `
    <section ${k}="${t.bg} ${t.font} px-6 py-20 md:px-12">
      <div data-carousel ${k}="mx-auto max-w-3xl">
        <div ${k}="grid">${c.testimonials
          .map(
            (q) => `
          <figure data-slide ${k}="${t.surface} ${t.border} ${t.radius} mb-4 border px-8 py-12 text-center">
            <div ${k}="${t.badge} mx-auto mb-4 flex size-14 items-center justify-center rounded-full text-lg font-bold" aria-hidden="true">${esc(initials(q.author))}</div>
            <div ${k}="text-5xl font-serif leading-none ${t.accent}">&ldquo;</div>
            <blockquote ${k}="mt-2 text-xl font-medium ${t.text_main} md:text-2xl">${esc(q.quote)}</blockquote>
            <figcaption ${k}="mt-6 text-sm ${t.text_muted}">
              <span ${k}="font-semibold ${t.text_main}">${esc(q.author)}</span>, ${esc(q.role)}
            </figcaption>
          </figure>`,
          )
          .join('')}
        </div>
        <div ${k}="mt-2 flex justify-center gap-2">${c.testimonials
          .map((_, i) => `
          <button type="button" data-dot aria-label="Show testimonial ${i + 1}" ${k}="size-2.5 rounded-full bg-(--g-accent)"></button>`)
          .join('')}
        </div>
      </div>
    </section>`,

  footer: ({ t, c, k, m }) => `
    <footer ${k}="${t.bg} ${t.font} ${t.border} border-t px-6 py-8 text-center text-xs ${t.text_muted}"${m.rv('fade')}>
      &copy; ${new Date().getFullYear()} ${esc(c.brandName)}${c.subject ? ` &middot; ${esc(sentence(c.subject))}` : ''}. All rights reserved.${c.photos?.credit ? ` &middot; ${esc(c.photos.credit)}` : ''}
    </footer>`,
}

export type LayoutChoice = {
  size: 'compact' | 'full'
  nav: 'navbar-left' | 'navbar-center'
  hero: 'hero-split' | 'hero-split-reverse' | 'hero-centered'
  features: 'features-cards' | 'features-list' | 'features-rows'
  aboutSide: 'left' | 'right'
  steps: 'grid' | 'timeline'
  testimonials: 'none' | 'single' | 'grid' | 'carousel'
  /** scrolling keyword strip under the hero */
  marquee: boolean
  stats: boolean
  faq: boolean
  gallery: boolean
  team: boolean
  blog: boolean
}

const when = <T,>(condition: boolean, ...items: T[]) => (condition ? items : [])

export function buildLayout(choice: LayoutChoice): LayoutId[] {
  if (choice.size === 'compact') {
    return [
      choice.nav,
      choice.hero,
      ...when<LayoutId>(choice.stats, 'stats'),
      choice.features,
      ...when<LayoutId>(choice.testimonials !== 'none', 'testimonial'),
      ...when<LayoutId>(choice.faq, 'faq'),
      'cta',
      'footer',
    ]
  }
  return [
    choice.nav,
    choice.hero,
    ...when<LayoutId>(choice.marquee, 'marquee'),
    ...when<LayoutId>(choice.stats, 'stats'),
    choice.aboutSide === 'left' ? 'about-left' : 'about-right',
    choice.features,
    choice.steps === 'grid' ? 'steps-grid' : 'steps-timeline',
    ...when<LayoutId>(choice.gallery, 'gallery'),
    'pricing',
    ...when<LayoutId>(choice.team, 'team'),
    choice.testimonials === 'grid' ? 'testimonials-grid' : choice.testimonials === 'carousel' ? 'testimonials-carousel' : 'testimonial',
    ...when<LayoutId>(choice.blog, 'blog'),
    ...when<LayoutId>(choice.faq, 'faq'),
    'cta',
    'contact',
    'footer-rich',
  ]
}

/** What a page of a multi-page site needs to know about the site around it. */
export type SiteRender = { pages: PagePlan[]; current: string; page?: PageInfo; posts?: Post[]; post?: Post }

/** the links of a single page, in the order of its sections, with the labels the person chose */
function pageLinks(content: WebsiteContent, layoutIds: LayoutId[], has: (prefix: string) => boolean) {
  const label = (page: string, fallback: string) => content.navLabels?.[page] ?? fallback
  const at = (prefix: string) => layoutIds.findIndex((id) => id.startsWith(prefix))
  const sections = [
    { at: at('about'), link: { href: '#about', label: label('about', 'About') }, on: has('about') },
    { at: at('features'), link: { href: '#features', label: label('services', 'Features') }, on: has('features') },
    { at: at('pricing'), link: { href: '#pricing', label: label('pricing', 'Pricing') }, on: has('pricing') },
    { at: at('faq'), link: { href: '#faq', label: label('faq', 'FAQ') }, on: has('faq') },
  ]
    .filter((s) => s.on)
    .sort((a, b) => a.at - b.at)
    .map((s) => s.link)
  return [{ href: '#home', label: label('home', 'Home') }, ...sections, { href: '#contact', label: label('contact', 'Contact') }]
}

export function renderSections(
  theme: Theme,
  layoutIds: LayoutId[],
  content: WebsiteContent,
  mode: Mode,
  tier: Tier,
  plan: MotionPlan,
  site?: SiteRender,
  visuals?: Visuals,
  paints?: Paints,
  fits?: Fits,
) {
  const k = mode === 'jsx' ? 'className' : 'class'
  const has = (prefix: string) => layoutIds.some((id) => id.startsWith(prefix))
  const links = site
    ? site.pages.filter((p) => p.inNav).map((p) => ({ href: `#${p.path}`, label: p.label }))
    : pageLinks(content, layoutIds, has)
  const full = !!site || layoutIds.includes('contact')
  // the tier changes spacing / type size (e.g. premium = roomier, bigger headings)
  const swap = (html: string) => tierSwaps[tier].reduce((out, [from, to]) => out.split(from).join(to), html)
  const m = makeMotion(plan)
  const siteCtx = site ? { pages: site.pages, current: site.current } : undefined
  return layoutIds.map((id) => {
    const html = swap(
      sections[id]({ t: theme, c: content, k, m, mode, full, links, site: siteCtx, page: site?.page, posts: site?.posts, post: site?.post, v: visuals, has }),
    )
    const routed = (site ? routeLinks(html, site.pages) : html) + (id.startsWith('footer') ? whatsappButton(content, k) : '')
    const part = targetOfLayout(id, sectionOfLayout as (id: string) => Target | undefined) as Target
    const tokens = paints?.[part]
    const painted = tokens ? paintMarkup(routed, tokens, mode) : routed
    const fit = fits?.[part]
    return fit ? fitMarkup(painted, fit, mode) : painted
  })
}

/** The <style> rules that hold both colour palettes of the live preview; `data-mode` on .g-root picks one. */
export const themeCss = (tokens: Record<ColorMode, Record<string, string>>) => {
  const declarations = (values: Record<string, string>) => Object.entries(values).map(([key, value]) => `${key}:${value}`).join(';')
  return `.g-root[data-mode="light"]{${declarations(tokens.light)}}.g-root[data-mode="dark"]{${declarations(tokens.dark)}}.g-root[data-mode="dark"] .g-moon,.g-root[data-mode="light"] .g-sun{display:none}`
    // colour on the page itself: a glow of the two main colours behind the first screen, and a soft gradient band behind every fourth part
    + `.g-root>:nth-child(2){background-image:radial-gradient(60% 90% at 12% 0%,color-mix(in oklab,var(--g-accent) 26%,transparent),transparent 70%),radial-gradient(55% 80% at 95% 15%,color-mix(in oklab,var(--g-alt) 16%,transparent),transparent 70%)}`
    + `.g-root>:nth-child(4n+1):not(:first-child):not(:last-child){background-image:linear-gradient(100deg,color-mix(in oklab,var(--g-accent) 13%,var(--g-bg)),color-mix(in oklab,var(--g-alt) 11%,var(--g-bg)))}`
}

/** Markup for the live preview. Both colour palettes are in a <style> block; `data-mode` picks one. */
export function compileWebsiteHtml(
  theme: Theme,
  layoutIds: LayoutId[],
  content: WebsiteContent,
  tokens: Record<ColorMode, Record<string, string>>,
  initialMode: ColorMode,
  tier: Tier = 'better',
  motion: MotionPlan = noMotion(),
  visuals?: Visuals,
  paints?: Paints,
  fits?: Fits,
): string {
  const css = themeCss(tokens)
  return `<style>${css}</style><div data-mode="${initialMode}" class="g-root min-h-screen overflow-x-clip [overflow-wrap:anywhere] ${theme.bg} ${theme.text_main}">${renderSections(theme, layoutIds, content, 'html', tier, motion, undefined, visuals, paints, fits).join('\n')}\n</div>`
}

/** A complete React component file as a string (with a working light / dark switch). */
export function compileWebsiteCode(
  theme: Theme,
  layoutIds: LayoutId[],
  content: WebsiteContent,
  tokens: Record<ColorMode, Record<string, string>>,
  initialMode: ColorMode,
  tier: Tier = 'better',
  motion: MotionPlan = noMotion(),
  visuals?: Visuals,
  paints?: Paints,
  fits?: Fits,
): string {
  const body = renderSections(theme, layoutIds, content, 'jsx', tier, motion, undefined, visuals, paints, fits).join('\n')
  // React wants camelCase for standard style properties (custom --g-* variables stay as they are)
  const reactTokens = Object.fromEntries(
    Object.entries(tokens).map(([mode, values]) => [mode, Object.fromEntries(Object.entries(values).map(([key, value]) => [key === 'color-scheme' ? 'colorScheme' : key, value]))]),
  )
  const animated = motion.level !== 'off'
  return `import { ${animated ? 'useLayoutEffect, useRef, ' : ''}useState, type CSSProperties } from 'react'
${animated ? "import type { MotionPlan } from './generator/motionBrain'\nimport { initMotion } from './generator/motionRuntime'\n" : ''}
// Colours for both modes. The Tailwind classes below read these CSS variables.
const tokens = ${JSON.stringify(reactTokens, null, 2)} as Record<'light' | 'dark', CSSProperties>
${
  animated
    ? `
// How the page moves (timings, and which effects are on). The CSS for it lives in src/index.css.
const motion: MotionPlan = ${JSON.stringify(motion, null, 2)}
`
    : ''
}
export default function GeneratedLandingPage() {
  const [mode, setMode] = useState<'light' | 'dark'>('${initialMode}')
${
  animated
    ? `  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => initMotion(rootRef.current!, motion), [])
`
    : ''
}
  return (
    <div ${animated ? 'ref={rootRef} ' : ''}style={tokens[mode]} className="g-root min-h-screen overflow-x-clip [overflow-wrap:anywhere] ${theme.bg} ${theme.text_main}">${body.replace(/\n/g, '\n  ')}
    </div>
  )
}
`
}

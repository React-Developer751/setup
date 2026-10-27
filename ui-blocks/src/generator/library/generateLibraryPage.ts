// Same pipeline as generateWebsite (theme, palette, content) but the page is assembled from the
// stored components instead of the built-in templates.
import { generateWebsite, hash, seededRandom } from '../generateWebsite'
import { applyPoolToContent } from '../siteData'
import type { Tier } from '../designBrain'
import type { MotionSetting } from '../motionBrain'
import { TARGETS, type SectionKey, type SiteEdits, type Target } from '../edit/edits'
import { fitsFrom, reorder } from '../edit/fit'
import { rolePools, tierPools, type Role } from './libraryRoles'
import { panelColors } from '../moods'
import { chosenFont, editCss } from './editCss'

/** the part of a page that a library component fills, for each section a person can ask to remove or add */
const ROLE_OF: Partial<Record<SectionKey, Role[]>> = {
  stats: ['stats'],
  features: ['features'],
  about: ['about', 'profile'],
  steps: ['steps'],
  gallery: ['gallery'],
  pricing: ['pricing'],
  team: ['team'],
  testimonials: ['testimonial'],
  faq: ['faq'],
  blog: ['blog'],
  cta: ['cta'],
  contact: ['contact'],
}

/** size and alignment of one part (a minimum height and a maximum width in pixels, a text alignment) */
export type LibraryFit = { /** the buttons alone */ buttons?: 'left' | 'center' | 'right'; minHeight?: number; /** scales the roomy parts (padding) of the component */ heightFactor?: number; maxWidth?: number; align?: 'left' | 'center' | 'right' }
export type LibrarySection = { role: Role; componentId: string; /** the page of a multi-page site this part is on ('*' = every page) */ page?: string; /** the title block of an inner page */ head?: { title: string; text: string; home: string }; /** a soft band of the main colour behind this part */ band?: boolean; /** background colour of this part only ("footer green") */ paint?: string; fit?: LibraryFit }

const componentName = (id: string) => id.split('/')[1]

export function generateLibraryPage(
  userPrompt: string,
  variation = 0,
  tierOverride?: Tier,
  creative = true,
  motionSetting: MotionSetting = 'auto',
  /** changes the person asked for (see edit/edits.ts) */
  edits?: SiteEdits,
  /** a site with pages (Home, About, Pricing ...) instead of one long page */
  multi = false,
) {
  const generated = generateWebsite(userPrompt, variation, tierOverride, creative, motionSetting, edits)
  // your own data (src/data/dataPool.json) first, the generated text for what it does not cover
  const poolRand = seededRandom(hash(`${userPrompt.trim().toLowerCase()}|pool|${variation}`))
  const base = { ...generated, content: applyPoolToContent(generated.content, generated.themeKey, userPrompt, poolRand) }
  const tier = base.tier
  const rand = seededRandom(hash(`${userPrompt.trim().toLowerCase()}|library|${variation}`))
  const poolFor = (role: Role) => (tier === 'better' ? undefined : tierPools[tier][role]) ?? rolePools[role]
  const pickFrom = (role: Role) => {
    const pool = poolFor(role)
    return pool[Math.floor(rand() * pool.length)]
  }
  const maybe = (probability: number) => rand() < probability
  // offers the person named ("free shipping above 999", "cash on delivery") have a bar of their own at the top of the page
  const hasOffers = !!base.content.offers?.length

  // draw everything in a fixed order so the same prompt always gives the same page
  const chosen = Object.fromEntries((Object.keys(rolePools) as Role[]).map((role) => [role, pickFrom(role)])) as Record<Role, string>
  // the parts a page may have besides the always-there ones; a page that is too long is not read
  const optional = {
    stats: maybe(0.7),
    profile: false,
    gallery: maybe(0.5),
    team: maybe(0.4),
    blog: maybe(0.35),
    links: maybe(0.1),
    faq: maybe(0.5),
    steps: maybe(0.6),
    pricing: maybe(0.5),
    banner: maybe(0.3),
  }

  // a site with pages has most of the parts: each page needs something to show
  const multiOn = multi ? Object.fromEntries((['stats', 'steps', 'pricing', 'gallery', 'team', 'blog', 'faq'] as const).map((role) => [role, maybe(tier === 'normal' ? 0.7 : 0.92)])) : undefined

  // normal = short page, premium = the rich parts on (the team and the blog by turns)
  const premiumOn = new Set<keyof typeof optional>(['stats', 'steps'])
  const show = (role: keyof typeof optional) =>
    tier === 'normal' ? false : tier === 'premium' ? premiumOn.has(role) || (role === 'gallery' || role === 'faq' || role === 'pricing' ? optional[role] || maybe(0.6) : role === 'banner' ? optional.banner : role === 'team' || role === 'blog' ? optional[role] || maybe(0.3) : false) : optional[role]

  // which parts the page has: the short page (normal), or the long one with its optional parts; then what the person removed or added
  const FULL: Role[] = ['banner', 'nav', 'hero', 'stats', 'about', 'profile', 'features', 'steps', 'gallery', 'pricing', 'team', 'testimonial', 'faq', 'blog', 'links', 'cta', 'contact', 'footer']
  const visible = new Set<Role>(
    multiOn
      ? ['nav', 'hero', 'about', 'features', 'testimonial', 'cta', 'contact', 'footer', ...(['stats', 'steps', 'pricing', 'gallery', 'team', 'blog', 'faq'] as const).filter((role) => multiOn[role]), ...(tier !== 'normal' && optional.banner ? (['banner'] as const) : [])]
      : tier === 'normal'
      ? ['nav', 'hero', 'about', 'features', 'cta', 'contact', 'footer']
      : ['nav', 'hero', 'about', 'features', 'testimonial', 'cta', 'contact', 'footer', ...(['stats', 'steps', 'pricing', 'gallery', 'team', 'blog', 'links', 'faq', 'banner'] as const).filter((role) => show(role))],
  )
  if (hasOffers) visible.add('banner')
  for (const section of edits?.added ?? []) for (const role of ROLE_OF[section] ?? []) if (role !== 'profile') visible.add(role)
  // a part that is moved is a part the person wants to see ("move FAQ above pricing" on a page without a FAQ)
  for (const move of edits?.moves ?? []) for (const section of [move.section, move.target]) for (const role of (section && ROLE_OF[section]) || []) if (role !== 'profile') visible.add(role)
  // a part the person resizes, aligns or renames is a part they expect to see (a colour is not asked for one part: "background green" paints them all)
  for (const key of [...Object.keys(edits?.sizes ?? {}), ...Object.keys(edits?.aligns ?? {}), ...Object.keys(edits?.buttonAligns ?? {}), ...Object.keys(edits?.titles ?? {})]) for (const role of ROLE_OF[key as SectionKey] ?? []) if (role !== 'profile') visible.add(role)
  for (const section of edits?.hidden ?? []) for (const role of ROLE_OF[section] ?? []) visible.delete(role)
  const sectionOfRole = (role: Role): SectionKey | undefined => (role === 'profile' ? 'about' : (Object.keys(ROLE_OF) as SectionKey[]).find((key) => ROLE_OF[key]?.includes(role)))
  const order: Role[] = reorder(FULL.filter((role) => visible.has(role)), edits?.moves ?? [], sectionOfRole)
  const targetOfRole = (role: Role): Target | undefined =>
    role === 'nav' ? 'header' : role === 'hero' ? 'hero' : role === 'footer' ? 'footer' : role === 'profile' ? 'about' : ((Object.keys(ROLE_OF) as SectionKey[]).find((key) => ROLE_OF[key]?.includes(role)) as Target | undefined)
  const fits = fitsFrom(edits, TARGETS)
  const fitOf = (role: Role): LibraryFit | undefined => {
    const f = fits?.[targetOfRole(role) as Target]
    if (!f) return undefined
    const maxWidth = f.width ? (f.width.px ?? Math.round(1152 * (f.width.factor ?? 1))) : undefined
    return { ...(f.buttons ? { buttons: f.buttons } : {}), ...(f.height?.px ? { minHeight: f.height.px } : f.height?.factor && f.height.factor !== 1 ? { heightFactor: f.height.factor } : {}), ...(maxWidth ? { maxWidth } : {}), ...(f.align ? { align: f.align } : {}) }
  }
  // every other body part gets a band of the main colour; the call-to-action gets the main colour itself
  // the colour of each part: the mood's rules for the panels, then what the person asked for ('' = none)
  const auto = generated.mood ? panelColors(generated.mood, order.map((r) => r as string), base.palette, generated.initialMode, (id) => targetOfRole(id as Role)) : undefined
  let bodyIndex = 0

  // the pages of a multi-page site: the parts are grouped by page, an inner page starts with its title block; the menu and the footer are on every page
  const PAGE_OF: Partial<Record<Role, string>> = { hero: '/', stats: '/', features: '/', links: '/', testimonial: '/', cta: '/', about: '/about', profile: '/about', team: '/about', steps: '/about', pricing: '/pricing', faq: '/pricing', gallery: '/gallery', blog: '/blog', contact: '/contact' }
  // the label of a page in the menu: the one the person gave it, else the heading they gave its section ("rename pricing to Rates" renames both)
  const edited = base.content.titles ?? {}
  const nl = { ...Object.fromEntries((['about', 'pricing', 'gallery', 'blog', 'contact'] as const).filter((key) => edited[key] && edited[key]!.length <= 24).map((key) => [key, edited[key]])), ...(base.content.navLabels ?? {}) } as Partial<Record<string, string>>
  const brand = base.content.brandName
  const PAGES: { path: string; label: string; text: string }[] = [
    { path: '/', label: nl.home ?? 'Home', text: base.content.hero.subtitle },
    { path: '/about', label: nl.about ?? 'About', text: base.content.about.paragraphs[0] ?? base.content.hero.subtitle },
    { path: '/pricing', label: nl.pricing ?? 'Pricing', text: base.content.pricing.title },
    { path: '/gallery', label: nl.gallery ?? 'Gallery', text: base.content.gallery.title },
    { path: '/blog', label: nl.blog ?? 'Blog', text: base.content.blog.title },
    { path: '/contact', label: nl.contact ?? 'Contact', text: base.content.contact.text },
  ]
  const usedPages = multi ? PAGES.filter((page) => order.some((role) => PAGE_OF[role] === page.path)) : []
  const pagesInfo = usedPages.map((page) => ({ path: page.path, label: page.label, title: page.path === '/' ? brand : `${page.label} | ${brand}` }))
  const arranged: { role: Role; page?: string; head?: LibrarySection['head'] }[] = multi
    ? [
        ...order.filter((role) => role === 'banner').map((role) => ({ role, page: '*' })),
        ...order.filter((role) => role === 'nav').map((role) => ({ role, page: '*' })),
        ...usedPages.flatMap((page) => [
          ...(page.path === '/' ? [] : [{ role: 'pagehead' as Role, page: page.path, head: { title: page.label, text: page.text, home: nl.home ?? 'Home' } }]),
          ...order.filter((role) => PAGE_OF[role] === page.path).map((role) => ({ role, page: page.path })),
        ]),
        ...order.filter((role) => role === 'footer').map((role) => ({ role, page: '*' })),
      ]
    : order.map((role) => ({ role }))
  const sections: LibrarySection[] = arranged.map(({ role, page, head }) => {
    const body = role !== 'banner' && role !== 'nav' && role !== 'hero' && role !== 'footer' && role !== 'pagehead'
    const band = body && bodyIndex++ % 2 === 1 && role !== 'cta'
    const t = targetOfRole(role) as Target
    const own = edits?.sectionColors[t] ?? auto?.[t]
    return { role, componentId: chosen[role], ...(page ? { page } : {}), ...(head ? { head } : {}), paint: own === '' ? undefined : (own ?? (role === 'cta' ? base.palette.light.accent : undefined)), band: band || undefined, fit: fitOf(role) }
  })

  const css = editCss(edits)
  const fontTokens = chosenFont(edits)
  const imports = [...new Set(sections.map(({ componentId }) => componentId))]
    .map((componentId) => `import ${componentName(componentId)} from './components/${componentId}'`)
    .join('\n')
  const body = sections
      .map(({ role, componentId, paint, fit, band, page, head }) => `      <Section role="${role}"${page ? ` page="${page}"` : ''}${head ? ` head={${JSON.stringify(head)}}` : ''}${band ? ' band' : ''}${paint ? ` paint="${paint}"` : ''}${fit && Object.keys(fit).length ? ` fit={${JSON.stringify(fit)}}` : ''}>\n        <${componentName(componentId)} />\n      </Section>`)
    .join('\n')

  const code = `// Page assembled from the stored components. Save as src/GeneratedLandingPage.tsx
import { Section, ThemeScope } from './generator/library/ThemeScope'
${base.motion.level === 'off' ? '' : "import type { MotionPlan } from './generator/motionBrain'\n"}${imports}

const content = ${JSON.stringify(base.content, null, 2)}

// Colours made for this prompt (both light and dark mode)
const palette = ${JSON.stringify(base.palette, null, 2)}
${css ? `
// The looks you asked for (buttons, headings, text, corners ...)
const css = ${JSON.stringify(css)}
` : ''}${fontTokens ? `
const fontTokens = ${JSON.stringify(fontTokens, null, 2)}
` : ''}${multi ? `
// The pages of the site: #/about style addresses switch between them (the parts of the other pages are hidden)
const pages = ${JSON.stringify(pagesInfo, null, 2)}
` : ''}${
    base.motion.level === 'off'
      ? ''
      : `
// How the page moves. The CSS for it lives in src/index.css.
const motion: MotionPlan = ${JSON.stringify(base.motion, null, 2)}
`
  }
export default function GeneratedLandingPage() {
  return (
    <ThemeScope theme="${base.themeKey}" palette={palette} content={content}${multi ? ' pages={pages}' : ''} mode="${base.initialMode}"${css ? ' css={css}' : ''}${fontTokens ? ' fontTokens={fontTokens}' : ''}${base.motion.level === 'off' ? '' : ' motion={motion}'}>
${body}
    </ThemeScope>
  )
}
`

  return { multi, pages: multi ? pagesInfo : undefined, initialMode: base.initialMode, css, fontTokens, themeKey: base.themeKey, niche: generated.niche, palette: base.palette, content: base.content, sections, code, tier, brain: base.brain, motion: base.motion, copy: base.copy, brainsForced: base.brainsForced, colorReasons: base.colorReasons }
}

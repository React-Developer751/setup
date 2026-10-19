// Turns a planned multi-page site into
//   * one block of HTML per page, for the live preview in the generator, and
//   * a small React project (router, layout, one file per page) for the Code tab.
// Both come from the same section templates as the single page, so they cannot drift apart.
import type { Tier } from './designBrain'
import type { Fits } from './edit/fit'
import type { Paints } from './edit/sectionColors'
import { coverJsx, gradientAt, renderSections, themeCss, type LayoutId, type PageInfo, type Visuals } from './finalProductionTemplate'
import type { WebsiteContent } from './finalPrompt'
import type { MotionPlan } from './motionBrain'
import type { PagePlan, Post } from './siteTypes'
import type { ColorMode, Theme } from './themes'

export type SiteSpec = {
  brand: string
  theme: Theme
  content: WebsiteContent
  tokens: Record<ColorMode, Record<string, string>>
  initialMode: ColorMode
  tier: Tier
  motion: MotionPlan
  pages: PagePlan[]
  posts: Post[]
  navId: 'navbar-left' | 'navbar-center'
  headerStyle: 'center' | 'left'
  visuals: Visuals
  /** colours of single parts of the page ("footer green"), see edit/sectionColors.ts */
  paints?: Paints
  /** sizes and alignments of single parts ("shorter pricing", "narrower gallery"), see edit/fit.ts */
  fits?: Fits
}

export type SiteFile = { path: string; code: string }

const rootClass = (theme: Theme) => `min-h-screen overflow-x-clip [overflow-wrap:anywhere] ${theme.bg} ${theme.text_main}`

/** The home and about pages show a taste of lists that have their own page. */
function pageContent(content: WebsiteContent, page: PagePlan): WebsiteContent {
  if (page.id === 'home') {
    return {
      ...content,
      features: { ...content.features, items: content.features.items.slice(0, 3) },
      blog: { ...content.blog, posts: content.blog.posts.slice(0, 3) },
    }
  }
  if (page.id === 'about') return { ...content, team: { ...content.team, members: content.team.members.slice(0, 3) } }
  return content
}

function pageInfo(spec: SiteSpec, page: PagePlan): PageInfo {
  const blog = spec.pages.find((p) => p.id === 'blog')
  const crumbs =
    page.id === 'post' && blog
      ? [{ label: 'Home', href: '#home' }, { label: blog.label, href: '#blog' }, { label: page.title }]
      : [{ label: 'Home', href: '#home' }, { label: page.label }]
  return { id: page.id, title: page.title, subtitle: page.subtitle, label: page.label, crumbs, headerStyle: spec.headerStyle }
}

const FOOTER: LayoutId = 'footer-rich'

/** HTML of one page, wrapped in the shared navigation and footer. */
export function compileSiteHtml(spec: SiteSpec, page: PagePlan): string {
  const body = renderSections(
    spec.theme,
    [spec.navId, ...page.sections, FOOTER],
    pageContent(spec.content, page),
    'html',
    spec.tier,
    spec.motion,
    {
      pages: spec.pages,
      current: page.path,
      page: pageInfo(spec, page),
      posts: spec.posts,
      post: page.slug ? spec.posts.find((p) => p.slug === page.slug) : undefined,
    },
    spec.visuals,
    spec.paints,
    spec.fits,
  )
  return `<style>${themeCss(spec.tokens)}</style><div data-mode="${spec.initialMode}" class="g-root ${rootClass(spec.theme)}">${body.join('\n')}\n</div>`
}

// ───────────── the React project ─────────────
const COMPONENT_NAMES: Record<string, string> = {
  home: 'HomePage',
  about: 'AboutPage',
  services: 'ServicesPage',
  pricing: 'PricingPage',
  team: 'TeamPage',
  gallery: 'GalleryPage',
  blog: 'BlogPage',
  faq: 'FaqPage',
  contact: 'ContactPage',
  privacy: 'PrivacyPage',
  terms: 'TermsPage',
  post: 'BlogPostPage',
  notfound: 'NotFoundPage',
}

const indent = (text: string, spaces: number) => text.replace(/\n/g, `\n${' '.repeat(spaces)}`)

const ROUTER = `import { useEffect, useState } from 'react'

/** "#/about" -> "/about" ("#/" or an empty address -> "/") */
const readPath = () => window.location.hash.replace(/^#/, '').replace(/\\/+$/, '') || '/'

/** The current page, from the address bar (#/about). No library needed: it works on any static host. */
export function useHashPath() {
  const [path, setPath] = useState(readPath)

  useEffect(() => {
    const onChange = () => {
      setPath(readPath())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return path
}
`

export function compileSiteFiles(spec: SiteSpec): SiteFile[] {
  const { theme, tier, motion, content } = spec
  const animated = motion.level !== 'off'
  const render = (ids: LayoutId[], page: PagePlan) =>
    renderSections(theme, ids, pageContent(content, page), 'jsx', tier, motion, {
      pages: spec.pages,
      current: page.path,
      page: pageInfo(spec, page),
      posts: spec.posts,
    }, spec.visuals, spec.paints, spec.fits)

  const notFound: PagePlan = { id: 'notfound', path: '/404', label: '404', title: 'Page not found', subtitle: '', sections: ['not-found'], inNav: false }
  const home = spec.pages.find((p) => p.id === 'home') ?? spec.pages[0]

  // ── Layout: shared navigation, footer, colours, theme switch and motion
  const [nav, footer] = [render([spec.navId], home)[0], render([FOOTER], home)[0]]
  const reactTokens = Object.fromEntries(
    Object.entries(spec.tokens).map(([mode, values]) => [
      mode,
      Object.fromEntries(Object.entries(values).map(([key, value]) => [key === 'color-scheme' ? 'colorScheme' : key, value])),
    ]),
  )
  const layout = `import { ${animated ? 'useLayoutEffect, useRef, ' : ''}useState, type CSSProperties, type ReactNode } from 'react'
${animated ? "import type { MotionPlan } from '../generator/motionBrain'\nimport { initMotion } from '../generator/motionRuntime'\n" : ''}
// Colours for both modes. The Tailwind classes read these CSS variables.
const tokens = ${JSON.stringify(reactTokens, null, 2)} as Record<'light' | 'dark', CSSProperties>
${animated ? `\n// How the pages move. The CSS for it lives in src/index.css.\nconst motion: MotionPlan = ${JSON.stringify(motion, null, 2)}\n` : ''}
/** The navigation and footer around every page, plus the light / dark switch. */
export default function Layout({ path, children }: { path: string; children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('${spec.initialMode}')
  // "/blog/some-post" highlights the Blog link
  const active = path.startsWith('/blog/') ? '/blog' : path
${animated ? '  const rootRef = useRef<HTMLDivElement>(null)\n\n  // start the animations again for every page\n  useLayoutEffect(() => initMotion(rootRef.current!, motion), [path])\n' : ''}
  return (
    <div ${animated ? 'ref={rootRef} ' : ''}style={tokens[mode]} className="g-root ${rootClass(theme)}">${indent(nav, 2)}
      {children}${indent(footer, 2)}
    </div>
  )
}
`

  // ── one file per page
  const pages = [...spec.pages.filter((p) => p.id !== 'post'), ...spec.pages.filter((p) => p.id === 'post').slice(0, 1), notFound]
  const covers = JSON.stringify([0, 1, 2, 3].map((i) => gradientAt(theme.gradient, i)))
  const usesPosts = (page: PagePlan) => page.sections.some((id) => id === 'blog-list' || id === 'post-body' || id === 'blog-related')
  const pageFiles: SiteFile[] = pages.map((page) => {
    const body = render(page.sections, page).join('\n')
    const name = COMPONENT_NAMES[page.id]
    const coverArtList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `  ${coverJsx(spec.visuals, i).replace('<svg ', `<svg key="${i}" `)},`).join('\n')
    const header = usesPosts(page) ? `import { posts } from '../data'\n${page.id === 'post' ? "import NotFoundPage from './NotFoundPage'\n" : ''}\n// gradients and drawings for the article covers\nconst COVERS = ${covers}\nconst COVER_ART = [\n${coverArtList}\n]\n\n` : ''
    const signature = page.id === 'post' ? `{ path }: { path: string }` : ''
    const find = page.id === 'post' ? "  const post = posts.find((p) => `/blog/${p.slug}` === path)\n  if (!post) return <NotFoundPage />\n\n" : ''
    return {
      path: `site/pages/${name}.tsx`,
      code: `${header}export default function ${name}(${signature}) {\n${find}  return (\n    <>${indent(body, 2)}\n    </>\n  )\n}\n`,
    }
  })

  // ── the blog's data: one place to edit the articles
  const hasBlog = spec.posts.length > 0 && spec.pages.some((p) => p.id === 'blog')
  const dataFile: SiteFile = {
    path: 'site/data.ts',
    code: `// The articles of the blog. Edit, add or remove entries and the blog pages follow.
export type PostBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] }

export type Post = {
  slug: string
  title: string
  tag: string
  excerpt: string
  author: string
  role: string
  date: string
  readTime: string
  body: PostBlock[]
}

export const posts: Post[] = ${JSON.stringify(spec.posts, null, 2)}
`,
  }

  // ── App: the route table
  const routable = pages.filter((p) => p.id !== 'notfound' && p.id !== 'post')
  const imports = pages.map((p) => `import ${COMPONENT_NAMES[p.id]} from './pages/${COMPONENT_NAMES[p.id]}'`).join('\n')
  const routes = routable.map((p) => `  '${p.path}': ${COMPONENT_NAMES[p.id]},`).join('\n')
  const titles = routable.map((p) => `  '${p.path}': '${(p.id === 'home' ? spec.brand : `${p.label} | ${spec.brand}`).replace(/'/g, "\\'")}',`).join('\n')
  const brand = spec.brand.replace(/'/g, "\\'")
  const app = `// A multi-page site. Save these files under src/site/ and render <App /> from src/main.tsx.
import { useEffect } from 'react'
import Layout from './Layout'
import { useHashPath } from './router'
${hasBlog ? "import { posts } from './data'\n" : ''}${imports}

const routes: Record<string, (props: { path: string }) => React.ReactElement> = {
${routes}
}

const titles: Record<string, string> = {
${titles}
}

export default function App() {
  const path = useHashPath()
${hasBlog ? "  const post = posts.find((p) => `/blog/${p.slug}` === path)\n  const Page = routes[path] ?? (path.startsWith('/blog/') ? BlogPostPage : NotFoundPage)\n" : '  const Page = routes[path] ?? NotFoundPage\n'}
  useEffect(() => {
    document.title = titles[path] ?? ${hasBlog ? "(post ? `${post.title} | " + brand + "` : '404 | " + brand + "')" : "'404 | " + brand + "'"}
  }, [path${hasBlog ? ', post' : ''}])

  return (
    <Layout path={path}>
      <Page path={path} />
    </Layout>
  )
}
`

  return [
    { path: 'site/App.tsx', code: app },
    { path: 'site/Layout.tsx', code: layout },
    { path: 'site/router.ts', code: ROUTER },
    ...(hasBlog ? [dataFile] : []),
    ...pageFiles,
  ]
}

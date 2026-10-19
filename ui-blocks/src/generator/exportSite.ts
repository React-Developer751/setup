// Export: turns a generated site into something you can keep.
//   * `buildProject`    a complete Vite + React + Tailwind project (zip it, `npm install`, `npm run dev`, `npm run build`)
//   * `buildStandalone` one .html file that works offline, double-click to open (multi-page sites use #/routes)
// Both come from the same planned site as the live preview, so what you download is what you saw.
//
// This file reads a few of the generator's own files as text (`?raw`), so it only works inside Vite; the
// generators themselves (generateSite, generateWebsite) stay plain TypeScript.
import indexCss from '../index.css?raw'
import motionBrainSource from './motionBrain.ts?raw'
import motionRuntimeSource from './motionRuntime.ts?raw'
import packageJson from '../../package.json?raw'
import { faviconSvg } from './artBrain'
import { fontLinks } from './fonts'
import { compileSiteHtml, type SiteFile } from './compileSite'
import type { generateSite } from './generateSite'
import type { generateWebsite } from './generateWebsite'
import { MOTION_RUNTIME_JS } from './motionRuntimeJs'
import type { MotionPlan } from './motionBrain'
import { seededRandom } from './random'
import type { PagePlan } from './siteTypes'
import type { ColorMode, ThemeKey } from './themes'
import { createZip, type ZipEntry } from './zip'

export type ExportSource = {
  brand: string
  description: string
  themeKey: ThemeKey
  seed: number
  tokens: Record<ColorMode, Record<string, string>>
  initialMode: ColorMode
  motion: MotionPlan
  /** every page of the site as preview HTML ('/' only for a single page) */
  pages: { path: string; title: string; description: string; html: string; jsonLd?: object }[]
  /** the "page not found" page of a multi-page site */
  notFoundHtml?: string
  /** the React files, relative to src/ */
  files: SiteFile[]
  multi: boolean
  /** the placeholder contact details written into the pages (swapped by `applyDetails`) */
  contact: { email: string; phone: string; address: string }
  /** the address of the finished site, for sitemap and canonical links */
  siteUrl?: string
  /** a form service the forms post to (otherwise they open an email) */
  formEndpoint?: string
}

/** What the person can fill in before exporting: it replaces the placeholders and adds real pictures. */
export type ExportDetails = {
  email?: string
  phone?: string
  address?: string
  /** e.g. https://www.mybusiness.com */
  siteUrl?: string
  /** a form service address (Formspree, Netlify ...): the forms post there instead of opening an email */
  formEndpoint?: string
  /** data: URL of the logo / the hero picture */
  logo?: string
  hero?: string
}

const escHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')

/** Replaces the generated placeholders with the person's own details and pictures. Returns a new source. */
export function applyDetails(source: ExportSource, details: ExportDetails): ExportSource {
  const pairs: [string, string][] = []
  for (const key of ['email', 'phone', 'address'] as const) {
    const to = details[key]?.trim()
    if (to && to !== source.contact[key]) pairs.push([source.contact[key], to])
  }
  const endpoint = details.formEndpoint?.trim()
  const email = details.email?.trim() || source.contact.email

  const swap = (text: string) => {
    let out = text
    for (const [from, to] of pairs) out = out.split(escHtml(from)).join(escHtml(to)).split(from).join(to)
    if (endpoint) out = out.split(`action="mailto:${escHtml(email)}" method="post" enctype="text/plain"`).join(`action="${endpoint.replace(/"/g, '')}" method="post"`)
    if (details.logo) {
      out = out.replace(/<svg width="(\d+)" height="\d+" viewBox="0 0 36 36"[^>]*>[\s\S]*?<\/svg>/g, (tag: string, size: string) => {
        const cls = tag.includes('className=') ? 'className' : 'class'
        return `<img src="${details.logo}" alt="" width="${size}" height="${size}" ${cls}="shrink-0 rounded-full object-cover" />`
      })
    }
    if (details.hero) {
      const home = out.indexOf('id="home"')
      const art = home < 0 ? -1 : out.indexOf('<svg viewBox="0 0 400 300"', home)
      const end = art < 0 ? -1 : out.indexOf('</svg>', art)
      // only the hero's own picture: it must come before the end of the home section
      if (art >= 0 && end >= 0 && !out.slice(home, art).includes('</section>')) {
        const cls = /className="/.test(out.slice(art - 400, art + 400)) ? 'className' : 'class'
        out = `${out.slice(0, art)}<img src="${details.hero}" alt="" ${cls}="absolute inset-0 size-full object-cover" />${out.slice(end + 6)}`
      } else if (home >= 0) {
        // a hero without a drawing (the centred one): the picture goes behind its text
        const open = out.lastIndexOf('<section', home)
        const close = out.indexOf('>', home)
        const tag = out.slice(open, close + 1)
        const cls = tag.includes('className=') ? 'className' : 'class'
        const withClasses = tag.replace(new RegExp(`${cls}="`), `${cls}="relative isolate overflow-hidden `)
        out = `${out.slice(0, open)}${withClasses}<img src="${details.hero}" alt="" ${cls}="absolute inset-0 -z-10 size-full object-cover opacity-30" />${out.slice(close + 1)}`
      }
    }
    return out
  }

  return {
    ...source,
    description: swap(source.description),
    contact: { email: details.email?.trim() || source.contact.email, phone: details.phone?.trim() || source.contact.phone, address: details.address?.trim() || source.contact.address },
    siteUrl: details.siteUrl?.trim().replace(/\/+$/, '') || source.siteUrl,
    formEndpoint: endpoint || source.formEndpoint,
    pages: source.pages.map((page) => ({
      ...page,
      description: swap(page.description),
      html: swap(page.html),
      jsonLd: page.jsonLd ? (JSON.parse(swap(JSON.stringify(page.jsonLd))) as object) : undefined,
    })),
    notFoundHtml: source.notFoundHtml ? swap(source.notFoundHtml) : undefined,
    files: source.files.map((file) => ({ ...file, code: swap(file.code) })),
  }
}

export function sourceFromSite(site: ReturnType<typeof generateSite>): ExportSource {
  const { spec } = site
  const title = (page: PagePlan) =>
    page.id === 'home' ? spec.brand : `${page.slug ? (spec.posts.find((p) => p.slug === page.slug)?.title ?? page.label) : page.label} | ${spec.brand}`
  const notFound: PagePlan = { id: 'notfound', path: '/404', label: '404', title: 'Page not found', subtitle: '', sections: ['not-found'], inNav: false }
  const { contact } = spec.content
  const business = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: spec.brand,
    description: spec.content.hero.subtitle,
    email: contact.email,
    telephone: contact.phone,
    address: contact.address,
  }
  return {
    brand: spec.brand,
    description: spec.content.hero.subtitle,
    themeKey: site.themeKey,
    seed: spec.visuals.seed,
    tokens: spec.tokens,
    initialMode: spec.initialMode,
    motion: spec.motion,
    pages: site.pages.map((page) => {
      const post = page.slug ? spec.posts.find((p) => p.slug === page.slug) : undefined
      return {
        path: page.path,
        title: title(page),
        description: post?.excerpt ?? (page.id === 'home' ? spec.content.hero.subtitle : page.subtitle || spec.content.hero.subtitle),
        html: site.pagesHtml[page.path],
        jsonLd: post
          ? { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.excerpt, author: { '@type': 'Person', name: post.author }, datePublished: post.date }
          : page.id === 'home'
            ? business
            : undefined,
      }
    }),
    notFoundHtml: compileSiteHtml(spec, notFound),
    files: site.files,
    multi: true,
    contact: { email: contact.email, phone: contact.phone, address: contact.address },
  }
}

export function sourceFromPage(page: ReturnType<typeof generateWebsite>): ExportSource {
  const brand = page.content.brandName
  return {
    brand,
    description: page.content.hero.subtitle,
    themeKey: page.themeKey,
    seed: page.visuals.seed,
    tokens: page.tokens,
    initialMode: page.initialMode,
    motion: page.motion,
    pages: [{ path: '/', title: brand, description: page.content.hero.subtitle, html: page.html }],
    files: [{ path: 'App.tsx', code: page.code }],
    multi: false,
    contact: { email: page.content.contact.email, phone: page.content.contact.phone, address: page.content.contact.address },
  }
}

export const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'my-website'
export const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const favicon = (source: ExportSource) => {
  const tokens = source.tokens[source.initialMode]
  return faviconSvg(source.themeKey, source.brand, seededRandom(source.seed + 17), tokens['--g-accent'], tokens['--g-on-accent'])
}

export const projectName = (source: ExportSource) => slugify(source.brand)

// ───────────── the Vite project ─────────────
/** The motion runtime as one file of the exported project: its types plus the engine. */
export function motionFile() {
  const start = motionBrainSource.indexOf('export type MotionSetting')
  const end = motionBrainSource.indexOf('const STYLE_BY_THEME')
  const types = motionBrainSource.slice(start, end).trim()
  return `${motionRuntimeSource.replace("import type { MotionPlan } from './motionBrain'", types)}`
}

/** Just the motion part of src/index.css (the generator's own styles are not part of an exported site). */
export const motionCss = () => indexCss.slice(indexCss.indexOf('/* ───────────────────────── motion'))

export function buildProject(source: ExportSource): ZipEntry[] {
  const pkg = JSON.parse(packageJson) as { dependencies: Record<string, string>; devDependencies: Record<string, string> }
  const name = projectName(source)
  const animated = source.motion.level !== 'off'
  const dir = source.multi ? 'src/site' : 'src'
  const rewrite = (code: string) => code.replace(/'(?:\.\.\/|\.\/)generator\/(?:motionBrain|motionRuntime)'/g, "'./motion'")

  const files: ZipEntry[] = [
    {
      path: 'package.json',
      content:
        JSON.stringify(
          {
            name,
            private: true,
            version: '1.0.0',
            type: 'module',
            scripts: { dev: 'vite', build: 'tsc -b && vite build', preview: 'vite preview' },
            dependencies: { react: pkg.dependencies.react, 'react-dom': pkg.dependencies['react-dom'] },
            devDependencies: {
              '@tailwindcss/forms': pkg.dependencies['@tailwindcss/forms'],
              '@tailwindcss/vite': pkg.dependencies['@tailwindcss/vite'],
              '@types/react': pkg.devDependencies['@types/react'],
              '@types/react-dom': pkg.devDependencies['@types/react-dom'],
              '@vitejs/plugin-react': pkg.devDependencies['@vitejs/plugin-react'],
              tailwindcss: pkg.dependencies.tailwindcss,
              typescript: pkg.devDependencies.typescript,
              vite: pkg.devDependencies.vite,
            },
          },
          null,
          2,
        ) + '\n',
    },
    {
      path: 'index.html',
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(source.brand)}</title>
    <meta name="description" content="${escapeHtml(source.description)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    ${fontLinks(source.themeKey).replace(/\n/g, '\n    ')}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    { path: 'public/favicon.svg', content: favicon(source) + '\n' },
    {
      path: 'vite.config.ts',
      content: `import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// base './' lets the built site live in any folder or sub-path of a web server
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
`,
    },
    {
      path: 'tsconfig.json',
      content:
        JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2022',
              lib: ['ES2023', 'DOM', 'DOM.Iterable'],
              module: 'ESNext',
              moduleResolution: 'bundler',
              types: ['vite/client'],
              jsx: 'react-jsx',
              strict: true,
              skipLibCheck: true,
              noEmit: true,
              isolatedModules: true,
              allowImportingTsExtensions: true,
            },
            include: ['src'],
          },
          null,
          2,
        ) + '\n',
    },
    { path: '.gitignore', content: 'node_modules\ndist\n' },
    {
      path: 'src/index.css',
      content: `@import "tailwindcss";
@plugin "@tailwindcss/forms";

html {
  scroll-behavior: smooth;
  scroll-padding-top: 5rem; /* keeps the sticky navigation off the top of an anchor */
}

${motionCss()}`,
    },
    {
      path: 'src/main.tsx',
      content: `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './${source.multi ? 'site/App' : 'App'}'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`,
    },
    {
      path: 'README.md',
      content: `# ${source.brand}

A ${source.multi ? 'multi-page' : 'single-page'} website made with the offline website generator (React + Vite + Tailwind CSS). It is fully static: no server, no database.

## Run it

\`\`\`bash
npm install
npm run dev      # open the address it prints
npm run build    # the finished site is in dist/
\`\`\`

## Put it online

Upload the \`dist/\` folder to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages, any web server).
${source.multi ? 'Pages use "#/" addresses (for example `/#/about`), so no server rules are needed.\n' : ''}
## Edit it

${
  source.multi
    ? '- `src/site/pages/` one file per page. Change the text right inside.\n- `src/site/data.ts` the blog articles (edit, add or remove entries).\n- `src/site/Layout.tsx` the navigation, footer, colours and light / dark switch.\n'
    : '- `src/App.tsx` the whole page. Change the text right inside; the colours are at the top of the file.\n'
}${animated ? `- \`${dir}/motion.ts\` the animation engine; its settings are at the top of ${source.multi ? 'Layout.tsx' : 'App.tsx'}.\n` : ''}
The contact and newsletter forms open the visitor's email program by default: connect them to a form service (Formspree, Netlify Forms ...) to receive messages directly.
${source.multi ? 'The Privacy Policy and Terms of Service pages are general templates, not legal advice: have them checked for your business.\n' : ''}
`,
    },
    { path: 'src/vite-env.d.ts', content: '/// <reference types="vite/client" />\n' },
    ...(animated ? [{ path: `${dir}/motion.ts`, content: motionFile() }] : []),
    ...source.files.map((file) => ({ path: file.path === 'App.tsx' ? 'src/App.tsx' : `src/${file.path}`, content: rewrite(file.code) })),
  ]
  return files.map((file) => ({ ...file, path: `${name}/${file.path}` }))
}

export const buildZip = (source: ExportSource) => createZip(buildProject(source))

// ───────────── one .html file ─────────────
const splitTopLevel = (selector: string) => {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of selector) {
    if (ch === '(' || ch === '[') depth++
    if (ch === ')' || ch === ']') depth--
    if (ch === ',' && depth === 0) {
      parts.push(current)
      current = ''
    } else current += ch
  }
  return [...parts, current]
}

const unescapeClass = (token: string) =>
  token.replace(/\\([0-9a-f]{1,6}) ?/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16))).replace(/\\(.)/g, '$1')

/** The page's CSS: the styles of this app, without the rules for classes that none of the pages uses. */
export function usedCss(htmls: string[], prune = true): string {
  const classes = new Set<string>()
  for (const html of htmls) for (const match of html.matchAll(/class="([^"]*)"/g)) match[1].split(/\s+/).forEach((c) => classes.add(c))
  // classes that only the motion script puts on the elements (the rotating testimonials show their slide through `is-active`)
  for (const c of ['is-active', 'is-in', 'm-lift']) classes.add(c)

  const wanted = (selector: string) =>
    !prune ||
    splitTopLevel(selector).some((part) => [...part.matchAll(/\.((?:\\[0-9a-f]{1,6} ?|\\.|[\w-])+)/gi)].every((m) => classes.has(unescapeClass(m[1]))))

  const keep = (rule: CSSRule): string => {
    if (rule instanceof CSSStyleRule) return wanted(rule.selectorText) ? rule.cssText : ''
    if (rule instanceof CSSLayerBlockRule || rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule || rule instanceof CSSContainerRule) {
      const inner = [...rule.cssRules].map(keep).join('')
      return inner ? `${rule.cssText.slice(0, rule.cssText.indexOf('{'))}{${inner}}` : ''
    }
    return rule.cssText
  }

  const out: string[] = []
  for (const sheet of document.styleSheets) {
    try {
      out.push([...sheet.cssRules].map(keep).join(''))
    } catch {
      // a sheet from another origin cannot be read; the generator has none
    }
  }
  const css = out.join('\n')
  // keyframes nobody refers to are dropped as well
  if (!prune) return css
  return css.replace(/@keyframes ([\w-]+)\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, (block, name: string) => (css.split(name).length > 2 ? block : ''))
}

/** The CSS of the whole export: the app's styles without the rules no page uses. */
export const buildPageCss = (source: ExportSource) => usedCss([...source.pages.map((p) => p.html), source.notFoundHtml ?? ''])

export const jsString = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c')

export function buildStandalone(source: ExportSource): string {
  const pages = Object.fromEntries(source.pages.map((p) => [p.path, p.html]))
  const titles = Object.fromEntries(source.pages.map((p) => [p.path, p.title]))
  const svg = favicon(source)
  const css = buildPageCss(source)

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(source.brand)}</title>
<meta name="description" content="${escapeHtml(source.description)}" />
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(svg)}" />
${fontLinks(source.themeKey)}
<style>${css}
html{scroll-behavior:smooth;scroll-padding-top:5rem}body{margin:0}</style>
</head>
<body>
<div id="app"></div>
<script>
// ${source.multi ? 'A multi-page site: every page is in this file, and #/about style addresses switch between them.' : 'A single-page site.'}
const PAGES = ${jsString(pages)};
const TITLES = ${jsString(titles)};
const NOT_FOUND = ${jsString(source.notFoundHtml ?? '')};
const MOTION = ${jsString(source.motion)};
const MULTI = ${source.multi};

${MOTION_RUNTIME_JS}

const app = document.getElementById('app');
let stop = null;
let mode = null;

function show() {
  const path = location.hash.replace(/^#/, '').replace(/\\/+$/, '') || '/';
  const html = MULTI ? (PAGES[path] || NOT_FOUND) : PAGES['/'];
  if (stop) stop();
  app.innerHTML = html;
  const root = app.querySelector('.g-root');
  if (mode) root.setAttribute('data-mode', mode);
  document.title = TITLES[path] || (MULTI ? '404 | ' + TITLES['/'] : TITLES['/']);
  // inside the generator's preview frame: tell which page is shown
  if (window.parent !== window) { try { window.parent.postMessage({ site: 'preview-route', path: path }, '*'); } catch (e) {} }
  if (MULTI) window.scrollTo(0, 0);
  stop = initMotion(root, MOTION);
}

document.addEventListener('click', (event) => {
  // inside the generator's preview frame a "#..." link would be resolved against the generator's own address: handle it here
  const anchor = event.target.closest('a[href^="#"]');
  if (anchor && window.parent !== window) {
    event.preventDefault();
    const target = anchor.getAttribute('href');
    if (target.startsWith('#/')) location.hash = target;
    else if (target === '#') window.scrollTo(0, 0);
    else { try { const element = document.querySelector(target); if (element) element.scrollIntoView({ behavior: 'smooth' }); } catch (e) {} }
    const menu = anchor.closest('details');
    if (menu) menu.removeAttribute('open');
    return;
  }
  const toggle = event.target.closest('[data-theme-toggle]');
  if (toggle) {
    const root = toggle.closest('.g-root');
    mode = root.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-mode', mode);
    return;
  }
  const link = event.target.closest('a');
  const menu = event.target.closest('details');
  if (link && menu) menu.removeAttribute('open');
});

if (MULTI) window.addEventListener('hashchange', show);
show();
</script>
</body>
</html>
`
}

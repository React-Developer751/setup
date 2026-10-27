// Export of a page built from the stored components ("My 92 components").
//   * `buildLibraryProject`    a Vite project: the page, the components it uses, the small runtime around them
//                              (ThemeScope, content filling, colours) and the images they need
//   * `buildLibraryStandalone` one .html file: the finished page with its CSS, light / dark switch, animations and,
//                              when a component needs it, Preline's script for menus and accordions
// Like exportSite.ts this reads files as text (`?raw`), so it only runs inside Vite.
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import indexCss from '../index.css?raw'
import packageJson from '../../package.json?raw'
import prelineScript from '../../node_modules/preline/dist/preline.js?raw'
import extraContentSource from './extraContent.ts?raw'
import { faviconSvg } from './artBrain'
import { escapeHtml, jsString, slugify, usedCss, type ExportDetails } from './exportSite'
import { seededRandom } from './random'
import finalPromptSource from './finalPrompt.ts?raw'
import type { generateLibraryPage } from './library/generateLibraryPage'
import { libraryComponents } from './library/libraryComponents'
import { repairContrast } from './library/pageAudit'
import { libraryWithDetails, safeSiteUrl, xmlEscape } from './library/exportDetails'
import { contentTypesFrom, libraryProjectEntries } from './library/projectBuilder'

export { libraryWithDetails }
import motionBrainSource from './motionBrain.ts?raw'
import { libraryThemeStyle } from './library/libraryTheme'
import { deployFiles } from './deploy'
import { fontLinksFor } from './fonts'
import { Section, ThemeScope } from './library/ThemeScope'
import { MOTION_RUNTIME_JS } from './motionRuntimeJs'
import siteTypesSource from './siteTypes.ts?raw'
import { onColor, type ColorMode } from './themes'
import { createZip, type ZipEntry } from './zip'

type Library = ReturnType<typeof generateLibraryPage>

const componentSources = import.meta.glob<string>('../components/*/*.tsx', { query: '?raw', import: 'default' })

export const libraryProjectName = (lib: Library) => slugify(lib.content.brandName)

/** images that the used components point at (assets/img/...), read from the running app */
async function assetFiles(sources: string[]): Promise<ZipEntry[]> {
  const paths = new Set(sources.flatMap((code) => [...code.matchAll(/assets\/[\w\-./]+\.(?:webp|png|jpe?g|svg|gif|avif)/g)].map((m) => m[0])))
  const found: ZipEntry[] = []
  for (const path of paths) {
    try {
      const response = await fetch(`/${path}`)
      // a dev server answers a missing file with the app's own page, so check that it really is an image
      if (response.ok && response.headers.get('content-type')?.startsWith('image/')) found.push({ path: `public/${path}`, content: new Uint8Array(await response.arrayBuffer()) })
    } catch {
      // the image is simply left out
    }
  }
  return found
}

const generatorSources = import.meta.glob<string>('./{*,library/*,edit/*,art/*,kits/*}.{ts,tsx}', { query: '?raw', import: 'default' })
const dataSources = import.meta.glob<string>('../data/premiumPalettes.json', { query: '?raw', import: 'default' })

export async function buildLibraryProject(lib: Library): Promise<ZipEntry[]> {
  const entries = await libraryProjectEntries(lib, {
    packageJson,
    indexCss,
    readSource: async (path) => {
      const load = path.startsWith('data/') ? dataSources[`../${path}`] : generatorSources[`./${path.replace(/^generator\//, '')}`]
      return load ? load() : undefined
    },
    readComponent: (id) => componentSources[`../components/${id}.tsx`](),
    contentTypes: () => contentTypesFrom(finalPromptSource, extraContentSource, siteTypesSource),
    motionTypes: () => motionBrainSource.slice(motionBrainSource.indexOf('export type MotionSetting'), motionBrainSource.indexOf('const STYLE_BY_THEME')).trim() + '\n',
    assets: (sources) => assetFiles(sources),
  })
  return entries as ZipEntry[]
}

export const buildLibraryZip = async (lib: Library) => createZip(await buildLibraryProject(lib))

// ───────────── one .html file ─────────────
const SUN = '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>'
const MOON = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>'

const cssText = (style: object) =>
  Object.entries(style)
    .map(([key, value]) => `${key.startsWith('--') ? key : key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${value}`)
    .join(';')

/** the script of a site with pages: the parts of the page in the address (#/about) are shown, the others hidden; the first page is the home page */
const pagesScript = (lib: Library) =>
  lib.pages && lib.pages.length > 1
    ? `
const PAGES = ${jsString(lib.pages)};
function route() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const known = PAGES.some((p) => p.path === raw) ? raw : '/';
  document.querySelectorAll('[data-page]').forEach((el) => { el.hidden = !(el.dataset.page === '*' || el.dataset.page === known); });
  const info = PAGES.find((p) => p.path === known);
  if (info) document.title = info.title;
  document.querySelectorAll('a').forEach((a) => { if (a.getAttribute('href') === '#' + known) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (window.parent !== window) { try { window.parent.postMessage({ site: 'preview-route', path: known }, '*'); } catch (e) {} }
}
window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });
route();
`
    : ''

function renderLibrary(lib: Library) {
  // draw the page once in memory: the components, then ThemeScope fills their text and sets the colours
  const host = document.createElement('div')
  const root = createRoot(host)
  try {
    flushSync(() =>
      root.render(
        <ThemeScope theme={lib.themeKey} palette={lib.palette} content={lib.content} pages={lib.pages} mode={lib.initialMode} css={lib.css} fontTokens={lib.fontTokens}>
          {lib.sections.map(({ role, componentId, paint, fit, band, page, head }, index) => {
            const Component = libraryComponents[componentId]
            // a part whose component is not known is left out, not a reason to lose the whole page
            if (!Component) return null
            return (
              <Section key={`${role}-${index}`} role={role} paint={paint} fit={fit} band={band} page={page} head={head}>
                <Component />
              </Section>
            )
          })}
        </ThemeScope>,
      ),
    )
  } catch (error) {
    // a part that throws while it is drawn: the drawing is taken down, the caller decides what to show
    root.unmount()
    throw error
  }
  const styles = Object.fromEntries((['light', 'dark'] as ColorMode[]).map((mode) => [mode, cssText(libraryThemeStyle(lib.palette, mode, lib.themeKey, lib.fontTokens).style)]))
  // the finished page is looked at in a browser, in both modes: a text that cannot be read on what is behind it gets a readable colour (pageAudit.ts)
  const page = host.firstElementChild as HTMLElement | null
  if (page && typeof document !== 'undefined' && document.body) {
    host.style.cssText = 'position:absolute;left:-9999px;top:0;width:1280px'
    document.body.appendChild(host)
    // colours that are fading to another mode would be measured half way
    const still = document.createElement('style')
    still.textContent = '*{transition:none!important;animation:none!important}'
    document.head.appendChild(still)
    try {
      const first = lib.initialMode
      // every page is looked at, also the ones that are hidden now
      const inner = [...page.querySelectorAll<HTMLElement>('[data-page]')]
      const hiddenBefore = inner.map((el) => el.hidden)
      inner.forEach((el) => (el.hidden = false))
      repairContrast(page, (mode) => {
        page.setAttribute('style', styles[mode])
        page.classList.toggle('dark', mode === 'dark')
      }, [first, first === 'light' ? 'dark' : 'light'])
      page.setAttribute('style', styles[first])
      page.classList.toggle('dark', first === 'dark')
      inner.forEach((el, i) => (el.hidden = hiddenBefore[i]))
    } catch {
      // the repair is a help: a page that cannot be checked is used as it is
    } finally {
      still.remove()
      host.remove()
    }
  }
  const html = host.innerHTML
  root.unmount()

  const needsPreline = /data-hs-|\bhs-/.test(html)
  const css = usedCss([html], false)
  return { html, styles, needsPreline, css }
}

export function buildLibraryStandalone(lib: Library): string {
  const { html, styles, needsPreline, css } = renderLibrary(lib)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(lib.content.brandName)}</title>
<meta name="description" content="${escapeHtml(lib.content.hero.subtitle)}" />
${fontLinksFor(lib.themeKey, lib.fontTokens)}
<style>${css}
html{scroll-behavior:smooth;scroll-padding-top:5rem}body{margin:0}</style>
</head>
<body>
${html}
${needsPreline ? `<script>${prelineScript.replace(/<\/script/gi, '<\\/script')}</script>\n` : ''}<script>
const STYLES = ${jsString(styles)};
const MOTION = ${jsString(lib.motion)};
const SUN = ${jsString(SUN)};
const MOON = ${jsString(MOON)};

${MOTION_RUNTIME_JS}

const page = document.querySelector('[data-gen-theme]');
let mode = ${jsString(lib.initialMode)};

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
  const toggle = event.target.closest('[aria-label="Toggle dark mode"]');
  if (!toggle) return;
  mode = mode === 'dark' ? 'light' : 'dark';
  page.setAttribute('style', STYLES[mode]);
  page.classList.toggle('dark', mode === 'dark');
  const icon = toggle.querySelector('svg');
  if (icon) icon.innerHTML = mode === 'dark' ? SUN : MOON;
});

${needsPreline ? 'if (window.HSStaticMethods) window.HSStaticMethods.autoInit();\n' : ''}initMotion(page, MOTION);
${pagesScript(lib)}</script>
</body>
</html>
`
}

// ───────────── a folder of plain files (index.html + assets) ─────────────
const PLACEHOLDER_URL = 'https://www.example.com'

export function buildLibraryStaticFiles(lib: Library, details: ExportDetails = {}): ZipEntry[] {
  const { html, styles, needsPreline, css } = renderLibrary(lib)
  const brand = lib.content.brandName
  const description = lib.content.hero.subtitle
  const siteUrl = safeSiteUrl(details.siteUrl, PLACEHOLDER_URL)
  const mode = lib.initialMode
  const palette = lib.palette[mode]
  const favicon = faviconSvg(lib.themeKey, brand, seededRandom(lib.content.brandName.length + 17), palette.accent, onColorOf(palette.accent))
  const business = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: brand,
    description,
    email: lib.content.contact.email,
    telephone: lib.content.contact.phone,
    address: lib.content.contact.address,
  }
  const script = `${MOTION_RUNTIME_JS}

const STYLES = ${JSON.stringify(styles)};
const MOTION = ${JSON.stringify(lib.motion)};
const SUN = ${JSON.stringify(SUN)};
const MOON = ${JSON.stringify(MOON)};
const page = document.querySelector('[data-gen-theme]');
let mode = ${JSON.stringify(mode)};
try { mode = localStorage.getItem('site-mode') || mode; } catch (e) {}
function apply() {
  page.setAttribute('style', STYLES[mode]);
  page.classList.toggle('dark', mode === 'dark');
  const icon = document.querySelector('[aria-label="Toggle dark mode"] svg');
  if (icon) icon.innerHTML = mode === 'dark' ? SUN : MOON;
}
apply();
document.addEventListener('click', (event) => {
  if (!event.target.closest('[aria-label="Toggle dark mode"]')) return;
  mode = mode === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('site-mode', mode); } catch (e) {}
  apply();
});
if (window.HSStaticMethods) window.HSStaticMethods.autoInit();
initMotion(page, MOTION);
${pagesScript(lib)}`
  const index = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(brand)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(siteUrl)}/" />
<meta property="og:title" content="${escapeHtml(brand)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:type" content="website" />
${fontLinksFor(lib.themeKey, lib.fontTokens)}
<meta property="og:site_name" content="${escapeHtml(brand)}" />
<meta name="twitter:card" content="summary" />
<meta name="theme-color" content="${palette.bg}" />
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg" />
<link rel="stylesheet" href="assets/style.css" />
<script type="application/ld+json">${JSON.stringify(business).replace(/</g, '\\u003c')}</script>
</head>
<body>
${html}
${needsPreline ? '<script src="assets/preline.js"></script>\n' : ''}<script src="assets/site.js" defer></script>
</body>
</html>
`
  const today = new Date().toISOString().slice(0, 10)
  return [
    { path: 'index.html', content: index },
    { path: 'assets/style.css', content: `${css}\nhtml{scroll-behavior:smooth;scroll-padding-top:5rem}body{margin:0}\n` },
    { path: 'assets/site.js', content: script },
    { path: 'assets/favicon.svg', content: favicon + '\n' },
    ...(needsPreline ? [{ path: 'assets/preline.js', content: prelineScript }] : []),
    { path: 'sitemap.xml', content: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${xmlEscape(siteUrl)}/</loc><lastmod>${today}</lastmod></url>\n</urlset>\n` },
    { path: 'robots.txt', content: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl.replace(/\s/g, '')}/sitemap.xml\n` },
    ...deployFiles(brand),
    {
      path: 'README.txt',
      content: `${brand}: ${lib.pages && lib.pages.length > 1 ? `a static website with ${lib.pages.length} pages (${lib.pages.map((p) => p.label).join(', ')}) in plain HTML, CSS and JavaScript. The pages are switched by the address (index.html#/about), so no server rules are needed.` : 'a one-page static website (plain HTML, CSS and JavaScript).'}

  1. Upload everything in this folder to any web host, or open index.html by double-click.
  2. ${siteUrl !== PLACEHOLDER_URL ? `The address ${siteUrl} is already in the sitemap, robots.txt and the canonical link.` : `Replace ${PLACEHOLDER_URL} with your real address in sitemap.xml, robots.txt and index.html.`}
  3. Check the email, phone number and address (they are placeholders unless you filled them in).
  4. The form layouts come from the stored components and are not connected to anything yet: connect them to a form service
     such as Formspree or Netlify Forms.
`,
    },
  ].map((file) => ({ ...file, path: `${libraryProjectName(lib)}-static/${file.path}` }))
}

export const buildLibraryStaticZip = (lib: Library, details: ExportDetails = {}) => createZip(buildLibraryStaticFiles(lib, details))

/** the readable text colour on an accent (same rule as the generator's) */
const onColorOf = (hex: string) => onColor(hex)

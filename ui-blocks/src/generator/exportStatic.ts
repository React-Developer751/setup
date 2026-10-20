// Export as a folder of plain HTML files: index.html, about.html, blog-<post>.html ... plus one stylesheet, one script,
// sitemap.xml and robots.txt. Every page is a real file with its own <title>, description, social tags and structured
// data, so search engines can index each page. Upload the folder to any web host; no build step, no server.
//
// It is built from the same pages as the live preview (see exportSite.ts), with the "#/about" links turned into "about.html".
import { buildPageCss, escapeHtml, favicon, projectName, type ExportSource } from './exportSite'
import { deployFiles } from './deploy'
import { fontLinksFor } from './fonts'
import { MOTION_RUNTIME_JS } from './motionRuntimeJs'
import { createZip, type ZipEntry } from './zip'

/** "/" -> index.html, "/about" -> about.html, "/blog/some-post" -> blog-some-post.html */
export const fileFor = (path: string) => (path === '/' ? 'index.html' : `${path.replace(/^\//, '').replace(/\//g, '-')}.html`)

const PLACEHOLDER_URL = 'https://www.example.com'

const SCRIPT = (motion: object) => `${MOTION_RUNTIME_JS}

// light / dark: remembered between pages
const MOTION = ${JSON.stringify(motion)};
const page = document.querySelector('.g-root');
let saved = null;
try { saved = localStorage.getItem('site-mode'); } catch (e) {}
if (saved) page.setAttribute('data-mode', saved);

document.addEventListener('click', (event) => {
  const toggle = event.target.closest('[data-theme-toggle]');
  if (toggle) {
    const next = page.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
    page.setAttribute('data-mode', next);
    try { localStorage.setItem('site-mode', next); } catch (e) {}
    return;
  }
  const menu = event.target.closest('details');
  if (menu && event.target.closest('a')) menu.removeAttribute('open');
});

initMotion(page, MOTION);
`

export function buildStaticFiles(source: ExportSource): ZipEntry[] {
  const SITE_URL = source.siteUrl || PLACEHOLDER_URL
  const css = buildPageCss(source)
  const all = source.pages.map((p) => ({ ...p, file: fileFor(p.path) }))
  const linkMap = new Map(all.map((p) => [p.path, p.file]))
  const withFiles = (html: string) => html.replace(/href="#(\/[^"]*)"/g, (match, path: string) => (linkMap.has(path) ? `href="${linkMap.get(path)}"` : match))

  const render = (title: string, description: string, html: string, file: string, jsonLd?: object, noindex = false) => {
    // the <style> with the colour variables moves into <head>
    const style = html.match(/^<style>[\s\S]*?<\/style>/)?.[0] ?? ''
    const body = withFiles(style ? html.slice(style.length) : html)
    const url = `${SITE_URL}/${file === 'index.html' ? '' : file}`
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
${noindex ? '<meta name="robots" content="noindex" />\n' : `<link rel="canonical" href="${url}" />\n`}<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:type" content="${jsonLd && 'headline' in jsonLd ? 'article' : 'website'}" />
<meta property="og:site_name" content="${escapeHtml(source.brand)}" />
<meta name="twitter:card" content="summary" />
<meta name="theme-color" content="${source.tokens[source.initialMode]['--g-bg']}" />
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg" />
${fontLinksFor(source.themeKey, source.tokens.light)}
<link rel="stylesheet" href="assets/style.css" />
${style}
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>\n` : ''}</head>
<body>
${body}
<script src="assets/site.js" defer></script>
</body>
</html>
`
  }

  const pages: ZipEntry[] = all.map((p) => ({ path: p.file, content: render(p.title, p.description, p.html, p.file, p.jsonLd) }))
  if (source.notFoundHtml) pages.push({ path: '404.html', content: render(`Page not found | ${source.brand}`, 'This page does not exist.', source.notFoundHtml, '404.html', undefined, true) })

  const today = new Date().toISOString().slice(0, 10)
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map((p) => `  <url><loc>${SITE_URL}/${p.file === 'index.html' ? '' : p.file}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`

  return [
    ...pages,
    { path: 'assets/style.css', content: css },
    { path: 'assets/site.js', content: SCRIPT(source.motion) },
    { path: 'assets/favicon.svg', content: favicon(source) + '\n' },
    { path: 'sitemap.xml', content: sitemap },
    { path: 'robots.txt', content: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n` },
    ...deployFiles(source.brand),
    {
      path: 'README.txt',
      content: `${source.brand}: a static website (plain HTML, CSS and JavaScript).

HOW TO USE
  1. Upload everything in this folder to any web host (Netlify, GitHub Pages, Cloudflare Pages, shared hosting ...).
  2. Or open index.html by double-click to look at it on your computer.

BEFORE YOU PUBLISH
  * ${source.siteUrl ? `The site address ${SITE_URL} is already in sitemap.xml, robots.txt and the canonical links.` : `Replace ${SITE_URL} with your real address in sitemap.xml, robots.txt and the canonical links of the pages
    (search the files for "example.com").`}
  * Check the email, phone number and address on the Contact page, in the footer and in the Privacy / Terms pages${source.contact.email.endsWith('.example') ? ' (the placeholder email ends in .example on purpose)' : ''}.
  * ${source.formEndpoint ? 'The forms post to your form service.' : 'The contact form opens the visitor\'s email program (mailto:). To receive messages directly, point the form\'s "action" at a form service such as Formspree or Netlify Forms.'}
  * The Privacy Policy and Terms of Service are general templates, not legal advice: have them checked for your business.
  * Social sharing cards: add an image with <meta property="og:image" content="..."> if you have one.

${source.pages.length} page${source.pages.length === 1 ? '' : 's'}: ${all.map((p) => p.file).join(', ')}
`,
    },
  ].map((file) => ({ ...file, path: `${projectName(source)}-static/${file.path}` }))
}

export const buildStaticZip = (source: ExportSource) => createZip(buildStaticFiles(source))

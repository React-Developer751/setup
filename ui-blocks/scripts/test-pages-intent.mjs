// "single page" / "landing page" in a prompt gives one page, "multi-page" gives a site with pages, nothing said changes nothing.
import { loadGeneratorModule } from './lib/load-generator.mjs'
const { pagesWanted } = await loadGeneratorModule('edit/pagesIntent.ts')
let pass = 0
const fail = []
const ok = (c, n) => (c ? (pass += 1) : fail.push(n))
for (const p of ['ek single page landing page banao dental clinic ke liye', 'create a landing page for a gym', 'one page website for a bakery', 'mujhe ek hi page chahiye', 'single-page site for a lawyer', 'one-pager for my cafe']) ok(pagesWanted(p) === 'single', `single: ${p}`)
for (const p of ['multi-page website for a school', 'a website with 5 pages for my clinic', 'multiple pages: home, about, contact', 'alag alag pages wali website', 'multiple page website banao', 'mujhe multiple page chahiye', 'multipage site for a cafe', 'kai page ki website', 'website with about, services and contact pages', '3 page website for a gym', 'Multi Page dental clinic website']) ok(pagesWanted(p) === 'multi', `multi: ${p}`)
for (const p of ['dental clinic called Smile Care in Pune', 'pizza shop in Mumbai', 'website for a yoga studio']) ok(pagesWanted(p) === undefined, `nothing: ${p}`)
ok(pagesWanted('not a multi-page site, just a single page') === 'single', 'single wins when both are said')
// ── the pages of a multi-page site always have something to show
globalThis.document = { styleSheets: [] }
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { editsFrom } = await loadGeneratorModule('edit/edits.ts')
for (const prompt of ['dental clinic called Smile Care in Pune with implants, braces and whitening', 'Italian restaurant called Forno Rosso in Mumbai with pizza, pasta and tiramisu']) {
  for (const hidden of [[], ['pricing', 'team', 'blog', 'testimonials']]) {
    const lib = generateLibraryPage(prompt, 3, 'premium', true, 'auto', editsFrom(hidden.map((section) => ({ op: 'remove', section }))), true)
    const pages = lib.pages ?? []
    const rolesOf = (path) => lib.sections.filter((x) => x.page === path).map((x) => x.role).filter((r) => r !== 'pagehead')
    ok(pages.every((p) => rolesOf(p.path).length >= 1), `every page has a part (${prompt.slice(0, 12)}, hidden ${hidden.length})`)
    ok(rolesOf('/').filter((r) => ['hero', 'features', 'steps', 'gallery', 'stats'].includes(r)).length >= 3, `the home page carries the hero, the services and more (${prompt.slice(0, 12)})`)
    ok(!(hidden.includes('pricing') && pages.some((p) => p.path === '/pricing')), 'a price page is not listed when there is no price list')
    ok(!pages.some((p) => p.path === '/pricing' && rolesOf('/pricing').join() === 'faq'), 'the questions are not hidden on a page called Pricing')
  }
}
console.log(`pages-intent: ${pass} checks passed, ${fail.length} failed`)
if (fail.length) { console.log(fail.map((f) => ` - ${f}`).join('\n')); process.exit(1) }

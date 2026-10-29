// "single page" / "landing page" in a prompt gives one page, "multi-page" gives a site with pages, nothing said changes nothing.
import { loadGeneratorModule } from './lib/load-generator.mjs'
const { pagesWanted, autoPages } = await loadGeneratorModule('edit/pagesIntent.ts')
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
// nobody has to choose: the prompt says it, or the kind of business does
const CASES = [
  ['dental clinic Smile Care in Pune, braces, implants', 'healthcare', 'single'],
  ['meri bakery hai Jaipur me, eggless cakes aur cookies, WhatsApp par order', 'food_dining', 'single'],
  ['SaaS tool for invoicing small shops', 'modern_tech', 'single'],
  ['kurti boutique Jaipur', 'fashion_retail', 'single'],
  ['a landing page for my gym', 'bold_fitness', 'single'],
  ['ek page ki website chahiye mujhe salon ke liye', 'beauty_wellness', 'single'],
  ['hospital multi speciality 24x7 emergency with departments, doctors, appointment', 'healthcare', 'multi'],
  ['school Sunrise Public School Lucknow admissions, fees, facilities, events', 'education', 'multi'],
  ['portfolio for a photographer with gallery, about and contact', 'creative_studio', 'multi'],
  ['restaurant with menu, gallery, reservations and about', 'food_dining', 'multi'],
  ['company website for packers and movers across India', 'home_services', 'multi'],
  ['multi page website for a law firm', 'professional_services', 'multi'],
  ['Italian restaurant Forno Rosso in Mumbai, wood fired pizza, fresh pasta, tiramisu, open 12pm to 11pm, online booking, family seating', 'food_dining', 'multi'],
]
for (const [prompt, theme, mode] of CASES) {
  const got = autoPages(prompt, theme)
  ok(got.mode === mode && got.reason.length > 10, `"${prompt.slice(0, 40)}" is ${mode} (${got.mode}: ${got.reason})`)
}
// an explicit word always wins over the kind of business
ok(autoPages('one page website for a hospital with departments, doctors, rooms', 'healthcare').mode === 'single', 'one page asked for: one page, even for a hospital')
ok(autoPages('multiple pages for a tiny tea stall', 'food_dining').mode === 'multi', 'several pages asked for: several pages, even for a tea stall')

console.log(`pages-intent: ${pass} checks passed, ${fail.length} failed`)
if (fail.length) { console.log(fail.map((f) => ` - ${f}`).join('\n')); process.exit(1) }

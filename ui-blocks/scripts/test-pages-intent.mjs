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
console.log(`pages-intent: ${pass} checks passed, ${fail.length} failed`)
if (fail.length) { console.log(fail.map((f) => ` - ${f}`).join('\n')); process.exit(1) }

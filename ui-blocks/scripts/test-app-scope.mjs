// A login and a dashboard only when the first prompt asks for them (or the person asks later in the chat); a site never gets them on its own.
// And the number of pages is what the person said: one page when they said so, several when they said so, whether or not the app is asked for.   node scripts/test-app-scope.mjs
import { loadGeneratorModule } from './lib/load-generator.mjs'

globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const { appIntent, stripAppRequest } = await loadGeneratorModule('app/appIntent.ts')
const { autoPages, pagesWanted } = await loadGeneratorModule('edit/pagesIntent.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { parseEdit } = await loadGeneratorModule('edit/understand.ts')
let passed = 0
let failed = 0
const ok = (cond, label) => { if (cond) passed += 1; else { failed += 1; console.log(` - ${label}`) } }

// what the first prompt says
const ON = ['Gym website in Pune with login and dashboard', 'Gym in Pune, login aur dashboard chahiye', 'School website with student portal and register page', 'Bakery site with dashboard to see orders', 'Meri dukaan ke liye website banao with login', 'website with user login / register', 'Dashboard ke saath coaching website chahiye', 'Clinic site with member area']
const OFF = ['Clinic website without login', 'Clinic website, bina login ke', 'Gym website, no dashboard', 'Dukaan ki website, login nahi chahiye']
const NOTHING = ['Dental clinic in Surat, braces, implants, appointments', 'Gym with free trial sign up and online booking', 'Website for an analytics dashboard tool for retailers', 'SaaS website: dashboard software for HR teams', 'Bakery in Jaipur, eggless cakes, home delivery', 'Kurti boutique online, free shipping above 999', 'Coaching institute for UPSC, admission open, register for demo class', 'Office management software website: desk booking, meeting rooms, visitor management']
for (const p of ON) ok(appIntent(p) === 'on', `asked for: "${p}"`)
for (const p of OFF) ok(appIntent(p) === 'off', `refused: "${p}"`)
for (const p of NOTHING) ok(appIntent(p) === undefined, `nothing said: "${p}"`)

// the words about the app are not the business
for (const p of ON) {
  const clean = stripAppRequest(p)
  ok(!/log\s*in|login|dashboard|register|portal|member area|sign\s*up/i.test(clean), `the app words are cut out of "${p}" (left: "${clean}")`)
}
ok(stripAppRequest('Clinic website without login') === 'Clinic website', 'a refusal is cut out too')
for (const p of NOTHING) ok(stripAppRequest(p) === p, `a prompt that says nothing is left as it is: "${p.slice(0, 40)}"`)
const gym = generateLibraryPage('Gym in Pune with personal training, with login and dashboard', 7, undefined, true, 'auto', undefined, true)
ok(!gym.content.app && !JSON.stringify(gym.content.features.items).match(/login|dashboard/i) && !/login|dashboard/i.test(gym.content.brandName) && !/login|dashboard/i.test(gym.content.hero.subtitle), 'a prompt with the app words does not put "login" or "dashboard" on the page as a service or a name')
const plain = generateLibraryPage('Dental clinic in Surat, braces, implants', 7, undefined, true, 'auto', undefined, true)
ok(!plain.content.app, 'a site made from a prompt that says nothing has no app')

// the chat asks later
ok(parseEdit('login aur dashboard add karo', 'single').ops?.some((o) => o.op === 'app' && o.on), 'asking in the chat adds it')
ok(parseEdit('dashboard hatao', 'single').ops?.some((o) => o.op === 'app' && !o.on), 'asking in the chat removes it')

// the number of pages is what was said
const PAGES = [
  ['Gym website with login and dashboard, single page', 'bold_fitness', 'single'],
  ['Gym website with login and dashboard, multiple pages', 'bold_fitness', 'multi'],
  ['Ek page ki gym website, login aur dashboard ke saath', 'bold_fitness', 'single'],
  ['Gym ki website, kai pages, login ke saath', 'bold_fitness', 'multi'],
  ['Landing page for a gym, with login', 'bold_fitness', 'single'],
  ['Multi-page website for a clinic with dashboard', 'healthcare', 'multi'],
  ['Clinic website, one page only, no login', 'healthcare', 'single'],
  ['Bakery in Jaipur, single page', 'food_dining', 'single'],
  ['Bakery in Jaipur, multiple pages: home, about, menu, contact', 'food_dining', 'multi'],
  ['Bakery in Jaipur, 5 pages', 'food_dining', 'multi'],
]
for (const [prompt, theme, want] of PAGES) {
  const said = pagesWanted(prompt)
  ok(said === want, `pages said in "${prompt}": ${want} (got ${said})`)
  ok(autoPages(stripAppRequest(prompt), theme).mode === want && autoPages(prompt, theme).mode === want, `site with pages "${want}": "${prompt}"`)
}
// nothing said about pages: a short brief is one page, even with the app
ok(autoPages(stripAppRequest('Gym website in Pune with login and dashboard'), 'bold_fitness').mode === 'single', 'a short brief with the app is one page, as without it')
// and the built page has them
for (const [prompt, , want] of PAGES.slice(0, 2)) {
  const lib = generateLibraryPage(stripAppRequest(prompt), 7, undefined, true, 'auto', undefined, want === 'multi')
  ok(!!lib.multi === (want === 'multi'), `the built page of "${prompt}" is ${want}`)
}

console.log(`app-scope: ${passed} checks passed, ${failed} failed`)
process.exit(failed ? 1 : 0)

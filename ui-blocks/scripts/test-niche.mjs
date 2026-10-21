// Tests of the niche packs and of the personalisation from the prompt (what the person wrote about their business ends up on the page).
globalThis.document = { styleSheets: [] }
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const { generateWebsite } = await loadGeneratorModule('generateWebsite.ts')
const { generateSite } = await loadGeneratorModule('generateSite.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { NICHES } = await loadGeneratorModule('niche/niches.ts')
const { extractFacts } = await loadGeneratorModule('personalize.ts')
const { editsFrom } = await loadGeneratorModule('edit/edits.ts')

// ── every niche builds a clean page in all engines
for (const n of NICHES) {
  const prompt = `website for my ${n.keywords[0]} called Test Name`
  const label = n.id
  try {
    const single = generateWebsite(prompt, 0, 'premium', true, 'auto')
    const multi = generateSite(prompt, 0, undefined, true, 'auto')
    const lib = generateLibraryPage(prompt, 0, undefined, true, 'auto')
    ok(single.niche === n.id && multi.spec && lib.content, `${label}: the niche is found`)
    const c = single.content
    ok(n.heroTitles.includes(c.hero.title), `${label}: hero title comes from the niche`)
    ok(c.features.items.length === 6 && c.features.items.every((f, i) => f.title === n.features[i].title), `${label}: six niche features`)
    ok(c.brandName === 'Test Name', `${label}: the given name is kept`)
    const everything = JSON.stringify(c) + single.html + JSON.stringify(multi.pagesHtml)
    ok(!/\{brand\}|undefined|\[object Object\]/.test(everything), `${label}: no placeholder is left`)
    ok(multi.content.posts.length === 3 && multi.content.posts.every((p) => p.body.length >= 5 && p.title), `${label}: three blog posts from the niche`)
    ok(multi.pages.some((p) => p.id === 'about') && Object.keys(multi.pagesHtml).length >= 8, `${label}: the multi-page site has its pages`)
    ok(multi.content.team.members.every((m) => n.team.roles.includes(m.role)), `${label}: team roles are the niche's`)
    ok(c.stats.every((s) => !/\d/.test(s.value) || /^24\s*\/\s*7$/.test(s.value)), `${label}: no invented numbers in the stats`)
  } catch (error) {
    fail.push(`${label}: crashed (${error instanceof Error ? error.message : error})`)
  }
}

// ── a niche gives way to what the person chooses
const edited = generateWebsite('pest control services called BugOff', 0, undefined, true, 'auto', editsFrom([{ op: 'theme', theme: 'food_dining' }]))
ok(edited.niche === undefined && edited.themeKey === 'food_dining', 'a business type chosen in the chat replaces the niche')
ok(generateWebsite('pest control services called BugOff', 0).niche === 'pest_control', 'without a choice the niche is used')
ok(generateWebsite('website for my robotics lab', 0).niche === undefined, 'a business without a niche pack still uses its kit')

// ── same prompt, same page
ok(JSON.stringify(generateWebsite('tattoo studio in Pune', 0).content) === JSON.stringify(generateWebsite('tattoo studio in Pune', 0).content), 'the same prompt gives the same text')
ok(JSON.stringify(generateWebsite('tattoo studio in Pune', 0).content) !== JSON.stringify(generateWebsite('tattoo studio in Pune', 1).content), 'another variation gives other text')

// ── prices follow the place
ok(generateWebsite('pest control in Pune', 0).content.pricing.plans[0].price.startsWith('₹'), 'Indian prompt: prices in rupees')
ok(generateWebsite('pest control in London', 0).content.pricing.plans[0].price.startsWith('£'), 'UK prompt: prices in pounds')
ok(generateWebsite('pest control services', 0).content.pricing.plans[0].price.startsWith('$'), 'no place: dollars')

// ── facts from the prompt
const cases = [
  ['gym offering yoga, zumba and crossfit in Pune, open 24x7', 'gym', { services: ['yoga', 'zumba', 'crossfit'], place: 'Pune', perk: 'always' }],
  ['bakery in Jaipur selling cakes, cookies and bread, free delivery', 'bakery', { services: ['cakes', 'cookies', 'bread'], place: 'Jaipur' }],
  ['Create a website for a pest control company for homes and offices in Delhi', 'pest control company', { audience: 'homes and offices', place: 'Delhi', services: [] }],
  ['Dental clinic website for Dr. Sharma in Pune, teeth whitening, braces and root canal', 'dental clinic', { services: ['teeth whitening', 'braces', 'root canal'], place: 'Pune' }],
  ['coaching institute with online classes and 10 years of experience', 'coaching institute', { perk: 'online', years: 10 }],
  ['salon called Glow with free consultation', 'salon', { perk: 'free', services: [] }],
]
for (const [prompt, subject, want] of cases) {
  const f = extractFacts(prompt, subject)
  if (want.services) ok(JSON.stringify(f.services) === JSON.stringify(want.services), `facts services of "${prompt.slice(0, 40)}": ${JSON.stringify(f.services)}`)
  if (want.place) ok(f.place === want.place, `facts place of "${prompt.slice(0, 40)}": ${f.place}`)
  if (want.audience) ok(f.audience === want.audience, `facts audience: ${f.audience}`)
  if (want.perk) ok(f.perks.some((p) => p.kind === want.perk), `facts promise ${want.perk}`)
  if (want.years) ok(f.years === want.years, `facts years: ${f.years}`)
}
const gym = generateWebsite('Create a page for a sports academy offering cricket, football and badminton in Pune, open 24x7', 0).content
ok(gym.hero.subtitle.includes('Pune') && /cricket/i.test(gym.hero.subtitle), 'the hero line names the services and the place')
ok(['Cricket', 'Football', 'Badminton'].every((t) => gym.features.items.some((f) => f.title === t)), 'one feature card per service')
ok(gym.faq.some((q) => /Pune/.test(q.a)) && gym.faq.some((q) => /24\/7/.test(q.q)), 'the FAQ answers about the place and the opening promise')
ok(gym.stats.filter((s) => /24\s*\/\s*7/.test(s.value)).length <= 1, 'the 24/7 promise is not shown twice in the stats')
const quiet = generateWebsite('Create a page for a sports academy', 0).content
ok(!/Pune|Serving/.test(JSON.stringify(quiet)), 'a prompt without facts gets no made-up place')
const dr = generateWebsite('Dental clinic website for Dr. Sharma in Pune, teeth whitening, braces and root canal', 0).content
ok(dr.brandName === 'Dr. Sharma', `a title and surname is the name (got "${dr.brandName}")`)
ok(!dr.features.items.some((f) => /sharma/i.test(f.title)), 'the doctor is not a service')
// a niche page gets the place but keeps its own sentence
const pest = generateWebsite('pest control for homes and offices in Pune, 24x7, free inspection called BugOff', 0).content
ok(/Pune/.test(pest.hero.subtitle) && pest.hero.subtitle.length <= 175, 'a niche line gets the place added')
ok(!pest.features.items.some((f) => /24x7|free inspection/i.test(f.title)), 'promises are not turned into services')
ok(pest.faq.some((q) => /free/i.test(q.q)), 'the free inspection is a question')

console.log(`${pass} passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

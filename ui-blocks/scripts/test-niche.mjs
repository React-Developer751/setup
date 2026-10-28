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

// the business of the prompt decides the niche, the services it lists do not ("salon ... with haircut, facial and bridal makeup" is a salon, not a bridal makeup artist)
ok(generateWebsite('salon called Glow Up in Lucknow with haircut, facial and bridal makeup', 3).niche === 'hair_salon_spa', 'a salon that also does bridal makeup is still a salon')
ok(generateWebsite('bridal makeup artist called Glow in Lucknow', 3).niche === 'bridal_makeup', 'a bridal makeup artist is still one')

// a business without a text pack: the cards of the business type next to it do not talk about another business
const F = await loadGeneratorModule('foreignWords.ts')
const noPack = ['pottery studio called Clay Room in Pondicherry with workshops and handmade mugs', 'tyre shop called Grip Point in Nagpur with tyres, alignment and batteries', 'robotics lab called Nova Bots in Chennai teaching kids arduino and drones', 'tarot reader called Mystic Sara online readings', 'hardware store called Patel Traders in Surat selling paint, pipes and tools', 'bike shop called Spoke in Bangalore selling cycles, helmets and repairs', 'furniture shop called Wood Craft in Rajkot with sofas, beds and tables', 'toy store called Funky in Indore selling puzzles, dolls and board games', 'candle maker called Glow in Jaipur', 'aquarium shop called Fishy in Pune', 'signboard maker called Neon Art in Surat', 'steel manufacturer called Iron Works in Raipur', 'packaging company called Box It in Vapi', 'tractor dealer called Kisan Motors in Karnal', 'dj service called Beat Box in Delhi', 'matrimonial site called Jodi in Pune']
let left = []
for (const p of noPack) {
  for (const v of [1, 2, 3]) {
    const c = generateWebsite(p, v).content
    const text = [...c.features.items.map((f) => `${f.title} ${f.text}`), ...c.about.points, ...c.steps.items.map((x) => `${x.title} ${x.text}`), ...c.marquee].join(' | ')
    const f = F.foreignIn(text, F.domainsOf(p))
    if (f.length) left.push(`${p.slice(0, 30)}: ${f.join()}`)
  }
}
ok(left.length === 0, `${noPack.length * 3} pages of businesses without a text pack: no card, step or keyword of another kind of business (${left.slice(0, 2).join(' | ')})`)
const pot = generateWebsite('pottery studio called Clay Room in Pondicherry with workshops and handmade mugs', 3, 'premium').content
ok(pot.features.items.length === 6 && pot.features.items.some((f) => /workshops/i.test(f.title)), 'the services are kept and the cards are still six')
ok(F.foreignIn('Flexible Rentals and Well-Maintained Vehicles', F.domainsOf('car rental company')).length === 0 && F.foreignIn('Flexible Rentals and Well-Maintained Vehicles', F.domainsOf('pottery studio')).includes('auto'), 'the check knows whose words are whose')

// services listed after "with" ("with crossfit, zumba and personal training") are services; promises after "with" are not
const withFacts = (text, subject) => extractFacts(text, subject)
ok(withFacts('pottery studio called Clay Room in Pondicherry with workshops and handmade mugs', 'pottery studio').services.join() === 'workshops,handmade mugs', '"with workshops and handmade mugs" lists two services')
ok(withFacts('gym called Iron House in Delhi with crossfit, zumba and personal training', 'gym').services.join() === 'crossfit,zumba,personal training', '"with crossfit, zumba and personal training" lists three services')
ok(withFacts('restaurant with free delivery and 24x7 service', 'restaurant').services.length === 0 && withFacts('shop with 10 years experience and free quote', 'shop').services.length === 0 && withFacts('bakery with great service and best prices', 'bakery').services.length === 0, 'promises after "with" (delivery, 24x7, years, quote, prices) are not services')
ok(generateWebsite('pottery studio called Clay Room in Pondicherry with workshops and handmade mugs', 3, 'premium').content.features.items.slice(0, 2).map((f) => f.title).join() === 'Workshops,Handmade Mugs', 'the services of the prompt are the first service cards of the page')

// the business decides the business type, not the services it lists ("workshops" in a pottery studio is no garage)
ok(generateWebsite('pottery studio called Clay Room in Pondicherry with workshops and handmade mugs', 3).themeKey === 'creative_studio', 'a pottery studio with workshops is a creative studio, not a garage')
const TC = await loadGeneratorModule('themeClassifier.ts')
ok(TC.decideTheme('online store for kurtis and sarees').theme === 'fashion_retail' && TC.businessHead('Create a website for a pottery studio called Clay Room in Pune with workshops and mugs') === 'pottery studio', 'what a store sells still decides when no business noun comes first, and the head of a prompt is the business itself')

// names with "and": the whole name is kept
const { extractContentDetails } = await loadGeneratorModule('filter.ts')
for (const [prompt, name] of [['Create a website for a law firm called Rao and Partners in Delhi', 'Rao and Partners'], ['cafe called Tom and Jerry Cafe in Pune', 'Tom and Jerry Cafe'], ['bakery called Sweet and Salty', 'Sweet and Salty'], ['gym called Iron House and open 24x7', 'Iron House']]) {
  ok(extractContentDetails(prompt, 'general_business').businessName === name, `the name "${name}" is kept whole (got "${extractContentDetails(prompt, 'general_business').businessName}")`)
}

// ── a German cafe is a German cafe (a Hinglish prompt, no name): its own menu, a German name, no chai and no prices that nobody wrote
for (const prompt of ['ek german cafe ke liye website banao', 'German cafe in Pune', 'website for a german bakery and kaffeehaus', 'जर्मन कैफे की वेबसाइट']) {
  const g = generateWebsite(prompt, 0, 'premium', true, 'auto')
  const text = JSON.stringify(g.content)
  ok(g.niche === 'german_cafe', `"${prompt}" is the German cafe pack (${g.niche})`)
  ok(/Pretzel/.test(text) && /Strudel|Black Forest/.test(text), `"${prompt}": the menu is German`)
  ok(!/chai|masala|samosa|tandoor|thali|curry/i.test(text), `"${prompt}": no Indian menu on a German cafe`)
  if (!/जर्मन/.test(prompt)) ok(/Kaffeehaus|Cafe Edelweiss|Brezel|Zum Goldenen/.test(g.content.brandName), `"${prompt}": a German name (${g.content.brandName})`)
  ok(!g.content.pricing.fromPrompt, `"${prompt}": the example prices are not the person's`)
}
const priced = generateWebsite('German cafe called Kaffeehaus Berlin: pretzel 150 rupees, black forest cake 250 rupees', 0, 'premium', true, 'auto')
ok(priced.content.pricing.fromPrompt === true && priced.content.brandName === 'Kaffeehaus Berlin', 'prices the person wrote are kept and shown')

// simple Hinglish requests: the scaffolding words are never content
for (const prompt of ['mera restaurant hai Jaipur me, uski website banao', 'meri dukaan ke liye website banao', 'doctor ki website', 'ek salon ki website', 'coaching institute for UPSC']) {
  const g = generateWebsite(prompt, 0, 'premium', true, 'auto')
  const text = JSON.stringify(g.content)
  ok(!/\b(?:mera|meri|uski|banao|chahiye|liye|hai Jaipur)\b/i.test(text), `"${prompt}": no Hinglish filler in the page`)
}
ok(!/Upsc/.test(JSON.stringify(generateWebsite('coaching institute for UPSC', 0, 'premium', true, 'auto').content)), 'UPSC keeps its capitals')
ok(generateWebsite('coaching institute for UPSC', 0, 'premium', true, 'auto').content.brandName !== 'UPSC', 'an exam is not the brand')
const jp = JSON.stringify(generateWebsite('japanese restaurant', 0, 'premium', true, 'auto').content)
ok(/Sushi|Ramen/.test(jp) && !/Regional Favourites/.test(jp), 'a japanese restaurant serves japanese food')

console.log(`${pass} passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

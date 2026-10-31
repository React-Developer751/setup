// The design generator (src/generator/gen): the spec, its id, the tree, the component and its source text.
import { loadGeneratorModule } from './lib/load-generator.mjs'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const spec = await loadGeneratorModule('gen/heroSpec.ts')
const emit = await loadGeneratorModule('gen/heroEmit.ts')
const pick = await loadGeneratorModule('gen/heroPick.ts')
const fs = await loadGeneratorModule('gen/featuresSpec.ts')
const cs = await loadGeneratorModule('gen/ctaSpec.ts')
const reg = await loadGeneratorModule('gen/registry.ts')
const taste = await loadGeneratorModule('gen/heroTaste.ts')
const { compileSource } = await loadGeneratorModule('library/componentCompile.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
let pass = 0
const fail = []
const ok = (c, m) => (c ? pass++ : fail.push(m))
const seeded = (n) => () => ((n = (n * 1664525 + 1013904223) >>> 0) / 2 ** 32)

// the space of designs
const total = spec.countSpecs()
ok(total > 1_000_000, `a large space of valid first screens (${total.toLocaleString()})`)
const rand = seeded(9)
const ids = new Set()
const specs = []
for (let i = 0; i < 400; i += 1) {
  const mood = ['any', 'calm', 'bold', 'soft', 'dark', 'playful'][i % 6]
  const s = spec.randomSpec(rand, mood, specs.slice(-3))
  specs.push(s)
  ids.add(spec.specId(s))
  const back = spec.specOfId(spec.specId(s))
  ok(back && Object.keys(s).every((k) => back[k] === s[k]) && spec.valid(s), `the id of a spec gives the spec back (${spec.specId(s)})`)
}
ok(ids.size >= 395, `400 random heroes are almost all different (${ids.size})`)
ok(new Set(specs.map((s) => s.layout)).size === 8 && new Set(specs.map((s) => s.media)).size === 5 && new Set(specs.map((s) => s.decor)).size === 7, 'every layout, picture shape and decoration is used')
ok(!spec.specOfId('gen/Hero_zzzzzzzzzzzzzzzzzzzz') && !spec.specOfId('hero/Hero1') && !spec.specOfId('gen/Hero_!!'), 'an id that is not a spec is refused')
// the mood leans the choices
const calm = Array.from({ length: 120 }, () => spec.randomSpec(rand, 'calm'))
const bold = Array.from({ length: 120 }, () => spec.randomSpec(rand, 'bold'))
const share = (list, f) => list.filter(f).length / list.length
ok(share(calm, (s) => s.scale === 'm' || s.scale === 'l') > share(bold, (s) => s.scale === 'm' || s.scale === 'l') + 0.3, 'calm heroes have smaller headlines than bold ones')
ok(share(bold, (s) => s.weight >= 700) > share(calm, (s) => s.weight >= 700) + 0.3, 'bold heroes are heavier than calm ones')

// the component and its text
let sourceOk = 0
let drawn = 0
for (const id of [...ids].slice(0, 120)) {
  const C = emit.generatedHero(id)
  if (!C) { fail.push(`no component for ${id}`); continue }
  const html = renderToStaticMarkup(createElement(C))
  const slots = ['title', 'subtitle', 'button', 'button2', 'image', 'eyebrow'].every((n) => html.includes(`data-slot="${n}"`))
  if (slots && (html.match(/<h1\b/g) ?? []).length === 1 && html.includes('<style>') && !/undefined|\[object/.test(html) && html.includes('data-ref="show-type-hero"')) drawn += 1
  else fail.push(`the hero ${id} is not drawn with all its parts`)
  const source = emit.generatedHeroSource(id)
  const compiled = source ? compileSource(source) : { error: 'no source' }
  if ('code' in compiled && source.includes('export default function') && source.includes('data-slot="title"')) sourceOk += 1
  else fail.push(`the source of ${id} does not compile: ${compiled.error}`)
  ok(!/className="[^"]*\b(?:text|bg|px|py|mt|mb|flex|grid)-/.test(html), `no Tailwind class in ${id}: an exported site would miss its rule`)
}
ok(drawn === 120 && sourceOk === 120, `120 heroes drawn and their source compiled (${drawn}, ${sourceOk})`)
ok(emit.generatedHero([...ids][0]) === emit.generatedHero([...ids][0]), 'the same id is the same component (React keeps it)')

// the choice for a page
const base = { prompt: 'cafe website in Jaipur', variation: 3, level: 'balanced', tier: 'better', theme: 'food_dining', dark: false, bold: false, keep: false }
ok(pick.pickGenHero({ ...base, level: 'safe' }) === undefined && pick.pickGenHero({ ...base, tier: 'normal' }) === undefined && pick.pickGenHero({ ...base, keep: true }) === undefined, 'safe creativity, a short page and a named design keep the stored first screen')
let some = 0
let wild = 0
for (let v = 1; v <= 200; v += 1) {
  if (pick.pickGenHero({ ...base, variation: v })) some += 1
  if (pick.pickGenHero({ ...base, variation: v, level: 'wild' })) wild += 1
}
ok(some > 100 && some < 160 && wild > some, `balanced uses it most of the time (${some} of 200), wild more often (${wild})`)
ok(pick.pickGenHero({ ...base, variation: 5 }) === pick.pickGenHero({ ...base, variation: 5 }), 'a prompt and a variation give the same choice')
// a page that uses one
let page
for (let v = 1; v <= 40 && !page; v += 1) { const l = generateLibraryPage('cafe website in Jaipur', v, 'better', true, 'auto', undefined, false); if (l.sections.some((s) => s.componentId.startsWith('gen/Hero_'))) page = l }
ok(page && /import Hero\w+ from '\.\/components\/gen\/Hero_/.test(page.code), 'a page with a generated hero names it in its code')
// the taste: what was liked is drawn more, what was not is drawn less, and a few thumbs change nothing
const r2 = seeded(31)
const pool = Array.from({ length: 80 }, () => spec.randomSpec(r2, 'any'))
const ratings = pool.map((s) => ({ id: spec.specId(s), up: s.font !== 'sans' }))
taste.setHeroTaste(ratings.slice(0, 10), spec.specOfId)
ok(taste.tasteWeight('font', 'serif') === 1 && !taste.tasteActive(), 'ten thumbs are not a taste yet')
taste.setHeroTaste(ratings, spec.specOfId)
ok(taste.tasteActive() && taste.tasteWeight('font', 'serif') > 1.2 && taste.tasteWeight('font', 'sans') < 0.7, `a choice that is never disliked is drawn more, one that is often disliked less (${taste.tasteWeight('font', 'serif').toFixed(2)} / ${taste.tasteWeight('font', 'sans').toFixed(2)})`)
ok(taste.tasteWeight('font', 'serif') <= 1.5 && taste.tasteWeight('font', 'sans') >= 0.35, 'nothing is shut out and nothing takes over')
const r3 = seeded(77)
const serif = (n) => Array.from({ length: n }, () => spec.randomSpec(r3, 'any')).filter((s) => s.font === 'serif').length
const after = serif(300)
taste.setHeroTaste([], spec.specOfId)
const before = serif(300)
ok(after > before * 1.2, `after the thumbs the generator draws serif more often (${before} -> ${after} of 300)`)
// a hero that was not liked twice, more often than liked, is not drawn again; a small serif headline does not exist any more
const bad = spec.specId(pool[0])
taste.setHeroTaste([{ id: bad, up: false }, { id: bad, up: false }, { id: bad, up: true }], spec.specOfId)
ok(taste.isBlocked(bad), 'a hero that was not liked twice (and liked once) is blocked')
taste.setHeroTaste([{ id: bad, up: false }, { id: bad, up: true }, { id: bad, up: true }], spec.specOfId)
ok(!taste.isBlocked(bad), 'one that is mostly liked is not')
taste.setHeroTaste([], spec.specOfId)
const r5 = seeded(5)
ok(Array.from({ length: 400 }, () => spec.randomSpec(r5, 'any')).every((s) => !(s.font === 'serif' && s.scale === 'm')), 'no small serif headline')
// the services part
ok(fs.countFeatures() > 100_000, `a large space of services parts (${fs.countFeatures().toLocaleString()})`)
const rf = seeded(21)
const fspecs = []
const fids = new Set()
for (let i = 0; i < 300; i += 1) {
  const s = fs.randomFeatures(rf, ['any', 'calm', 'bold', 'soft', 'dark', 'playful'][i % 6], fspecs.slice(-3))
  fspecs.push(s)
  const id = fs.featuresId(s)
  fids.add(id)
  const back = fs.featuresOfId(id)
  ok(back && Object.keys(s).every((k) => back[k] === s[k]), `the id of a services spec gives it back (${id})`)
}
ok(fids.size >= 290 && new Set(fspecs.map((s) => s.layout)).size === 8, `300 services parts are almost all different (${fids.size}) and every layout is used`)
let fdrawn = 0
for (const id of [...fids].slice(0, 80)) {
  const C = emit.generatedHero(id)
  const html = C ? renderToStaticMarkup(createElement(C)) : ''
  const six = (html.match(/data-slot="tile"/g) ?? []).length === 6 && ['title', 'lead', 'tile-title', 'tile-text'].every((n) => html.includes(`data-slot="${n}"`))
  const src = emit.generatedHeroSource(id)
  const compiled = src ? compileSource(src) : { error: 'no source' }
  if (six && 'code' in compiled && html.includes('data-ref="show-tiles"') && !/undefined|\[object/.test(html) && !/className="[^"]*\b(?:text|bg|px|py|grid|flex)-/.test(html)) fdrawn += 1
  else fail.push(`the services part ${id} is not drawn with its parts or does not compile`)
}
ok(fdrawn === 80, `80 services parts drawn (6 tiles each) and their source compiled (${fdrawn})`)
ok(!fs.featuresOfId('gen/Hero_67ky7') && !spec.specOfId('gen/Features_1jms7'), 'a hero id is not a services id and the other way round')
const fpage = []
for (let v = 1; v <= 60 && fpage.length < 1; v += 1) { const l = generateLibraryPage('dental clinic website in Pune', v, 'better', true, 'auto', undefined, false); if (l.sections.some((s) => s.componentId.startsWith('gen/Features_'))) fpage.push(l) }
ok(fpage.length === 1 && /import Features\w+ from '\.\/components\/gen\/Features_/.test(fpage[0].code), 'a page with a generated services part names it in its code')
// the taste of the services part is its own
taste.setHeroTaste(fspecs.map((s, i) => ({ id: fs.featuresId(s), up: s.layout !== 'bento' || i % 9 === 0 })), fs.decodeFeatures, 'features')
ok(taste.tasteActive('features') && !taste.tasteActive('hero') === true && taste.tasteWeight('layout', 'bento', 'features') < 1, 'the services part has a taste of its own (bento is disliked there, the first screens are untouched)')
// the closing call to action
const rc = seeded(77)
const cspecs = []
let cdrawn = 0
for (let i = 0; i < 80; i += 1) {
  const sp = cs.randomCta(rc, ['any', 'calm', 'bold', 'soft', 'dark', 'playful'][i % 6], cspecs.slice(-3))
  cspecs.push(sp)
  ok(cs.cValid(sp), 'a closing banner of the generator is valid')
  const id = cs.ctaId(sp)
  const back = cs.ctaOfId(id)
  ok(back && Object.keys(sp).every((k) => back[k] === sp[k]), 'a closing banner id reads back to its spec')
  const Comp = emit.generatedHero(id)
  const html = Comp ? renderToStaticMarkup(createElement(Comp)) : ''
  if (/data-ref="show-cta"/.test(html) && /data-slot="title"/.test(html) && /data-slot="button"/.test(html) && /data-slot="button2"/.test(html) && /data-slot="lead"/.test(html)) cdrawn += 1
  const src = emit.generatedHeroSource(id)
  const cc = src ? compileSource(src) : { error: 'no source' }
  ok('code' in cc, 'the source of a closing banner compiles')
}
ok(cdrawn === 80, `80 closing banners drawn with all four slots (${cdrawn})`)
ok(!cs.ctaOfId('gen/Hero_67ky7') && !spec.specOfId(cs.ctaId(cspecs[0])), 'a closing banner id is not a hero id and the other way round')
taste.setHeroTaste(cspecs.map((s, i) => ({ id: cs.ctaId(s), up: s.layout !== 'bar' || i % 9 === 0 })), cs.decodeCta, 'cta')
ok(taste.tasteActive('cta') && taste.tasteWeight('layout', 'bar', 'cta') < 1, 'the closing banner has a taste of its own')
// the generators made with partKit (pricing, FAQ, testimonials, gallery)
for (const kit of reg.KIT_PARTS) {
  const rk = seeded(kit.role.length * 91)
  const list = []
  let drawn = 0
  ok(kit.part.count() > 20_000, `${kit.role}: a large space (${kit.part.count().toLocaleString()})`)
  for (let i = 0; i < 60; i += 1) {
    const sp = kit.part.random(rk, ['any', 'calm', 'bold', 'soft', 'dark', 'playful'][i % 6], list.slice(-3))
    list.push(sp)
    ok(kit.part.valid(sp), `${kit.role}: a drawn spec is valid`)
    const id = kit.part.id(sp)
    const back = kit.part.of(id)
    ok(back && Object.keys(sp).every((k) => back[k] === sp[k]), `${kit.role}: the id reads back to its spec`)
    const Comp = emit.generatedHero(id)
    const html = Comp ? renderToStaticMarkup(createElement(Comp)) : ''
    const src = emit.generatedHeroSource(id)
    const cc = src ? compileSource(src) : { error: 'no source' }
    if (kit.slots.every((n) => html.includes(`data-slot="${n}"`)) && html.includes(`data-ref="show-`) && 'code' in cc && !/undefined|\[object/.test(html) && !/className="[^"]*\b(?:text|bg|px|py|grid|flex)-/.test(html)) drawn += 1
    else fail.push(`${kit.role} ${id} is not drawn with its slots or does not compile`)
  }
  ok(drawn === 60, `${kit.role}: 60 drawn with all slots and compiled (${drawn})`)
  ok(!kit.part.of('gen/Hero_67ky7') && reg.kitOfId(kit.part.id(list[0])) === kit, `${kit.role}: its id is its own`)
  taste.setHeroTaste(list.map((sp, i) => ({ id: kit.part.id(sp), up: sp.layout !== list[0].layout || i % 9 === 0 })), kit.part.decode, kit.part.ns)
  ok(taste.tasteActive(kit.part.ns) && taste.tasteWeight('layout', list[0].layout, kit.part.ns) < 1, `${kit.role}: a taste of its own`)
}
// pages that use them
const kitSeen = new Set()
for (let v = 1; v <= 80; v += 1) { const l = generateLibraryPage('yoga studio website in Rishikesh Pricing: Drop-in 500 rupees, Monthly 3000 rupees, Retreat 12000 rupees', v, 'better', true, 'auto', undefined, true); for (const sct of l.sections) if (sct.componentId.startsWith('gen/') && reg.kitOfId(sct.componentId)) kitSeen.add(reg.kitOfId(sct.componentId).role) }
ok(['pricing', 'faq', 'gallery'].every((r) => kitSeen.has(r)), `multi-page sites use the new generated parts (testimonials are shown only when real ones exist) (${[...kitSeen].join(', ')})`)
// what the person named in the prompt is on the page (found with a real prompt: the prices they wrote were dropped for some variations, and "FAQ" became the business name)
const named = 'Mere yoga studio ke liye unique bold website banao Rishikesh me, pricing: drop-in 500 rupees, monthly 3000 rupees, retreat 12000 rupees, multiple pages, gallery aur FAQ ke saath'
let namedOk = 0
for (const v of [1, 2, 3, 7, 99, 5251, 5252]) { const l = generateLibraryPage(named, v, undefined, true, 'auto', undefined, true); const roles = l.sections.map((x) => x.role); if (roles.includes('pricing') && roles.includes('gallery') && roles.includes('faq') && l.content.brandName !== 'FAQ') namedOk += 1 }
ok(namedOk === 7, `the prices, the gallery and the FAQ the person named are on the page for every variation, and FAQ is not the name (${namedOk} of 7)`)
const noGal = generateLibraryPage('cafe website without gallery and no FAQ', 5251, undefined, true, 'auto', undefined, true).sections.map((x) => x.role)
ok(!noGal.includes('gallery') && !noGal.includes('faq'), '"without gallery and no FAQ" leaves them out')
// prices the person wrote are read whole (a plan name was cut to "retre", "premium" was dropped as a style word, "gallery" and "plans" were taken for services)
const PF = await loadGeneratorModule('personalize.ts')
const pf = (t) => PF.extractFacts(t, 'studio')
ok(JSON.stringify(pf('yoga studio, pricing: drop-in 500 rupees, monthly 3000 rupees, retreat 12000 rupees, gallery and FAQ').prices.map((p) => p.name)) === '["drop-in","monthly","retreat"]', 'the price names are read whole (retreat)')
ok(pf('gym in Pune, plans: basic 999 rupees, premium 1999 rupees, personal training 4999 rupees').prices.length === 3, 'three prices are three plans (premium is not a style word here)')
ok(!pf('yoga studio, drop-in 500 rupees, monthly 3000 rupees, gallery and FAQ').services.some((x) => /gallery|faq|plans/.test(x)), 'gallery and FAQ named in the prompt are not services')
ok(pf('dental clinic in Pune, 10 years of experience, open 24 hours').prices.length === 0, 'years and hours are not prices')
// a period is shown only when the person wrote one; a business that sells by plans has a price page without being asked, the others only when asked
const per = PF.extractFacts('yoga studio, drop-in 500 rupees per class, monthly 3000 rupees, retreat 12000 rupees', 'studio').prices
ok(per[0].period === '/ class' && !per[1].period && !per[2].period, 'a period ("per class") is kept when the person wrote it and not invented otherwise')
const priceOn = (prompt) => { let n = 0; for (let v = 1; v <= 8; v += 1) if (generateLibraryPage(prompt, v * 17, undefined, true, 'auto', undefined, true).sections.some((x) => x.role === 'pricing')) n += 1; return n }
ok(['gym website in Pune', 'SaaS startup landing page', 'salon in Delhi'].every((p) => priceOn(p) === 8), 'a gym, a software and a salon site have a price page')
ok(['dental clinic in Delhi', 'law firm website', 'NGO for girl education'].every((p) => priceOn(p) === 0) && priceOn('gym website without pricing') === 0, 'a clinic, a law firm, an NGO and "without pricing" have none')
const askPage = generateLibraryPage('gym website in Pune', 5, undefined, true, 'auto', undefined, true).sections.find((x) => x.role === 'pricing')
ok(askPage && askPage.componentId.startsWith('gen/Pricing_'), 'prices nobody wrote are shown by a part that says "ask for the price"')
// what the person wrote is read for what it is (found with 8 real prompts: a firm's name, prices, a number of rooms and a website were taken for services)
const CL = await loadGeneratorModule('edit/claims.ts')
const facts = (t, subject = 'x') => PF.extractFacts(t, subject)
const sv = (t, subject) => facts(t, subject).services
ok(!sv('Sharma & Associates law firm in Delhi, family and property law', 'law firm').some((x) => /sharma|associates/.test(x)) && sv('Sharma & Associates law firm in Delhi, family and property law', 'law firm').includes('family law'), 'a firm named with "&" is the brand, "family and property law" is two services')
ok(!sv('Rao and Partners CA firm, gst filing, audit', 'ca firm').some((x) => /rao|partners/.test(x)), '"Rao and Partners" is a name')
const plans = facts('Invoice software for small businesses, plans 499 rupees and 999 rupees per month', 'invoice software')
ok(plans.prices.length === 2 && plans.prices[0].name === 'basic' && plans.prices[1].name === 'pro' && plans.prices.every((p) => p.period === '/ month') && !plans.services.some((x) => /\d|rupee/.test(x)), 'unnamed prices are two plans, the period said once is for both, and no price is a service')
ok(facts('Coaching institute for UPSC in Delhi, fees 45000 rupees', 'coaching institute').prices[0]?.amount === 45000 && !sv('Coaching institute for UPSC in Delhi, fees 45000 rupees', 'coaching institute').includes('fees'), '"fees 45000" is a price, not a service')
ok(!sv('Wedding photographer in Jaipur, portfolio website', 'wedding photographer').some((x) => /website/.test(x)), '"portfolio website" is the website, not a service')
const hotel = facts('Boutique hotel in Udaipur with 12 rooms and lake view', 'boutique hotel')
ok(hotel.services.length === 0 && hotel.details?.includes('12 rooms') && hotel.details?.includes('lake view'), '"12 rooms" and "lake view" are details of the place, not services')
const hotelPage = generateLibraryPage('Boutique hotel in Udaipur with 12 rooms and lake view', 7, undefined, true, 'auto', undefined, false).content
ok(/12 rooms and lake view/.test(hotelPage.hero.subtitle) && !hotelPage.faq.some((f) => /do you offer (?:12|lake)/i.test(f.q)), 'the details are in the line under the headline and not in a question')
const lawPage = generateLibraryPage('Sharma & Associates law firm in Delhi, family and property law', 7, undefined, true, 'auto', undefined, false).content
ok(lawPage.features.items.length >= 2 && lawPage.features.items.every((f) => /family|property/i.test(f.title)), 'a law firm shows only the services it named (no criminal defence nobody said)')
// the chat lists what the generator wrote that the person did not say
const cafe = generateLibraryPage('cafe website in Jaipur', 7, undefined, true, 'auto', undefined, false).content
const claim = CL.claimsToCheck('cafe website in Jaipur', cafe)
ok(claim && claim.services.length > 0 && /Check before you publish/.test(claim.text), 'a prompt that names nothing gets the list of what was written from the kind of business')
const lawClaim = CL.claimsToCheck('Sharma & Associates law firm in Delhi, family and property law', lawPage)
ok(!lawClaim || lawClaim.services.length === 0, 'a law firm with only its named services has no services to check')
ok(CL.claimChoices(claim, cafe).some((c) => c.action === 'dismiss') && CL.claimChoices(claim, cafe).every((c) => c.label), 'the message always has a way to keep everything')
// a site has a way to write to the business
let withForm = 0
for (let v = 1; v <= 30; v += 1) { const l = generateLibraryPage('law firm website', v * 13, undefined, true, 'auto', undefined, v % 2 === 0); const c = l.sections.find((x) => x.role === 'contact'); if (c && !/^contact\/Contact(?:1|2|3|5|6)$/.test(c.componentId)) withForm += 1 }
ok(withForm === 30, `every contact part has a form (${withForm} of 30)`)
// points 6 to 9: the pictures are spread, the headlines are about the business, the colours of a law firm stay professional, the generated parts are the usual
const FI = await loadGeneratorModule('library/fillContent.ts').catch(() => undefined)
const FL = await loadGeneratorModule('filter.ts')
ok(['Invoice software for small businesses, plans 499 rupees', 'Billing software for pharmacies in Pune', 'CRM tool for real estate agents'].every((t, i) => FL.extractContentDetails(t).subject === ['invoice software', 'billing software', 'crm tool'][i]), 'the product in front of "for" is the subject, the customers after it are not')
let namesProduct = 0
let buzz = 0
for (let v = 1; v <= 12; v += 1) {
  const c = generateLibraryPage('Invoice software for small businesses, plans 499 rupees and 999 rupees per month', v * 11, undefined, true, 'auto', undefined, false).content
  if (/invoice/i.test(c.hero.title) || /invoice/i.test(c.hero.subtitle)) namesProduct += 1
  if (/rock-solid|unmatched|next-level|lightning speed|redefine|velocity/i.test(`${c.hero.title} ${c.hero.subtitle} ${c.features.title} ${c.cta.title}`)) buzz += 1
}
ok(namesProduct === 12 && buzz === 0, `a software prompt gets headlines about its product and no empty praise (${namesProduct} of 12 name it, ${buzz} buzzwords)`)
if (FI?.picturesFor) {
  const photos = { hero: 'H', about: 'A', gallery: ['g0', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'] }
  ok(FI.picturesFor('hero', photos)[0] === 'H' && FI.picturesFor('about', photos)[0] === 'A' && FI.picturesFor('gallery', photos).join() === photos.gallery.join(), 'the first screen, the about part and the gallery have their own pictures')
  ok(FI.picturesFor('features', photos)[0] === 'g4' && FI.picturesFor('blog', photos).slice(0, 4).every((x) => ['g4', 'g5', 'g6', 'g7'].includes(x)), 'the cards and the notes start at the far end of the gallery, not at the pictures the gallery shows first')
}
const noOffer = generateLibraryPage('shoe store website', 5, 'premium', true, 'auto', undefined, true).sections.some((x) => x.role === 'banner')
const withOffer = [1, 2, 3, 4, 5, 6].some((v) => generateLibraryPage('shoe store with free shipping above 999', v, 'premium', true, 'auto', undefined, true).sections.some((x) => x.role === 'banner'))
ok(!noOffer && withOffer, 'an announcement bar appears only when there is an offer to announce')
const PL = await loadGeneratorModule('memory/designPlanner.ts')
const PS = await loadGeneratorModule('memory/designStore.ts')
const RN = await loadGeneratorModule('random.ts')
const hueOf = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255); const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const d = mx - mn; if (!d) return 0; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return Math.round((h * 60 + 360) % 360) }
let odd = 0
for (let i = 0; i < 16; i += 1) {
  const plan = await PL.planDesign('Sharma & Associates law firm in Delhi', new PS.MemoryStore(), { group: `l${i}`, creativity: 'wild', temperature: 0.6, rand: RN.seededRandom(300 + i) })
  const a = plan.ops.find((o) => o.op === 'concept')?.data?.light?.accent ?? plan.ops.find((o) => o.op === 'accent')?.hex
  if (a && hueOf(a) > 250 && hueOf(a) < 345) odd += 1
}
ok(odd === 0, `a law firm is never violet or pink, also at a wild creativity (${odd} of 16)`)
console.log(`${pass} passed, ${fail.length} failed`)
for (const f of [...new Set(fail)].slice(0, 12)) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

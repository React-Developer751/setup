// Tests of the business details: WhatsApp button, map, opening hours, services and prices, fonts, deploy files.
globalThis.document = { styleSheets: [] }
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))
const text = (x) => JSON.stringify(x)

const { generateWebsite } = await loadGeneratorModule('generateWebsite.ts')
const { generateSite } = await loadGeneratorModule('generateSite.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { editsFrom, cleanOp } = await loadGeneratorModule('edit/edits.ts')
const { parseEdit, parseServices, parseHoursText } = await loadGeneratorModule('edit/understand.ts')
const { parseHours } = await loadGeneratorModule('edit/applyEdits.ts')
const { fontVars, fontHref, fontLinks } = await loadGeneratorModule('fonts.ts')
const { THEME_KEYS, themes } = await loadGeneratorModule('themes.ts')
const { sourceFromSite, sourceFromPage, buildStandalone } = await loadGeneratorModule('exportSite.ts')
const { buildStaticFiles } = await loadGeneratorModule('exportStatic.ts')

const P = 'salon called Glow Studio in Pune'
const E = (...ops) => editsFrom(ops)

// ── operations
ok(cleanOp({ op: 'contact', field: 'whatsapp', value: '+91 98765 43210' })?.field === 'whatsapp', 'cleanOp: whatsapp')
ok(cleanOp({ op: 'contact', field: 'fax', value: '1' }) === undefined, 'cleanOp: unknown contact field refused')
ok(cleanOp({ op: 'services', items: [{ name: 'Haircut', price: '300' }, { name: 'x' }, { nope: 1 }] })?.items.length === 1, 'cleanOp: services keeps the valid ones')
ok(cleanOp({ op: 'services', items: [] }) === undefined, 'cleanOp: no services is nothing')
ok(cleanOp({ op: 'services', items: Array.from({ length: 20 }, (_, i) => ({ name: `Service ${i}` })) }).items.length === 8, 'cleanOp: at most 8 services')

// ── parsing
const sv = parseServices('services: haircut 300, facial 800, bridal makeup 5000')
ok(text(sv) === text([{ name: 'Haircut', price: '300' }, { name: 'Facial', price: '800' }, { name: 'Bridal makeup', price: '5000' }]), 'parse services with prices')
ok(parseServices('prices: cake 500/kg, cookies 200')[0].price === '500/kg', 'parse a price with a unit')
ok(parseServices('remove the services section') === undefined, '"services" in a command is not a list')
ok(parseHoursText('timings: Mon-Sat 9am-7pm, Sun closed') === 'Mon-Sat 9am-7pm, Sun closed', 'parse opening hours')
ok(parseHoursText('opening hours are great') === undefined, 'hours need a time')
ok(parseEdit('whatsapp number 98765 43210', 'single').ops[0].field === 'whatsapp', 'whatsapp is not taken for a phone')
ok(text(parseHours('Mon-Sat 9am-7pm, Sun closed')) === text([{ day: 'Mon-Sat', time: '9am-7pm' }, { day: 'Sun', time: 'closed' }]), 'hours rows')

// ── all engines
const single = generateWebsite(P, 0, 'premium', true, 'auto', E({ op: 'contact', field: 'whatsapp', value: '98765 43210' }, { op: 'contact', field: 'hours', value: 'Mon-Sat 9am-7pm, Sun closed' }, { op: 'contact', field: 'address', value: '12 MG Road, Pune 411001' }, { op: 'services', items: [{ name: 'Haircut', price: '300' }, { name: 'Facial', price: '800' }, { name: 'Bridal makeup', price: '5000' }, { name: 'Hair spa' }] }))
ok(single.html.includes('https://wa.me/919876543210') && single.html.includes('aria-label="Chat on WhatsApp"'), 'single page: WhatsApp button with a wa.me link (10 digits = India)')
ok(single.code.includes('className="fixed bottom-5 left-5'), 'single page code: the button')
ok(single.html.includes('Mon-Sat 9am-7pm, Sun closed'), 'single page: hours in the contact section')
ok(single.html.includes('google.com/maps?q=12%20MG%20Road%2C%20Pune%20411001&amp;output=embed'), 'single page: a real map for the person\'s address')
ok(['Haircut', 'Facial', 'Bridal makeup', 'Hair spa'].every((n) => single.content.features.items.some((f) => f.title === n)), 'services are the feature cards')
ok(single.content.pricing.plans.map((p) => p.price).join() === '₹300,₹800,₹5,000', `prices in rupees (got ${single.content.pricing.plans.map((p) => p.price)})`)
const multi = generateSite(P, 0, undefined, true, 'auto', E({ op: 'contact', field: 'whatsapp', value: '+44 7700 900123' }, { op: 'contact', field: 'hours', value: 'Mon-Fri 8am-5pm' }, { op: 'contact', field: 'address', value: '5 High Street, Leeds' }))
ok(Object.values(multi.pagesHtml).every((h) => h.includes('wa.me/447700900123')), 'multi-page: the WhatsApp button is on every page')
ok(multi.content.hours.length === 1 && multi.content.hours[0].time === '8am-5pm', 'multi-page: the opening hours are the person\'s')
ok(multi.pagesHtml['/contact'].includes('output=embed'), 'multi-page: the contact page has the map')
ok(!generateSite(P, 0).pagesHtml['/contact'].includes('output=embed'), 'without an address of their own there is no map')
ok(!generateWebsite(P, 0).html.includes('wa.me'), 'without a number there is no WhatsApp button')
const lib = generateLibraryPage(P, 0, undefined, true, 'auto', E({ op: 'services', items: [{ name: 'Haircut', price: '300' }] }))
ok(lib.content.features.items[0].title === 'Haircut', 'library page: the services are used too')

// ── fonts: every business type has one that the page really reads
for (const key of THEME_KEYS) {
  const v = fontVars(key)
  const cls = themes[key].font
  const variable = cls === 'font-serif' ? '--font-serif' : cls === 'font-mono' ? '--font-mono' : '--font-sans'
  ok(Object.keys(v)[0] === variable && /^"[A-Za-z0-9 ]+", /.test(Object.values(v)[0]), `font of ${key} goes to ${variable}`)
  ok(/^https:\/\/fonts\.googleapis\.com\/css2\?family=[A-Za-z0-9+]+:wght@[0-9;]+&display=swap$/.test(fontHref(key)), `font address of ${key}`)
}
// the typeface of the business type (a design mood, when there is one, brings its own: see test-moods.mjs)
const { setCreativity } = await loadGeneratorModule('creativity.ts')
setCreativity('safe')
const food = generateWebsite('bakery in Jaipur', 0)
ok(food.tokens.light['--font-serif']?.startsWith('"Playfair Display"') && food.tokens.dark['--font-serif'] === food.tokens.light['--font-serif'], 'the page tokens carry the font in both modes')
const src = sourceFromPage(food)
ok(buildStandalone(src).includes('fonts.googleapis.com/css2?family=Playfair+Display'), 'one-file export links the font')
const files = buildStaticFiles(sourceFromSite(generateSite('bakery in Jaipur', 0)))
ok(files.filter((f) => f.path.endsWith('.html')).every((f) => f.content.includes('fonts.googleapis.com')), 'every page of the static export links the font')
setCreativity('balanced')
ok(fontLinks('modern_tech').includes('preconnect'), 'preconnect hints')

// ── deploy files in the static export
const names = files.map((f) => f.path.split('/').slice(1).join('/'))
for (const need of ['netlify.toml', '_headers', '.nojekyll', 'DEPLOY.md']) ok(names.includes(need), `static export has ${need}`)
const headers = files.find((f) => f.path.endsWith('_headers'))?.content ?? ''
ok(/X-Content-Type-Options: nosniff/.test(headers) && /Referrer-Policy/.test(headers) && /X-Frame-Options/.test(headers), 'security headers are in _headers')


// ── photos
const J = 'https://images.pexels.com/photos/1/a.jpeg'
ok(cleanOp({ op: 'photos', hero: J })?.hero === J, 'cleanOp: an https photo is accepted')
ok(cleanOp({ op: 'photos', hero: 'http://x.com/a.jpg' }) === undefined, 'cleanOp: plain http is refused')
ok(cleanOp({ op: 'photos', hero: 'javascript:alert(1)' }) === undefined, 'cleanOp: javascript: is refused')
ok(cleanOp({ op: 'photos', hero: 'https://x.com/a" onerror="alert(1)' }) === undefined, 'cleanOp: a quote in an address is refused')
ok(cleanOp({ op: 'photos', hero: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD' })?.hero?.startsWith('data:image/jpeg'), 'cleanOp: a small uploaded picture is accepted')
ok(cleanOp({ op: 'photos', hero: 'data:image/svg+xml;base64,PHN2Zz4=' }) === undefined, 'cleanOp: svg data pictures are refused (they can hold scripts)')
ok(cleanOp({ op: 'photos', hero: `data:image/jpeg;base64,${'A'.repeat(500000)}` }) === undefined, 'cleanOp: a huge picture is refused')
ok(cleanOp({ op: 'photos', gallery: Array.from({ length: 20 }, (_, i) => `https://x.com/${i}.jpg`) }).gallery.length === 8, 'cleanOp: at most 8 gallery photos')
const G = Array.from({ length: 6 }, (_, i) => `https://images.pexels.com/photos/${i + 10}/g.jpeg`)
const withPhotos = E({ op: 'photos', hero: J, about: 'https://images.pexels.com/photos/2/b.jpeg', gallery: G, credit: 'Photos: Pexels' })
const ph = generateWebsite('bakery in Jaipur', 0, 'premium', true, 'auto', withPhotos)
ok(ph.html.includes(`src="${J}"`) && ph.html.includes('photos/2/b.jpeg'), 'single page: hero and about photos')
ok(G.every((g) => ph.html.includes(g)) || G.slice(0, 6).filter((g) => ph.html.includes(g)).length >= 3, 'single page: gallery photos')
ok(/<img src="https:[^"]*" alt="[^"]+"/.test(ph.html), 'photos have alt text')
ok(ph.html.includes('Photos: Pexels'), 'the credit is in the footer')
ok(ph.code.includes('<img src=') && ph.code.includes('className="absolute inset-0 size-full object-cover"'), 'the React code has the photos')
const phMulti = generateSite('bakery in Jaipur', 0, undefined, true, 'auto', withPhotos)
ok(Object.values(phMulti.pagesHtml).filter((h) => h.includes(J)).length >= 1 && phMulti.pagesHtml['/'].includes('Photos: Pexels'), 'multi-page: photos and credit')
ok(phMulti.files.some((f) => f.code.includes(J)), 'multi-page React export has the photos')
ok(!generateWebsite('bakery in Jaipur', 0).html.includes('<img'), 'without photos the drawings stay')
ok(!generateWebsite('bakery in Jaipur', 0, 'premium', true, 'auto', E({ op: 'photos', hero: J }, { op: 'clearPhotos' })).html.includes(J), 'clearPhotos brings the drawings back')
// the centred hero uses the photo as a soft background
let centred
for (let v = 0; v < 12 && !centred; v += 1) { const g = generateWebsite('bakery in Jaipur', v, undefined, true, 'auto', E({ op: 'photos', hero: J })); if (g.choice.hero === 'hero-centered') centred = g }
ok(!centred || centred.html.includes('opacity-30'), 'the centred hero has the photo behind its text')


console.log(`${pass} passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

// Tests of the business details: WhatsApp button, map, opening hours, services and prices, fonts, deploy files.
globalThis.document = { styleSheets: [] }
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
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
import http from 'node:http'
import { spawn } from 'node:child_process'
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

// ── the photo search of the server, against a fake Pexels
let pexelsCalls = 0
const pexels = http.createServer((req, res) => {
  pexelsCalls += 1
  const url = new URL(req.url, 'http://x')
  res.writeHead(req.headers.authorization === 'pex-key' ? 200 : 401, { 'content-type': 'application/json' })
  res.end(JSON.stringify({ photos: Array.from({ length: 9 }, (_, i) => ({ id: i + 1, alt: `photo of ${url.searchParams.get('query')}`, photographer: 'Ana', photographer_url: 'https://www.pexels.com/@ana', url: `https://www.pexels.com/photo/${i + 1}/`, src: { large2x: `https://images.pexels.com/photos/${i + 1}/big.jpeg`, large: `https://images.pexels.com/photos/${i + 1}/l.jpeg`, medium: `https://images.pexels.com/photos/${i + 1}/m.jpeg` } })) }))
})
await new Promise((r) => pexels.listen(0, '127.0.0.1', r))
const PORT = 8900 + Math.floor(Math.random() * 90)
const run = (env) => spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(PORT), ...env }, stdio: 'ignore' })
const ready = async () => { for (let i = 0; i < 40; i += 1) { try { await fetch(`http://127.0.0.1:${PORT}/api/health`); return } catch { await new Promise((r) => setTimeout(r, 100)) } } }
let srv = run({ PEXELS_API_KEY: '', PHOTO_FALLBACK: 'off' })
await ready()
const none = await fetch(`http://127.0.0.1:${PORT}/api/photos?q=bakery`)
ok(none.status === 503 && (await (await fetch(`http://127.0.0.1:${PORT}/api/health`)).json()).photos === false, 'photos: no key -> 503 and health says so')
srv.kill()
await new Promise((r) => setTimeout(r, 300))
// without a key: Wikimedia Commons (a fake one here): only big landscape JPEGs with a free licence, the best matches first, at most two of one photographer
const JPEG = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64')
let commonsCalls = 0
const commons = http.createServer((req, res) => {
  if (req.url.startsWith('/img.jpg')) {
    res.writeHead(200, { 'content-type': 'image/jpeg' })
    return res.end(JPEG)
  }
  commonsCalls += 1
  const page = (id, title, mime, w, h, licence, description, artist = 'Bo') => ({ pageid: id, index: id, title, imageinfo: [{ mime, width: w, height: h, thumburl: `http://127.0.0.1:${commons.address().port}/img.jpg?id=${id}`, descriptionurl: `https://commons.wikimedia.org/wiki/${title}`, extmetadata: { LicenseShortName: { value: licence }, Artist: { value: `<a href="//x">${artist}</a>` }, ImageDescription: { value: description } } }] })
  res.writeHead(200, { 'content-type': 'application/json' })
  res.end(JSON.stringify({ query: { pages: {
    a: page(1, 'File:Bread.jpg', 'image/jpeg', 3000, 2000, 'CC BY-SA 4.0', 'fresh bread in a bakery window'),
    b: page(2, 'File:Noncommercial bakery.jpg', 'image/jpeg', 3000, 2000, 'CC BY-NC 4.0', 'bakery'),
    c: page(3, 'File:Bakery portrait.jpg', 'image/jpeg', 2000, 3000, 'CC BY 4.0', 'bakery'),
    d: page(4, 'File:Bakery logo.jpg', 'image/jpeg', 3000, 2000, 'CC0', 'bakery'),
    e: page(5, 'File:Tiny bakery.jpg', 'image/jpeg', 300, 200, 'CC0', 'bakery'),
    f: page(6, 'File:Bakery drawing.png', 'image/png', 3000, 2000, 'CC0', 'bakery'),
    g: page(7, 'File:Bakery counter.jpg', 'image/jpeg', 3000, 2000, 'CC BY 4.0', 'a bakery counter', 'Ann'),
    h: page(8, 'File:Mountain lake.jpg', 'image/jpeg', 3000, 2000, 'CC BY 4.0', 'a lake in the mountains', 'Cy'),
    i: page(9, 'File:Bakery shelf 1.jpg', 'image/jpeg', 3000, 2000, 'CC BY 4.0', 'bakery shelf', 'Ann'),
    j: page(10, 'File:Bakery shelf 2.jpg', 'image/jpeg', 3000, 2000, 'CC BY 4.0', 'bakery shelf', 'Ann'),
  } } }))
})
await new Promise((r) => commons.listen(0, '127.0.0.1', r))
const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'photo-cache-'))
srv = run({ PEXELS_API_KEY: '', COMMONS_BASE_URL: `http://127.0.0.1:${commons.address().port}`, EDIT_DATA_DIR: cacheDir })
await ready()
const viaCommons = await (await fetch(`http://127.0.0.1:${PORT}/api/photos?q=bakery`)).json()
const alts = viaCommons.photos.map((p) => p.alt)
ok(/Wikimedia/.test(viaCommons.source) && alts.includes('Bread') && alts.includes('Bakery counter'), 'photos: without a key Wikimedia Commons answers')
ok(!alts.some((a) => /Noncommercial|portrait|logo|Tiny|drawing|Mountain/i.test(a)), 'photos: no NC licence, no portrait, no logo, no tiny file, no PNG, nothing that does not match the words')
ok(alts.filter((a) => /shelf|counter/.test(a)).length <= 2, 'photos: at most two photos of one photographer')
ok(alts[0].startsWith('Bakery') || alts[0] === 'Bread', 'photos: the best match comes first')
ok(viaCommons.photos[0].credit.includes('('), 'photos: the photographer and the licence are named')
ok((await (await fetch(`http://127.0.0.1:${PORT}/api/health`)).json()).photos === true, 'photos: health says the search is on')
// a photo copied through the server is kept on the disk
const file = await fetch(`http://127.0.0.1:${PORT}/api/photo-file?u=${encodeURIComponent(viaCommons.photos[0].url)}`)
ok(file.status === 200 && file.headers.get('content-type') === 'image/jpeg', 'photos: a photo is copied through the server')
ok((await fetch(`http://127.0.0.1:${PORT}/api/photo-file?u=${encodeURIComponent('https://evil.example.com/a.jpg')}`)).status === 400, 'photos: only the hosts of the photo services can be copied')
srv.kill()
commons.close()
await new Promise((r) => setTimeout(r, 300))
// the internet is gone: the same search and the same photo come from the disk
srv = run({ PEXELS_API_KEY: '', COMMONS_BASE_URL: 'http://127.0.0.1:9', EDIT_DATA_DIR: cacheDir, PHOTO_FILE_HOSTS: new URL(viaCommons.photos[0].url).host })
await ready()
const offline = await (await fetch(`http://127.0.0.1:${PORT}/api/photos?q=bakery`)).json()
ok(offline.offline === true && offline.photos.length === viaCommons.photos.length, 'photos: a search that was made before is answered without the internet')
const offlineFile = await fetch(`http://127.0.0.1:${PORT}/api/photo-file?u=${encodeURIComponent(viaCommons.photos[0].url)}`)
ok(offlineFile.status === 200, 'photos: a photo that was loaded before is answered without the internet')
ok((await fetch(`http://127.0.0.1:${PORT}/api/photos?q=never+searched+before`)).status === 502, 'photos: a new search without the internet says so')
fs.rmSync(cacheDir, { recursive: true, force: true })
srv.kill()
await new Promise((r) => setTimeout(r, 300))
srv = run({ PEXELS_API_KEY: 'pex-key', PEXELS_BASE_URL: `http://127.0.0.1:${pexels.address().port}` })
await ready()
ok((await (await fetch(`http://127.0.0.1:${PORT}/api/health`)).json()).photos === true, 'photos: health says the photo search is on')
const found = await (await fetch(`http://127.0.0.1:${PORT}/api/photos?q=${encodeURIComponent('pest control <script>')}`)).json()
ok(found.photos.length === 9 && found.photos[0].url.startsWith('https://images.pexels.com/') && found.photos[0].credit === 'Ana' && found.source === 'Pexels', 'photos: the answer is cleaned and normalised')
ok(found.photos[0].alt === 'photo of pest control script', 'photos: the query is sanitised before it goes upstream')
await fetch(`http://127.0.0.1:${PORT}/api/photos?q=${encodeURIComponent('pest control <script>')}`)
ok(pexelsCalls === 1, 'photos: the same search is answered from the cache')
ok((await fetch(`http://127.0.0.1:${PORT}/api/photos`)).status === 400, 'photos: a missing query is refused')
srv.kill()
pexels.close()

console.log(`${pass} passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

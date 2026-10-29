// Core-Craft AI writing a whole page: the op that carries its texts, the decision when it is used (Hindi, a business without a text pack that names its
// services), the server route that cleans its page, and the real bridge on real prompts (when Python and the cont folder are here).
globalThis.document = { styleSheets: [] }
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const C = await loadGeneratorModule('edit/corecraft.ts')
const E = await loadGeneratorModule('edit/edits.ts')
const { generateWebsite } = await loadGeneratorModule('generateWebsite.ts')
const { generateSite } = await loadGeneratorModule('generateSite.ts')

const page = (over = {}) => ({
  brand: 'Spoke', lang: 'en', business_type: 'shop', type_label: 'Online Store', location: 'Bangalore', hero_heading: 'Cycles without the hassle', tagline: 'Good advice for helmets.', about_title: 'About Spoke',
  about: ['Our team handles repairs and cycles from start to finish.', 'We specialise in helmets.'], features_title: 'Why Choose Us',
  features: [{ title: 'Cycles', text: 'Get cycles handled by people who do it every day.' }, { title: 'Helmets', text: 'We make helmets simple.' }, { title: 'Repairs', text: 'Whatever you need from repairs, just ask.' }],
  highlights: [{ title: 'Chosen with care', text: 'A range picked for quality.' }, { title: 'Friendly help', text: 'Ask us anything.' }, { title: 'Easy to order', text: 'Simple ways to shop.' }],
  steps_title: 'How It Works', steps: [{ title: 'Browse', text: 'Look through the range.' }, { title: 'Choose', text: 'Pick what you like.' }, { title: 'Enjoy', text: 'Take it home.' }],
  faq: [{ q: 'Do you offer cycles?', a: 'Yes, cycles is one of the things we do.' }], cta_primary: 'Shop Now', cta_secondary: 'Browse', cta_title: 'Ready when you are', ui: { faq: 'FAQ', contact: 'Contact' },
  generated_by: { business_type: 'shop (confidence 1.4)', mode: 'strict (your phrases only)', items_from_prompt: ['cycles', 'helmets', 'repairs'] }, needs_review: ['Business type was detected with low confidence.'], ...over,
})
const ours = { niche: undefined, heroTitle: 'Bike Shop You Can Count On', subject: 'bike shop', theme: 'automotive', prompt: 'bike shop called Spoke in Bangalore selling cycles, helmets and repairs', brand: 'Spoke' }

// ── the op: checked, kept, undone
ok(!E.cleanOp({ op: 'core', data: {} }) && !E.cleanOp({ op: 'core' }) && !E.cleanOp({ op: 'core', data: 'x' }), 'an empty or malformed core op is refused')
const dirty = E.cleanOp({ op: 'core', data: { hero: { title: '<script>alert(1)</script>Hello world', subtitle: 'x'.repeat(500) }, features: { items: [{ title: 'A'.repeat(90), text: 'ok <b>text</b>' }, { title: '', text: 'no title' }, ...Array.from({ length: 20 }, (_, i) => ({ title: `t${i}`, text: `x${i}` }))] }, faq: [{ q: 'q?', a: 'a' }], titles: { features: 'Mine', nonsense: 'x' }, navLabels: { about: 'Hamare', zzz: 'x' } } })
ok(dirty && !/[<>]/.test(JSON.stringify(dirty)) && dirty.data.hero.subtitle.length <= 220, 'markup is removed and texts are cut to size')
ok(dirty.data.features.items.length === 8 && dirty.data.features.items[0].title.length <= 40, 'at most 8 service cards, titles cut')
ok(dirty.data.titles.features === 'Mine' && !('nonsense' in dirty.data.titles) && dirty.data.navLabels.about === 'Hamare' && !('zzz' in dirty.data.navLabels), 'only known sections and pages are titled')
ok(E.editsFrom([dirty]).core?.hero && E.editsFrom([dirty, { op: 'core', data: { faq: [{ q: 'a?', a: 'b' }] } }]).core.faq.length === 1, 'the last core op is the one that counts')
ok(/Core-Craft AI/.test(E.describeOp(dirty)), 'the op describes itself')

// ── the page: the texts are about the services of the person
const blocks = C.decideCore(page(), ours).blocks
const merged = generateWebsite(ours.prompt, 3, undefined, true, 'auto', E.editsFrom([{ op: 'core', data: blocks }]))
ok(merged.content.features.items.slice(0, 3).map((f) => f.title).join() === 'Cycles,Helmets,Repairs' && merged.content.features.items.length >= 3, 'the feature cards are the services of the person (values like "Easy to reach" are not cards)')
ok(merged.content.steps.items.map((s) => s.title).join() === 'Browse,Choose,Enjoy' && merged.content.faq[0].q === 'Do you offer cycles?', 'steps and questions come from Core-Craft')
ok(!merged.content.features.items.some((f) => /rental|car care|drive/i.test(JSON.stringify(f))), 'no padding of another business type (car rental next to a bike shop) among the service cards')
const typed = generateWebsite(ours.prompt, 3, undefined, true, 'auto', E.editsFrom([{ op: 'core', data: blocks }, { op: 'text', field: 'featuresTitle', text: 'My own title' }, { op: 'services', items: [{ name: 'Gears' }, { name: 'Bells' }] }]))
ok(typed.content.features.title === 'My own title' && typed.content.features.items.map((f) => f.title).join() === 'Gears,Bells', 'what the person types afterwards wins over Core-Craft')
const multi = generateSite(ours.prompt, 3, undefined, true, 'auto', E.editsFrom([{ op: 'core', data: { ...blocks, navLabels: { about: 'हमारे बारे में', contact: 'संपर्क' } } }]))
ok(multi.content.features.items[0].title === 'Cycles' && multi.content.faq[0].q === 'Do you offer cycles?', 'a multi-page site gets the same texts')
ok(multi.pages.find((p) => p.id === 'contact')?.label === 'संपर्क' && multi.pages.find((p) => p.id === 'about')?.label === 'हमारे बारे में', 'the menu of a multi-page site follows the labels of Core-Craft')

// ── the decision
let d = C.decideCore(page(), ours)
ok(d.use && /Cycles|cycles/.test(d.reason), 'a business without a pack that names 3 services: Core-Craft writes it')
ok(d.blocks.cta?.button === 'Shop Now' && d.blocks.steps.title === 'How It Works' && !d.blocks.navLabels, 'in English Core-Craft writes the buttons and section titles, the menu stays')
ok(d.hide.map((h) => h.section).join() === 'blog,testimonials,team,pricing', 'its general blog notes and sample reviews stay out')
ok(C.decideCore(page(), { ...ours, niche: 'dental_clinic' }).use, 'a business with a hand-written text pack: Core-Craft still writes it when it named 2+ services (the pack padded restaurants with thali)')
ok(!C.decideCore(page({ generated_by: { business_type: 'cafe', mode: 'typical offerings', items_from_prompt: ['arduino', 'drones'] } }), ours).use, 'a page that is not tied to the services is not used')
ok(!C.decideCore(page({ generated_by: { business_type: 'shop', mode: 'strict (your phrases only)', items_from_prompt: ['cycles'] } }), ours).use, 'one service is too little to write a page about')
ok(d.review.length === 1, 'what Core-Craft says to check is passed on')
ok(d.blocks.hero.title === 'Cycles without the hassle' && d.blocks.hero.button === 'Shop Now', 'the first screen is Core-Craft\'s too')
ok(C.decideCore(page({ hero_heading: 'Paint without the hassle', generated_by: { business_type: 'shop', mode: 'strict (your phrases only)', items_from_prompt: ['paint', 'pipes', 'tools'] } }), { ...ours, subject: 'hardware store', heroTitle: 'Where Reliable Services And Trusted Projects Come Together', theme: 'general_business' }).blocks.hero?.title === 'Paint without the hassle', 'a heading that does not name the business is replaced by one that names a service')
const hindi = C.decideCore(page({ lang: 'hi', brand: 'स्माइल केयर', hero_heading: 'इम्प्लांट में भरोसेमंद मदद', features_title: 'हमारी सेवाएं', ui: { about: 'हमारे बारे में', pricing: 'कीमतें', team: 'हमारी टीम', faq: 'सवाल-जवाब', faq_title: 'अक्सर पूछे जाने वाले सवाल', contact: 'संपर्क', testimonials: 'ग्राहकों की राय' }, generated_by: { business_type: 'clinic', mode: 'strict (your phrases only)', items_from_prompt: ['इम्प्लांट', 'ब्रेसेज़'] } }), { ...ours, niche: 'dental_clinic', brand: 'Oak Care' })
ok(hindi.use && hindi.rename === 'स्माइल केयर' && hindi.blocks.lang === 'hi' && hindi.blocks.navLabels.contact === 'संपर्क' && hindi.blocks.titles.faq === 'अक्सर पूछे जाने वाले सवाल', 'a Hindi prompt is always written by Core-Craft, with the name, the menu and the headings in Hindi (even where a text pack exists)')
const hops = [{ op: 'core', data: hindi.blocks }, { op: 'rename', name: hindi.rename }, ...hindi.hide]
const hs = generateWebsite('दिल्ली में दांतों का क्लिनिक', 3, 'premium', true, 'auto', E.editsFrom(hops))
const visible = (html) => html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')
ok(hs.content.brandName === 'स्माइल केयर' && /[\u0900-\u097F]/.test(hs.content.hero.title) && hs.content.navLabels.about === 'हमारे बारे में', 'the Hindi page has a Hindi name, heading and menu')
ok(!/Kabir|Okafor|Haddad|Siddharth|Dedicated practitioner/.test(visible(hs.html)), 'the English team, prices and sample reviews are not shown on a Hindi page')
ok(hs.html.includes('स्माइल केयर') && hs.html.includes('और जानें') && !/>Learn more</.test(hs.html) && !/>Welcome to</.test(hs.html), 'the Hindi name is in the page, and the fixed words of the first screen are Hindi too')
ok(!C.decideCore({ ...page(), features: [] }, ours).use, 'an incomplete page is not used')

// ── the server route with a fake Core-Craft behind it
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-'))
const seen = []
const fake = http.createServer((req, res) => {
  if (req.url === '/health') return res.end('{"ok":true}')
  let body = ''
  req.on('data', (x) => (body += x))
  req.on('end', () => { res.setHeader('content-type', 'application/json'); seen.push(JSON.parse(body).prompt); if (JSON.parse(body).prompt.includes('fail')) { res.statusCode = 422; return res.end('{"error":"x"}') } res.end(JSON.stringify({ page: { ...page(), brand: '<b>Spoke</b>', hero_heading: 'h'.repeat(300), features: Array.from({ length: 30 }, (_, i) => ({ title: `T${i}`, text: '<script>x</script>y' })), evil: 'zzz', ui: { about: 'About', secret: 'x' } } })) })
})
await new Promise((r) => fake.listen(0, '127.0.0.1', r))
const PORT = 9900 + Math.floor(Math.random() * 90)
const srv = spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(PORT), EDIT_DATA_DIR: dir, CORECRAFT_URL: `http://127.0.0.1:${fake.address().port}` }, stdio: 'ignore' })
for (let i = 0; i < 40; i += 1) { try { await fetch(`http://127.0.0.1:${PORT}/api/health`); break } catch { await new Promise((r) => setTimeout(r, 100)) } }
try {
  const r = await (await fetch(`http://127.0.0.1:${PORT}/api/corecraft/page?prompt=${encodeURIComponent('bike shop selling cycles')}`)).json()
  ok(r.page.brand === 'bSpoke/b'.replace('bSpoke/b', 'bSpoke/b') || !/[<>]/.test(JSON.stringify(r)), 'markup is removed from the page')
  ok(r.page.hero_heading.length === 120 && r.page.features.length === 8 && !('evil' in r.page) && !('secret' in r.page.ui), 'the page is cut to size and only known fields come back')
  ok((await fetch(`http://127.0.0.1:${PORT}/api/corecraft/page?prompt=fail`)).status === 422, 'a prompt Core-Craft cannot write is a 422')
  ok((await fetch(`http://127.0.0.1:${PORT}/api/corecraft/page?prompt=`)).status === 400, 'an empty prompt is refused')
  const hindiUrl = await fetch(`http://127.0.0.1:${PORT}/api/corecraft/page?prompt=${encodeURIComponent('दिल्ली में क्लिनिक')}`)
  ok(hindiUrl.status === 200, 'a Devanagari prompt reaches Core-Craft (letters are kept)')
  const echo = await (await fetch(`http://127.0.0.1:${PORT}/api/corecraft/page?prompt=${encodeURIComponent('क्लिनिक, इम्प्लांट। नाम "स्माइल"')}`)).json()
  ok(echo.page && seen.at(-1) === 'क्लिनिक, इम्प्लांट। नाम "स्माइल"', 'the Hindi full stop and the quotes of the prompt reach Core-Craft unchanged (they split the services from the name)')
} finally {
  srv.kill()
  fake.close()
  fs.rmSync(dir, { recursive: true, force: true })
}

// ── broken frames of the content AI are caught before they reach a page
{
  const shop = C.decideCore(page({ features: [{ title: 'Kurtis', text: 'a' }, { title: 'Sarees', text: 'b' }, { title: 'Free shipping above 999', text: 'c' }, { title: 'Online Store', text: 'd' }], about: ['Rang Mahal sells free shipping above 999 and kurtis.'], generated_by: { business_type: 'shop', mode: 'strict (your phrases only)', items_from_prompt: ['kurtis', 'sarees', 'free shipping above 999'] } }), ours)
  ok(shop.use && shop.blocks.features.items.map((f) => f.title).join().startsWith('Kurtis,Sarees') && !/shipping/i.test(JSON.stringify(shop.blocks.features.items.slice(0, 2))), 'an offer ("free shipping above 999") is not a service card')
  ok(!shop.blocks.features.items.some((f) => f.title === 'Online Store') && !shop.blocks.about, 'the type of the business is not a service, and a paragraph that sells an offer is left to the built-in text')
  ok(shop.hide.some((h) => h.section === 'pricing'), 'no prices given: the price list of the kit is left out')
  const hi = C.decideCore(page({ lang: 'hi', brand: 'स्माइल केयर', hero_heading: 'इम्प्लांट — दिल्ली में ब्रेसेज़ और नाम — दिल्ली में', features: [{ title: 'इम्प्लांट', text: 'क' }, { title: 'नाम', text: 'ख' }] }), ours)
  ok(hi.blocks.hero.title.startsWith('स्माइल केयर') && !hi.blocks.features.items.some((f) => f.title === 'नाम'), 'a garbled Hindi heading and the word "नाम" as a service are fixed')
}

// ── the real bridge on real prompts
const cont = path.resolve(process.env.CORECRAFT_DIR ?? ['../cont', '../../cont'].find((d) => fs.existsSync(path.join(d, 'corecraft'))) ?? '../cont')
if (fs.existsSync(path.join(cont, 'corecraft', 'business_types.py'))) {
  const BP = 9700 + Math.floor(Math.random() * 90)
  const bridge = spawn(process.env.PYTHON ?? 'python3', ['scripts/corecraft_bridge.py', '--port', String(BP)], { env: { ...process.env, CORECRAFT_DIR: cont, PYTHONDONTWRITEBYTECODE: '1' }, stdio: 'ignore' })
  let up = false
  for (let i = 0; i < 80 && !up; i += 1) { try { up = (await fetch(`http://127.0.0.1:${BP}/health`)).ok } catch { await new Promise((r) => setTimeout(r, 250)) } }
  try {
    ok(up, 'the real bridge starts (new engine)')
    if (up) {
      const ask = async (prompt) => (await (await fetch(`http://127.0.0.1:${BP}/page`, { method: 'POST', body: JSON.stringify({ prompt, seed: 3 }) })).json()).page
      const used = []
      const padding = /rental|car care|test drive|rollback|startup|plans for mindful|brews|detailing|facial|pickup and drop/i
      let paddedBefore = 0
      let paddedAfter = 0
      let tried = 0
      for (const [prompt, services] of [
        ['bike shop called Spoke in Bangalore selling cycles, helmets and repairs', ['cycles', 'helmets', 'repairs']],
        ['hardware store called Patel Traders in Surat selling paint, pipes and tools', ['paint', 'pipes', 'tools']],
        ['tyre shop called Grip Point in Nagpur with tyres, alignment and batteries', ['tyres', 'alignment', 'batteries']],
        ['mens wear store called Gents Corner in Lucknow with suits, shirts and jeans', ['suits', 'shirts', 'jeans']],
        ['toy store called Funky in Indore selling puzzles, dolls and board games', ['puzzles', 'dolls', 'board games']],
        ['stationery shop called Paper Plane in Nashik selling notebooks, pens and files', ['notebooks', 'pens', 'files']],
      ]) {
        const p = await ask(prompt)
        const base = generateWebsite(prompt, 3)
        const dec = C.decideCore(p, { niche: base.niche, heroTitle: base.content.hero.title, subject: base.content.subject, theme: base.themeKey, prompt, brand: base.content.brandName })
        if (base.niche) continue
        tried += 1
        if (dec.use) {
          used.push(prompt)
          const after = generateWebsite(prompt, 3, undefined, true, 'auto', E.editsFrom([{ op: 'core', data: dec.blocks }]))
          const wordsOk = services.every((w) => after.content.features.items.some((f) => f.title.toLowerCase() === w))
          ok(wordsOk, `the page of "${prompt.slice(0, 30)}" lists exactly the services that were named`)
          paddedBefore += padding.test(JSON.stringify(base.content.features.items) + JSON.stringify(base.content.marquee)) ? 1 : 0
          paddedAfter += padding.test(JSON.stringify(after.content.features.items) + JSON.stringify(after.content.marquee)) ? 1 : 0
        }
      }
      ok(tried >= 4 && used.length >= Math.ceil(tried * 0.75), `most businesses without a pack that name 3 services are written by Core-Craft (${used.length} of ${tried})`)
      ok(paddedAfter === 0 && paddedAfter <= paddedBefore, `no padding of another business type on the services (before ${paddedBefore}, after ${paddedAfter})`)
      // Hindi
      const hp = await ask('दिल्ली में दांतों का क्लिनिक, इम्प्लांट, ब्रेसेज़ और सफाई। नाम "स्माइल केयर"')
      ok(hp.lang === 'hi' && hp.brand === 'स्माइल केयर' && hp.features.map((f) => f.title).filter((t) => t !== 'नाम').join() === 'इम्प्लांट,ब्रेसेज़,सफाई', 'a Hindi prompt: Hindi page, the name and the three services of the prompt')
      const hd = C.decideCore(hp, { niche: undefined, heroTitle: 'x', subject: 'x', theme: 'healthcare', prompt: 'x', brand: 'Oak Care' })
      const hsite = generateWebsite('दिल्ली में दांतों का क्लिनिक', 3, 'premium', true, 'auto', E.editsFrom([{ op: 'core', data: hd.blocks }, ...(hd.rename ? [{ op: 'rename', name: hd.rename }] : []), ...(hd.hide ?? [])]))
      ok(hsite.content.brandName === 'स्माइल केयर' && !/[A-Za-z]{4,}/.test(hsite.content.hero.title + hsite.content.hero.subtitle + hsite.content.features.items.map((f) => f.title + f.text).join('')), 'the Hindi site has no English words in its heading, subheading and service cards')
      ok(hsite.html.includes('स्माइल केयर') && /हमारे बारे में/.test(hsite.html) && /संपर्क/.test(hsite.html), 'the Hindi name and the Hindi menu are in the page')
    }
  } finally {
    bridge.kill()
  }
}

console.log(`corecontent: ${pass} checks passed, ${fail.length} failed`)
if (fail.length) {
  console.log(fail.map((f) => ` - ${f}`).join('\n'))
  process.exit(1)
}

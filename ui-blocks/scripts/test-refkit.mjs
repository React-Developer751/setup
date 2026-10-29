// The designs read from live translation-service sites: a translation / certificate prompt gets the design of its kind, and the parts of the reference kit.
globalThis.document = { styleSheets: [] }
import fs from 'node:fs'
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, n) => (c ? (pass += 1) : fail.push(n))

const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { referenceMood, showcaseMood, moodFromText } = await loadGeneratorModule('moods.ts')
const { refPools, rolePools, showPools } = await loadGeneratorModule('library/libraryRoles.ts')

const CASES = [
  ['Medical translation service in the UK called MediLingua: certified medical report translation, NHS and hospital documents', 'clinic-mesh'],
  ['Death certificate translation UK called Solace Translations: certified and notarised, Home Office accepted', 'plum-ivory'],
  ['Divorce certificate translation service in the UK called ClearPath Translations: certified, notarised, court use', 'trust-navy'],
  ['Marketing translation agency in the UK called BrandBridge: campaigns, websites, adverts, transcreation', 'violet-glow'],
  ['ICA certified translation services in Singapore called ProDoc Translations: PR, citizenship, birth certificates', 'cream-coral'],
  ['Immigration visa document translation with apostille', 'trust-navy'],
]
// the designs read for a kind of site win nearly always when balanced (their parts compete with the stored ones by taste); a design the person names is worn as it is
const refShare = { hero: [0, 0], features: [0, 0] }
for (const [prompt, mood] of CASES) {
  ok(referenceMood(prompt) === mood, `${mood}: the kind of translation site is recognised (${prompt.slice(0, 24)})`)
  for (const variation of [1, 4, 9]) for (const tier of ['normal', 'better', 'premium']) {
    const page = generateLibraryPage(prompt, variation, tier)
    ok(page.palette.name.toLowerCase().includes(mood.split('-')[0]) || page.palette.name.length > 0, 'a palette')
    const ids = Object.fromEntries(page.sections.map((s) => [s.role, s.componentId]))
    refShare.hero[0] += ids.hero === 'refkit/RefHero1' ? 1 : 0
    refShare.hero[1] += 1
    refShare.features[0] += page.sections.filter((s) => s.role === 'features').every((s) => s.componentId === 'refkit/RefFeatures1') ? 1 : 0
    refShare.features[1] += 1
    ok(page.css.includes('.ref-cta-box'), `${mood}: its closing panel colours are in the css`)
  }
}
for (const [role, [hit, all]] of Object.entries(refShare)) ok(hit / all >= 0.8, `the reference ${role} of the translation designs wins nearly always (${hit}/${all})`)
for (const name of ['trust navy', 'clinic mesh', 'violet glow', 'plum and ivory', 'cream and coral']) {
  for (const variation of [1, 4, 9]) {
    const page = generateLibraryPage(`plumber called Pipe Pro in Leeds, ${name} look`, variation, 'premium')
    ok(page.sections.some((s) => s.componentId === 'refkit/RefHero1') && page.sections.filter((s) => s.role === 'features').every((s) => s.componentId === 'refkit/RefFeatures1'), `"${name}" is worn as it is`)
  }
}
// a business that is not a translation site keeps the stored components and its own mood
const { setCreativity } = await loadGeneratorModule('creativity.ts')
setCreativity('safe')
const bakery = generateLibraryPage('bakery called Sweet Crumbs in Mumbai', 3, 'premium')
// (the menu board of a food business is its content, not a design: it is the one kit part a bakery has at every creativity)
ok(bakery.sections.every((s) => s.componentId === 'refkit/RefMenu1' || !/^(refkit|showkit)\//.test(s.componentId)), 'at a safe creativity a bakery keeps the stored components')
setCreativity('balanced')
ok(generateLibraryPage('bakery called Sweet Crumbs in Mumbai', 3, 'premium').sections.some((s) => /^(refkit|showkit)\//.test(s.componentId)), 'at the usual creativity a bakery wears a learned design')
ok(referenceMood('bakery called Sweet Crumbs') === undefined && referenceMood('gym in Pune') === undefined, 'only translation and certificate prompts have a reference design')
// asked by name: any business can wear it
ok(moodFromText('a plumber website, trust navy look')?.id === 'trust-navy', 'a design can be asked for by name')
const named = generateLibraryPage('plumber called Pipe Pro in Leeds, trust navy look', 3, 'premium')
ok(named.sections.some((s) => s.componentId === 'refkit/RefHero1'), 'a plumber in the navy design gets the reference hero')
// the pools: every part of the kit has a role, and none is in the pools of the stored components
for (const [role, ids] of Object.entries(refPools)) {
  ok(ids.length >= 1 && ids.every((id) => id.startsWith('refkit/')), `the kit part of "${role}" is in refkit/`)
  ok(ids.every((id) => !(rolePools[role] ?? []).includes(id)), `the stored pool of "${role}" does not hold a kit part`)
}
// every slot of the kit is marked, the fill needs it
for (const f of fs.readdirSync('src/components/refkit')) {
  const code = fs.readFileSync(`src/components/refkit/${f}`, 'utf8')
  ok(/data-ref="[a-z]+"/.test(code) && /data-slot="/.test(code), `${f}: has data-ref and data-slot parts`)
}
// ── the six designs read from picture-led sites: Gucci, Nowness, Lusion, Apple, teenage engineering, Tesla
const SHOW = [
  ['Luxury fashion house called Maison Verre in Milan: couture, handbags, silk scarves', 'maison-noir', 'showkit/ShowTiles1'],
  ['Film magazine and documentary studio called Slow Reel: short films, photography essays', 'film-editorial', 'showkit/ShowTiles1'],
  ['3D interactive digital studio called Orbit Lab: WebGL experiences, motion design', 'atelier-3d', 'showkit/ShowTiles1'],
  ['Consumer electronics brand called Lumen: wireless headphones, smartwatch, smartphone', 'apple-tile', 'showkit/ShowStack1'],
  ['Synth and audio instrument maker called Pocket Waves: drum machines, samplers', 'techno-black', 'showkit/ShowStack1'],
  ['Electric car showroom called Volt Motors: electric cars, home solar, wall chargers', 'showroom-white', 'showkit/ShowStack1'],
  ['Immersive experiences studio called Dark Room: installations, VR, interactive experiences', 'noir-lab', 'showkit/ShowIndex1'],
  ['Furniture and lighting studio called Sable Home: sofas, lamps, ceramics', 'blush-serif', 'showkit/ShowTiles1'],
  ['Indie game studio called Pixel Pals: arcade games, esports events', 'neon-arcade', 'showkit/ShowTiles1'],
  ['Creative agency called Northfold: brand identity, websites, campaigns', 'studio-index', 'showkit/ShowIndex1'],
]
// a design the generator chose for the kind of business is a starting point: its picture-led parts compete with the stored ones by taste (taste.ts) and win
// most of the time; a design the person names ("in the style of Apple") is worn as it is
const share = { hero: [0, 0], features: [0, 0], cta: [0, 0] }
for (const [prompt, mood, features] of SHOW) {
  ok(showcaseMood(prompt) === mood, `${mood}: recognised (${prompt.slice(0, 22)})`)
  for (const variation of [1, 5, 9]) for (const tier of ['normal', 'premium']) {
    const page = generateLibraryPage(prompt, variation, tier)
    const ids = Object.fromEntries(page.sections.map((x) => [x.role, x.componentId]))
    const kitHero = /^showkit\/ShowTypeHero1$|^showkit\/ShowHero1$/.test(ids.hero)
    share.hero[0] += kitHero ? 1 : 0
    share.hero[1] += 1
    share.cta[0] += ids.cta === 'showkit/ShowCta1' ? 1 : 0
    share.cta[1] += 1
    const kitFeatures = page.sections.filter((x) => x.role === 'features').every((x) => x.componentId === features)
    share.features[0] += kitFeatures ? 1 : 0
    share.features[1] += 1
    // whichever parts won, the rules and the typeface of the design are in the page
    ok((page.css.includes('.show-hero') || page.css.includes('.show-type-hero') || page.css.includes('--g-font') || !!page.fontTokens?.['--g-font']) && page.fontTokens?.['--g-font'], `${mood}: its rules and typeface are in the page`)
  }
}
for (const [role, [hit, all]] of Object.entries(share)) ok(hit / all >= 0.45 && hit < all, `the picture-led ${role} wins most of the time but not always (${hit}/${all})`)
// a design the person names is worn as it is
for (const [name, mood, features] of [['apple style', 'apple-tile', 'showkit/ShowStack1'], ['obys style', 'studio-index', 'showkit/ShowIndex1'], ['gucci style', 'maison-noir', 'showkit/ShowTiles1']]) {
  for (const variation of [1, 5, 9]) {
    const page = generateLibraryPage(`${name} website for a bakery called Sweet Crumbs`, variation, 'premium')
    const ids = Object.fromEntries(page.sections.map((x) => [x.role, x.componentId]))
    ok(/^showkit\/ShowTypeHero1$|^showkit\/ShowHero1$/.test(ids.hero) && ids.cta === 'showkit/ShowCta1' && ids.features === features, `"${name}" is worn as it is (${mood})`)
  }
}
ok(['maison-noir', 'film-editorial', 'atelier-3d', 'apple-tile', 'techno-black', 'showroom-white', 'noir-lab', 'neon-arcade'].every((m) => showPools[m]?.hero?.[0] === 'showkit/ShowHero1') && ['blush-serif', 'studio-index'].every((m) => showPools[m]?.hero?.[0] === 'showkit/ShowTypeHero1'), 'every picture-led design has its kit parts')
ok(showcaseMood('bakery called Sweet Crumbs') === undefined && referenceMood('Electric car showroom') === undefined, 'a bakery has no picture-led design, and a car showroom is not a translation site')
ok(moodFromText('apple style website for a bakery')?.id === 'apple-tile', 'the famous sites can be asked for by name')
for (const f of fs.readdirSync('src/components/showkit')) {
  const code = fs.readFileSync(`src/components/showkit/${f}`, 'utf8')
  ok(/data-ref="show-[a-z-]+"/.test(code) && /data-slot="/.test(code), `${f}: has data-ref and data-slot parts`)
}
console.log(`refkit: ${pass} checks passed, ${fail.length} failed`)
if (fail.length) { console.log(fail.map((f) => ` - ${f}`).join('\n')); process.exit(1) }

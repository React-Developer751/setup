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
ok(some > 40 && some < 120 && wild > some, `balanced uses it now and then (${some} of 200), wild more often (${wild})`)
ok(pick.pickGenHero({ ...base, variation: 5 }) === pick.pickGenHero({ ...base, variation: 5 }), 'a prompt and a variation give the same choice')
// a page that uses one
let page
for (let v = 1; v <= 40 && !page; v += 1) { const l = generateLibraryPage('cafe website in Jaipur', v, 'better', true, 'auto', undefined, false); if (l.sections.some((s) => s.componentId.startsWith('gen/'))) page = l }
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
console.log(`${pass} passed, ${fail.length} failed`)
for (const f of [...new Set(fail)].slice(0, 12)) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

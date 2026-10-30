// The design generator (src/generator/gen): the spec, its id, the tree, the component and its source text.
import { loadGeneratorModule } from './lib/load-generator.mjs'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const spec = await loadGeneratorModule('gen/heroSpec.ts')
const emit = await loadGeneratorModule('gen/heroEmit.ts')
const pick = await loadGeneratorModule('gen/heroPick.ts')
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
console.log(`${pass} passed, ${fail.length} failed`)
for (const f of [...new Set(fail)].slice(0, 12)) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

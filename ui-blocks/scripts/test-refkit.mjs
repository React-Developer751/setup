// The designs read from live translation-service sites: a translation / certificate prompt gets the design of its kind, and the parts of the reference kit.
globalThis.document = { styleSheets: [] }
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, n) => (c ? (pass += 1) : fail.push(n))

const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { referenceMood, moodFromText } = await loadGeneratorModule('moods.ts')
const { refPools, rolePools } = await loadGeneratorModule('library/libraryRoles.ts')

const CASES = [
  ['Medical translation service in the UK called MediLingua: certified medical report translation, NHS and hospital documents', 'clinic-mesh'],
  ['Death certificate translation UK called Solace Translations: certified and notarised, Home Office accepted', 'plum-ivory'],
  ['Divorce certificate translation service in the UK called ClearPath Translations: certified, notarised, court use', 'trust-navy'],
  ['Marketing translation agency in the UK called BrandBridge: campaigns, websites, adverts, transcreation', 'violet-glow'],
  ['ICA certified translation services in Singapore called ProDoc Translations: PR, citizenship, birth certificates', 'cream-coral'],
  ['Immigration visa document translation with apostille', 'trust-navy'],
]
for (const [prompt, mood] of CASES) {
  ok(referenceMood(prompt) === mood, `${mood}: the kind of translation site is recognised (${prompt.slice(0, 24)})`)
  for (const variation of [1, 4, 9]) for (const tier of ['normal', 'better', 'premium']) {
    const page = generateLibraryPage(prompt, variation, tier)
    ok(page.palette.name.toLowerCase().includes(mood.split('-')[0]) || page.palette.name.length > 0, 'a palette')
    const ids = Object.fromEntries(page.sections.map((s) => [s.role, s.componentId]))
    ok(ids.hero === 'refkit/RefHero1', `${mood} v${variation} ${tier}: the hero is the reference hero (${ids.hero})`)
    ok(page.sections.filter((s) => s.role === 'features').every((s) => s.componentId === 'refkit/RefFeatures1'), `${mood}: the services are the tinted cards`)
    ok(page.css.includes('.ref-cta-box'), `${mood}: its closing panel colours are in the css`)
  }
}
// a business that is not a translation site keeps the stored components and its own mood
const bakery = generateLibraryPage('bakery called Sweet Crumbs in Mumbai', 3, 'premium')
ok(bakery.sections.every((s) => !s.componentId.startsWith('refkit/')), 'a bakery does not get the reference kit')
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
import fs from 'node:fs'
for (const f of fs.readdirSync('src/components/refkit')) {
  const code = fs.readFileSync(`src/components/refkit/${f}`, 'utf8')
  ok(/data-ref="[a-z]+"/.test(code) && /data-slot="/.test(code), `${f}: has data-ref and data-slot parts`)
}
console.log(`refkit: ${pass} checks passed, ${fail.length} failed`)
if (fail.length) { console.log(fail.map((f) => ` - ${f}`).join('\n')); process.exit(1) }

// Every kind of business has its own way of moving and its own depth: several kinds of arrival, extras that fit the business,
// a page that is neither a stub nor endless, and a short prompt is not a request for a poor page.
import { loadGeneratorModule } from './lib/load-generator.mjs'
globalThis.document = { styleSheets: [] }

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { thinkMotion } = await loadGeneratorModule('motionBrain.ts')
const { depthOf, sectionWeights } = await loadGeneratorModule('experience.ts')
const { analyzePrompt } = await loadGeneratorModule('designBrain.ts')

const BUSINESSES = {
  'dental clinic Smile Care in Pune': 'calm',
  'gym in Jaipur': 'energetic',
  'kurti boutique Jaipur': 'elegant',
  'italian restaurant Forno Rosso Mumbai': 'appetite',
  'SaaS invoicing tool': 'tech',
  'kids toy store': 'playful',
  'travel agency Goa Kerala': 'wander',
  'wedding photographer Udaipur': 'creative',
}
const recipes = new Set()
for (const [prompt, recipe] of Object.entries(BUSINESSES)) {
  const page = generateLibraryPage(prompt, 0, undefined, true, 'auto')
  const m = page.motion
  recipes.add(m.recipe)
  ok(m.recipe === recipe, `"${prompt}" moves with the ${recipe} recipe (${m.recipe})`)
  ok(new Set(m.mix).size >= 3, `"${prompt}": at least three different arrivals (${m.mix})`)
  ok(m.level === 'rich', `"${prompt}": a plain prompt gets rich motion, not the subtle one (${m.level})`)
  const extras = Object.entries(m.features).filter(([k, on]) => on && !['reveal', 'hover', 'accordion'].includes(k))
  ok(extras.length >= 3, `"${prompt}": at least three extras beyond the basics (${extras.map(([k]) => k)})`)
  // the page is not a stub
  const n = page.sections.length
  ok(n >= 10 && n <= 15, `"${prompt}": a page of ${n} parts is neither a stub nor endless`)
}
ok(recipes.size >= 7, `the businesses use at least seven different recipes (${[...recipes]})`)

// serious businesses do not get the showy extras, playful and creative ones do
const rand = () => 0.5
const calm = thinkMotion('healthcare', 'premium', 'auto', rand).features
const wild = thinkMotion('creative_studio', 'premium', 'auto', rand).features
ok(!calm.tilt && !calm.magnetic && !calm.parallax && !calm.wiggle && !calm.split, 'a clinic does not tilt, lean, drift or wiggle')
ok(wild.tilt && wild.magnetic && wild.parallax && wild.split, 'a studio tilts, leans, drifts and splits its headline')
// the arrivals are different for different businesses
const arrive = (theme) => thinkMotion(theme, 'better', 'auto', rand).mix.join('>')
ok(arrive('bold_fitness') !== arrive('healthcare') && arrive('luxury_minimal') !== arrive('bold_fitness') && arrive('creative_studio') !== arrive('food_dining'), 'a gym, a clinic, a luxury house, a studio and a restaurant do not arrive the same way')
// off is off, and a quiet level keeps three arrivals and no continuous effect
const off = thinkMotion('food_dining', 'premium', 'off', rand)
ok(off.level === 'off' && !Object.values(off.features).some(Boolean), 'motion off switches every effect off')
const subtle = thinkMotion('food_dining', 'better', 'subtle', rand)
ok(subtle.mix.length === 3 && !subtle.features.kenburns && !subtle.features.parallax && !subtle.features.shimmer, 'subtle motion has no drifting or sweeping extras')

// depth by business type
ok(depthOf('healthcare') === 'focused' && depthOf('food_dining') === 'rich' && depthOf('bold_fitness') === 'standard', 'the depth follows the kind of business')
ok(sectionWeights('food_dining').gallery > sectionWeights('healthcare').gallery && sectionWeights('healthcare').faq > sectionWeights('food_dining').faq, 'a restaurant shows more pictures, a clinic more answers')
let galleries = { rich: 0, focused: 0 }
for (let v = 0; v < 20; v += 1) {
  if (generateLibraryPage('italian restaurant Forno Rosso Mumbai', v, 'better').sections.some((s) => s.role === 'gallery')) galleries.rich += 1
  if (generateLibraryPage('dental clinic Smile Care in Pune', v, 'better').sections.some((s) => s.role === 'gallery')) galleries.focused += 1
}
ok(galleries.rich >= 17 && galleries.rich > galleries.focused, `restaurants nearly always have a gallery (${galleries.rich}/20) and clinics less often (${galleries.focused}/20)`)

// a short prompt is not a request for a short page; asking for a simple one is
ok(analyzePrompt('gym in Jaipur').tier === 'better', 'a three-word prompt gets the full page')
ok(analyzePrompt('simple basic gym page').tier === 'normal', 'asking for a simple page gets the short one')
ok(analyzePrompt('SaaS tool for invoicing small shops').tier !== 'normal' && analyzePrompt('quick easy repairs for tiny phones').tier !== 'normal', 'small, quick, easy and tiny describe the business, not the page')

console.log(`${pass} passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

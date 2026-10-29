// The generator's own idea of a business: known colours for the kind of business (coffee is brown, not pink), readable in both modes, bets that stay inside what
// the business may wear, and learning from what the person corrects.
import { loadGeneratorModule } from './lib/load-generator.mjs'
globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const { thinkConcept, familiesOf, noMemory, conceptOps, buildPalette } = await loadGeneratorModule('concept.ts')
const { contrast } = await loadGeneratorModule('colorBrain.ts')
const { conceptMemoryFor, MemoryCorrections } = await loadGeneratorModule('memory/correctionMemory.ts')
const { cleanOp, editsFrom } = await loadGeneratorModule('edit/edits.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { rgbToHsl, hexToRgb } = await loadGeneratorModule('art/color.ts')
const hueOf = (hex) => rgbToHsl(hexToRgb(hex)).h
const seeded = (n) => { let s = n; return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296) }

// the kinds of business it knows
const KNOWN = [
  ['ek cafe ki website banao', 'food_dining', 'cafe_coffee_tea', 'coffee'],
  ['gym in Jaipur', 'bold_fitness', 'gym_fitness_studio', 'fitness'],
  ['dental clinic Pune', 'healthcare', 'dental_clinic', 'health'],
  ['kids toy store', 'playful_vibrant', 'toy_store', 'kids'],
  ['Italian restaurant Forno Rosso', 'food_dining', 'restaurant_dining', 'restaurant'],
  ['law firm Chandigarh', 'professional_services', 'law_firm_advocate', 'legal'],
  ['plumber in Leeds', 'home_services', '', 'trades'],
]
for (const [prompt, theme, niche, family] of KNOWN) {
  const found = familiesOf(prompt.toLowerCase(), theme, niche)
  ok(found[0]?.family.id === family, `"${prompt}" is the ${family} family (${found[0]?.family.id})`)
  for (const level of ['safe', 'balanced', 'wild']) for (let v = 0; v < 4; v += 1) {
    const c = thinkConcept({ prompt, theme, niche, variation: v, level, rand: seeded(v + 3) })
    ok(!!c, `${prompt}: an idea at ${level} #${v}`)
    if (!c) continue
    for (const mode of ['light', 'dark']) {
      const m = c.data[mode]
      ok(contrast(m.text, m.bg) >= 7 && contrast(m.muted, m.bg) >= 4.4 && contrast(m.accent, m.bg) >= 3, `${prompt} ${level} #${v} ${mode}: readable (${contrast(m.text, m.bg).toFixed(1)}, ${contrast(m.accent, m.bg).toFixed(1)})`)
    }
    if (level === 'safe') ok(!c.bold, 'a safe creativity makes no bet')
  }
}

// coffee is brown or green or terracotta, never the pink of the default designs
const coffee = new Set()
for (let v = 0; v < 6; v += 1) coffee.add(thinkConcept({ prompt: 'ek cafe ki website banao', theme: 'food_dining', niche: 'cafe_coffee_tea', variation: v, level: 'balanced', rand: seeded(v) }).id)
ok(coffee.has('coffee:roastery') && [...coffee].every((id) => id.startsWith('coffee:')), `a cafe gets ideas of the coffee family, the roastery among them (${[...coffee]})`)
// a page of a cafe wears them
const page = generateLibraryPage('ek cafe ki website banao', 0, 'better', true, 'auto', editsFrom([{ op: 'concept', data: thinkConcept({ prompt: 'ek cafe ki website banao', theme: 'food_dining', niche: 'cafe_coffee_tea', variation: 0, level: 'balanced', rand: seeded(1) }).data }]))
ok(page.palette.light.accent === '#7a4527' && page.palette.light.bg === '#f5ede3', `the page of a cafe has the roastery colours (${page.palette.light.accent} on ${page.palette.light.bg})`)

// the idea is an edit like any other: cleaned, undoable, described
const op = conceptOps(thinkConcept({ prompt: 'gym in Jaipur', theme: 'bold_fitness', niche: 'gym_fitness_studio', variation: 0, level: 'balanced', rand: seeded(2) }))[0]
ok(!!cleanOp(op) && cleanOp({ op: 'concept', data: { ...op.data, light: { ...op.data.light, bg: 'javascript:alert(1)' } } }) === undefined, 'an idea is checked: a colour that is not #rrggbb is refused')

// bets stay inside what the business may wear
const band = (h) => h >= 330 || h <= 60
let bets = 0
let inside = 0
for (let v = 0; v < 60; v += 1) {
  const c = thinkConcept({ prompt: 'jewellery shop', theme: 'luxury_minimal', niche: 'jewellery_shop', variation: v, level: 'wild', rand: seeded(v * 7 + 1), allowed: (h) => band(((h % 360) + 360) % 360), used: [] })
  if (c?.bold) { bets += 1; if (band(hueOf(c.data.light.accent))) inside += 1 }
}
ok(bets >= 5 && inside === bets, `a bet stays inside the hues the business may wear (${inside} of ${bets})`)
// a crowded wheel still gives hues that are new
const used = []
for (let v = 0; v < 30; v += 1) {
  const c = thinkConcept({ prompt: 'yoga studio', theme: 'beauty_wellness', niche: 'yoga_studio', variation: v, level: 'balanced', rand: seeded(v + 11), used, allowed: (h) => ((h % 360) + 360) % 360 >= 90 && ((h % 360) + 360) % 360 <= 200 })
  used.push(hueOf(c.data.light.accent))
}
let closest = 999
for (let i = 0; i < used.length; i += 1) for (let j = i + 1; j < used.length; j += 1) closest = Math.min(closest, Math.min(Math.abs(used[i] - used[j]), 360 - Math.abs(used[i] - used[j])))
ok(closest >= 1, `30 ideas for one business never repeat a hue (closest ${closest.toFixed(1)} degrees)`)

// learning from what the person corrects
const store = new MemoryCorrections()
const base = thinkConcept({ prompt: 'ek cafe ki website banao', theme: 'food_dining', niche: 'cafe_coffee_tea', variation: 0, level: 'balanced', rand: seeded(5) })
store.add({ at: '', key: 'ek cafe ki website banao', theme: 'food_dining', kind: 'accent', conceptId: base.id, from: base.data.light.accent, to: '#2f6f4f' })
store.add({ at: '', key: 'ek cafe ki website banao', theme: 'food_dining', kind: 'remove', section: 'blog' })
store.add({ at: '', key: 'ek cafe ki website banao', theme: 'food_dining', kind: 'remove', section: 'blog' })
store.add({ at: '', key: 'ek cafe ki website banao', theme: 'food_dining', kind: 'remove', section: 'stats' })
const memory = conceptMemoryFor(store.list(), [], 'ek cafe ki website banao', 'food_dining')
ok(memory.chosenAccents.includes('#2f6f4f') && memory.disliked.includes(base.id) && memory.removed.join() === 'blog', `the corrections are counted (${JSON.stringify(memory.removed)}, a part removed twice is out by default)`)
const learned = thinkConcept({ prompt: 'ek cafe ki website banao', theme: 'food_dining', niche: 'cafe_coffee_tea', variation: 0, level: 'balanced', rand: seeded(5), memory })
ok(learned.learned && learned.data.light.accent === '#2f6f4f' && learned.hide.join() === 'blog', 'the next idea wears the colour the person chose and leaves out what they removed')
ok(/you chose/.test(learned.why), `and says so (${learned.why.slice(0, 60)})`)
// the idea that was changed is not offered first again; a kept idea is preferred
const memory2 = { ...noMemory(), disliked: [base.id], liked: ['coffee:latte-and-sage'] }
const next = thinkConcept({ prompt: 'ek cafe ki website banao', theme: 'food_dining', niche: 'cafe_coffee_tea', variation: 0, level: 'balanced', rand: seeded(5), memory: memory2 })
ok(next.id === 'coffee:latte-and-sage', `a kept idea leads and a turned-down one does not (${next.id})`)
// a business of the same type learns from another one (a cafe from a tea stall) when it has nothing of its own
const sameType = conceptMemoryFor(store.list(), [], 'tea stall', 'food_dining')
ok(sameType.chosenAccents.includes('#2f6f4f'), 'a business of the same type starts from what was taught for another one')
ok(buildPalette({ name: 'x', why: '', bg: '#ffffff', ink: '#000000', accent: '#ffff00', alt: '#00ff00' }).light.accent !== '#ffff00', 'a colour that cannot be seen on its background is moved until it can')

console.log(`${pass} passed, ${fail.length} failed`)
for (const f of [...new Set(fail)].slice(0, 12)) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

// Creativity: temperature sampling, the genetic palettes (see test-colors), the Markov headlines and the scene mixes. Everything stays seeded and gated.
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const { sampleTopK, setCreativity, temperature, creativityLevel } = await loadGeneratorModule('creativity.ts')
const { seededRandom } = await loadGeneratorModule('random.ts')
const { generateWebsite } = await loadGeneratorModule('generateWebsite.ts')
const { Markov, newLine } = await loadGeneratorModule('markovCopy.ts')
const { repeatsAWord } = await loadGeneratorModule('creativeBrain.ts')
const { mashups } = await loadGeneratorModule('edit/imageDirector.ts')

// ── temperature
const ranked = [{ item: 'best', score: 1 }, { item: 'good', score: 0.9 }, { item: 'fine', score: 0.8 }, { item: 'poor', score: 0.1 }]
const draw = (temp, n = 600) => {
  const rand = seededRandom(11)
  const counts = {}
  for (let i = 0; i < n; i += 1) { const x = sampleTopK(ranked, temp, rand); counts[x] = (counts[x] ?? 0) + 1 }
  return counts
}
ok(draw(0).best === 600, 'temperature 0 always takes the best')
ok(draw(0.1).best === 600, 'a low temperature always takes the best')
const hot = draw(0.9)
ok((hot.best ?? 0) < 500 && (hot.good ?? 0) > 40 && (hot.fine ?? 0) > 20, `a high temperature gives the second and third a chance (${JSON.stringify(hot)})`)
ok(!hot.poor, 'but never a poor one')
setCreativity('wild')
ok(creativityLevel() === 'wild' && temperature() === 0.9, 'the level sets the temperature')

// ── headlines
const gate = { maxLength: 64, repeats: (t) => repeatsAWord(t) }
const corpus = ['Fresh Bread Baked Every Morning', 'Warm Loaves For Hungry Neighbours', 'Baked Fresh. Served Warm. Every Single Day.', 'Handmade Pastries Hot From The Oven', 'Where Flour And Butter Come Together']
const model = new Markov(corpus)
const rand = seededRandom(3)
const lines = new Set()
for (let i = 0; i < 40; i += 1) { const l = newLine(model, 0.9, rand, gate); if (l) lines.add(l) }
ok(lines.size >= 3, `the chain writes new lines (${lines.size})`)
ok([...lines].every((l) => !corpus.includes(l) && l.split(/\s+/).length >= 4 && /^[A-Z]/.test(l)), 'a new line is never a copy of a known one and is tidy')
ok([...lines].every((l) => !repeatsAWord(l)), 'no new line repeats a word')

setCreativity('safe')
const safe = ['bakery in Mumbai', 'gym', 'law firm', 'salon'].flatMap((p) => [1, 2, 3, 4, 5, 6].map((v) => generateWebsite(p, v).content.hero.title))
setCreativity('safe')
const safeAgain = ['bakery in Mumbai', 'gym', 'law firm', 'salon'].flatMap((p) => [1, 2, 3, 4, 5, 6].map((v) => generateWebsite(p, v).content.hero.title))
ok(JSON.stringify(safe) === JSON.stringify(safeAgain), 'safe is repeatable: the same prompt gives the same headlines')
setCreativity('wild')
const wild = ['bakery in Mumbai', 'gym', 'law firm', 'salon'].flatMap((p) => [1, 2, 3, 4, 5, 6].map((v) => generateWebsite(p, v).content.hero.title))
const wildAgain = ['bakery in Mumbai', 'gym', 'law firm', 'salon'].flatMap((p) => [1, 2, 3, 4, 5, 6].map((v) => generateWebsite(p, v).content.hero.title))
ok(JSON.stringify(wild) === JSON.stringify(wildAgain), 'wild is seeded too: the same prompt gives the same headlines')
ok(wild.filter((t, i) => t !== safe[i]).length >= 6, `wild writes new headlines (${wild.filter((t, i) => t !== safe[i]).length} of ${wild.length} differ from safe)`)
ok(wild.every((t) => t.length > 4 && t.length <= 90 && !/undefined|NaN|\[object/.test(t)), 'every headline is clean')
ok(wild.every((t) => !/(?:^| )(?:Your|The|And|With|For|To|Of)$/.test(t.replace(/[.?!]$/, ''))), 'no headline ends in the middle of a phrase')

// ── scene mixes
const LEX = { yogi: 1, lotus: 1, pizza: 1, restaurant: 1 }
const fakeParse = async (text) => ({ mode: 'scene', entities: text.toLowerCase().split(/[^a-z_]+/).filter((w) => LEX[w]).map((w) => ({ name: w })), not_in_lexicon: text.split(/\s+/).filter((w) => /zxqv/.test(w)) })
const mixes = await mashups(['yogi', 'lotus'], fakeParse, seededRandom(2), ['pizza'])
ok(mixes.length >= 3 && mixes.every((m) => /yogi|lotus/.test(m)), `scene mixes keep a prop of the business (${mixes.join(' | ')})`)
ok(new Set(mixes).size === mixes.length, 'scene mixes differ from each other')
ok(mixes.some((m) => /pizza/.test(m)), 'a prop of a scene the person liked is mixed in (crossover)')
const none = await mashups(['yogi'], async () => ({ mode: 'scene', entities: [], not_in_lexicon: ['zxqv'] }), seededRandom(2))
ok(none.length === 0, 'a mix the engine does not understand is thrown away')
setCreativity('balanced')

console.log(`${pass} checks passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

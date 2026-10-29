// The prompt memory: similar prompts are found, their edits become lessons, and a new prompt starts from them (no browser, no server).
import { loadGeneratorModule } from './lib/load-generator.mjs'
globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const { similarity, similarPrompts, lessonsFrom, lessonNote, MemoryPrompts } = await loadGeneratorModule('memory/promptMemory.ts')
const { conceptMemoryFor, MemoryCorrections } = await loadGeneratorModule('memory/correctionMemory.ts')
const { thinkConcept } = await loadGeneratorModule('concept.ts')
let pass = 0
const fail = []
const ok = (c, m) => (c ? pass++ : fail.push(m))
const seeded = (n) => () => ((n = (n * 1664525 + 1013904223) >>> 0) / 2 ** 32)

ok(similarity('cafe website banao', 'mujhe ek cafe ki website chahiye') >= 0.4, 'a cafe is a cafe in Hinglish and English')
ok(similarity('cafes in pune', 'cafe in pune') >= 0.9, 'plurals are folded')
ok(similarity('gym website', 'dental clinic website') < 0.2, 'different businesses do not resemble each other')
ok(similarity('unique website banakar do', 'sabse alag hatke website') === 0, 'request and look words are not what a prompt is about')

const store = new MemoryPrompts()
const row = (id, prompt, edits) => ({ id, at: '2026-01-01', prompt, key: 'cafe', theme: 'food_dining', niche: 'cafe_coffee_tea', concept: 'coffee:roastery', hero: 'x', pages: 'single', edits })
await store.save(row('a', 'modern cafe website in Jaipur', [{ at: '', text: 'make it green', ops: [{ k: 'accent', v: '#2f6f4f' }] }, { at: '', text: 'remove blog', ops: [{ k: 'remove', v: 'blog' }] }]))
await store.save(row('b', 'gym website', []))
await store.save(row('a', 'modern cafe website in Jaipur', [{ at: '', text: 'make it green', ops: [{ k: 'accent', v: '#2f6f4f' }] }, { at: '', text: 'remove blog', ops: [{ k: 'remove', v: 'blog' }] }, { at: '', text: 'dark', ops: [{ k: 'mode', v: 'dark' }] }]))
const rows = await store.list()
ok(rows.length === 2 && rows[0].edits.length === 3, 'saving the same page again replaces its row (the edits grow, no copies)')

const near = similarPrompts('cafe website for Jaipur with coffee', rows)
ok(near.length === 1 && near[0].row.id === 'a', 'the new cafe prompt finds the old cafe prompt and not the gym')
ok(similarPrompts('law firm website', rows).length === 0, 'a prompt that resembles nothing finds nothing')
const lessons = lessonsFrom(near, 'cafe')
ok(lessons.some((l) => l.kind === 'accent' && l.to === '#2f6f4f') && lessons.some((l) => l.kind === 'mode' && l.to === 'dark'), 'the colour and the mode they ended with are lessons')
ok(/colour you chose/.test(lessonNote(near)) && /blog/.test(lessonNote(near)), `the chat says what was taken (${lessonNote(near)})`)

// the lessons reach the idea of the new page
const corrections = new MemoryCorrections()
for (const l of lessons) corrections.add(l)
const memory = conceptMemoryFor(corrections.list(), [], 'cafe', 'food_dining')
const idea = thinkConcept({ prompt: 'cafe website for Jaipur with coffee', theme: 'food_dining', niche: 'cafe_coffee_tea', variation: 0, level: 'balanced', rand: seeded(3), memory })
ok(idea.learned && idea.data.light.accent === '#2f6f4f', `the new cafe page wears the colour of the old one (${idea.data.light.accent})`)
const fresh = thinkConcept({ prompt: 'cafe website for Jaipur with coffee', theme: 'food_dining', niche: 'cafe_coffee_tea', variation: 0, level: 'balanced', rand: seeded(3) })
ok(!fresh.learned, 'without the memory the idea is the generator\'s own')

console.log(`${pass} passed, ${fail.length} failed`)
for (const f of fail.slice(0, 12)) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

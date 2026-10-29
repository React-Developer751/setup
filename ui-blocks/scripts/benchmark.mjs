// The benchmark: 100 fixed prompts (src/data/benchmark-prompts.json: niches, Hinglish, vague, long, one word, typos) are made with the generator and scored on what can be
// checked without eyes: the business type, no request words in the headline or the name, a designed palette that can be read, a page of real length, texts without holes.
//   node scripts/benchmark.mjs                 prints the scorecard
//   node scripts/benchmark.mjs --save          keeps this run as the baseline (scripts/benchmark-baseline.json)
// A run is compared with the baseline: a prompt that got worse is listed, and the exit code is 1 when the average falls by more than 1 point or a prompt falls by more than 15.
import fs from 'node:fs'
import { loadGeneratorModule } from './lib/load-generator.mjs'

globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const { planDesign } = await loadGeneratorModule('memory/designPlanner.ts')
const { MemoryStore } = await loadGeneratorModule('memory/designStore.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { editsFrom } = await loadGeneratorModule('edit/edits.ts')
const { seededRandom } = await loadGeneratorModule('random.ts')
const { contrast } = await loadGeneratorModule('colorBrain.ts')
const { promptWords } = await loadGeneratorModule('memory/promptMemory.ts')

const prompts = JSON.parse(fs.readFileSync('src/data/benchmark-prompts.json', 'utf8'))
const LEAK = /\b(?:banakar|banao|chahiye|chahie|jisme|sabse|alag|hatke|mujhe|meri|mera|mere|karke|dena|undefined|null|sample customer|lorem)\b|\{brand\}|\[object/i
const MAX_TITLE = 70
const STOCK = /(?:made simple|starts here|done right|you can count on|you can trust)\s*$|^(?:better|your trusted)\s/i
const repeats = (t) => { const w = t.toLowerCase().match(/[a-z]{4,}/g) ?? []; return w.length !== new Set(w).size }

const rows = []
const store = new MemoryStore()
for (const [i, item] of prompts.entries()) {
  const started = Date.now()
  const plan = await planDesign(item.prompt, store, { group: `g${i}`, creativity: 'balanced', temperature: 0.5, rand: seededRandom(11 + i) })
  const lib = generateLibraryPage(item.prompt, plan.variation, undefined, true, 'auto', editsFrom(plan.ops))
  const c = lib.content
  const p = lib.palette.light
  const checks = {
    theme: !item.theme || [].concat(item.theme).includes(lib.themeKey) ? 1 : 0,
    noLeak: !LEAK.test(`${c.hero.title} ${c.hero.subtitle} ${c.brandName}`) ? 1 : 0,
    brand: c.brandName && c.brandName !== 'My Business' ? 1 : item.kind === 'vague' ? 0.5 : 0,
    designed: plan.record.concept ? 1 : 0,
    readable: contrast(p.text, p.bg) >= 7 && contrast(p.muted, p.bg) >= 4.5 ? 1 : 0,
    accent: contrast(p.accent, p.bg) >= 3 ? 1 : 0,
    length: lib.sections.length >= (item.kind === 'short' ? 8 : 10) ? 1 : lib.sections.length >= 8 ? 0.5 : 0,
    headline: c.hero.title.length <= MAX_TITLE && c.hero.title.length >= 12 && !repeats(c.hero.title) && !/\b(?:and|or|with|for|of|the),|\b(?:and|or|with|for|of|the)\s+(?:you|starts|made|done)\b/i.test(c.hero.title) ? 1 : 0,
    // a headline made of the business words and a stock ending ("... Made Simple", "... Starts Here") is the weakest kind: it says nothing about this business
    original: STOCK.test(c.hero.title) ? 0 : 1,
    relevant: item.kind === 'vague' || item.kind === 'edge' || promptWords(item.prompt).some((w) => `${c.hero.title} ${c.hero.subtitle} ${c.features.items.map((f) => `${f.title} ${f.text}`).join(' ')} ${lib.niche ?? ''}`.toLowerCase().includes(w)) ? 1 : 0,
    features: new Set(c.features.items.map((f) => f.title.toLowerCase())).size === c.features.items.length && c.features.items.length >= 3 ? 1 : 0,
    about: !!lib.niche || item.kind !== 'niche' ? 1 : 0.5,
  }
  const weights = { theme: 2, noLeak: 2, brand: 1, designed: 1, readable: 1.5, accent: 0.5, length: 1, headline: 1, original: 1.5, relevant: 1, features: 1, about: 0.5 }
  const score = Math.round((100 * Object.entries(checks).reduce((a, [k, v]) => a + v * weights[k], 0)) / Object.values(weights).reduce((a, b) => a + b, 0))
  rows.push({ prompt: item.prompt, kind: item.kind, score, theme: lib.themeKey, niche: lib.niche ?? '', concept: plan.record.concept ?? '', palette: lib.palette.name, hero: c.hero.title, brand: c.brandName, sections: lib.sections.length, failed: Object.entries(checks).filter(([, v]) => v < 1).map(([k]) => k), ms: Date.now() - started, words: promptWords(item.prompt).length })
}

// sameness: how many different palettes and headlines the 100 sites used (a generator that repeats itself fails here)
const distinct = (f) => new Set(rows.map(f)).size
const avg = (list) => (list.length ? Math.round((10 * list.reduce((a, b) => a + b, 0)) / list.length) / 10 : 0)
const byKind = Object.fromEntries([...new Set(rows.map((r) => r.kind))].map((k) => [k, avg(rows.filter((r) => r.kind === k).map((r) => r.score))]))
const summary = { average: avg(rows.map((r) => r.score)), byKind, distinctPalettes: distinct((r) => r.palette), distinctHeadlines: distinct((r) => r.hero), distinctConcepts: distinct((r) => r.concept), worst: [...rows].sort((a, b) => a.score - b.score).slice(0, 8).map((r) => `${r.score} ${r.prompt.slice(0, 50)} [${r.failed.join(',')}]`) }
console.log(JSON.stringify(summary, null, 1))

const file = 'scripts/benchmark-baseline.json'
if (process.argv.includes('--save')) {
  fs.writeFileSync(file, JSON.stringify({ summary, scores: Object.fromEntries(rows.map((r) => [r.prompt, r.score])) }, null, 1))
  console.log('baseline saved')
  process.exit(0)
}
fs.writeFileSync('scripts/benchmark-last.json', JSON.stringify({ summary, rows }, null, 1))
if (!fs.existsSync(file)) process.exit(0)
const base = JSON.parse(fs.readFileSync(file, 'utf8'))
const worse = rows.filter((r) => base.scores[r.prompt] !== undefined && r.score < base.scores[r.prompt] - 15)
console.log(`baseline ${base.summary.average} -> now ${summary.average}${worse.length ? `; worse by more than 15: ${worse.map((r) => `${r.prompt.slice(0, 40)} (${base.scores[r.prompt]} -> ${r.score})`).join('; ')}` : ''}`)
process.exit(summary.average < base.summary.average - 1 || worse.length ? 1 : 0)

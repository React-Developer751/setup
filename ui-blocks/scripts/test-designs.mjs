// The design memory: designs are stored, the person says which one is right, and the next design learns from it with a colour that is always new.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const { MemoryStore, applyBest } = await loadGeneratorModule('memory/designStore.ts')
const { analyse, hueGap, minGapFor, newness, tasteScore } = await loadGeneratorModule('memory/designMemory.ts')
const { planDesign, describeDesign } = await loadGeneratorModule('memory/designPlanner.ts')
const { seededRandom } = await loadGeneratorModule('random.ts')
const { setCreativity } = await loadGeneratorModule('creativity.ts')
setCreativity('balanced')

const PROMPT = 'Create a website for a yoga studio called Zen Flow in Pune'

// ── "one is right, the others are not"
const rows = ['a', 'b', 'c', 'd'].map((id, i) => ({ ...describeDesign(PROMPT, i + 1, 'balanced', i < 3 ? 'g1' : 'g2'), id }))
const best = applyBest(rows, 'b')
ok(best.find((r) => r.id === 'b').verdict === 'good' && best.filter((r) => r.group === 'g1' && r.id !== 'b').every((r) => r.verdict === 'bad'), 'the best design is kept and the others of its round are turned down')
ok(best.find((r) => r.id === 'd').verdict === 'unrated', 'designs of another round are not touched')

// ── every design has a colour that is new
const store = new MemoryStore()
const rand = seededRandom(42)
const hues = []
const accents = new Set()
for (let i = 0; i < 24; i += 1) {
  const plan = await planDesign(PROMPT, store, { group: 'round1', creativity: 'balanced', temperature: 0.5, rand })
  await store.add(plan.record)
  hues.push(plan.record.hue)
  accents.add(plan.record.accent)
}
let closest = 999
for (let i = 0; i < hues.length; i += 1) for (let j = i + 1; j < hues.length; j += 1) closest = Math.min(closest, hueGap(hues[i], hues[j]))
ok(accents.size === 24, `24 designs, 24 different main colours (${accents.size})`)
// (a business only wears the hues that suit it, a band of about 100 degrees: 24 designs there are a few degrees apart at least)
ok(closest >= 2, `no two of the 24 designs have the same hue (closest pair ${closest} degrees apart)`)
const first = hues.slice(0, 6)
let closestFirst = 999
for (let i = 0; i < first.length; i += 1) for (let j = i + 1; j < first.length; j += 1) closestFirst = Math.min(closestFirst, hueGap(first[i], first[j]))
ok(closestFirst >= 8, `while the wheel is empty the first six hues are clearly apart (closest ${closestFirst} degrees)`)
ok(minGapFor(0) > minGapFor(40) && minGapFor(400) >= 6, 'the gap to old colours shrinks only as the wheel fills up')
ok((await store.list()).length === 24 && (await store.list('yoga studio')).length === 24, 'every design is kept in the memory under its kind of business')

// ── what the person says teaches the next design
const teach = new MemoryStore()
const keptOnes = []
const turnedDown = []
const KEPT = 'hero-centered'
for (let v = 1; v <= 120 && (keptOnes.length < 3 || turnedDown.length < 4); v += 1) {
  const d = describeDesign(PROMPT, v * 11, 'balanced', 'g1')
  if (d.heroLayout === KEPT && keptOnes.length < 3 && keptOnes.every((x) => hueGap(x.hue, d.hue) > 8)) keptOnes.push(d)
  else if (d.heroLayout !== KEPT && turnedDown.length < 4 && turnedDown.every((x) => hueGap(x.hue, d.hue) > 8)) turnedDown.push(d)
}
ok(keptOnes.length >= 2 && turnedDown.length >= 3, `the test found two kinds of first screen to start from (${keptOnes.length} and ${turnedDown.length})`)
for (const d of keptOnes.slice(0, 2)) await teach.add({ ...d, verdict: 'good' })
for (const d of turnedDown.slice(0, 3)) await teach.add({ ...d, verdict: 'bad' })
const insights = analyse(await teach.list(), 'yoga studio')
ok(insights.good.length === 2 && insights.bad.length === 3 && insights.summary.some((l) => /kept/i.test(l)) && insights.summary.some((l) => /turned down/i.test(l)), `the analysis says what was kept and turned down (${insights.summary.length} lines)`)
ok(insights.taste.heroLayout[KEPT] > 0.5 && Object.entries(insights.taste.heroLayout).filter(([k]) => k !== KEPT).every(([, v]) => v < 0.5), 'the kept first screen scores above 0.5 and the turned down ones below')
const sample = keptOnes[2] ?? keptOnes[0]
const share = (list) => list.filter((x) => x === 1).length
const baseline = []
const learned = []
for (let i = 0; i < 14; i += 1) {
  const blank = await planDesign(PROMPT, new MemoryStore(), { group: 'g', creativity: 'balanced', temperature: 0.2, rand: seededRandom(100 + i) })
  baseline.push(blank.record.heroLayout === KEPT ? 1 : 0)
  const next = await planDesign(PROMPT, teach, { group: 'g', creativity: 'balanced', temperature: 0.2, rand: seededRandom(100 + i) })
  learned.push(next.record.heroLayout === KEPT ? 1 : 0)
  ok(!insights.seenHues.some((h) => hueGap(h, next.record.hue) < 6), `a learned design still has a new colour (#${i + 1})`)
  ok(!insights.badHues.some((h) => hueGap(h, next.record.hue) < 12), `and stays away from the turned down hues (#${i + 1})`)
}
ok(share(learned) > share(baseline), `after the verdicts more new designs have the kept first screen (${share(learned)} of 14 against ${share(baseline)} of 14 without memory)`)
ok(newness({ hue: keptOnes[0].hue, accent: keptOnes[0].accent }, insights, 20) === 0, 'a colour that was already made is not new')
ok(tasteScore(sample, insights) >= 0 && tasteScore(sample, insights) <= 1, 'the taste score stays between 0 and 1')

// ── "a new colour" asked for in chat is moved to a hue that is not used yet
const { uniqueAccent } = await loadGeneratorModule('memory/designMemory.ts')
const { hslToRgb, hexToRgb, rgbToHsl } = await loadGeneratorModule('art/color.ts')
const toHex = (h, sat, l) => `#${hslToRgb(h, sat, l).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
const hslOf = (hex) => rgbToHsl(hexToRgb(hex))
const usedHues = [0, 40, 80, 120, 160, 200, 240, 280, 320]
const askedFor = ['#dc2626', '#16a34a', '#2563eb', '#eab308', '#7c3aed']
for (const hex of askedFor) {
  const moved = uniqueAccent(hex, usedHues, toHex, hslOf)
  ok(usedHues.every((h) => hueGap(h, hslOf(moved).h) >= 6), `a fresh colour ${hex} becomes ${moved}, away from the hues in use`)
}
ok(uniqueAccent('#dc2626', [], toHex, hslOf) === '#dc2626' || hueGap(hslOf(uniqueAccent('#dc2626', [], toHex, hslOf)).h, 0) < 3, 'with nothing in use the colour stays')

// ── the file database of the server
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'designs-'))
const PORT = 9200 + Math.floor(Math.random() * 90)
const srv = spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(PORT), EDIT_DATA_DIR: dir }, stdio: 'ignore' })
for (let i = 0; i < 40; i += 1) { try { await fetch(`http://127.0.0.1:${PORT}/api/health`); break } catch { await new Promise((r) => setTimeout(r, 100)) } }
const call = (p, body) => fetch(`http://127.0.0.1:${PORT}${p}`, body ? { method: 'POST', body: JSON.stringify(body) } : undefined).then((r) => r.json())
const ids = []
for (const d of rows.slice(0, 3)) ids.push((await call('/api/designs', d)).id)
const listed = await call('/api/designs?key=yoga%20studio')
ok(listed.total === 3 && listed.designs[0].accent === rows[2].accent.toLowerCase(), 'the server keeps the designs (latest first)')
await call('/api/designs/verdict', { id: ids[1], verdict: 'good', best: true })
const after = (await call('/api/designs')).designs
ok(after.find((d) => d.id === ids[1]).verdict === 'good' && after.filter((d) => d.id !== ids[1]).every((d) => d.verdict === 'bad'), 'the server turns down the other designs of the round when one is marked right')
ok((await call('/api/designs', { key: '<b>x</b>', accent: 'not-a-colour', layouts: ['a'], verdict: 'weird' })).ok === true && (await call('/api/designs')).designs[0].accent === '#000000' && (await call('/api/designs')).designs[0].verdict === 'unrated', 'bad input is cleaned')
ok(fs.existsSync(path.join(dir, 'designs.jsonl')) && fs.readFileSync(path.join(dir, 'designs.jsonl'), 'utf8').split('\n').filter(Boolean).length === 4, 'the database is a file with one line per design')
srv.kill()
fs.rmSync(dir, { recursive: true, force: true })

console.log(`${pass} checks passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

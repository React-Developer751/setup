// Colour combinations: the pair of colours of every site is checked (no neon second colour, no two loud colours of one lightness), and the premium
// set (stored in src/data/premiumPalettes.json, more in the server database) is used beside the normal colours.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const { generateWebsite } = await loadGeneratorModule('generateWebsite.ts')
const { contrast, hexToHsl } = await loadGeneratorModule('colorBrain.ts')
const { pairIssues, pairScore, harmonisePalette } = await loadGeneratorModule('colorHarmony.ts')
const P = await loadGeneratorModule('premiumPalettes.ts')
const { editsFrom } = await loadGeneratorModule('edit/edits.ts')
const { setCreativity } = await loadGeneratorModule('creativity.ts')
const { planDesign } = await loadGeneratorModule('memory/designPlanner.ts')
const { MemoryStore } = await loadGeneratorModule('memory/designStore.ts')
const { seededRandom } = await loadGeneratorModule('random.ts')
setCreativity('balanced')

// ── the pair check itself
ok(pairIssues('#dc2626', '#ffff00').includes('neon'), 'a red with a neon yellow is neon')
ok(pairIssues('#2563eb', '#e11d48').includes('vibrate'), 'two loud colours of one lightness vibrate')
ok(pairIssues('#2563eb', '#16a34a').length > 0, 'a loud blue with a loud green is flagged')
ok(pairIssues('#1e3a8a', '#d4a017').length === 0, 'navy and gold is fine')
ok(pairScore('#1e3a8a', '#d4a017') > pairScore('#dc2626', '#ffff00'), 'a good pair scores higher than a neon one')
const repaired = harmonisePalette({ name: 't', light: { bg: '#fff', surface: '#fff', border: '#ddd', text: '#000', muted: '#555', accent: '#dc2626', alt: '#ffff00' }, dark: { bg: '#000', surface: '#111', border: '#222', text: '#fff', muted: '#aaa', accent: '#f87171', alt: '#ffff00' } })
ok(pairIssues(repaired.light.accent, repaired.light.alt).length === 0 && pairIssues(repaired.dark.accent, repaired.dark.alt).length === 0, 'a neon pair is repaired in both modes')
ok(contrast(repaired.light.alt, '#ffffff') >= 3, 'the repaired second colour can still be seen')
ok(hexToHsl(repaired.light.accent).h === hexToHsl('#dc2626').h || Math.abs(hexToHsl(repaired.light.accent).h - hexToHsl('#dc2626').h) < 3, 'the main colour keeps its hue')

// ── the sites: no bad pairs in 800 sites (20 businesses x 40 variations)
const prompts = ['gym called Iron House', 'dental clinic called Smile Care', 'yoga studio called Zen Flow', 'restaurant called Spice Route', 'law firm called Rao and Partners', 'jewellery shop called Aurum', 'saas tool called Taskly', 'boutique called Rani', 'school called Bright', 'hotel called Palm', 'bakery called Crumb', 'travel agency called Wander', 'real estate called Nest', 'photography studio called Lens', 'car dealer called Drive', 'NGO called Asha', 'pet shop called Paws', 'salon called Glow', 'robotics lab Nova', 'bike shop Spoke']
const count = { neon: 0, vibrate: 0, awkward: 0, loud: 0 }
let sites = 0
let readableOk = 0
for (const p of prompts) {
  for (let v = 1; v <= 40; v += 1) {
    const s = generateWebsite(`website for a ${p}`, v * 37)
    sites += 1
    for (const mode of ['light', 'dark']) for (const i of pairIssues(s.palette[mode].accent, s.palette[mode].alt)) count[i] += 1
    const m = s.palette.light
    if (contrast(m.text, m.bg) >= 4.5 && contrast(m.accent, m.bg) >= 3) readableOk += 1
  }
}
ok(count.neon + count.vibrate + count.awkward + count.loud === 0, `${sites} sites x 2 modes: no neon, vibrating, awkward or loud pair (${JSON.stringify(count)})`)
ok(readableOk === sites, 'text and the main colour stay readable after the repair')

// ── the page is tinted with the colours of the site: no pale blue page around a green accent
let clash = 0
let tinted = 0
for (const p of prompts) {
  for (let v = 1; v <= 30; v += 1) {
    const s = generateWebsite(`website for a ${p}`, v * 61)
    for (const mode of ['light', 'dark']) {
      const bg = hexToHsl(s.palette[mode].bg)
      const accent = hexToHsl(s.palette[mode].accent)
      // a tint has colour (chroma); a warm ivory or a pearl page is a neutral
      const chroma = bg.s * (1 - Math.abs((2 * bg.l) / 100 - 1))
      if (chroma < 6) continue
      tinted += 1
      const d = Math.abs(bg.h - accent.h) % 360
      if ((d > 180 ? 360 - d : d) > 100 && s.mood?.id !== 'cyberpunk' && s.mood?.id !== 'retro' && s.mood?.id !== 'cream-coral') clash += 1
    }
  }
}
ok(clash === 0, `${tinted} tinted pages: none is tinted in a hue far from its main colour (${clash})`)

// ── the premium set
const set = P.premiumSet()
ok(set.length >= 36, `the premium set has ${set.length} palettes`)
ok(new Set(set.map((p) => p.id)).size === set.length && new Set(set.map((p) => p.name)).size === set.length, 'every premium palette has its own id and name')
let bad = []
for (const def of set) {
  const pal = P.premiumToPalette(def)
  for (const mode of ['light', 'dark']) {
    const m = pal[mode]
    const checks = [[contrast(m.text, m.bg), 7, 'text'], [contrast(m.muted, m.bg), 4.5, 'quiet text'], [contrast(m.muted, m.surface), 4.5, 'quiet text on cards'], [contrast(m.accent, m.bg), 4.5, 'accent on page'], [contrast(m.accent, m.surface), 4.5, 'accent on cards'], [Math.max(contrast('#ffffff', m.accent), contrast('#0a0a0a', m.accent)), 4.5, 'button text'], [contrast(m.alt, m.bg), 3, 'second colour']]
    for (const [value, need, what] of checks) if (value < need) bad.push(`${def.name} ${mode} ${what} ${value.toFixed(1)}<${need}`)
  }
  const issues = pairIssues(pal.light.accent, pal.light.alt)
  if (issues.length) bad.push(`${def.name} pair: ${issues.join(',')}`)
  // premium means calm: the main colour is deep and not neon
  const h = hexToHsl(def.accent)
  if (h.s > 85) bad.push(`${def.name} is too saturated (${Math.round(h.s)})`)
}
ok(bad.length === 0, `every premium palette is readable and calm in both modes (${bad.slice(0, 3).join(' | ')})`)
const themes = new Set(set.flatMap((p) => p.themes))
ok(['luxury_minimal', 'food_dining', 'healthcare', 'real_estate', 'professional_services', 'beauty_wellness', 'modern_tech', 'education'].every((t) => themes.has(t)), 'the premium set covers the main business types')

// ── the premium set is used beside the normal colours, more at the premium level
const share = (tier) => {
  let premium = 0
  let n = 0
  for (const p of prompts) for (let v = 1; v <= 30; v += 1) { n += 1; if (/\(premium\)/.test(generateWebsite(`website for a ${p}`, v * 91, tier).palette.name)) premium += 1 }
  return premium / n
}
const [sn, sb, sp] = [share('normal'), share('better'), share('premium')]
ok(sn > 0.08 && sn < 0.4, `the normal level uses some premium colours (${(sn * 100).toFixed(0)}%)`)
ok(sp > 0.45 && sp < 0.92, `the premium level uses mostly premium colours (${(sp * 100).toFixed(0)}%)`)
ok(sn < sb && sb < sp, `more premium colours with a higher level (${(sn * 100).toFixed(0)}% < ${(sb * 100).toFixed(0)}% < ${(sp * 100).toFixed(0)}%)`)
// a colour named in the prompt is the person's choice
ok(Array.from({ length: 30 }, (_, v) => generateWebsite('red website for a gym called Iron House', v + 1, 'premium').palette.name).every((n) => !/\(premium\)/.test(n)), 'a colour named in the prompt is never replaced by a premium palette')
// the moods that need their own colours are not put over a premium palette
const moods = new Set()
for (const p of prompts) for (let v = 1; v <= 30; v += 1) { const s = generateWebsite(`website for a ${p}`, v * 91, 'premium'); if (/\(premium\)/.test(s.palette.name) && s.mood) moods.add(s.mood.id) }
ok([...moods].every((m) => ['minimal-light', 'minimal-dark', 'editorial', 'luxe-dark'].includes(m)), `premium colours go with the calm moods only (${[...moods].join(', ') || 'none'})`)
// what the person chooses is theirs
const chosen = generateWebsite('website for a law firm called Rao', 12, 'premium', true, 'auto', editsFrom([{ op: 'accent', hex: '#ff0000' }, { op: 'alt', hex: '#00ff00' }]))
ok(Math.abs(hexToHsl(chosen.palette.light.accent).h - 0) < 4 || hexToHsl(chosen.palette.light.accent).h > 356, 'a chosen main colour keeps its hue')
ok(Math.abs(hexToHsl(chosen.palette.light.alt).h - 120) < 4 && hexToHsl(chosen.palette.light.alt).s > 80, 'a chosen second colour is not made quiet')
ok(JSON.stringify(generateWebsite('website for a hotel called Palm', 5, 'premium').palette) === JSON.stringify(generateWebsite('website for a hotel called Palm', 5, 'premium').palette), 'the same prompt gives the same colours')
// the words of the business make a palette likelier
const jewel = { };
for (let v = 1; v <= 80; v += 1) { const n = generateWebsite('website for a jewellery shop called Aurum', v * 17, 'premium').palette.name; jewel[n] = (jewel[n] ?? 0) + 1 }
ok(Object.keys(jewel).filter((n) => /Ink and Gold|Aubergine|Black and Gold|Burgundy|Emerald/.test(n)).length >= 2, 'a jewellery shop gets gold and jewel palettes among its premium ones')

// ── a business wears colours that suit it: no lime jewellery shop, no neon-green law firm
let odd = 0
let total = 0
for (const p of ['jewellery shop called Aurum', 'law firm called Rao and Partners', 'luxury hotel called Palm']) {
  for (let v = 1; v <= 100; v += 1) {
    for (const tier of ['normal', 'premium']) {
      const h = hexToHsl(generateWebsite(`website for a ${p}`, v * 29, tier).palette.light.accent)
      total += 1
      if (h.h >= 62 && h.h <= 118 && h.s > 40) odd += 1
    }
  }
}
ok(odd === 0, `600 sites of luxury and law businesses: none in lime or yellow-green (${odd} of ${total})`)
const luxuryStore = new MemoryStore()
const luxRand = seededRandom(9)
let limeDesigns = 0
for (let i = 0; i < 24; i += 1) {
  const plan = await planDesign('Create a premium website for a jewellery shop called Aurum', luxuryStore, { group: 'j', creativity: 'balanced', temperature: 0.5, rand: luxRand })
  await luxuryStore.add(plan.record)
  const h = hexToHsl(plan.ops.find((o) => o.op === 'accent')?.hex ?? plan.record.accent)
  if (h.h >= 62 && h.h <= 118 && h.s > 40) limeDesigns += 1
}
ok(limeDesigns <= 1, `24 designs of one jewellery shop, each with a new colour: at most one yellow-green (${limeDesigns})`)

// ── what a normal person types: short, vague, Hinglish. The colours must still suit the business and make a pair.
const hueIn = (h, lo, hi) => { const x = ((h % 360) + 360) % 360; const a = ((lo % 360) + 360) % 360; const b = ((hi % 360) + 360) % 360; return a <= b ? x >= a && x <= b : x >= a || x <= b }
const people = [
  ['pizza shop', 320, 70], ['mera restaurant ka website banao', 320, 80], ['restaurant website', 320, 80], ['bakery', 320, 80], ['mithai ki dukaan', 320, 80], ['cafe', 330, 90],
  ['school website', 170, 290], ['tuition classes', 170, 290], ['coaching institute', 170, 290], ['hospital website', 130, 235], ['dental clinic', 130, 235], ['yoga', 90, 200],
  ['gym', 320, 70], ['personal trainer', 320, 70], ['online grocery', 90, 200], ['ngo website', 110, 210], ['law firm', 170, 290], ['real estate agent', 170, 290], ['car showroom', 170, 290],
  ['mobile shop', 190, 310], ['ai startup landing page', 190, 300], ['clothing store', 280, 70], ['wedding planner', 280, 80], ['furniture shop', 320, 80], ['travel agency', 150, 260], ['salon', 280, 40],
  ['hotel', 130, 260], ['photographer portfolio', 190, 330], ['digital marketing agency', 190, 300], ['plumber', 335, 80],
]
const calmBad = new Set(['cyberpunk', 'bold-contrast', 'retro', 'playful-pop'])
const wrongHue = []
const badPair = []
let loudMood = 0
let runs = 0
for (const [text, lo, hi] of people) {
  for (let v = 1; v <= 14; v += 1) {
    runs += 1
    const s = generateWebsite(text, v * 71)
    const a = hexToHsl(s.palette.light.accent)
    if (!hueIn(a.h, lo - 8, hi + 8) && a.s > 20) wrongHue.push(`${text}: ${Math.round(a.h)} (${s.palette.name.slice(0, 30)})`)
    for (const mode of ['light', 'dark']) if (pairIssues(s.palette[mode].accent, s.palette[mode].alt).length) badPair.push(`${text} ${mode}`)
    if (s.mood && calmBad.has(s.mood.id) && /tuition|coaching|hospital|dental|law|real estate|bank|ngo|hotel|plumber|grocery|furniture|clinic/.test(text)) loudMood += 1
  }
}
ok(wrongHue.length === 0, `${runs} sites from everyday prompts: every main colour suits its business (${wrongHue.length} off: ${wrongHue.slice(0, 3).join(' | ')})`)
ok(badPair.length === 0, `and every pair of colours is clean (${badPair.length})`)
ok(loudMood === 0, `a tuition centre, clinic, law firm or hotel never gets cyberpunk, bold, retro or playful looks from a plain prompt (${loudMood})`)
// a plain prompt without a business: still a calm, readable result
let vague = 0
for (const text of ['make a website', 'website for my shop', 'portfolio website', 'mujhe apni dukaan ki website banani hai', 'simple website']) for (let v = 1; v <= 12; v += 1) { const s = generateWebsite(text, v * 43); if (!(s.mood && calmBad.has(s.mood.id)) && pairIssues(s.palette.light.accent, s.palette.light.alt).length === 0) vague += 1 }
ok(vague >= 55, `vague prompts ("make a website", "website for my shop") give clean calm designs in most cases (${vague} of 60)`)

// ── palettes added to the database join the set
const before = P.premiumSet().length
ok(P.registerPremium([{ id: 'x1', name: 'Test Palette', accent: '#224466', alt: '#ccbb99', neutral: 'sand', themes: ['food_dining'], tags: ['cafe'] }]) === 1, 'a good palette is added')
ok(P.premiumSet().length === before + 1, 'the set grows by one')
ok(P.registerPremium([{ id: 'x1', name: 'Test Palette', accent: '#224466', alt: '#ccbb99', neutral: 'sand' }]) === 0, 'the same id is not added twice')
ok(P.registerPremium([{ id: 'x2', name: 'Bad', accent: 'blue', alt: '#ccbb99', neutral: 'sand' }, { id: 'x3', name: 'Bad2', accent: '#224466', alt: '#ccbb99', neutral: 'neon' }, null, 'text']) === 0, 'bad palettes are refused (colour, neutral, shape)')
ok(P.premiumFor('food_dining', 'cafe').some((o) => o.palette.id === 'x1' && o.weight > 1), 'an added palette is offered for its business type and tags')

// ── the planner knows the kind and keeps the colours unique
const store = new MemoryStore()
const rand = seededRandom(5)
const kinds = new Set()
const accents = new Set()
for (let i = 0; i < 20; i += 1) {
  const plan = await planDesign('Create a website for a hotel called Palm', store, { group: 'g', creativity: 'balanced', temperature: 0.5, rand })
  await store.add(plan.record)
  kinds.add(plan.record.kind)
  accents.add(plan.record.accent)
}
ok(kinds.has('premium') && kinds.size >= 2, `the design memory records the premium kind next to the others (${[...kinds].join(', ')})`)
ok(accents.size === 20, `20 designs, 20 different main colours (${accents.size})`)

// ── the server database
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pal-'))
const PORT = 9500 + Math.floor(Math.random() * 90)
const srv = spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(PORT), EDIT_DATA_DIR: dir }, stdio: 'ignore' })
for (let i = 0; i < 40; i += 1) { try { await fetch(`http://127.0.0.1:${PORT}/api/health`); break } catch { await new Promise((r) => setTimeout(r, 100)) } }
const call = (p, body) => fetch(`http://127.0.0.1:${PORT}${p}`, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined).then(async (r) => ({ status: r.status, ...(await r.json()) }))
try {
  const added = await call('/api/palettes', { name: 'Lagoon And Pearl', accent: '#0b5a63', alt: '#d8d2c4', neutral: 'mist', themes: ['travel_tourism', 'bogus'], tags: ['Resort', 'Spa'] })
  ok(added.ok && added.id, 'a palette is stored in the database')
  ok((await call('/api/palettes', { name: 'No', accent: '#fff', alt: '#000', neutral: 'sand' })).status === 400, 'a palette with a bad colour is refused')
  ok((await call('/api/palettes', { name: 'Fine Name', accent: '#0b5a63', alt: '#d8d2c4', neutral: 'plaid' })).status === 400, 'an unknown neutral is refused')
  ok((await call('/api/palettes', { id: added.id, name: 'Lagoon Again', accent: '#0b5a63', alt: '#d8d2c4', neutral: 'mist' })).status === 409, 'the same id is refused')
  const list = (await call('/api/palettes')).palettes
  ok(list.length === 1 && list[0].themes.length === 1 && list[0].themes[0] === 'travel_tourism' && list[0].tags.includes('resort'), 'themes and tags are cleaned')
  ok(P.registerPremium(list) === 1 && P.premiumFor('travel_tourism', 'resort').some((o) => o.palette.id === added.id), 'what the database returns joins the set')
} finally {
  srv.kill()
  fs.rmSync(dir, { recursive: true, force: true })
}

console.log(`palettes: ${pass} checks passed, ${fail.length} failed`)
if (fail.length) {
  console.log(fail.map((f) => ` - ${f}`).join('\n'))
  process.exit(1)
}

// The content AI's learning from words and actions: sentiment, phrase scores, choosing, the planner and the server database.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const { analyseFeedback } = await loadGeneratorModule('memory/sentiment.ts')
const P = await loadGeneratorModule('memory/phraseScores.ts')
const L = await loadGeneratorModule('memory/copyLearning.ts')
const { planDesign, describeDesign } = await loadGeneratorModule('memory/designPlanner.ts')
const { MemoryStore } = await loadGeneratorModule('memory/designStore.ts')
const { parseEdit } = await loadGeneratorModule('edit/understand.ts')
const { seededRandom } = await loadGeneratorModule('random.ts')
const { setCreativity } = await loadGeneratorModule('creativity.ts')
setCreativity('balanced')

// ── the sentiment engine: English, Hinglish, Hindi, negation, targets
const feel = [
  ['Heading change karo badhiya nahi hai', 'NEGATIVE', 'heroTitle'], ['heading boring hai', 'NEGATIVE', 'heroTitle'], ['ye bekar hai', 'NEGATIVE', 'overall'], ['this is not good', 'NEGATIVE', 'overall'],
  ['colour pasand nahi aaya', 'NEGATIVE', 'colour'], ['button text sahi nahi hai', 'NEGATIVE', 'heroButton'], ['bahut kharab design', 'NEGATIVE', 'layout'], ['photo galat hai', 'NEGATIVE', 'image'],
  ['मुझे हेडिंग पसंद नहीं आया', 'NEGATIVE', 'heroTitle'], ['बहुत बेकार है', 'NEGATIVE', 'overall'], ['subheading is weak', 'NEGATIVE', 'heroSubtitle'],
  ['mast hai perfect', 'POSITIVE', 'overall'], ['website achhi hai', 'POSITIVE', 'overall'], ['not bad', 'POSITIVE', 'overall'], ['kharab nahi hai', 'POSITIVE', 'overall'], ['I love the heading', 'POSITIVE', 'heroTitle'], ['मस्त है', 'POSITIVE', 'overall'],
  ['remove the FAQ', 'NEUTRAL', 'overall'], ['button ka text Order Karo kar do', 'NEUTRAL', 'heroButton'], ['heading sahi karo', 'NEUTRAL', 'heroTitle'], ['make it look like a bakery', 'NEUTRAL', 'layout'],
]
for (const [text, label, target] of feel) {
  const f = analyseFeedback(text)
  ok(f.label === label, `"${text}" is ${label} (got ${f.label})`)
  ok(f.target === target, `"${text}" is about ${target} (got ${f.target})`)
}
ok(analyseFeedback('change the colour to blue').hasPayload, '"change the colour to blue" carries its value: a command')
ok(analyseFeedback('heading "Best Pizza" karo').hasPayload, 'a quoted text is a command')

// ── an opinion is not turned into a text (the edit parser alone would do that)
const opinion = (text) => {
  const f = analyseFeedback(text)
  const parsed = parseEdit(text, 'single')
  return L.treatAsOpinion(f, text, parsed.kind === 'ops' ? parsed.ops : undefined)
}
ok(opinion('Heading change karo badhiya nahi hai'), 'a complaint about the heading is no new heading')
ok(opinion('heading boring hai'), '"heading boring hai" is not "set the heading to bring"')
ok(opinion('this is not good'), '"this is not good" is not an undo')
ok(opinion('heading perfect hai'), '"heading perfect hai" is praise, not a new heading')
ok(!opinion('heading Best Coffee in Town'), 'a new heading with a good word in it stays a command')
ok(!opinion('rename it to Good Eats'), 'a rename with a good word stays a command')
ok(!opinion('button ka text Order Karo kar do'), 'a plain text change stays a command')
ok(!opinion('remove the FAQ, it is boring'), 'a structural command with a complaint stays a command')
ok(!opinion('undo'), 'undo stays undo')
ok(opinion('another heading') && opinion('dusra heading do') && opinion('heading badlo'), '"another heading" asks for a new heading (the page offers one)')

// ── scores: 10 to start, one person counts once, actions weigh less than words
const ev = (session, delta, reason = 'opinion', phrase = 'transform your body today', slot = 'heroTitle', group = 'fitness_gym', at = new Date().toISOString()) => ({ at, session, group, slot, phrase, delta, reason })
const key = P.phraseKey('fitness_gym', 'heroTitle', 'transform your body today')
ok(P.scoreOf(new Map(), 'fitness_gym', 'heroTitle', 'x') === 10, 'a phrase nobody rated has 10')
let scores = P.foldPhraseScores([ev('a', -1)])
ok(scores.get(key).score === 9, 'one person: 10 -> 9')
scores = P.foldPhraseScores([ev('a', -1), ev('a', -1), ev('a', -1, 'replaced')])
ok(scores.get(key).score === 9, 'the same person repeating themselves counts once')
scores = P.foldPhraseScores(Array.from({ length: 10 }, (_, i) => ev(`s${i}`, -1)))
ok(scores.get(key).score === 0 && scores.get(key).down === 10, '10 different people: 10 -> 0 (not below 0)')
ok(P.foldPhraseScores([ev('a', -1, 'regenerate')]).get(key).score === 9.5, 'a regenerate weighs half')
ok(P.foldPhraseScores([ev('a', 1, 'export'), ev('b', 1, 'rating')]).get(key).score === 11.5, 'an export weighs half, a rating one')
ok(P.foldPhraseScores([ev('a', -1, 'opinion', 'transform your body today', 'heroTitle', 'fitness_gym', new Date(Date.now() - 200 * 86_400_000).toISOString())]).get(key).score === 9.75, 'a 200-day-old opinion counts a quarter')
ok(P.foldPhraseScores([ev('a', 0, 'abandoned')]).size === 0, 'a logged action without a thumb changes nothing')
ok(P.foldPhraseScores(Array.from({ length: 40 }, (_, i) => ev(`s${i}`, 1))).get(key).score === 20, 'the score stops at 20')
ok(P.normalisePhrase('Welcome to Zen Flow', 'Zen Flow') === 'welcome to {brand}', 'the brand name is not part of the phrase')

// ── choosing: low scores are dropped, high scores are chosen more
const many = (events) => P.foldPhraseScores(events)
const bad = Array.from({ length: 5 }, (_, i) => ev(`b${i}`, -1, 'opinion', 'bad line'))
const good = Array.from({ length: 6 }, (_, i) => ev(`g${i}`, 1, 'rating', 'good line'))
const sc = many([...bad, ...good])
const rand = seededRandom(7)
const draws = { bad: 0, good: 0, new: 0 }
for (let i = 0; i < 3000; i += 1) draws[P.choosePhrase([{ item: 'bad', phrase: 'bad line' }, { item: 'good', phrase: 'good line' }, { item: 'new', phrase: 'new line' }], sc, 'fitness_gym', 'heroTitle', rand)] += 1
ok(draws.bad === 0, `a phrase with score ${P.scoreOf(sc, 'fitness_gym', 'heroTitle', 'bad line')} is never chosen while others exist`)
ok(draws.good > draws.new * 1.5 && draws.new > 300, `a liked phrase is chosen more (${draws.good}) but a new one still gets tried (${draws.new})`)
ok(P.choosePhrase([{ item: 'bad', phrase: 'bad line' }], sc, 'fitness_gym', 'heroTitle', rand) === 'bad', 'if only bad phrases are left, the best of them is used')
ok(P.copyFactor(sc, 'fitness_gym', { heroTitle: 'bad line' }).dropped.length === 1 && P.copyFactor(sc, 'fitness_gym', { heroTitle: 'good line' }).factor > 1, 'a design with a sent-back text is marked, with a liked text it is worth more')

// ── the loop: the planner stops choosing a headline that people send back
const PROMPT = 'Create a website for a yoga studio called Zen Flow in Pune'
const heads = new Map()
for (let v = 1; v <= 60; v += 1) {
  const r = describeDesign(PROMPT, v * 37, 'balanced', 'g')
  heads.set(r.copy.heroTitle, (heads.get(r.copy.heroTitle) ?? 0) + 1)
}
const group = describeDesign(PROMPT, 5, 'balanced', 'g')
const grp = group.niche || group.theme
ok(heads.size >= 2, `the generator has several headlines for a yoga studio (${heads.size})`)
const top = [...heads.entries()].sort((a, b) => b[1] - a[1])[0][0]
const used = async (phrases) => {
  const count = {}
  const r = seededRandom(11)
  for (let i = 0; i < 14; i += 1) {
    const plan = await planDesign(PROMPT, new MemoryStore(), { group: `x${i}`, creativity: 'balanced', temperature: 0.5, rand: r, phrases })
    count[plan.record.copy.heroTitle] = (count[plan.record.copy.heroTitle] ?? 0) + 1
  }
  return count
}
const before = await used(new Map())
const against = P.foldPhraseScores(Array.from({ length: 8 }, (_, i) => ({ at: new Date().toISOString(), session: `u${i}`, group: grp, slot: 'heroTitle', phrase: top, delta: -1, reason: 'opinion' })))
const after = await used(against)
ok((before[top] ?? 0) > 0, `without feedback the most common headline is used (${before[top] ?? 0} of 14)`)
ok(!after[top], `after 8 people sent "${top.slice(0, 40)}" back it is not chosen any more (${after[top] ?? 0} of 14)`)
ok(Object.keys(after).length >= 1, 'other headlines are chosen instead')

// ── "another heading": a different text, never the current one or a turned-down one
const current = describeDesign(PROMPT, 3, 'balanced', 'g')
const alt = L.alternativeFor(PROMPT, 'heroTitle', { current: current.heroTitle, brand: 'Zen Flow', group: grp, scores: against, avoid: [] })
ok(alt && alt.text !== current.heroTitle && alt.op.op === 'text' && alt.op.field === 'heroTitle', 'another heading is a text edit with a different heading')
ok(alt && P.normalisePhrase(alt.text, 'Zen Flow') !== top, 'a headline that people sent back is not offered as the other one')
ok(!alt || alt.text.includes('Zen Flow') || !/Zen Flow/i.test(current.heroTitle), 'the brand name of the site stays')

// ── a headline that is about the business: a bike shop gets bike shop headlines, and broken lines are not written
const TEA = 'Create a website for a bike shop called Spoke'
const teaCurrent = describeDesign(TEA, 3, 'balanced', 'g')
const teaGroup = teaCurrent.niche || teaCurrent.theme
let offTopic = 0
let seenTexts = new Set()
let avoid = []
for (let i = 0; i < 6; i += 1) {
  const a = L.alternativeFor(TEA, 'heroTitle', { current: teaCurrent.heroTitle, brand: 'Spoke', group: teaGroup, scores: new Map(), avoid, rand: seededRandom(100 + i) })
  if (!a) break
  seenTexts.add(a.text)
  avoid = [...avoid, a.text]
  if (!P.fitsBusiness(a.text, 'bike shop', 'Spoke')) offTopic += 1
}
ok(seenTexts.size >= 4 && offTopic === 0, `six "another heading" in a row for a bike shop are all about the bike shop (${seenTexts.size} different, ${offTopic} off topic)`)
ok(P.fitsBusiness('Dental Clinic You Can Count On', 'dental clinic', 'Smile Care') && !P.fitsBusiness('Pure Wellness For Curious Tasters', 'bike shop', 'Spoke'), 'the fit check tells a headline about the business from a general one')
const { generateWebsite } = await loadGeneratorModule('generateWebsite.ts')
const BROKEN = /\bFor The Wait\b|\b(People|Lifters|Growers|Tasters|Eaters|Athletes|Members|Patients|Families|Pros)[.!]?$/
let broken = 0
let total = 0
for (const prompt of [TEA, 'Create a website for a gym called Iron House in Delhi', 'dental clinic in Pune called Smile Care', PROMPT]) {
  for (let v = 1; v <= 150; v += 1) {
    const title = generateWebsite(prompt, v * 17).content.hero.title
    total += 1
    if (BROKEN.test(title) && !/\bFor\b/.test(title)) broken += 1
  }
}
ok(broken === 0, `600 generated headlines: none ends on a group of people without its "For" or says "For The Wait" (${broken} of ${total})`)

// ── the other texts of a page read like sentences too
let badLines = []
for (const prompt of ['website for a robotics lab called Nova', 'website for a bike shop called Spoke', 'site for a language school called Lingo', 'dental clinic in Pune called Smile Care']) {
  for (let v = 1; v <= 80; v += 1) {
    const c = generateWebsite(prompt, v * 31).content
    for (const line of [c.features.title, c.cta.title, c.steps.title, c.hero.subtitle]) {
      if (/Why (Every|All|The Whole)\b/.test(line) || /^(Everything You Need For|Built Around)\b.*, Done Right$/.test(line) || /makes [a-z ]+ simple/.test(line) || /Ready To (Join|For)\b.*Your/.test(line)) badLines.push(line)
    }
  }
}
ok(badLines.length === 0, `320 pages: no "Why Every Age Choose", no double "Done Right", no "makes bike shop simple" (${badLines.slice(0, 2).join(' | ')})`)

// ── the trend report
const fail3 = P.analyseTrends(Array.from({ length: 3 }, (_, i) => ev(`t${i}`, -1)))
ok(fail3.failing.length === 1 && fail3.failing[0].phrase === 'transform your body today', 'three people against a phrase: it is reported as failing')
ok(P.analyseTrends([ev('a', -1), ev('b', -1)]).failing.length === 0, 'two people are not a trend')
ok(P.analyseTrends([...Array.from({ length: 4 }, (_, i) => ev(`w${i}`, 1, 'rating'))]).winners.length === 1, 'phrases people keep are winners')

// ── the server database
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'phr-'))
const PORT = 9400 + Math.floor(Math.random() * 90)
const srv = spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(PORT), EDIT_DATA_DIR: dir }, stdio: 'ignore' })
for (let i = 0; i < 40; i += 1) { try { await fetch(`http://127.0.0.1:${PORT}/api/health`); break } catch { await new Promise((r) => setTimeout(r, 100)) } }
const call = (p, body) => fetch(`http://127.0.0.1:${PORT}${p}`, body ? { method: 'POST', body: JSON.stringify(body) } : undefined).then(async (r) => ({ status: r.status, ...(await r.json()) }))
try {
  const good1 = ev('web1', -1, 'opinion')
  ok((await call('/api/phrase-events', { events: [{ ...good1, text: 'heading change karo badhiya nahi hai', sentiment: 'NEGATIVE' }, ev('web2', 1, 'export')] })).stored === 2, 'events are stored')
  ok((await call('/api/phrase-events', { events: [{ slot: 'nope', phrase: 'x', session: 's', group: 'g' }] })).status === 400, 'an unknown slot is refused')
  ok((await call('/api/phrase-events', { events: [{ ...ev('web3', -1), reason: 'hack', delta: 99 }] })).stored === 1, 'bad values are cleaned, not trusted')
  const back = (await call('/api/phrase-events')).events
  ok(back.length === 3 && back[0].text === 'heading change karo badhiya nahi hai' && back[0].sentiment === 'NEGATIVE', 'the words of the person come back with the event')
  ok(back[2].reason === 'opinion' && back[2].delta === 0, 'an unknown reason becomes "opinion" and an unknown delta 0')
  const folded = P.foldPhraseScores(back)
  ok(folded.get(key).score === 10 + (-1) + 0.5, 'another browser folds the stored events into the same score')
  const long = (await call('/api/phrase-events', { events: [ev('x'.repeat(200), -1, 'opinion', 'p'.repeat(500))] })).stored
  ok(long === 1 && (await call('/api/phrase-events')).events.at(-1).phrase.length === 140, 'long texts are cut')
  ok(fs.existsSync(path.join(dir, 'phrase-events.jsonl')), 'a JSON-lines file keeps them')
  // a design is stored with its texts
  await call('/api/designs', { ...describeDesign(PROMPT, 9, 'balanced', 'g') })
  ok(Object.keys((await call('/api/designs')).designs[0].copy ?? {}).length === 6, 'a design is stored with the six texts the scores are about')
  // the trend script on the same folder
  const out = await new Promise((resolve) => { const p = spawn(process.execPath, ['scripts/phrase-trends.mjs'], { env: { ...process.env, EDIT_DATA_DIR: dir } }); let o = ''; p.stdout.on('data', (d) => (o += d)); p.on('close', () => resolve(o)) })
  ok(/events from/.test(out) && fs.existsSync(path.join(dir, 'phrase-scores.json')), 'the trend script reports and writes the scores')
} finally {
  srv.kill()
  fs.rmSync(dir, { recursive: true, force: true })
}

console.log(`phrases: ${pass} checks passed, ${fail.length} failed`)
if (fail.length) {
  console.log(fail.map((f) => ` - ${f}`).join('\n'))
  process.exit(1)
}

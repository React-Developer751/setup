// Tests of the edit chat: (1) operations change all three engines the way they say, undo = fewer operations, (2) the server (no external AI)
// (against a fake model server: no key and no network needed), (3) the server's tool schema matches edits.ts.
import fs from 'node:fs'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (cond, name) => (cond ? (pass += 1) : fail.push(name))

const { generateSite } = await loadGeneratorModule('generateSite.ts')
const { generateWebsite } = await loadGeneratorModule('generateWebsite.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const edits = await loadGeneratorModule('edit/edits.ts')
const { parseEdit } = await loadGeneratorModule('edit/understand.ts')
const { answerFor, clarify } = await loadGeneratorModule('edit/clarify.ts')

const P = 'Create a page for an organic green tea cafe named Leafy Premium'
const E = (...ops) => edits.editsFrom(ops)
const text = (x) => JSON.stringify(x)
const J_ = text
const all = (e) => ({
  multi: generateSite(P, 0, undefined, true, 'auto', e),
  single: generateWebsite(P, 0, undefined, true, 'auto', e),
  library: generateLibraryPage(P, 0, undefined, true, 'auto', e),
})
const base = all(undefined)
const noop = all(E())

// ── 1. the engines
ok(text(base.single.html) === text(noop.single.html), 'empty edits change nothing (single)')
ok(text(base.multi.pagesHtml) === text(noop.multi.pagesHtml), 'empty edits change nothing (multi)')
ok(text(base.library.code) === text(noop.library.code), 'empty edits change nothing (library)')

const renamed = all(E({ op: 'rename', name: 'Zen Cafe' }))
for (const [name, site] of Object.entries(renamed)) {
  const html = name === 'multi' ? text(site.pagesHtml) : name === 'single' ? site.html : site.code
  ok(html.includes('Zen Cafe'), `rename shows the new name (${name})`)
  ok(!html.includes('Leafy Premium'), `rename leaves no old name (${name})`)
}

const noFaq = all(E({ op: 'remove', section: 'faq' }, { op: 'remove', section: 'pricing' }, { op: 'removePage', page: 'pricing' }))
ok(!noFaq.single.layoutIds.includes('pricing') && base.single.layoutIds.includes('pricing'), 'remove pricing drops it from the single page')
ok(!noFaq.multi.pages.some((p) => p.id === 'pricing') && base.multi.pages.some((p) => p.id === 'pricing'), 'removePage pricing drops the page')
ok(!noFaq.library.sections.some((s) => s.componentId.startsWith('pricing/')), 'remove pricing drops it from the library page')
ok(!text(noFaq.multi.pagesHtml).includes('#/pricing'), 'no link to the removed page is left')

const added = all(E({ op: 'remove', section: 'gallery' }, { op: 'add', section: 'gallery' }))
ok(text(added.single.layoutIds) === text(base.single.layoutIds), 'remove then add restores the section')

const blue = all(E({ op: 'accent', hex: '#2563eb' }))
ok(blue.single.palette.light.accent.toLowerCase().includes('2563eb') || blue.single.palette.name.includes('edited'), 'accent changes the palette')
const dark = all(E({ op: 'mode', mode: 'dark' }))
ok(dark.single.initialMode === 'dark', 'mode dark')
const txt = all(E({ op: 'text', field: 'heroTitle', text: 'Fresh Every Single Day' }, { op: 'contact', field: 'phone', value: '+91 98765 43210' }, { op: 'replace', from: 'cafe', to: 'bistro' }))
ok(text(txt.single.html).includes('Fresh Every Single Day'), 'headline text is set')
ok(text(txt.single.html).includes('98765 43210'), 'phone is set')
ok(!/\bcafe\b/i.test(JSON.stringify(txt.single.content).replace(/[a-z]+@[a-z.]+/gi, '')), 'replace changes every occurrence')
ok(all(E({ op: 'tier', tier: 'premium' })).single.tier === 'premium', 'tier')
ok(all(E({ op: 'motion', level: 'off' })).single.motion.level === 'off', 'motion off')
ok(all(E({ op: 'theme', theme: 'bold_fitness' })).single.themeKey === 'bold_fitness', 'theme')

// undo = the list without its last entry: the site is the same as before
const history = [{ op: 'rename', name: 'Zen Cafe' }, { op: 'accent', hex: '#dc2626' }]
ok(text(generateWebsite(P, 0, undefined, true, 'auto', E(...history.slice(0, 1))).html) === text(renamed.single.html), 'undo restores the earlier site')

// bad operations never get in
ok(edits.cleanOp({ op: 'remove', section: 'nope' }) === undefined, 'cleanOp refuses an unknown section')
ok(edits.cleanOp({ op: 'accent', hex: 'blue' }) === undefined, 'cleanOp refuses a bad hex')
ok(edits.cleanOp({ op: 'rename', name: '<script>alert(1)</script>'.repeat(5) }).name.length <= 40, 'cleanOp limits names')
ok(edits.cleanOp({ op: 'drop table' }) === undefined, 'cleanOp refuses an unknown op')

// the clarifying questions only produce valid operations
for (const intent of ['tier', 'motion', 'mode', 'recolor', 'remove', 'add', 'new_site']) {
  const q = clarify(intent, 'multi')
  ok(q && q.choices.every((c) => c.action || (c.ops && c.ops.every((o) => edits.cleanOp(o)))), `clarify(${intent}) gives valid operations`)
}
ok(answerFor('name', 'Sunrise Tea House', 'single').ops[0]?.name === 'Sunrise Tea House', 'a typed name answers the question')
ok(answerFor('business', 'dentist', 'single').ops[0]?.theme === 'healthcare', 'a typed business type answers the question')
ok(answerFor('contact', 'hello@zen.cafe', 'single').ops[0]?.field === 'email', 'a typed email answers the question')

// the parser keeps quotes and capital letters, and never throws on odd input
for (const odd of ['', '   ', '🙂🙂', 'a'.repeat(5000), '"""', "'", '#', '@@@@', '\u0000\u0001', 'remove '.repeat(300)]) {
  let threw = false
  try { parseEdit(odd, 'multi') } catch { threw = true }
  ok(!threw, `parser survives ${JSON.stringify(odd.slice(0, 12))}`)
}


// ── colours: many names, fresh colours, pictures, any hex gives a readable palette
const { dominantColor } = await loadGeneratorModule('edit/imageColor.ts')
const { freshAccent } = await loadGeneratorModule('edit/understand.ts')
const hexOf = (t) => parseEdit(t, 'single').ops?.[0]?.hex
for (const [t, h] of [['make the buttons marigold', '#f59e0b'], ['theme colour mint green', '#2dd4a7'], ['royal blue buttons', '#1d4ed8'], ['buttons ko haldi jaisa karo', '#eab308'], ['rang mehendi karo', '#65a30d'], ['use burgundy for the theme', '#7f1d1d'], ['forest green please', '#166534'], ['links ko firozi karo', '#06b6d4'], ['colour of peacock', '#0f766e']]) ok(hexOf(t) === h, `colour name: "${t}" -> ${h} (got ${hexOf(t)})`)
ok(parseEdit('we serve wine and cheese', 'single').ops?.length === 0 || parseEdit('we serve wine and cheese', 'single').kind !== 'ops', 'an everyday word like "wine" is not a colour without colour talk')
const fresh = parseEdit('surprise me with a new colour', 'single')
ok(fresh.kind === 'ops' && /^#[0-9a-f]{6}$/.test(fresh.ops[0].hex), 'a fresh colour is a valid hex')
const seen = new Set(Array.from({ length: 30 }, () => freshAccent()))
ok(seen.size > 20, 'fresh colours differ from each other')
// a picture: red logo on white -> red; black and white -> neutral; empty -> nothing
const px = (r, g, b, a, n) => Array.from({ length: n }, () => [r, g, b, a]).flat()
const red = dominantColor([...px(255, 255, 255, 255, 800), ...px(220, 38, 38, 255, 200)])
ok(red && parseInt(red.slice(1, 3), 16) > 200 && parseInt(red.slice(3, 5), 16) < 80, `logo colour ignores the white background (got ${red})`)
ok(dominantColor([...px(0, 0, 0, 255, 300), ...px(255, 255, 255, 255, 700)]) !== undefined, 'a black and white picture gives a neutral colour')
ok(dominantColor(px(10, 10, 10, 0, 100)) === undefined, 'a transparent picture gives nothing')
// every hex, however extreme, makes a palette with readable text (contrast at least 4.5 against the page)
const { recolor } = await loadGeneratorModule('colorBrain.ts')
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const basePalette = generateWebsite(P, 0, undefined, true, 'auto', undefined).palette
let worst = 99
for (const hex of ['#ffffff', '#000000', '#fffdd0', '#ffff00', '#00ffff', '#ff00ff', '#0a0a0a', '#f5f5f5', '#7f7f7f', '#1e3a8a', '#fde047']) {
  const pal = recolor(basePalette, 'general_business', { accent: hex })
  for (const mode of ['light', 'dark']) worst = Math.min(worst, ratio(pal[mode].text, pal[mode].bg))
}
ok(worst >= 4.5, `text stays readable for extreme colours (worst contrast ${worst.toFixed(1)})`)

// ── part colours, harmonies, second colour in all engines
const painted = all(E({ op: 'sectionColor', target: 'footer', hex: '#16a34a' }, { op: 'sectionColor', target: 'header', hex: '#dc2626' }))
ok(painted.single.html.includes('--g-bg:#16a34a') && painted.single.html.includes('--g-bg:#dc2626'), 'footer and header colours are in the single page')
ok(Object.values(painted.multi.pagesHtml).every((html) => html.includes('--g-bg:#16a34a') && html.includes('--g-bg:#dc2626')), 'footer and header colours are on every page of the multi-page site')
ok(painted.multi.files.some((f) => f.code.includes('[--g-bg:#16a34a]')), 'the React export has the footer colour as classes')
ok(painted.single.code.includes('[--g-bg:#16a34a]'), 'the single page code has the footer colour')
ok(painted.library.sections.find((s) => s.role === 'footer')?.paint === '#16a34a' && painted.library.code.includes('paint="#16a34a"'), 'the library page paints the footer')
ok(!base.single.html.includes('--g-bg:#16a34a'), 'without the change the page has no part colour')
const gal = all(E({ op: 'add', section: 'gallery' }, { op: 'sectionColor', target: 'gallery', hex: '#1e3a8a' }))
ok(gal.single.html.includes('--g-bg:#1e3a8a'), 'a section can have its own colour')
const cleared = all(E({ op: 'sectionColor', target: 'footer', hex: '#16a34a' }, { op: 'clearSectionColor', target: 'footer' }))
ok(text(cleared.single.html) === text(base.single.html), 'clearing a part colour restores the page')
// the text on a painted part is readable (dark text on light, light on dark)
const { sectionTokens, contrast } = await loadGeneratorModule('edit/sectionColors.ts')
let bad = 0
for (const bg of ['#ffffff', '#000000', '#16a34a', '#dc2626', '#facc15', '#1e3a8a', '#fde047', '#7c3aed', '#f3f4f6', '#111827']) {
  const t = sectionTokens(bg, base.single.palette)
  if (contrast(t['--g-text'], t['--g-bg']) < 4.5 || contrast(t['--g-on-accent'], t['--g-accent']) < 3) bad += 1
}
ok(bad === 0, `text and accent stay readable on painted parts (${bad} bad)`)
// harmony turns the hue, alt sets the second colour
const { hexToHsl } = await loadGeneratorModule('colorBrain.ts')
const baseHue = hexToHsl(recolor(base.single.palette, 'general_business', { accent: '#2563eb' }).light.accent).h
const compHue = hexToHsl(recolor(base.single.palette, 'general_business', { accent: '#2563eb', harmony: ['complementary'] }).light.accent).h
const diff = Math.abs(((compHue - baseHue + 360) % 360) - 180)
ok(diff < 12, `complementary turns the hue by about 180 degrees (${compHue.toFixed(0)} vs ${baseHue.toFixed(0)})`)
const altPal = recolor(base.single.palette, 'general_business', { accent: '#2563eb', alt: '#ea580c' })
ok(Math.abs(hexToHsl(altPal.light.alt).h - 24) < 30, 'alt sets the second colour')
const par = (t) => parseEdit(t, 'single').ops
ok(text(par('header red footer green').map((o) => [o.target, o.hex])) === text([['header', '#dc2626'], ['footer', '#16a34a']]), 'header red footer green')
ok(text(par('header lal, footer hara').map((o) => [o.target, o.hex])) === text([['header', '#dc2626'], ['footer', '#16a34a']]), 'header lal, footer hara')
ok(par('make the footer dark')[0]?.hex === '#111827', 'dark footer')
ok(par('buttons ko ocean jaisa karo')[0]?.op === 'accent', 'ocean jaisa is a colour, not button text')
ok(par('theme like spotify')[0]?.hex === '#1db954', 'brand colour')
ok(par('ocean blue buttons')[0]?.hex === '#0e7490', 'ocean blue is a colour of its own thing')
ok(parseEdit('headline: Fresh Every Day', 'single').ops[0].op === 'text', 'a text with colour-like words stays a text')
// a logo with two colours gives a main and a second colour
const { paletteFromPixels } = await loadGeneratorModule('edit/imageColor.ts')
const duo = paletteFromPixels([...px(255, 255, 255, 255, 600), ...px(220, 38, 38, 255, 250), ...px(37, 99, 235, 255, 150)])
ok(duo && duo.accent.startsWith('#dc') && duo.alt && duo.alt.toLowerCase().startsWith('#25'), `logo palette: main and second colour (${J_(duo)})`)

// security: a quote in a name or contact value must not end an attribute (it used to: action="mailto:x" onmouseover=...)
const nasty = 'x" onmouseover="alert(1)'
const hostile = all(E({ op: "contact", field: "email", value: nasty }, { op: 'rename', name: nasty }, { op: 'text', field: 'heroTitle', text: nasty }))
const evilPages = [hostile.single.html, ...Object.values(hostile.multi.pagesHtml)]
ok(evilPages.every((h) => !/ onmouseover="alert/.test(h) && h.includes('&quot;')), 'a quote in a value is escaped in attributes (single and multi-page)')

// ── 2. the server calls no external AI, model or API
const PORT = 8800 + Math.floor(Math.random() * 100)
const start = (env) => spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(PORT), ...env }, stdio: 'ignore' })
const wait = async () => { for (let i = 0; i < 40; i += 1) { try { await fetch(`http://127.0.0.1:${PORT}/api/health`); return } catch { await new Promise((r) => setTimeout(r, 100)) } } }
const post = (path, body, headers = {}) => fetch(`http://127.0.0.1:${PORT}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) })

const src = fs.readFileSync('server/index.mjs', 'utf8')
ok(!/anthropic|openai|pexels|wikimedia|api\.[a-z]+\.com/i.test(src), 'server: no external AI or API is named in the server')
ok(!fs.existsSync('server/commons.mjs'), 'server: the Wikimedia photo search is gone')

const server = start({ ANTHROPIC_API_KEY: 'test-key', PEXELS_API_KEY: 'test-key' })
await wait()
const health = await (await fetch(`http://127.0.0.1:${PORT}/api/health`)).json()
ok(health.ok === true && !('ai' in health) && !('photos' in health), 'health reports only the own engines')
ok((await post('/api/edit', { text: 'make it red' })).status === 404, 'there is no external-AI edit route')
ok((await post('/api/blueprint', { prompt: 'Italian restaurant in Mumbai' })).status === 404, 'there is no external-AI blueprint route')
ok((await fetch(`http://127.0.0.1:${PORT}/api/photos?q=bakery`)).status === 404, 'there is no external photo search route')
ok((await fetch(`http://127.0.0.1:${PORT}/api/nothing`)).status === 404, 'unknown path is 404')
const feedbackFile = 'server/data/feedback.jsonl'
const before = fs.existsSync(feedbackFile) ? fs.readFileSync(feedbackFile, 'utf8').split('\n').filter(Boolean).length : 0
await post('/api/feedback', { text: 'make it red', ops: [{ op: 'accent', hex: '#dc2626' }], accepted: true, source: 'rules' })
const after = fs.readFileSync(feedbackFile, 'utf8').split('\n').filter(Boolean)
ok(after.length === before + 1 && JSON.parse(after.at(-1)).text === 'make it red', 'feedback is appended to the file')
// rate limit: the 31st request within a minute from one address is refused
let limit = 0
for (let i = 0; i < 40; i += 1) if ((await post('/api/feedback', { text: 'x', ops: [] })).status === 429) limit += 1
ok(limit > 0, 'too many requests are refused with 429')
server.kill()

// ── 4. the parser on the labelled command sets: it must not get worse
const cmdFile = 'src/data/training/edit-commands.test.jsonl'
if (fs.existsSync(cmdFile)) {
  const rows = fs.readFileSync(cmdFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
  let right = 0
  for (const row of rows) {
    const got = parseEdit(row.text, row.context)
    const e = row.expect
    if (e.control ? got.kind === 'control' && got.control === e.control : e.newSite ? got.kind === 'newSite' : got.kind === 'ops' ? text(got.ops) === text(e.ops) : e.ops.length === 0) right += 1
  }
  ok(right / rows.length >= 0.97, `parser accuracy on ${rows.length} commands is at least 97% (now ${((100 * right) / rows.length).toFixed(1)}%)`)
}

// ── the server guards what writes and what reads stored data: token, rate limit, origin, content type (checked before any handler runs)
{
  const dataDir = fs.mkdtempSync('/tmp/guard-data-')
  const guarded = start({ EDIT_SERVER_TOKEN: 'secret', EDIT_RATE_PER_MINUTE: '6', EDIT_DATA_DIR: dataDir })
  await wait()
  const designs = (headers = {}, body = '{}') => fetch(`http://127.0.0.1:${PORT}/api/designs`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body })
  ok((await designs()).status === 401, 'guard: a write without the token is refused')
  ok((await fetch(`http://127.0.0.1:${PORT}/api/designs?limit=5`)).status === 401, 'guard: stored designs are not read without the token')
  ok((await fetch(`http://127.0.0.1:${PORT}/api/health`)).status === 200, 'guard: health needs no token')
  ok((await designs({ 'x-edit-token': 'secret', origin: 'https://evil.example' })).status === 403, 'guard: a page of another site is refused')
  ok((await designs({ 'x-edit-token': 'secret', 'content-type': 'text/plain' })).status === 415, 'guard: a cross-site form (text/plain) is refused')
  ok((await designs({ 'x-edit-token': 'secret', origin: 'http://localhost:5173' })).status !== 401 && (await designs({ 'x-edit-token': 'secret', origin: 'http://localhost:5173' })).status !== 403, 'guard: the local page with the token is let in')
  for (let i = 0; i < 6; i += 1) await designs({ 'x-edit-token': 'secret' })
  ok((await designs({ 'x-edit-token': 'secret' })).status === 429, 'guard: too many writes in a minute are slowed down')
  guarded.kill()
  fs.rmSync(dataDir, { recursive: true, force: true })
}

console.log(`${pass} passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

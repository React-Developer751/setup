// Core-Craft AI as a second Content AI: the gate that keeps its lines honest, the server route, and (when the Python bridge and the `cont` folder
// are here) the real bridge.
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const G = await loadGeneratorModule('edit/corecraft.ts')
const cand = (over) => ({ seed: 1, niche: 'restaurant', brand: 'Ember Hearth', hero_heading: 'Your pizza, our passion', tagline: 'Hungry for pizzas? We have you covered.', cta_primary: 'Book Now', cta_secondary: 'Explore Burgers', cta_text: 'x', ...over })
const ctx = { theme: 'food_dining', subject: 'pizza shop', prompt: 'pizza shop', current: { heroTitle: 'Pizza Shop, Done Right', heroSubtitle: 'Fresh pizza.', heroButton: 'Visit Us' } }

// ── the gate: what is offered
let g = G.gateCandidates([cand({})], ctx)
ok(g.accepted.some((a) => a.slot === 'heroTitle' && a.text === 'Your pizza, our passion'), 'a line that names the business is offered')
ok(g.accepted.some((a) => a.slot === 'heroSubtitle'), 'a sentence that names the business is offered')
ok(g.accepted.some((a) => a.slot === 'heroButton' && a.text === 'Book Now'), 'an action that fits a food business is offered')

// ── what is kept out, with the reason
const why = (c, c2 = ctx) => G.gateCandidates([cand(c)], c2).rejected.map((r) => r.reason).join(' | ')
ok(/does not name your business/.test(why({ hero_heading: 'Come hungry. Leave happy.' })), 'a line that could be on any page is kept out')
ok(/awkward frame/.test(why({ hero_heading: 'All about pizza' })), '"All about pizza" is an awkward frame')
ok(/numbers or links/.test(why({ tagline: 'Pizza from 99 rupees at www.x.com today.' })), 'numbers and links are kept out')
ok(/corporate button/.test(why({ cta_primary: 'Learn more' })) && /corporate button/.test(why({ cta_primary: 'Download the App' })), 'corporate button texts are kept out')
ok(/does not start with an action that fits/.test(why({ cta_primary: 'Start Free' })), '"Start Free" does not fit a food business')
ok(/something free/.test(why({ cta_primary: 'Order free' })), 'a free promise nobody made is kept out')
ok(/group of people/.test(why({ hero_heading: 'Pizza made by happy Owners' })) && !/group of people/.test(why({ hero_heading: 'Pizza for happy Owners' })), 'a line that ends on people needs its "for"')
ok(/this project does not know/.test(why({ niche: 'banking' })), 'an unknown niche is kept out')
ok(/but your site is/.test(why({ niche: 'fitness' })), 'a niche of another business type is kept out')
ok(G.gateCandidates([cand({ niche: 'business' })], ctx).accepted.length > 0, 'the catch-all niche "business" is not enough to keep a good line out')
ok(/already|turned down/.test(why({ hero_heading: 'Pizza Shop, Done Right' })), 'the line the page has now is not offered again')
ok(/already|turned down/.test(why({ hero_heading: 'Your pizza, our passion' }, { ...ctx, avoid: ['your pizza, our passion'] })), 'a turned-down line is not offered again')
ok(/length/.test(why({ hero_heading: 'Pizza!' })), 'a line of the wrong length is kept out')
ok(/nothing in the prompt/.test(why({}, { ...ctx, subject: '', prompt: 'make a website' })), 'a prompt without a business gives nothing to tie a line to')
ok(G.gateCandidates([cand({ hero_heading: 'Your pizza, our passion' }), cand({ hero_heading: 'Your pizza, our passion', seed: 2 })], ctx).accepted.filter((a) => a.slot === 'heroTitle').length === 1, 'the same line twice is offered once')
// the button of a shop needs a shop verb
const shop = { theme: 'fashion_retail', subject: 'shoe store', prompt: 'shoe store', current: {} }
ok(G.gateCandidates([cand({ niche: 'shop', cta_primary: 'Shop Now' })], shop).accepted.some((a) => a.text === 'Shop Now') && /does not start with an action/.test(G.gateCandidates([cand({ niche: 'shop', cta_primary: 'Book Now' })], shop).rejected.map((r) => r.reason).join('|')), 'a shop gets "Shop Now", not "Book Now"')
ok(G.subjectWords('pizza shop', 'Create a website for a pizza shop called Zen').join() === 'pizza', 'the words of the business come from the prompt without the brand')

// ── the server route, with a fake Core-Craft behind it
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-'))
const fake = http.createServer((req, res) => {
  if (req.url === '/health') return res.end('{"ok":true}')
  let body = ''
  req.on('data', (d) => (body += d))
  req.on('end', () => { const r = JSON.parse(body); res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ niche: 'restaurant', candidates: [{ seed: 1, niche: 'restaurant', brand: 'X', hero_heading: `Your ${r.prompt}, our passion`, tagline: 't'.repeat(400), cta_primary: 'Book Now', cta_secondary: 'b', cta_text: 'c', stats: [{ value: '5000+' }], evil: '<script>' }] })) })
})
await new Promise((r) => fake.listen(0, '127.0.0.1', r))
const FAKE = fake.address().port
const PORT = 9600 + Math.floor(Math.random() * 90)
const srv = spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(PORT), EDIT_DATA_DIR: dir, CORECRAFT_URL: `http://127.0.0.1:${FAKE}` }, stdio: 'ignore' })
for (let i = 0; i < 40; i += 1) { try { await fetch(`http://127.0.0.1:${PORT}/api/health`); break } catch { await new Promise((r) => setTimeout(r, 100)) } }
const get = (p) => fetch(`http://127.0.0.1:${PORT}${p}`).then(async (r) => ({ status: r.status, ...(await r.json()) }))
try {
  ok((await get('/api/health')).corecraft === true, 'the health answer says that Core-Craft runs')
  const r = await get('/api/corecraft?prompt=pizza%20shop%20%3Cscript%3E&n=3')
  ok(r.status === 200 && r.candidates.length === 1 && r.candidates[0].hero_heading === 'Your pizza shop script, our passion', 'the prompt is cleaned before it is sent')
  ok(r.candidates[0].tagline.length <= 240 && !('stats' in r.candidates[0]) && !('evil' in r.candidates[0]), 'only the text slots come back, cut to size (no invented stats)')
  ok((await get('/api/corecraft?prompt=')).status === 400, 'a missing prompt is refused')
} finally {
  srv.kill()
  fake.close()
  fs.rmSync(dir, { recursive: true, force: true })
}
// ── no Core-Craft behind the server
const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'cc2-'))
const PORT2 = 9700 + Math.floor(Math.random() * 90)
const srv2 = spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(PORT2), EDIT_DATA_DIR: dir2, CORECRAFT_URL: 'http://127.0.0.1:9' }, stdio: 'ignore' })
for (let i = 0; i < 40; i += 1) { try { await fetch(`http://127.0.0.1:${PORT2}/api/health`); break } catch { await new Promise((r) => setTimeout(r, 100)) } }
try {
  const h = await (await fetch(`http://127.0.0.1:${PORT2}/api/health`)).json()
  const r = await fetch(`http://127.0.0.1:${PORT2}/api/corecraft?prompt=pizza`)
  ok(h.corecraft === false && r.status === 503, 'without Core-Craft the health answer says so and the route answers 503')
} finally {
  srv2.kill()
  fs.rmSync(dir2, { recursive: true, force: true })
}

// ── the real bridge (only when Python and the cont folder are here)
const cont = path.resolve(process.env.CORECRAFT_DIR ?? '../../cont')
if (fs.existsSync(path.join(cont, 'corecraft', 'content_engine.py'))) {
  const BP = 9800 + Math.floor(Math.random() * 90)
  const bridge = spawn(process.env.PYTHON ?? 'python3', ['scripts/corecraft_bridge.py', '--port', String(BP)], { env: { ...process.env, CORECRAFT_DIR: cont, PYTHONDONTWRITEBYTECODE: '1' }, stdio: 'ignore' })
  let up = false
  for (let i = 0; i < 80 && !up; i += 1) { try { up = (await fetch(`http://127.0.0.1:${BP}/health`)).ok } catch { await new Promise((r) => setTimeout(r, 250)) } }
  try {
    ok(up, 'the real bridge starts')
    if (up) {
      const call = (body) => fetch(`http://127.0.0.1:${BP}/generate`, { method: 'POST', body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, ...(await r.json()) }))
      const out = await call({ prompt: 'pizza shop', n: 3 })
      ok(out.status === 200 && out.candidates.length === 3 && out.candidates.every((c) => c.hero_heading && c.cta_primary && !('stats' in c)), 'the bridge returns three pages of copy without stats')
      ok(JSON.stringify((await call({ prompt: 'pizza shop', n: 2, seed: 5 })).candidates) === JSON.stringify((await call({ prompt: 'pizza shop', n: 2, seed: 5 })).candidates), 'the same seed gives the same pages')
      ok((await call({ prompt: '' })).status === 400, 'the bridge refuses an empty prompt')
      // the gate on real pages: it keeps lines out, it does not let them all through
      const real = await call({ prompt: 'hardware store', n: 8 })
      const gated = G.gateCandidates(real.candidates, { theme: 'general_business', subject: 'hardware store', prompt: 'hardware store', current: {} })
      ok(gated.rejected.length > gated.accepted.length && !gated.accepted.some((a) => /rings|diamonds|sneakers/i.test(a.text)), `the gate keeps the jewellery lines out of a hardware store (${gated.accepted.length} kept, ${gated.rejected.length} out)`)
    }
  } finally {
    bridge.kill()
  }
}

console.log(`corecraft: ${pass} checks passed, ${fail.length} failed`)
if (fail.length) {
  console.log(fail.map((f) => ` - ${f}`).join('\n'))
  process.exit(1)
}

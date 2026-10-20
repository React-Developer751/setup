// The check of the pictures of the image AI: the pixel check, the prompt check, the server routes (against a fake engine), the learning script.
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))
const { assessPixels, cleanPrompt, promptUnderstood } = await loadGeneratorModule('edit/imageCheck.ts')

// ── pixels
const fill = (n, f) => Uint8ClampedArray.from({ length: n * 4 }, (_, i) => f(Math.floor(i / 4), i % 4))
const N = 64 * 48
const blank = assessPixels(fill(N, () => 255))
ok(!blank.ok && blank.reasons.length > 0, `a white picture is turned away (${blank.reasons})`)
ok(!assessPixels(fill(N, (_, c) => (c === 3 ? 255 : 0))).ok, 'a black picture is turned away')
ok(!assessPixels(fill(N, (_, c) => (c === 3 ? 255 : 120))).ok, 'a flat grey picture is turned away')
// a picture with a sky, a ground and some objects in the colours of the site
const scene = fill(N, (p, c) => {
  const x = p % 64
  const y = Math.floor(p / 64)
  if (c === 3) return 255
  const sky = y < 24
  const object = x > 20 && x < 44 && y > 14 && y < 40
  const rgb = object ? [200, 60, 40] : sky ? [120 + y * 3, 170 + y, 230] : [60 + (x % 8) * 6, 140, 70]
  return rgb[c]
})
const good = assessPixels(scene, '#dc2626')
ok(good.ok && good.score >= 0.4 && good.stats.colours > 8, `a picture with a scene passes (score ${good.score}, ${good.stats.colours} colours)`)
const close = assessPixels(scene, '#c81e1e')
const far = assessPixels(scene, '#1d4ed8')
ok(close.stats.hueGap !== null && far.stats.hueGap !== null, 'the hue gap to the site colour is measured')
ok(assessPixels(new Uint8ClampedArray(0)).ok === false, 'an empty picture is turned away')

// ── prompts
ok(promptUnderstood({ entities: [{ name: 'bakery' }], not_in_lexicon: ['wooden'] }), 'a prompt with a thing the engine knows is understood')
ok(!promptUnderstood({ entities: [], not_in_lexicon: ['zxqv', 'blorf'] }), 'a prompt of unknown words is not understood')
ok(promptUnderstood({ entities: [], not_in_lexicon: [] }), 'a pattern prompt (mandala) is understood')
ok(promptUnderstood(undefined), 'when the check is not available the drawing is not blocked')
ok(cleanPrompt('zxqv bakery blorf', { not_in_lexicon: ['zxqv', 'blorf'] }) === 'bakery', 'unknown words are dropped from a prompt')

// ── the server routes, against a fake engine
const engine = http.createServer((req, res) => {
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    if (req.url === '/health') return res.writeHead(200).end('{"status":"ok"}')
    if (req.url === '/parse') {
      const prompt = JSON.parse(body).prompt
      res.writeHead(200, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ mode: 'scene', entities: /bakery/.test(prompt) ? [{ kind: 'object', name: 'bakery' }] : [], not_in_lexicon: /zxqv/.test(prompt) ? ['zxqv'] : [], time: null }))
    }
    res.writeHead(404).end()
  })
})
await new Promise((r) => engine.listen(0, '127.0.0.1', r))
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'imgfb-'))
const PORT = 9100 + Math.floor(Math.random() * 90)
const srv = spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(PORT), PIXELMATH_URL: `http://127.0.0.1:${engine.address().port}`, EDIT_DATA_DIR: dir }, stdio: 'ignore' })
for (let i = 0; i < 40; i += 1) { try { await fetch(`http://127.0.0.1:${PORT}/api/health`); break } catch { await new Promise((r) => setTimeout(r, 100)) } }
const get = (p) => fetch(`http://127.0.0.1:${PORT}${p}`)
const parsed = await (await get('/api/ai-parse?prompt=' + encodeURIComponent('a <b>bakery</b> shop'))).json()
ok(parsed.entities?.[0]?.name === 'bakery' && Array.isArray(parsed.not_in_lexicon), 'the server returns how the engine reads a prompt')
ok((await (await get('/api/ai-parse?prompt=zxqv')).json()).not_in_lexicon[0] === 'zxqv', 'unknown words are reported')
ok((await get('/api/ai-parse?prompt=')).status === 400, 'an empty prompt is refused')
const post = (body) => fetch(`http://127.0.0.1:${PORT}/api/image-feedback`, { method: 'POST', body: JSON.stringify(body) })
for (let i = 0; i < 4; i += 1) await post({ prompt: 'bad scene', seed: i, attempt: i + 1, accepted: false, score: 0.1, reasons: ['the picture is flat (one tone)'], stage: 'pixels' })
for (let i = 0; i < 4; i += 1) await post({ prompt: 'good scene', seed: i, attempt: 1, accepted: true, score: 0.8, reasons: [], stage: 'pixels' })
const file = path.join(dir, 'image-feedback.jsonl')
const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []
ok(lines.length === 8 && lines[0].prompt === 'bad scene' && lines[0].accepted === false, 'the decisions are kept in image-feedback.jsonl')
// ── the learning script finds the scene that never works
const out = spawnSync(process.execPath, ['scripts/image-learn.mjs', `--file=${file}`, '--no-write'], { encoding: 'utf8' })
ok(/bad scene/.test(out.stdout) && !/good scene.*blocked/i.test(out.stdout), `image-learn names the scene that was always turned away\n${out.stdout}`)
srv.kill()
engine.close()
fs.rmSync(dir, { recursive: true, force: true })

// ── the director: scenes must show the business
const { businessText, businessProps, directPlan } = await loadGeneratorModule('edit/imageDirector.ts')
ok(businessText('Create a website for a yoga studio called Zen Flow in Pune') === 'Create a website for a yoga studio', `the brand and the place are cut from the business words (${businessText('Create a website for a yoga studio called Zen Flow in Pune')})`)
ok(businessText('Italian pizza restaurant Forno') === 'Italian pizza restaurant', 'a capitalised brand name is dropped')
const LEX = { yoga: 'yogi', pizza: 'pizza', restaurant: 'restaurant', salon: 'salon', scissors: 'scissors', bread: 'bread', bakery: 'bakery' }
const fakeParse = async (text) => ({ mode: 'scene', entities: text.toLowerCase().split(/[^a-z]+/).filter((w) => LEX[w]).map((w) => ({ name: LEX[w] })), not_in_lexicon: [] })
const mk = (prompt) => ({ prompt, width: 640, height: 400, seed: 1, alt: [] })
const base = { hero: mk('salon with scissors'), about: mk('bakery with bread'), gallery: [mk('bread'), mk('salon'), mk('pizza')] }
const props = await businessProps('yoga studio called Zen', fakeParse)
ok(props.join() === 'yogi', `the props of the business come from the engine (${props})`)
const directed = await directPlan('pizza restaurant called Forno', base, fakeParse)
ok(directed.plan.hero.prompt === 'pizza and restaurant' && directed.replaced >= 2, `a scene that shows nothing of the business is replaced (${directed.plan.hero.prompt}, ${directed.replaced} replaced)`)
ok(directed.plan.gallery[2].prompt === 'pizza', 'a scene that already shows the business stays')
const niche = await directPlan('pizza restaurant', { ...base, fromNiche: true }, fakeParse)
ok(niche.replaced === 0 && niche.plan.hero.prompt === 'salon with scissors', 'the scenes of a niche are trusted')
ok((await directPlan('something unknown here', base, async () => ({ mode: 'scene', entities: [], not_in_lexicon: ['something'] }))).replaced === 0, 'with no props found the plan stays')

console.log(`${pass} checks passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

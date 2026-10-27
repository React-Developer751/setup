// Tests of the image engine connection: the scene plans, the server's /api/ai-image (against a fake engine), and - when the real PixelMath engine
// is running on port 8000 (npm run images) - the real pictures it returns.
import http from 'node:http'
import { spawn } from 'node:child_process'
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const { scenePlan, allScenePrompts, sceneUrl } = await loadGeneratorModule('imageAi.ts')
const { THEME_KEYS } = await loadGeneratorModule('themes.ts')
const { NICHES } = await loadGeneratorModule('niche/niches.ts')

// ── the plans
for (const theme of THEME_KEYS) {
  const plan = scenePlan(theme, undefined, 0)
  const all = [plan.hero, plan.about, ...plan.gallery]
  ok(plan.gallery.length >= 7 && new Set(all.map((s) => s.prompt)).size === all.length, `${theme}: at least nine different scenes, none twice (${all.length})`)
  ok(plan.hero.width === 1024 && plan.hero.height === 640 && plan.about.width === 800 && plan.gallery.every((s) => s.width === 640 && s.height === 480), `${theme}: sizes`)
  ok(all.every((s) => s.seed >= 1 && s.seed <= 997 && s.prompt.length >= 3 && s.prompt.length <= 80), `${theme}: seeds and prompts are sane`)
  ok(JSON.stringify(plan) === JSON.stringify(scenePlan(theme, undefined, 0)), `${theme}: the same plan every time`)
  ok(new Set([0, 1, 2].map((v) => scenePlan(theme, undefined, v).hero.prompt)).size === 3, `${theme}: other variations start with other scenes`)
}
let withScenes = 0
for (const n of NICHES) {
  const plan = scenePlan(n.theme, n.id, 0)
  const all = [plan.hero, plan.about, ...plan.gallery]
  ok(plan.gallery.length >= 7 && new Set(all.map((s) => s.prompt)).size === all.length, `niche ${n.id}: at least nine different scenes, none twice`)
  if (scenePlan(n.theme, n.id, 0).hero.prompt !== scenePlan(n.theme, undefined, 0).hero.prompt) withScenes += 1
}
ok(withScenes >= 50, `most niches have scenes of their own (${withScenes} of ${NICHES.length})`)
ok(scenePlan('home_services', 'pest_control', 0).hero.prompt === 'cleaning with a broom and bucket', 'a niche gets its own headline scene')
ok(scenePlan('food_dining', 'no_such_niche', 0).hero.prompt === scenePlan('food_dining', undefined, 0).hero.prompt, 'an unknown niche falls back to its business type')
ok(sceneUrl({ prompt: 'a b&c', width: 640, height: 480, seed: 5 }) === '/api/ai-image?prompt=a%20b%26c&width=640&height=480&seed=5', 'the scene address is encoded')

// ── the server's proxy, against a fake engine
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const seen = []
let engineMode = 'ok'
const engine = http.createServer((req, res) => {
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' })
      return res.end('{"status":"ok"}')
    }
    seen.push({ url: req.url, key: req.headers['x-api-key'], body: body ? JSON.parse(body) : undefined })
    if (engineMode === 'text') {
      res.writeHead(200, { 'content-type': 'text/plain' })
      return res.end('not a picture')
    }
    res.writeHead(200, { 'content-type': 'image/png' })
    res.end(png)
  })
})
await new Promise((r) => engine.listen(0, '127.0.0.1', r))
const enginePort = engine.address().port
const PORT = 9000 + Math.floor(Math.random() * 90)
const run = (env) => spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(PORT), ...env }, stdio: 'ignore' })
const ready = async () => { for (let i = 0; i < 40; i += 1) { try { await fetch(`http://127.0.0.1:${PORT}/api/health`); return } catch { await new Promise((r) => setTimeout(r, 100)) } } }
const get = (p) => fetch(`http://127.0.0.1:${PORT}${p}`)

let srv = run({ PIXELMATH_URL: 'http://127.0.0.1:1' })
await ready()
ok((await (await get('/api/health')).json()).images === false, 'health: no engine -> images false')
ok((await get('/api/ai-image?prompt=sunset%20beach')).status === 503, 'no engine -> 503 with a clear message')
srv.kill()
await new Promise((r) => setTimeout(r, 300))

srv = run({ PIXELMATH_URL: `http://127.0.0.1:${enginePort}`, PIXELMATH_API_KEY: 'engine-key', EDIT_IMAGES_PER_MINUTE: '12' })
await ready()
ok((await (await get('/api/health')).json()).images === true, 'health: engine up -> images true')
const r = await get('/api/ai-image?prompt=' + encodeURIComponent('sunset <b>beach</b> with a house & tree') + '&width=640&height=480&seed=7')
const bytes = Buffer.from(await r.arrayBuffer())
ok(r.status === 200 && r.headers.get('content-type') === 'image/png' && bytes.equals(png), 'the picture of the engine is returned as it is')
ok(r.headers.get('cache-control')?.includes('max-age'), 'pictures are cacheable')
const sent = seen.at(-1)
ok(sent.url === '/generate' && sent.key === 'engine-key', 'the engine is called with its key')
ok(sent.body.prompt === 'sunset b beach b with a house tree' && sent.body.width === 640 && sent.body.height === 480 && sent.body.seed === 7 && sent.body.format === 'png', `the prompt is cleaned and the sizes are passed (${JSON.stringify(sent.body)})`)
for (const bad of ['', '?prompt=x', '?prompt=sunset&width=99999', '?prompt=sunset&width=abc', '?prompt=sunset&seed=-1', '?prompt=sunset&height=10']) ok((await get(`/api/ai-image${bad}`)).status === 400, `bad request refused: ${bad || '(nothing)'}`)
engineMode = 'text'
ok((await get('/api/ai-image?prompt=sunset')).status === 502, 'a reply that is not a picture is a 502')
engineMode = 'ok'
let limited = 0
for (let i = 0; i < 20; i += 1) if ((await get('/api/ai-image?prompt=sunset')).status === 429) limited += 1
ok(limited > 0, 'too many pictures a minute are refused with 429')
srv.kill()

// ── the real engine, when it runs
let live = false
try { live = (await fetch('http://127.0.0.1:8000/health', { signal: AbortSignal.timeout(1000) })).ok } catch { live = false }
if (live) {
  // every scene is understood by the engine: it recognises at least one thing to draw (read with its own /parse)
  let lost = []
  for (const prompt of allScenePrompts()) {
    const parsed = await (await fetch('http://127.0.0.1:8000/parse', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt }) })).json()
    if (!(parsed.entities?.length || parsed.flags?.length)) lost.push(prompt)
  }
  ok(lost.length === 0, `the engine recognises something in every scene (not: ${lost.join(' | ')})`)
  srv = run({ PIXELMATH_URL: 'http://127.0.0.1:8000', EDIT_IMAGES_PER_MINUTE: '500' })
  await ready()
  for (const theme of ['food_dining', 'modern_tech', 'real_estate']) {
    const plan = scenePlan(theme, undefined, 0)
    for (const scene of [plan.hero, plan.gallery[0]]) {
      const t0 = Date.now()
      const res = await get(sceneUrl(scene))
      const data = Buffer.from(await res.arrayBuffer())
      ok(res.status === 200 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `real engine: ${scene.prompt} is a PNG`)
      ok(data.readUInt32BE(16) === scene.width && data.readUInt32BE(20) === scene.height, `real engine: ${scene.prompt} has the asked size`)
      ok(Date.now() - t0 < 20000, `real engine: ${scene.prompt} took ${Date.now() - t0} ms`)
    }
  }
  // the same scene twice is the same picture (the engine is deterministic)
  const a = Buffer.from(await (await get(sceneUrl(scenePlan('food_dining', undefined, 0).hero))).arrayBuffer())
  const b = Buffer.from(await (await get(sceneUrl(scenePlan('food_dining', undefined, 0).hero))).arrayBuffer())
  ok(a.equals(b), 'real engine: the same scene gives the same picture')
  srv.kill()
} else console.log('(the real image engine is not running on port 8000: npm run images; the live checks are skipped)')

engine.close()
console.log(`${pass} passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

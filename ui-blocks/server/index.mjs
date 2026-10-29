// The local server of the page. No packages: Node's own http and fetch. It calls no external AI, model or API: only your own engines (PixelMath, Core-Craft).
//   node server/index.mjs        (or: npm run server)
// POST /api/feedback  { text, ops, accepted, source } -> appended to server/data/feedback.jsonl (examples for training the offline parser)
// GET  /api/ai-parse  ?prompt=  -> how the image engine reads a prompt;  POST /api/image-feedback -> server/data/image-feedback.jsonl
// GET/POST /api/edit-log, POST /api/edit-log/undo -> the chat commands and which ones were undone;  GET/POST /api/image-ratings -> picture thumbs shared by all browsers
// GET  /api/corecraft/page ?prompt=  -> one whole page of Core-Craft copy (services of the prompt, Hindi);  GET /api/corecraft ?prompt=&n=  -> pages of copy from Core-Craft AI (npm run corecraft); /api/health says corecraft: true when it runs
// GET/POST /api/palettes -> premium colour palettes that people add (on top of src/data/premiumPalettes.json)
// GET/POST /api/prompt-memory -> every prompt with what it became and the edits made to it (server/data/prompt-memory.jsonl); GET /api/prompt-memory/export (jsonl for training) and /keywords (word -> business type counts)
// GET/POST /api/phrase-events -> what people say and do about the texts of the sites (the content AI's phrase scores)
// GET  /api/designs ?key=&limit=  -> the designs made so far (server/data/designs.jsonl, the design memory);  POST /api/designs {record};  POST /api/designs/verdict {id, verdict, best?}
// GET  /api/health    -> { ok, images, corecraft }
// The page checks every operation again (cleanOp), so this server is never trusted with more than the offline rules may do.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 8787)
// local only by default; set HOST=0.0.0.0 behind a reverse proxy, and EDIT_SERVER_TOKEN so that only your page can use your API key
const HOST = process.env.HOST ?? '127.0.0.1'
const TOKEN = process.env.EDIT_SERVER_TOKEN
// optional image engine (PixelMath, the `normal` folder: npm run images): scenes for the first screen, About and gallery
const CORECRAFT_URL = (process.env.CORECRAFT_URL ?? 'http://127.0.0.1:8100').replace(/\/$/, '')
const PIXELMATH_URL = (process.env.PIXELMATH_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')
const PIXELMATH_KEY = process.env.PIXELMATH_API_KEY
const IMAGES_PER_MINUTE = Number(process.env.EDIT_IMAGES_PER_MINUTE ?? 90)
const RATE_PER_MINUTE = Number(process.env.EDIT_RATE_PER_MINUTE ?? 120)
const DATA = process.env.EDIT_DATA_DIR ?? path.join(here, 'data')
const MAX_BODY = 20_000

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    let tooLarge = false
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) tooLarge = true
      else chunks.push(c)
    })
    req.on('end', () => (tooLarge ? reject(Object.assign(new Error('request too large'), { status: 413 })) : resolve(Buffer.concat(chunks).toString('utf8'))))
    req.on('error', reject)
  })
}

/** the address of the caller; behind a reverse proxy (TRUST_PROXY=1) the first address of X-Forwarded-For */
const clientIp = (req) => (process.env.TRUST_PROXY === '1' ? String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : '') || req.socket.remoteAddress || 'unknown'
const STORED_READS = new Set(['/api/designs', '/api/edit-log', '/api/image-ratings', '/api/palettes', '/api/phrase-events', '/api/prompt-memory', '/api/prompt-memory/export', '/api/prompt-memory/keywords'])
const EXTRA_ORIGINS = new Set(String(process.env.EDIT_ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean))
/** this machine's own pages (any port: Vite, preview), the page the server itself was reached from, and what the operator listed */
function originAllowed(origin, host) {
  if (EXTRA_ORIGINS.has(origin)) return true
  try {
    const u = new URL(origin)
    return ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname) || u.host === host
  } catch {
    return false
  }
}
const hits = new Map()
/** at most RATE_PER_MINUTE requests a minute for one address: a stolen link cannot burn the whole API budget */
const limited = (ip) => {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) for (const [key, list] of hits) if (!list.some((t) => now - t < 60_000)) hits.delete(key)
  return recent.length > RATE_PER_MINUTE
}


const imageHits = new Map()
const imagesLimited = (ip) => {
  const now = Date.now()
  const recent = (imageHits.get(ip) ?? []).filter((t) => now - t < 60_000)
  recent.push(now)
  imageHits.set(ip, recent)
  return recent.length > IMAGES_PER_MINUTE
}

let engineProbe = { at: 0, up: false }
/** is the image engine answering? (asked at most every 5 seconds) */
let coreProbe = { at: 0, up: false }
async function coreCraftUp() {
  if (Date.now() - coreProbe.at < 5000) return coreProbe.up
  let up = false
  try {
    up = (await fetch(`${CORECRAFT_URL}/health`, { signal: AbortSignal.timeout(1500) })).ok
  } catch {
    up = false
  }
  coreProbe = { at: Date.now(), up }
  return up
}
async function imageEngineUp() {
  if (Date.now() - engineProbe.at < 5000) return engineProbe.up
  let up = false
  try {
    up = (await fetch(`${PIXELMATH_URL}/health`, { signal: AbortSignal.timeout(1500) })).ok
  } catch {
    up = false
  }
  engineProbe = { at: Date.now(), up }
  return up
}

const send = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}


// ── the built page (npm run build): served by this server, so one process is the whole site; the browser gets strict security headers
const DIST = path.resolve(process.env.DIST_DIR ?? path.join(here, '..', 'dist'))
const SERVE_DIST = process.env.SERVE_DIST !== '0' && fs.existsSync(path.join(DIST, 'index.html'))
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.wasm': 'application/wasm', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8', '.map': 'application/json; charset=utf-8' }
// the page shows its previews in frames made from text (srcdoc), which follow the rules of the page: inline scripts and styles and the Google fonts of the sites it makes are allowed, nothing else from outside
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' data: blob:; connect-src 'self' https://huggingface.co https://cdn.jsdelivr.net data: blob:; worker-src 'self' blob:; frame-src 'self' about: data: blob: https://www.google.com https://maps.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
const SECURITY = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY', 'cross-origin-opener-policy': 'same-origin', 'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()', 'content-security-policy': CSP }
/** a file of the built page; an address that is not a file is the page itself (the app has no other pages); nothing outside the folder can be read */
function serveStatic(req, res, pathname) {
  if (!SERVE_DIST || (req.method !== 'GET' && req.method !== 'HEAD')) return false
  let decoded
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return false
  }
  if (decoded.includes('\0')) return false
  let file = path.resolve(DIST, `.${decoded}`)
  if (file !== DIST && !file.startsWith(DIST + path.sep)) return false
  let stat = fs.statSync(file, { throwIfNoEntry: false })
  if (stat?.isDirectory()) {
    file = path.join(file, 'index.html')
    stat = fs.statSync(file, { throwIfNoEntry: false })
  }
  const asked = !!path.extname(decoded)
  // a missing file with an extension is a 404, any other address is the app
  if (!stat?.isFile()) {
    if (asked) return false
    file = path.join(DIST, 'index.html')
  }
  const ext = path.extname(file).toLowerCase()
  const hashed = file.includes(`${path.sep}assets${path.sep}`)
  res.writeHead(200, { 'content-type': TYPES[ext] ?? 'application/octet-stream', 'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache', ...SECURITY })
  if (req.method === 'HEAD') res.end()
  else fs.createReadStream(file).pipe(res)
  return true
}

export const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok: true, images: await imageEngineUp(), corecraft: await coreCraftUp() })
    // every request that writes (or reads what people wrote) passes these checks first, before any handler runs
    const ip = clientIp(req)
    if (req.method === 'POST' && url.pathname.startsWith('/api/')) {
      if (limited(ip)) return send(res, 429, { error: 'too many requests, try again in a minute' })
      // a web page of another site cannot post here: its Origin is not one of ours, and a cross-site form cannot send JSON
      const origin = req.headers.origin
      if (origin && !originAllowed(origin, req.headers.host)) return send(res, 403, { error: 'this origin is not allowed' })
      if (!/^application\/json\b/i.test(String(req.headers['content-type'] ?? ''))) return send(res, 415, { error: 'send application/json' })
      if (TOKEN && req.headers['x-edit-token'] !== TOKEN) return send(res, 401, { error: 'missing or wrong token' })
    }
    // the stored prompts, designs and opinions are read with the token as well (the pictures are not: an <img> cannot send a header)
    if (req.method === 'GET' && TOKEN && STORED_READS.has(url.pathname) && req.headers['x-edit-token'] !== TOKEN) return send(res, 401, { error: 'missing or wrong token' })
    if (req.method === 'GET' && url.pathname === '/api/ai-image') {
      if (imagesLimited(ip)) return send(res, 429, { error: 'too many pictures requested, try again in a minute' })
      const prompt = (url.searchParams.get('prompt') ?? '').replace(/[^\p{L}\p{M}\p{N} ,.'-]+/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
      const num = (name, min, max, fallback) => {
        const v = Number(url.searchParams.get(name) ?? fallback)
        return Number.isInteger(v) && v >= min && v <= max ? v : undefined
      }
      const width = num('width', 64, 1024, 640)
      const height = num('height', 64, 1024, 480)
      const seed = num('seed', 0, 999999, 1)
      if (prompt.length < 2 || !width || !height || seed === undefined) return send(res, 400, { error: 'prompt (2-200 letters), width and height (64-1024) and seed (0-999999) are needed' })
      let upstream
      try {
        upstream = await fetch(`${PIXELMATH_URL}/generate`, { method: 'POST', headers: { 'content-type': 'application/json', ...(PIXELMATH_KEY ? { 'x-api-key': PIXELMATH_KEY } : {}) }, body: JSON.stringify({ prompt, width, height, seed, format: 'png' }), signal: AbortSignal.timeout(60_000) })
      } catch {
        return send(res, 503, { error: 'the image engine is not running (npm run images)' })
      }
      if (!upstream.ok || !/^image\//.test(upstream.headers.get('content-type') ?? '')) return send(res, 502, { error: `the image engine answered ${upstream.status}` })
      const bytes = Buffer.from(await upstream.arrayBuffer())
      res.writeHead(200, { 'content-type': upstream.headers.get('content-type'), 'content-length': bytes.length, 'cache-control': 'public, max-age=86400' })
      return res.end(bytes)
    }
    // the studio of the image engine: 3-8 pictures of one site in one style (hero, about, tiles), already judged by the engine
    if (req.method === 'GET' && url.pathname === '/api/ai-set') {
      if (imagesLimited(ip)) return send(res, 429, { error: 'too many pictures requested, try again in a minute' })
      const prompt = (url.searchParams.get('prompt') ?? '').replace(/[^\p{L}\p{M}\p{N} ,.'-]+/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
      const count = Number(url.searchParams.get('count') ?? 6)
      const seed = Number(url.searchParams.get('seed') ?? 1)
      const accent = /^#[0-9a-f]{6}$/i.test(url.searchParams.get('accent') ?? '') ? url.searchParams.get('accent') : undefined
      const mood = ['warm', 'cool', 'dark', 'light'].includes(url.searchParams.get('mood')) ? url.searchParams.get('mood') : undefined
      if (prompt.length < 2 || !Number.isInteger(count) || count < 3 || count > 8 || !Number.isInteger(seed) || seed < 0 || seed > 999999) return send(res, 400, { error: 'prompt (2-200 letters), count (3-8) and seed (0-999999) are needed' })
      let upstream
      try {
        upstream = await fetch(`${PIXELMATH_URL}/set`, { method: 'POST', headers: { 'content-type': 'application/json', ...(PIXELMATH_KEY ? { 'x-api-key': PIXELMATH_KEY } : {}) }, body: JSON.stringify({ prompt, count, seed, ...(accent ? { accent } : {}), ...(mood ? { mood } : {}), text_zone: 'left', response: 'base64' }), signal: AbortSignal.timeout(90_000) })
      } catch {
        return send(res, 503, { error: 'the image engine is not running (npm run images)' })
      }
      if (!upstream.ok) return send(res, 502, { error: `the image engine answered ${upstream.status}` })
      const body = await upstream.json()
      const images = (Array.isArray(body.images) ? body.images : []).slice(0, 8).filter((i) => /^image\/(jpeg|png)$/.test(i?.mime) && typeof i.image_base64 === 'string' && /^[A-Za-z0-9+/=]+$/.test(i.image_base64) && i.image_base64.length < 400_000)
        .map((i) => ({ role: String(i.role ?? '').slice(0, 12), width: Number(i.width) || 0, height: Number(i.height) || 0, mime: i.mime, image_base64: i.image_base64 }))
      const r = body.report ?? {}
      return send(res, 200, { report: { niche: r.niche ?? null, title: String(r.title ?? '').slice(0, 60), fallback: r.fallback === true, redrawn: Number(r.redrawn) || 0, min_distance: Number(r.min_distance) || 0, hero_contrast: Number(r.hero_contrast) || 0, text_color: typeof r.text_color === 'string' ? r.text_color.slice(0, 9) : undefined }, images })
    }
    // Core-Craft AI (the `cont` folder, run by `npm run corecraft`): several pages of copy for a prompt; the page checks every line before it is offered
    if (req.method === 'GET' && url.pathname === '/api/corecraft') {
      const prompt = (url.searchParams.get('prompt') ?? '').replace(/[^\p{L}\p{M}\p{N} ,.'-]+/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
      const n = Math.max(1, Math.min(8, Number(url.searchParams.get('n')) || 4))
      if (prompt.length < 2) return send(res, 400, { error: 'prompt is needed' })
      if (limited(ip)) return send(res, 429, { error: 'too many requests, try again in a minute' })
      try {
        const upstream = await fetch(`${CORECRAFT_URL}/generate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt, n, seed: Number(url.searchParams.get('seed')) || undefined }), signal: AbortSignal.timeout(20_000) })
        if (!upstream.ok) return send(res, 502, { error: `Core-Craft answered ${upstream.status}` })
        const body = await upstream.json()
        const text = (v, k) => String(v ?? '').slice(0, k)
        const candidates = (Array.isArray(body.candidates) ? body.candidates : []).slice(0, 8).map((c) => ({
          seed: Number(c.seed) || 0, niche: text(c.niche, 20), brand: text(c.brand, 60), hero_heading: text(c.hero_heading, 120), tagline: text(c.tagline, 240), cta_primary: text(c.cta_primary, 60), cta_secondary: text(c.cta_secondary, 60), cta_text: text(c.cta_text, 240),
        }))
        return send(res, 200, { niche: text(body.niche, 20), candidates })
      } catch {
        return send(res, 503, { error: 'Core-Craft is not running (npm run corecraft)' })
      }
    }
    // one whole page of copy from Core-Craft AI (its own services-only mode, Hindi when the prompt is in Devanagari), cleaned before it reaches the page
    if (req.method === 'GET' && url.pathname === '/api/corecraft/page') {
      const prompt = (url.searchParams.get('prompt') ?? '').replace(/[^\p{L}\p{M}\p{N} ,.'"&\-;:\u0964\u0965]+/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 300)
      if (prompt.length < 2) return send(res, 400, { error: 'prompt is needed' })
      if (limited(ip)) return send(res, 429, { error: 'too many requests, try again in a minute' })
      try {
        const upstream = await fetch(`${CORECRAFT_URL}/page`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt, seed: Number(url.searchParams.get('seed')) || 1 }), signal: AbortSignal.timeout(20_000) })
        if (upstream.status === 422) return send(res, 422, { error: 'Core-Craft could not write a page for this prompt' })
        if (!upstream.ok) return send(res, 502, { error: `Core-Craft answered ${upstream.status}` })
        const p = (await upstream.json()).page ?? {}
        const t = (v, k) => String(v ?? '').replace(/\p{Cc}+/gu, ' ').replace(/[<>]/g, '').slice(0, k)
        const list = (v, n, f) => (Array.isArray(v) ? v.slice(0, n).map(f) : [])
        const ui = {}
        for (const k of ['about', 'faq', 'contact', 'pricing', 'testimonials', 'team', 'features_title', 'steps_title', 'faq_title']) ui[k] = t(p.ui?.[k], 60)
        return send(res, 200, {
          page: {
            brand: t(p.brand, 60), lang: p.lang === 'hi' ? 'hi' : 'en', business_type: t(p.business_type, 30), type_label: t(p.type_label, 60), location: t(p.location, 60), niche: t(p.niche, 20),
            hero_heading: t(p.hero_heading, 120), tagline: t(p.tagline, 240), about_title: t(p.about_title, 80), about: list(p.about, 3, (x) => t(x, 420)),
            features_title: t(p.features_title, 60), features: list(p.features, 8, (f) => ({ title: t(f?.title, 40), text: t(f?.text, 160) })),
            highlights: list(p.highlights, 4, (f) => ({ title: t(f?.title, 40), text: t(f?.text, 160) })),
            steps_title: t(p.steps_title, 60), steps: list(p.steps, 5, (f) => ({ title: t(f?.title, 30), text: t(f?.text, 140) })),
            faq: list(p.faq, 8, (f) => ({ q: t(f?.q, 100), a: t(f?.a, 260) })),
            cta_primary: t(p.cta_primary, 30), cta_secondary: t(p.cta_secondary, 30), cta_title: t(p.cta_title, 70),
            ui, generated_by: { business_type: t(p.generated_by?.business_type, 60), mode: t(p.generated_by?.mode, 60), items_from_prompt: list(p.generated_by?.items_from_prompt, 8, (x) => t(x, 40)) },
            needs_review: list(p.needs_review, 8, (x) => t(x, 220)),
          },
        })
      } catch {
        return send(res, 503, { error: 'Core-Craft is not running (npm run corecraft)' })
      }
    }
    // the design memory: every design that was made, and what the person said about it (a small file database, one JSON line per design)
    if (url.pathname === '/api/designs' || url.pathname === '/api/designs/verdict') {
      const file = path.join(DATA, 'designs.jsonl')
      const readAll = () => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l) } catch { return undefined } }).filter(Boolean) : [])
      const writeAll = (rows) => {
        fs.mkdirSync(DATA, { recursive: true })
        const tmp = `${file}.tmp`
        fs.writeFileSync(tmp, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''))
        fs.renameSync(tmp, file)
      }
      if (req.method === 'GET' && url.pathname === '/api/designs') {
        const key = url.searchParams.get('key')
        const limit = Math.max(1, Math.min(2000, Number(url.searchParams.get('limit')) || 500))
        const rows = readAll().filter((r) => !key || r.key === key)
        return send(res, 200, { designs: rows.slice(-limit).reverse(), total: rows.length })
      }
      if (req.method === 'POST' && url.pathname === '/api/designs') {
        const r = JSON.parse(await readBody(req))
        const text = (v, n) => String(v ?? '').slice(0, n)
        const hex = (v) => (/^#[0-9a-f]{6}$/i.test(String(v)) ? String(v).toLowerCase() : '#000000')
        const record = {
          id: text(r.id, 40) || `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
          at: new Date().toISOString(), key: text(r.key, 120), group: text(r.group, 80), prompt: text(r.prompt, 300), variation: Number(r.variation) || 0, creativity: text(r.creativity, 12),
          theme: text(r.theme, 40), niche: text(r.niche, 60), paletteName: text(r.paletteName, 80), kind: text(r.kind, 30), accent: hex(r.accent), alt: hex(r.alt), hue: Math.round(Number(r.hue) || 0) % 360,
          sat: Math.round(Number(r.sat) || 0), light: Math.round(Number(r.light) || 0), mode: r.mode === 'dark' ? 'dark' : 'light', tier: text(r.tier, 12), heroLayout: text(r.heroLayout, 40),
          layouts: Array.isArray(r.layouts) ? r.layouts.slice(0, 30).map((l) => text(l, 40)) : [], concept: text(r.concept, 60).replace(/[^A-Za-z0-9:_-]+/g, ''), parts: Array.isArray(r.parts) ? r.parts.slice(0, 30).map((l) => text(l, 60)).filter((id) => /^[A-Za-z0-9-]+\/[A-Za-z0-9]+$/.test(id)) : [], heroTitle: text(r.heroTitle, 140), copy: r.copy && typeof r.copy === 'object' ? Object.fromEntries(Object.entries(r.copy).slice(0, 8).map(([k, v]) => [text(k, 20), text(v, 140)])) : undefined, verdict: ['good', 'bad'].includes(r.verdict) ? r.verdict : 'unrated',
        }
        const rows = readAll()
        if (rows.length >= 20000) rows.splice(0, rows.length - 19999)
        rows.push(record)
        writeAll(rows)
        return send(res, 200, { ok: true, id: record.id })
      }
      if (req.method === 'POST' && url.pathname === '/api/designs/verdict') {
        const r = JSON.parse(await readBody(req))
        const rows = readAll()
        const target = rows.find((x) => x.id === r.id)
        if (!target) return send(res, 404, { error: 'unknown design' })
        const verdict = r.verdict === 'good' ? 'good' : r.verdict === 'bad' ? 'bad' : 'unrated'
        target.verdict = verdict
        // "this one is the right one, the others are not": the undecided designs of the same round are turned down
        if (verdict === 'good' && r.best === true) for (const x of rows) if (x.group && x.group === target.group && x.id !== target.id && x.verdict === 'unrated') x.verdict = 'bad'
        writeAll(rows)
        return send(res, 200, { ok: true })
      }
    }
    // the prompt memory: one row per page made (prompt, what it became, the edits that followed); a new prompt learns from the rows that resemble it
    if (url.pathname.startsWith('/api/prompt-memory')) {
      const file = path.join(DATA, 'prompt-memory.jsonl')
      const readAll = () => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l) } catch { return undefined } }).filter(Boolean) : [])
      if (req.method === 'GET' && url.pathname === '/api/prompt-memory') {
        const limit = Math.max(1, Math.min(5000, Number(url.searchParams.get('limit')) || 2000))
        const rows = readAll()
        return send(res, 200, { rows: rows.slice(-limit), total: rows.length })
      }
      if (req.method === 'GET' && url.pathname === '/api/prompt-memory/export') {
        res.writeHead(200, { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' })
        return res.end(readAll().map((r) => JSON.stringify(r)).join('\n') + '\n')
      }
      if (req.method === 'GET' && url.pathname === '/api/prompt-memory/keywords') {
        // for every word of the prompts: how often it came with each business type, and how often with each colour or part the person changed
        const table = {}
        for (const r of readAll()) {
          for (const w of new Set(String(r.prompt).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((x) => x.length > 2))) {
            const e = (table[w] ??= { n: 0, themes: {}, niches: {} })
            e.n += 1
            e.themes[r.theme] = (e.themes[r.theme] ?? 0) + 1
            if (r.niche) e.niches[r.niche] = (e.niches[r.niche] ?? 0) + 1
          }
        }
        return send(res, 200, { words: Object.fromEntries(Object.entries(table).sort((a, b) => b[1].n - a[1].n).slice(0, 1500)) })
      }
      if (req.method === 'POST' && url.pathname === '/api/prompt-memory') {
        const r = JSON.parse(await readBody(req))
        const text = (v, n) => String(v ?? '').slice(0, n)
        const KINDS = ['accent', 'remove', 'add', 'mood', 'mode', 'text']
        const row = {
          id: text(r.id, 40), at: text(r.at, 40) || new Date().toISOString(), updated: new Date().toISOString(), prompt: text(r.prompt, 600), key: text(r.key, 120), theme: text(r.theme, 40), niche: text(r.niche, 60),
          concept: text(r.concept, 60), hero: text(r.hero, 160), pages: r.pages === 'multi' ? 'multi' : 'single',
          verdict: r.verdict === 'up' || r.verdict === 'down' ? r.verdict : undefined,
          rejected: (Array.isArray(r.rejected) ? r.rejected : []).slice(-20).map((x) => text(x, 60)),
          ratings: (Array.isArray(r.ratings) ? r.ratings : []).slice(-40).map((x) => ({ at: text(x?.at, 40), text: text(x?.text, 200), up: x?.up === true })),
          edits: (Array.isArray(r.edits) ? r.edits : []).slice(0, 60).map((e) => ({ at: text(e?.at, 40), text: text(e?.text, 300), ops: (Array.isArray(e?.ops) ? e.ops : []).slice(0, 12).filter((o) => KINDS.includes(o?.k)).map((o) => ({ k: o.k, v: text(o.v, 120) })) })),
        }
        if (!row.id || !row.prompt.trim()) return send(res, 400, { error: 'a row needs an id and a prompt' })
        const rows = readAll()
        const i = rows.findIndex((x) => x.id === row.id)
        if (i >= 0) rows[i] = { ...row, at: rows[i].at }
        else rows.push(row)
        if (rows.length > 20000) rows.splice(0, rows.length - 20000)
        fs.mkdirSync(DATA, { recursive: true })
        fs.writeFileSync(`${file}.tmp`, rows.map((x) => JSON.stringify(x)).join('\n') + '\n')
        fs.renameSync(`${file}.tmp`, file)
        return send(res, 200, { ok: true })
      }
    }
    // the edit history: every chat command, what it changed, and whether the person undid it (an undo is a thumb down for how the command was read)
    if (url.pathname === '/api/edit-log' || url.pathname === '/api/edit-log/undo') {
      const file = path.join(DATA, 'edit-log.jsonl')
      const readAll = () => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l) } catch { return undefined } }).filter(Boolean) : [])
      const writeAll = (rows) => {
        fs.mkdirSync(DATA, { recursive: true })
        const tmp = `${file}.tmp`
        fs.writeFileSync(tmp, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''))
        fs.renameSync(tmp, file)
      }
      if (req.method === 'GET' && url.pathname === '/api/edit-log') {
        const key = url.searchParams.get('key')
        const limit = Math.max(1, Math.min(3000, Number(url.searchParams.get('limit')) || 800))
        const rows = readAll().filter((r) => !key || r.key === key)
        return send(res, 200, { rows: rows.slice(-limit), total: rows.length })
      }
      if (req.method === 'POST' && url.pathname === '/api/edit-log') {
        const r = JSON.parse(await readBody(req))
        const text = (v, n) => String(v ?? '').slice(0, n)
        const row = {
          id: text(r.id, 40) || `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
          at: new Date().toISOString(), key: text(r.key, 120), text: text(r.text, 300), norm: text(r.norm, 300), context: r.context === 'multi' ? 'multi' : 'single',
          ops: Array.isArray(r.ops) ? r.ops.slice(0, 12).map((o) => text(o, 160)) : [], via: ['rules', 'server', 'choice'].includes(r.via) ? r.via : 'rules', undone: false,
        }
        const rows = readAll()
        if (rows.length >= 20000) rows.splice(0, rows.length - 19999)
        rows.push(row)
        writeAll(rows)
        return send(res, 200, { ok: true, id: row.id })
      }
      if (req.method === 'POST' && url.pathname === '/api/edit-log/undo') {
        const r = JSON.parse(await readBody(req))
        const rows = readAll()
        const target = rows.find((x) => x.id === r.id)
        if (!target) return send(res, 404, { error: 'unknown command' })
        target.undone = true
        writeAll(rows)
        return send(res, 200, { ok: true })
      }
    }
    // the premium colour set: palettes that people add join the ones shipped with the generator (src/data/premiumPalettes.json); the page reads them at start
    if (url.pathname === '/api/palettes') {
      const file = path.join(DATA, 'premium-palettes.jsonl')
      const readAll = () => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l) } catch { return undefined } }).filter(Boolean) : [])
      if (req.method === 'GET') return send(res, 200, { palettes: readAll().slice(-500) })
      if (req.method === 'POST') {
        const r = JSON.parse(await readBody(req))
        const text = (v, n) => String(v ?? '').replace(/\p{Cc}+/gu, ' ').trim().slice(0, n)
        const hex = (v) => (/^#[0-9a-f]{6}$/i.test(String(v)) ? String(v).toLowerCase() : '')
        const NEUTRALS = ['ivory', 'pearl', 'sand', 'mist', 'blush', 'graphite']
        const THEMES = ['any', 'modern_tech', 'organic_nature', 'luxury_minimal', 'playful_vibrant', 'bold_fitness', 'professional_services', 'healthcare', 'food_dining', 'education', 'creative_studio', 'general_business', 'real_estate', 'travel_tourism', 'automotive', 'beauty_wellness', 'events_wedding', 'pets_animals', 'fashion_retail', 'home_services', 'nonprofit']
        const name = text(r.name, 40)
        if (name.length < 3 || !hex(r.accent) || !hex(r.alt) || !NEUTRALS.includes(r.neutral)) return send(res, 400, { error: 'name (3-40 letters), accent and alt (#rrggbb) and neutral (ivory, pearl, sand, mist, blush or graphite) are needed' })
        const id = text(r.id, 40).toLowerCase().replace(/[^a-z0-9-]+/g, '-') || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`
        const rows = readAll()
        if (rows.some((x) => x.id === id)) return send(res, 409, { error: 'a palette with this id exists' })
        const palette = { id, name, accent: hex(r.accent), alt: hex(r.alt), neutral: r.neutral, themes: Array.isArray(r.themes) && r.themes.length ? r.themes.filter((t) => THEMES.includes(t)).slice(0, 8) : ['any'], tags: Array.isArray(r.tags) ? r.tags.map((t) => text(t, 20).toLowerCase()).filter(Boolean).slice(0, 8) : [] }
        if (!palette.themes.length) palette.themes = ['any']
        fs.mkdirSync(DATA, { recursive: true })
        fs.appendFileSync(file, `${JSON.stringify(palette)}\n`)
        return send(res, 200, { ok: true, id })
      }
    }
    // what people say and do about the texts of the sites (headlines, buttons ...): one line per event, the page folds them into a score per phrase
    if (url.pathname === '/api/phrase-events') {
      const file = path.join(DATA, 'phrase-events.jsonl')
      const readAll = () => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l) } catch { return undefined } }).filter(Boolean) : [])
      if (req.method === 'GET') return send(res, 200, { events: readAll().slice(-8000) })
      if (req.method === 'POST') {
        const body = JSON.parse(await readBody(req))
        const text = (v, n) => String(v ?? '').replace(/\p{Cc}+/gu, ' ').slice(0, n)
        const SLOTS = ['heroTitle', 'heroSubtitle', 'heroButton', 'ctaTitle', 'featuresTitle', 'aboutTitle']
        const REASONS = ['opinion', 'replaced', 'regenerate', 'rating', 'export', 'abandoned']
        const events = (Array.isArray(body.events) ? body.events : [body]).slice(0, 20).flatMap((e) => {
          if (!e || !SLOTS.includes(e.slot) || !text(e.phrase, 140).trim() || !text(e.session, 60) || !text(e.group, 80)) return []
          return [{ at: new Date().toISOString(), session: text(e.session, 60), group: text(e.group, 80), slot: e.slot, phrase: text(e.phrase, 140), delta: e.delta === 1 ? 1 : e.delta === -1 ? -1 : 0, reason: REASONS.includes(e.reason) ? e.reason : 'opinion', ...(e.text ? { text: text(e.text, 200) } : {}), ...(['POSITIVE', 'NEGATIVE', 'NEUTRAL'].includes(e.sentiment) ? { sentiment: e.sentiment } : {}) }]
        })
        if (!events.length) return send(res, 400, { error: 'session, group, slot and phrase are needed' })
        fs.mkdirSync(DATA, { recursive: true })
        fs.appendFileSync(file, events.map((e) => JSON.stringify(e)).join('\n') + '\n')
        return send(res, 200, { ok: true, stored: events.length })
      }
    }
    // picture thumbs, shared by every browser: one line per thumb, the page folds them into liked / disliked / votes
    if (url.pathname === '/api/image-ratings') {
      const file = path.join(DATA, 'image-ratings.jsonl')
      const readAll = () => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l) } catch { return undefined } }).filter(Boolean) : [])
      if (req.method === 'GET') return send(res, 200, { events: readAll().slice(-5000) })
      if (req.method === 'POST') {
        const r = JSON.parse(await readBody(req))
        const prompt = String(r.prompt ?? '').replace(/[^\p{L}\p{M}\p{N} ,.'-]+/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
        const key = String(r.key ?? '').slice(0, 120)
        if (prompt.length < 2 || !key || typeof r.liked !== 'boolean') return send(res, 400, { error: 'key, prompt and liked are needed' })
        fs.mkdirSync(DATA, { recursive: true })
        fs.appendFileSync(file, `${JSON.stringify({ at: new Date().toISOString(), key, prompt, seed: Math.max(0, Math.min(999999, Math.round(Number(r.seed) || 0))), liked: r.liked })}\n`)
        return send(res, 200, { ok: true })
      }
    }
    // how the image engine understands a prompt (its /parse): the page asks before it draws, and tries other words when nothing is understood
    if (req.method === 'GET' && url.pathname === '/api/ai-parse') {
      const prompt = (url.searchParams.get('prompt') ?? '').replace(/[^\p{L}\p{M}\p{N} ,.'-]+/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
      if (prompt.length < 2) return send(res, 400, { error: 'prompt is needed' })
      try {
        const upstream = await fetch(`${PIXELMATH_URL}/parse`, { method: 'POST', headers: { 'content-type': 'application/json', ...(PIXELMATH_KEY ? { 'x-api-key': PIXELMATH_KEY } : {}) }, body: JSON.stringify({ prompt }), signal: AbortSignal.timeout(10_000) })
        if (!upstream.ok) return send(res, 502, { error: `the image engine answered ${upstream.status}` })
        const body = await upstream.json()
        return send(res, 200, { mode: body.mode, entities: (body.entities ?? []).map((e) => ({ name: String(e.name) })), not_in_lexicon: body.not_in_lexicon ?? [] })
      } catch {
        return send(res, 503, { error: 'the image engine is not running (npm run images)' })
      }
    }
    // what the page decided about a picture (accepted or redrawn, and why): examples for learning which scenes work (npm run images:learn)
    if (req.method === 'POST' && url.pathname === '/api/image-feedback') {
      const entry = JSON.parse(await readBody(req))
      fs.mkdirSync(DATA, { recursive: true })
      const reasons = Array.isArray(entry.reasons) ? entry.reasons.slice(0, 5).map((r) => String(r).slice(0, 120)) : []
      fs.appendFileSync(path.join(DATA, 'image-feedback.jsonl'), `${JSON.stringify({ at: new Date().toISOString(), prompt: String(entry.prompt ?? '').slice(0, 200), seed: Number(entry.seed) || 0, attempt: Number(entry.attempt) || 1, accepted: entry.accepted === true, score: Number(entry.score) || 0, reasons, stage: ['parse', 'plan', 'rating'].includes(entry.stage) ? entry.stage : 'pixels' })}\n`)
      return send(res, 200, { ok: true })
    }
    if (req.method === 'POST' && url.pathname === '/api/feedback') {
      const entry = JSON.parse(await readBody(req))
      fs.mkdirSync(DATA, { recursive: true })
      fs.appendFileSync(path.join(DATA, 'feedback.jsonl'), `${JSON.stringify({ at: new Date().toISOString(), text: String(entry.text ?? '').slice(0, 600), ops: entry.ops ?? [], accepted: entry.accepted !== false, source: entry.source === 'server' ? 'server' : 'rules' })}\n`)
      return send(res, 200, { ok: true })
    }
    if (!url.pathname.startsWith('/api/') && serveStatic(req, res, url.pathname)) return
    send(res, 404, { error: 'not found' })
  } catch (error) {
    // a problem of ours is not described to the caller (file names, internals); a refusal with a status (too large, bad request) is
    const status = error?.status ?? 500
    if (status === 500) console.error('request failed:', error)
    send(res, status, { error: status === 500 ? 'internal error' : error instanceof Error ? error.message : 'failed' })
  }
})

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // the phrase events only grow: once a day the oldest ones beyond 20000 are dropped (older opinions count little anyway)
  const compact = () => {
    try {
      const file = path.join(DATA, 'phrase-events.jsonl')
      if (!fs.existsSync(file)) return
      const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
      if (lines.length <= 20000) return
      fs.writeFileSync(`${file}.tmp`, `${lines.slice(-20000).join('\n')}\n`)
      fs.renameSync(`${file}.tmp`, file)
    } catch {
      // try again tomorrow
    }
  }
  compact()
  setInterval(compact, 86_400_000).unref()
  // the lists of recent requests of callers that went quiet are dropped
  setInterval(() => {
    const now = Date.now()
    for (const map of [hits, imageHits]) for (const [key, list] of map) if (!list.some((t) => now - t < 60_000)) map.delete(key)
  }, 60_000).unref()
  // a rejection nobody caught is logged, not a reason to stop the server; a stop signal closes it cleanly
  process.on('unhandledRejection', (reason) => console.error('unhandled rejection:', reason))
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 3000).unref()
  })
  server.listen(PORT, HOST, () => console.log(`edit server on http://${HOST}:${PORT}  (no external AI or API: only your own engines)`))
}

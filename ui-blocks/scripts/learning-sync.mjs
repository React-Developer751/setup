// What the AI has learned (prompts, edits, thumbs, ratings, designs, phrases, image feedback) travels with git, so another computer starts with it.
//   node scripts/learning-sync.mjs export   server/data/*.jsonl  ->  server/seed/*.jsonl   (e-mails, phone numbers and browser ids are removed first)
//   node scripts/learning-sync.mjs import   server/seed/*.jsonl  ->  server/data/*.jsonl   (only lines that are not there yet are added; the server does this at start)
// Not copied: server/data/sites (published sites), photo-cache, anything that holds a person's contact details.
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const DATA = process.env.EDIT_DATA_DIR ?? path.join(here, '..', 'server', 'data')
const SEED = path.join(here, '..', 'server', 'seed')
const FILES = ['prompt-memory', 'edit-log', 'feedback', 'gen-ratings', 'designs', 'phrase-events', 'image-feedback']

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const PHONE = /(?:\+?\d{1,3}[ -]?)?(?:\d[ -]?){9,11}\d/g
const clean = (line) => {
  let row
  try { row = JSON.parse(line) } catch { return undefined }
  const walk = (v) => (typeof v === 'string' ? v.replace(EMAIL, 'you@example.com').replace(PHONE, (m) => (/^\d{4}-\d{2}-\d{2}/.test(m) ? m : '+91 98765 43210')) : Array.isArray(v) ? v.map(walk) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === 'user' && typeof x === 'string' ? `u${createHash('sha256').update(x).digest('hex').slice(0, 10)}` : walk(x)])) : v)
  return JSON.stringify(walk(row))
}
const lines = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean) : [])

const mode = process.argv[2]
if (mode === 'export') {
  fs.mkdirSync(SEED, { recursive: true })
  for (const name of FILES) {
    const out = [...new Set(lines(path.join(DATA, `${name}.jsonl`)).map(clean).filter(Boolean))]
    fs.writeFileSync(path.join(SEED, `${name}.jsonl`), out.length ? `${out.join('\n')}\n` : '')
    console.log(`${name}: ${out.length} rows`)
  }
} else if (mode === 'import') {
  fs.mkdirSync(DATA, { recursive: true })
  for (const name of FILES) {
    const seed = lines(path.join(SEED, `${name}.jsonl`))
    if (!seed.length) continue
    const target = path.join(DATA, `${name}.jsonl`)
    const have = new Set(lines(target).map((l) => { try { return JSON.stringify(JSON.parse(l)) } catch { return l } }))
    // rows of this computer are kept as they are; a seed row is added when this computer does not have the same one (compared after the same clean-up)
    const haveClean = new Set(lines(target).map(clean).filter(Boolean))
    const add = seed.filter((l) => !have.has(l) && !haveClean.has(l))
    if (add.length) fs.appendFileSync(target, `${add.join('\n')}\n`)
    console.log(`${name}: ${add.length} rows added`)
  }
} else {
  console.log('usage: node scripts/learning-sync.mjs export|import')
  process.exit(1)
}

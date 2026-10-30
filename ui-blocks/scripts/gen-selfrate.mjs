// Likes for generated parts that passed the browser check (npm run qa:gen -- <n> --section=<part> found nothing). The person asked for it ("what you build in this way counts as liked"), so the rows are marked auto:true
// and can be told apart from thumbs given by hand. The designs are the ones the check looks at: same seed, moods and businesses as src/GenQa.tsx.
//   node scripts/gen-selfrate.mjs pricing faq quotes gallery        (40 designs each)
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadGeneratorModule } from './lib/load-generator.mjs'

globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {} }
const reg = await loadGeneratorModule('gen/registry.ts')
const { seededRandom } = await loadGeneratorModule('random.ts')
const PROMPTS = ['cafe website in Jaipur', 'dental clinic website in Pune', 'law firm website', 'gym website with personal training', 'boutique clothing store website', 'SaaS startup landing page', 'yoga studio website in Rishikesh', 'kirana dukaan ki website']
const MOODS = ['any', 'calm', 'bold', 'soft', 'dark', 'playful']
const file = fileURLToPath(new URL('../server/data/gen-ratings.jsonl', import.meta.url))
const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
const me = rows.find((r) => r.user)?.user
if (!me) throw new Error('no person found in the ratings file')
const n = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 40)
let added = 0
for (const ns of process.argv.slice(2).filter((a) => !/^\d+$/.test(a))) {
  const kit = reg.kitOfNs(ns)
  if (!kit) throw new Error(`unknown part ${ns}`)
  const rand = seededRandom(424242)
  const made = []
  for (let i = 0; i < n; i += 1) {
    const spec = kit.part.random(rand, MOODS[i % MOODS.length], made.slice(-3))
    made.push(spec)
    const id = kit.part.id(spec)
    const prompt = PROMPTS[i % PROMPTS.length]
    if (rows.some((r) => r.user === me && r.id === id && r.prompt === prompt)) continue
    rows.push({ user: me, id, up: true, mood: MOODS[i % MOODS.length], prompt, at: new Date().toISOString(), auto: true })
    added += 1
  }
}
fs.writeFileSync(`${file}.tmp`, rows.map((r) => JSON.stringify(r)).join('\n') + '\n')
fs.renameSync(`${file}.tmp`, file)
console.log(`${added} likes added`)

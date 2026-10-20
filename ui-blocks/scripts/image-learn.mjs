// Learns from the decisions the page made about pictures (server/data/image-feedback.jsonl): a scene the engine draws badly again and again is
// written to src/data/imageBlocklist.json, and the scene plans leave it out from then on.
//   npm run images:learn                 (shows what it found and updates the blocklist)
//   node scripts/image-learn.mjs --no-write    only shows it;   --file=path   another feedback file
import fs from 'node:fs'

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const file = arg('file') ?? 'server/data/image-feedback.jsonl'
const write = !process.argv.includes('--no-write')
const blocklistFile = 'src/data/imageBlocklist.json'
const MIN_TRIES = 3
const MAX_ACCEPTANCE = 0.34

if (!fs.existsSync(file)) {
  console.log(`No decisions yet (${file} does not exist). Make some sites with the image engine running first.`)
  process.exit(0)
}
const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
const stats = new Map()
for (const row of rows) {
  if (row.stage === 'plan') continue
  const s = stats.get(row.prompt) ?? { tries: 0, accepted: 0, parse: 0, up: 0, down: 0, reasons: new Map() }
  if (row.stage === 'rating') {
    // a thumb of the person counts for much more than a check of the machine
    if (row.accepted) s.up += 1
    else s.down += 1
    stats.set(row.prompt, s)
    continue
  }
  if (row.stage === 'parse') s.parse += 1
  else {
    s.tries += 1
    if (row.accepted) s.accepted += 1
  }
  for (const r of row.reasons ?? []) s.reasons.set(r, (s.reasons.get(r) ?? 0) + 1)
  stats.set(row.prompt, s)
}
const bad = [...stats.entries()].filter(([, s]) => (s.tries >= MIN_TRIES && s.accepted / s.tries <= MAX_ACCEPTANCE) || s.parse >= 2 || (s.down >= 3 && s.down > s.up * 2))
const loved = [...stats.entries()].filter(([, s]) => s.up >= 2 && s.up > s.down).sort((a, b) => b[1].up - a[1].up).slice(0, 10)
console.log(`${rows.length} decisions about ${stats.size} scenes`)
for (const [prompt, s] of [...stats.entries()].sort((a, b) => a[1].accepted / Math.max(1, a[1].tries) - b[1].accepted / Math.max(1, b[1].tries)).slice(0, 12)) {
  const top = [...s.reasons.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  console.log(`  ${(s.tries ? Math.round((100 * s.accepted) / s.tries) : 0).toString().padStart(3)}% of ${String(s.tries).padStart(2)} tries   ${prompt}${top ? `   (${top})` : ''}`)
}
if (loved.length) {
  console.log('\nThumbs up most often:')
  for (const [prompt, s] of loved) console.log(`  + ${s.up} up / ${s.down} down   ${prompt}`)
}
if (!bad.length) console.log('\nNothing is drawn badly often enough to be left out.')
else {
  console.log(`\nTo leave out (${bad.length}):`)
  for (const [prompt] of bad) console.log(`  - ${prompt}`)
  if (write) {
    const current = JSON.parse(fs.readFileSync(blocklistFile, 'utf8'))
    const blocked = [...new Set([...(current.blocked ?? []), ...bad.map(([p]) => p)])].sort()
    fs.writeFileSync(blocklistFile, `${JSON.stringify({ ...current, blocked }, null, 2)}\n`)
    console.log(`written to ${blocklistFile}`)
  }
}

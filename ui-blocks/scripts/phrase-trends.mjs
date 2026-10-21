// The 24-hour look at the phrase events (server/data/phrase-events.jsonl): which texts fail with several different people, which ones win.
// It writes server/data/phrase-scores.json (the current scores) and prints the report. Run it by hand or from cron: npm run phrases:trends
import fs from 'node:fs'
import path from 'node:path'
import { loadGeneratorModule } from './lib/load-generator.mjs'

const { analyseTrends, foldPhraseScores } = await loadGeneratorModule('memory/phraseScores.ts')
const dir = process.env.EDIT_DATA_DIR ?? path.resolve('server/data')
const file = path.join(dir, 'phrase-events.jsonl')
const events = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)] } catch { return [] } }) : []
const report = analyseTrends(events)
console.log(`${report.events} events from ${report.sessions} sessions about ${report.phrases} phrases`)
console.log(report.failing.length ? 'Failing (demoted):' : 'No phrase is failing yet (a phrase needs 3 different people).')
for (const r of report.failing) console.log(`  ${r.score}  [${r.group} / ${r.slot}] "${r.phrase}"  (${r.down} down, ${r.up} up)`)
if (report.winners.length) console.log('Winners:')
for (const r of report.winners) console.log(`  ${r.score}  [${r.group} / ${r.slot}] "${r.phrase}"  (${r.up} up, ${r.down} down)`)
const scores = Object.fromEntries([...foldPhraseScores(events)].map(([k, v]) => [k, Math.round(v.score * 10) / 10]))
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(path.join(dir, 'phrase-scores.json'), JSON.stringify({ at: new Date().toISOString(), scores }, null, 1))

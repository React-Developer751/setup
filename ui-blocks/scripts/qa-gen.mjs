// Opens the check of the generated first screens (src/GenQa.tsx) in headless Chrome and prints what it found. The dev server must run (npm run app).
//   npm run qa:gen             200 generated heroes, each at phone and desktop width
//   npm run qa:gen -- 50       the first 50
// Exit code 1 when more than 5% of them have a finding.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const [howMany = '200'] = process.argv.slice(2).filter((a) => /^\d+$/.test(a))
const base = process.env.QA_URL ?? 'http://localhost:5173'
const port = 9340 + Math.floor(Math.random() * 50)
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-chrome-'))
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const finish = (code) => { chrome.kill(); try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 }) } catch { /* chrome still writes */ }; process.exit(code) }

let target
for (let i = 0; i < 40 && !target; i += 1) {
  await sleep(250)
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page') } catch { /* chrome is starting */ }
}
if (!target) { console.error('Chrome did not start'); finish(2) }
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
ws.onmessage = (m) => { const d = JSON.parse(m.data); pending.get(d.id)?.(d); pending.delete(d.id) }
const send = (method, params = {}) => new Promise((r) => { id += 1; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })) })
await send('Page.navigate', { url: `${base}/?genqa=1&n=${howMany}${process.argv.includes('--prices') ? '&section=prices' : process.argv.includes('--features') ? '&section=features' : process.argv.includes('--cta') ? '&section=cta' : (process.argv.find((a) => a.startsWith('--section='))?.replace('--section=', '&section=') ?? '')}` })
let result
for (let i = 0; i < 1800; i += 1) {
  await sleep(1000)
  const r = await send('Runtime.evaluate', { expression: 'JSON.stringify(window.__genqa ?? null)', returnByValue: true })
  const qa = JSON.parse(r.result?.result?.value ?? 'null')
  if (qa?.done) { result = qa; break }
  if (i % 30 === 29 && qa) process.stderr.write(`... ${qa.rows.length} sites\n`)
}
if (!result) { console.error('the check did not finish in 30 minutes'); finish(2) }
const count = {}
for (const row of result.rows) for (const p of row.problems) count[p.replace(/\(.*\)|x\d+/g, '').trim()] = (count[p.replace(/\(.*\)|x\d+/g, '').trim()] ?? 0) + 1
console.log(`${result.rows.length} sites, ${result.rows.filter((r) => r.problems.length).length} with a finding`)
console.log(Object.entries(count).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${String(v).padStart(3)}  ${k}`).join('\n'))
for (const row of result.rows.filter((r) => r.problems.length)) console.log(`- ${row.spec} [${row.prompt.slice(0, 22)}]: ${row.problems.join(', ')}`)
fs.writeFileSync('scripts/qa-gen-last.json', JSON.stringify(result))
finish(result.rows.filter((r) => r.problems.length).length / result.rows.length > 0.05 ? 1 : 0)

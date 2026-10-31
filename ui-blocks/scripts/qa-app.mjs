// The demo app (log in, register, dashboard) checked end to end in headless Chrome against the dev server (npm run app): for each case a site is built from a prompt and its export is used like a visitor would
// (see scripts/lib/app-e2e.js for the walk): one page and several pages, with the app asked for in the prompt, asked for later in the chat, taken out again, never asked for, refused ("without login");
// the one-file export and the static site; a desktop and a phone width.
//   npm run qa:app                      all cases (about 6 minutes)
//   node --experimental-websocket scripts/qa-app.mjs --quick     the first six (about a minute)
//   --ui                                the generator page itself (typing the prompt, the chat, the offer): 6 cases, about 8 minutes
//   --if-up   when the dev server or Chrome is not there, say so and exit 0 (this is how npm test runs it)
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const base = process.env.QA_URL ?? 'http://localhost:5173'
const quick = process.argv.includes('--quick')
const ui = process.argv.includes('--ui')
const ifUp = process.argv.includes('--if-up')
const skip = (why) => { console.log(`qa-app: skipped (${why})`); process.exit(0) }

if (ifUp) {
  if (!fs.existsSync(CHROME)) skip('Chrome is not installed')
  try { await fetch(base, { signal: AbortSignal.timeout(2000) }) } catch { skip('the dev server is not running: npm run app') }
}
const cases = JSON.parse(fs.readFileSync(path.join(here, ui ? 'qa-app-ui-cases.json' : 'qa-app-cases.json'), 'utf8')).filter((c) => ui || !quick || c.quick)
const port = 9400 + Math.floor(Math.random() * 50)
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-app-chrome-'))
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const finish = (code) => { chrome.kill(); try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 }) } catch { /* Chrome is still closing: the temporary folder stays */ } process.exit(code) }

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
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, timeout: 120000 })
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text)
  return r.result?.result?.value
}

await send('Page.navigate', { url: `${base}/` })
// (the page must be loaded and the React refresh hook of the dev server in place before the check script imports the generator: a cold dev server needs a few seconds)
for (let i = 0; i < 80; i += 1) {
  await sleep(500)
  try { if (await evaluate("document.readyState === 'complete' && typeof window.$RefreshReg$ === 'function' && !!document.querySelector('#root')?.children.length")) break } catch { /* loading */ }
}
await sleep(500)
const flag = ui ? '__uiReady' : '__e2eReady'
try { await evaluate(fs.readFileSync(path.join(here, 'lib', ui ? 'app-ui.js' : 'app-e2e.js'), 'utf8')) } catch (err) { console.error(`the check script could not start: ${err.message}`); finish(2) }
for (let i = 0; i < 40 && !(await evaluate(`window.${flag} === true`)); i += 1) await sleep(500)
if (!(await evaluate(`window.${flag} === true`))) { console.error('the check script did not start (is the dev server up to date?)'); finish(2) }

let failed = 0
let steps = 0
for (const c of cases) {
  let rep
  try { rep = JSON.parse(await evaluate(`window.${ui ? '__ui' : '__e2e'}(${JSON.stringify(c)}).then((r) => JSON.stringify(r))`)) } catch (err) { rep = { prompt: c.prompt, problems: [`the walk did not finish: ${err.message}`], notes: {} } }
  steps += 1
  const tag = ui ? `ui/${c.link ? 'login' : 'no login'}${c.offer ? '/offer' : ''}` : `${c.app}${c.pages ? `/${c.pages}` : ''}${c.via === 'static' ? '/static' : ''}${c.width ? `/${c.width}px` : ''}`
  if (rep.problems.length) {
    failed += 1
    console.log(`✗ [${tag}] ${c.prompt.slice(0, 70)}`)
    rep.problems.forEach((p) => console.log(`    - ${p}`))
  } else console.log(`✓ [${tag}] ${c.prompt.slice(0, 70)}${rep.notes.dashboard ? `  (${rep.notes.dashboard})` : ''}`)
}
console.log(`qa-app: ${steps - failed} of ${steps} sites walked through without a problem`)
finish(failed ? 1 : 0)

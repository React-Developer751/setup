// A published site sends a message from its contact form to the inbox of this server, in a real browser (headless Chrome): the page runs in a sandbox (CSP), so its origin is "null".
// It publishes a site with a contact form, opens it, fills the form, sends it and reads the inbox. The server must run (npm run app); the dev page must run for the generator modules.
//   node --experimental-websocket scripts/qa-leads.mjs
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const app = process.env.QA_URL ?? 'http://localhost:5173'
const api = process.env.QA_API ?? 'http://127.0.0.1:8787'
const port = 9400 + Math.floor(Math.random() * 90)
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-leads-'))
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const finish = (code) => { chrome.kill(); try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 }) } catch { /* chrome still writes */ } process.exit(code) }
let target
for (let i = 0; i < 40 && !target; i += 1) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page') } catch { /* starting */ } }
if (!target) { console.error('Chrome did not start'); finish(2) }
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
ws.onmessage = (m) => { const d = JSON.parse(m.data); pending.get(d.id)?.(d); pending.delete(d.id) }
const send = (method, params = {}) => new Promise((r) => { id += 1; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })) })
const evalIn = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value

// 1. a site with a contact form, made by the app's own modules (the dev page), is published
await send('Page.navigate', { url: `${app}/?gen=1&section=nav` })
await sleep(3000)
const published = await evalIn(`(async () => {
  const gen = await import('/src/generator/library/generateLibraryPage.ts')
  const ex = await import('/src/generator/exportLibrary.tsx')
  const lib = gen.generateLibraryPage('Sharma & Associates law firm in Delhi, family and property law', 5, 'better', true, 'auto', undefined, false)
  const html = ex.buildLibraryStandalone(lib)
  const r = await fetch('/api/publish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'qa leads', files: [{ path: 'index.html', text: html }] }) }).then((x) => x.json())
  return JSON.stringify({ id: r.id, secret: r.secret, user: localStorage.getItem('ui-blocks:user') })
})()`)
const site = JSON.parse(published ?? '{}')
if (!site.id) { console.error('could not publish'); finish(2) }
// 2. the published page is opened (served by the API server, in a sandbox) and its form is sent
await send('Page.navigate', { url: `${api}/s/${site.id}/` })
await sleep(2500)
const note = await evalIn(`(async () => {
  const form = document.querySelector('[data-role="contact"] form')
  if (!form) return 'no form'
  form.querySelector('input[name="name"]').value = 'Browser Visitor'
  form.querySelector('input[type="email"]').value = 'bv@example.com'
  form.querySelector('textarea').value = 'Sent from a published page in a real browser.'
  form.requestSubmit()
  await new Promise((r) => setTimeout(r, 2500))
  return form.querySelector('[data-lead-note]')?.textContent ?? 'no note'
})()`)
// 3. it is in the inbox of the one who published it
const row = await (await fetch(`${api}/api/leads`, { headers: { 'x-user': String(site.user ?? '') } })).json().catch(() => ({ leads: [] }))
const got = (row.leads ?? []).some((l) => l.site === site.id && l.fields.name === 'Browser Visitor')
await fetch(`${api}/api/unpublish`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: site.id, secret: site.secret }) }).catch(() => undefined)
console.log(`the page said: ${note}`)
console.log(got ? 'the message is in the inbox of the owner: ok' : 'the message is NOT in the inbox')
finish(got && /sent/i.test(String(note)) ? 0 : 1)

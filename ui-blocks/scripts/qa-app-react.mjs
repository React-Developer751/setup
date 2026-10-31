// The React project (.zip) export of a site with the demo app: built with Vite (scripts/test-project.mjs keeps the build), served, and used in headless Chrome like a visitor would:
// Log in link, register, every page of the dashboard, a row added and deleted, log out, the dashboard closed without a login.   npm run qa:app:react
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
if (!fs.existsSync(CHROME)) { console.log('qa-app-react: skipped (Chrome is not installed)'); process.exit(0) }
const keep = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-react-'))
const built = spawnSync(process.execPath, ['scripts/test-project.mjs'], { env: { ...process.env, KEEP_PROJECT: keep }, encoding: 'utf8', timeout: 600000 })
if (built.status !== 0) { console.log(built.stdout.slice(-600), built.stderr.slice(-300)); console.error('qa-app-react: the project did not build'); process.exit(1) }
const dir = path.join(keep, 'with-app')
const root = fs.readdirSync(dir).map((f) => path.join(dir, f)).find((f) => fs.existsSync(path.join(f, 'dist', 'index.html')))
if (!root) { console.error('qa-app-react: no built project with the app'); process.exit(1) }
const dist = path.join(root, 'dist')
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  const file = path.join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html')
  const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(dist, 'index.html')
  res.writeHead(200, { 'content-type': types[path.extname(target)] ?? 'application/octet-stream' })
  fs.createReadStream(target).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const url = `http://127.0.0.1:${server.address().port}/`
const port = 9450 + Math.floor(Math.random() * 40)
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-react-chrome-'))
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const finish = (code) => { chrome.kill(); server.close(); for (const dir of [profile, keep]) { try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch { /* Chrome is still closing: the temporary folder stays */ } } process.exit(code) }
let target
for (let i = 0; i < 40 && !target; i += 1) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page') } catch { /* starting */ } }
if (!target) { console.error('Chrome did not start'); finish(2) }
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
ws.onmessage = (m) => { const d = JSON.parse(m.data); pending.get(d.id)?.(d); pending.delete(d.id) }
const send = (method, params = {}) => new Promise((r) => { id += 1; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })) })
await send('Runtime.enable')
await send('Page.navigate', { url })
await sleep(3500)
const walk = `(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const problems = []; const bad = (m) => problems.push(m)
  window.confirm = () => true
  const link = document.querySelector('a[data-ap-link]'); if (!link) bad('no Log in link')
  location.hash = '#/app'; await sleep(300); if (location.hash !== '#/login') bad('the dashboard opened without a login')
  location.hash = '#/register'; await sleep(400)
  const set = (n, v) => { const el = document.querySelector('.ap [name="' + n + '"]'); if (!el) throw new Error('no register form'); el.value = v }
  set('name', 'Owner'); set('email', 'o@example.com'); set('password', 'secret12'); set('again', 'secret12')
  document.querySelector('.ap form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); await sleep(700)
  if (location.hash !== '#/app') bad('register did not open the dashboard: ' + location.hash)
  const nav = [...document.querySelectorAll('.ap-nav a')].map((a) => [a.getAttribute('href'), a.textContent])
  for (const [href, label] of nav) {
    location.hash = href; await sleep(200)
    if (/undefined|NaN/.test(document.querySelector('.ap').innerText)) bad(label + ': undefined/NaN on screen')
    if (/#\\/app$|insights|settings/.test(href)) continue
    const rows = document.querySelectorAll('.ap tbody tr').length; if (rows < 3) bad(label + ': fewer than 3 rows')
    document.querySelector('.ap [data-add]').click(); await sleep(100)
    const m = document.querySelector('.ap-modal'); const inputs = [...m.querySelectorAll('input,select')]
    inputs.forEach((el, i) => { if (el.tagName === 'SELECT') return; el.value = el.type === 'date' ? '2026-03-12' : /email/.test(el.name) ? 'x@example.com' : i === 0 ? 'React Row' : '7' })
    m.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); await sleep(150)
    if (document.querySelectorAll('.ap tbody tr').length !== rows + 1) bad(label + ': the row was not added')
    document.querySelector('.ap [data-del]').click(); await sleep(150)
    if (document.querySelectorAll('.ap tbody tr').length !== rows) bad(label + ': the row was not deleted')
  }
  document.querySelector('.ap [data-logout]')?.click(); await sleep(300); if (location.hash !== '#/login') bad('logout did not go to the login page')
  location.hash = '#/app'; await sleep(300); if (location.hash !== '#/login') bad('the dashboard opened after logout')
  return JSON.stringify({ problems, pages: nav.map((n) => n[1]).join(', ') })
})()`
const r = await send('Runtime.evaluate', { expression: walk, awaitPromise: true, returnByValue: true })
const out = r.result?.exceptionDetails ? { problems: ['the walk crashed: ' + (r.result.exceptionDetails.exception?.description ?? '')], pages: '' } : JSON.parse(r.result.result.value)
if (out.problems.length) { console.log('✗ React project with the app'); out.problems.forEach((p) => console.log(`    - ${p}`)); finish(1) }
console.log(`✓ React project with the app, built by Vite: log in, register, ${out.pages}, add and delete rows, log out`)
console.log('qa-app-react: 1 of 1 projects walked through without a problem')
finish(0)

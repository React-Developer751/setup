// The contact forms of the sites made here: a visitor's message is kept for the owner of the site (published or a draft in the app), nobody else reads it, the route answers any origin
// (a published site runs in a sandbox whose origin is "null") but only accepts small, rate limited messages for a known site.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

let pass = 0
const fail = []
const ok = (c, m) => (c ? pass++ : fail.push(m))
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'leads-'))
const PORT = 9500 + Math.floor(Math.random() * 90)
const A = 'a1'.repeat(16)
const B = 'b2'.repeat(16)
const base = `http://127.0.0.1:${PORT}`
const srv = spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(PORT), EDIT_DATA_DIR: dir }, stdio: 'ignore' })
const up = async () => { for (let i = 0; i < 50; i += 1) { try { await fetch(`${base}/api/health`); return } catch { await new Promise((r) => setTimeout(r, 100)) } } }
const lead = (site, body, extra = '', origin = 'null') => fetch(`${base}/api/lead?site=${site}${extra}`, { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: typeof body === 'string' ? body : JSON.stringify(body) })
try {
  await up()
  // the preflight of a page with an opaque origin
  const pre = await fetch(`${base}/api/lead?site=draft`, { method: 'OPTIONS', headers: { origin: 'null', 'access-control-request-method': 'POST' } })
  ok(pre.status === 204 && pre.headers.get('access-control-allow-origin') === '*', 'a page of a sandboxed site may ask (preflight)')
  // a draft in the app: the message belongs to the person whose id is in the address
  const r1 = await lead('draft', { name: 'Ravi', message: 'Need a quote' }, `&u=${A}`)
  ok(r1.status === 200 && r1.headers.get('access-control-allow-origin') === '*', 'a message from a draft is kept')
  const mine = await (await fetch(`${base}/api/leads`, { headers: { 'x-user': A } })).json()
  ok(mine.leads.length === 1 && mine.leads[0].fields.name === 'Ravi' && !('owner' in mine.leads[0]), 'the owner reads it (without the owner id)')
  ok((await (await fetch(`${base}/api/leads`, { headers: { 'x-user': B } })).json()).leads.length === 0, 'another person does not')
  ok((await fetch(`${base}/api/leads`)).status === 400, 'reading needs the id of a person')
  // what is refused
  ok((await lead('draft', { name: '' }, `&u=${A}`)).status === 400, 'an empty message is refused')
  ok((await lead('draft', '[1,2]', `&u=${A}`)).status === 400, 'a list is not a message')
  ok((await lead('draft', 'not json', `&u=${A}`)).status === 400, 'text that is not JSON is refused')
  ok((await lead('..%2f', { a: 'b' })).status === 400 && (await lead('abcdef123456', { a: 'b' })).status === 404, 'a site that does not exist gets nothing')
  ok((await lead('draft', { a: 'x'.repeat(30_000) }, `&u=${A}`)).status === 413 || (await lead('draft', { a: 'x'.repeat(30_000) }, `&u=${A}`)).status === 400, 'a big message is refused')
  // long values are cut, odd keys cleaned
  await lead('draft', { 'na<me>': 'x'.repeat(5000), msg: 'ok\u0000' }, `&u=${A}`)
  const cut = (await (await fetch(`${base}/api/leads`, { headers: { 'x-user': A } })).json()).leads[0]
  ok(Object.values(cut.fields).every((v) => v.length <= 3000) && !Object.keys(cut.fields).some((k) => /[<>]/.test(k)) && cut.fields.msg === 'ok', 'values are cut to size and keys cleaned')
  // a published site: the owner is the one who published it
  const pub = await (await fetch(`${base}/api/publish`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-user': B }, body: JSON.stringify({ name: 'T', files: [{ path: 'index.html', text: '<html><body>hi</body></html>' }] }) })).json()
  ok(/^[a-z0-9]{8,16}$/.test(pub.id ?? ''), 'a site is published')
  ok((await lead(pub.id, { name: 'Asha', message: 'Hello' })).status === 200, 'a message to a published site is kept')
  const theirs = await (await fetch(`${base}/api/leads`, { headers: { 'x-user': B } })).json()
  ok(theirs.leads.some((l) => l.site === pub.id && l.fields.name === 'Asha') && !(await (await fetch(`${base}/api/leads`, { headers: { 'x-user': A } })).json()).leads.some((l) => l.site === pub.id), 'only the one who published it reads it')
  // the rate limit (30 an hour for one address and site)
  let limited = false
  for (let i = 0; i < 40 && !limited; i += 1) limited = (await lead(pub.id, { n: `m${i}` })).status === 429
  ok(limited, 'too many messages from one address are refused')
} finally {
  srv.kill()
  fs.rmSync(dir, { recursive: true, force: true })
}
console.log(`leads: ${pass} checks passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

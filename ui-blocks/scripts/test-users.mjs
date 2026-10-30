// Per-person data and the things kept on the server: prompts, edits and projects belong to one browser id; designs of others only teach colours; the training export is for the operator;
// projects keep versions; a published site is served in a sandbox and only its owner can change it.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

let pass = 0
const fail = []
const ok = (c, m) => (c ? pass++ : fail.push(m))
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'users-'))
const PORT = 9400 + Math.floor(Math.random() * 90)
const A = 'a1'.repeat(16)
const B = 'b2'.repeat(16)
const start = (env = {}) => spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(PORT), EDIT_DATA_DIR: dir, ...env }, stdio: 'ignore' })
const up = async () => { for (let i = 0; i < 50; i += 1) { try { await fetch(`http://127.0.0.1:${PORT}/api/health`); return } catch { await new Promise((r) => setTimeout(r, 100)) } } }
const call = (user, p, body) => fetch(`http://127.0.0.1:${PORT}${p}`, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json', ...(user ? { 'x-user': user } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }).then(async (r) => ({ status: r.status, ...(await r.json().catch(() => ({}))) }))
let srv = start()
try {
  await up()
  // prompt memory
  ok((await call(A, '/api/prompt-memory', { id: 'r1', prompt: 'my secret cafe', theme: 'food_dining', edits: [] })).ok, 'A stores a prompt')
  ok((await call(null, '/api/prompt-memory', { id: 'r2', prompt: 'no id', edits: [] })).status === 400, 'a write with no id of a person is refused')
  ok((await call(A, '/api/prompt-memory')).rows.length === 1 && (await call(B, '/api/prompt-memory')).rows.length === 0 && (await call(null, '/api/prompt-memory')).rows.length === 0, 'B (and nobody) cannot read the prompts of A')
  ok((await call(B, '/api/prompt-memory', { id: 'r1', prompt: 'taken over', edits: [] })).status === 403, 'B cannot overwrite the row of A')
  ok((await call(A, '/api/prompt-memory/export')).status === 200, 'the operator (this computer) can export for training')
  // edit log
  const row = { id: 'e1', key: 'cafe', text: 'make it green', norm: 'make green', context: 'single', ops: ['x'], via: 'rules' }
  await call(A, '/api/edit-log', row)
  ok((await call(A, '/api/edit-log')).rows.length === 1 && (await call(B, '/api/edit-log')).rows.length === 0, 'the commands of A are not read by B')
  ok((await call(B, '/api/edit-log/undo', { id: 'e1' })).status === 404, 'B cannot mark the command of A as undone')
  // designs: others only as colours
  await call(A, '/api/designs', { id: 'd1', key: 'cafe', group: 'g', prompt: 'my secret cafe', heroTitle: 'Secret headline', theme: 'food_dining', accent: '#7a4527', alt: '#c98a4b', hue: 20, sat: 50, light: 40 })
  const seenByB = (await call(B, '/api/designs?key=cafe')).designs
  ok(seenByB.length === 1 && seenByB[0].accent === '#7a4527' && !seenByB[0].prompt && !seenByB[0].heroTitle, 'B learns the colour of A but sees no prompt and no headline')
  ok((await call(A, '/api/designs?key=cafe')).designs[0].prompt === 'my secret cafe', 'A sees their own design in full')
  ok((await call(B, '/api/designs/verdict', { id: 'd1', verdict: 'bad' })).status === 403, 'B cannot rate the design of A')
  // projects
  const project = (n) => ({ v: 1, name: 'Glow', savedAt: `2026-01-0${n}`, prompt: 'salon website', variation: n, history: [] })
  ok((await call(A, '/api/projects/save', { name: 'Glow', project: project(1) })).versions === 1, 'a project is saved')
  await new Promise((r) => setTimeout(r, 5))
  ok((await call(A, '/api/projects/save', { name: 'Glow', project: project(1) })).changed === false, 'the same project saved again is not a new version')
  await new Promise((r) => setTimeout(r, 5))
  ok((await call(A, '/api/projects/save', { name: 'Glow', project: project(2) })).versions === 2, 'a changed project is a new version')
  const versions = (await call(A, '/api/projects/versions?name=Glow')).versions
  ok(versions.length === 2, 'both versions are listed')
  ok((await call(A, `/api/projects/version?name=Glow&id=${versions[1].id}`)).project.variation === 1 && (await call(A, '/api/projects/version?name=Glow')).project.variation === 2, 'an older version opens again, and latest is the newest')
  ok((await call(B, '/api/projects')).projects.length === 0 && (await call(B, '/api/projects/version?name=Glow')).status === 404, 'B cannot see the projects of A')
  ok((await call(null, '/api/projects')).status === 400, 'projects need the id of a person')
  for (let i = 3; i < 40; i += 1) { await new Promise((r) => setTimeout(r, 3)); await call(A, '/api/projects/save', { name: 'Glow', project: project(i) }) }
  ok((await call(A, '/api/projects/versions?name=Glow')).versions.length === 30, 'the last 30 versions stay')
  ok((await call(A, '/api/projects/save', { name: '../../x', project: project(1) })).ok && !fs.existsSync(path.join(dir, 'x')), 'a project name cannot leave its folder')
  await call(A, '/api/projects/delete', { name: 'Glow' })
  ok((await call(A, '/api/projects')).projects.every((p) => p.slug !== 'glow'), 'a project can be deleted')
  // publish
  const pub = await call(A, '/api/publish', { name: 'Glow', files: [{ path: 'index.html', text: '<h1>hi</h1>' }, { path: 'assets/site.js', text: 'x' }] })
  ok(pub.ok && pub.url.includes('/s/'), 'a site is published')
  const site = await fetch(`http://127.0.0.1:${PORT}/s/${pub.id}/`)
  ok(site.status === 200 && /sandbox/.test(site.headers.get('content-security-policy') ?? '') && (await site.text()).includes('<h1>hi</h1>'), 'the site is served in a sandbox')
  const big = await call(A, '/api/publish', { name: 'Big', files: [{ path: 'index.html', text: '<p>' + 'hello '.repeat(800) + '</p>' }] })
  const zipped = await fetch(`http://127.0.0.1:${PORT}/s/${big.id}/`, { headers: { 'accept-encoding': 'gzip' } })
  ok(zipped.headers.get('content-encoding') === 'gzip' && (await zipped.text()).includes('hello hello'), 'text files of a published site travel compressed')
  ok((await fetch(`http://127.0.0.1:${PORT}/s/${pub.id}/.meta.json`)).status === 404, 'the secret file of a site is not served')
  ok((await call(B, '/api/publish', { id: pub.id, secret: 'wrong', name: 'x', files: [{ path: 'index.html', text: 'x' }] })).status === 403, 'a site cannot be overwritten without its secret')
  ok((await call(A, '/api/publish', { name: 'x', files: [{ path: '../x.html', text: 'x' }, { path: 'index.html', text: 'x' }] })).status === 400 && (await call(A, '/api/publish', { name: 'x', files: [{ path: 'index.html', text: 'x' }, { path: 'a.php', text: 'x' }] })).status === 400, 'paths that leave the folder and file types that run on a server are refused')
  ok((await call(A, '/api/publish', { id: pub.id, secret: pub.secret, name: 'Glow', files: [{ path: 'index.html', text: '<h1>v2</h1>' }] })).url === pub.url && (await (await fetch(`http://127.0.0.1:${PORT}/s/${pub.id}/`)).text()).includes('v2'), 'the owner updates the same address')
  ok((await call(A, '/api/unpublish', { id: pub.id, secret: pub.secret })).ok && (await fetch(`http://127.0.0.1:${PORT}/s/${pub.id}/`)).status === 404, 'the owner takes it down')
  // a public server (behind a proxy, no admin token): the training export is closed
  srv.kill()
  await new Promise((r) => setTimeout(r, 300))
  srv = start({ TRUST_PROXY: '1' })
  await up()
  ok((await call(A, '/api/prompt-memory/export')).status === 403 && (await call(A, '/api/prompt-memory/keywords')).status === 403, 'on a public server the export is closed without the admin token')
  srv.kill()
  await new Promise((r) => setTimeout(r, 300))
  srv = start({ TRUST_PROXY: '1', EDIT_ADMIN_TOKEN: 'secret-admin' })
  await up()
  const withToken = await fetch(`http://127.0.0.1:${PORT}/api/prompt-memory/export`, { headers: { 'x-admin-token': 'secret-admin', 'x-user': A } })
  ok(withToken.status === 200, 'with the admin token the operator can export')
  srv.kill()
  await new Promise((r) => setTimeout(r, 300))
  srv = start({ EDIT_SHARED_LEARNING: '0' })
  await up()
  ok((await call(B, '/api/designs?key=cafe')).designs.length === 0, 'with shared learning off, B sees nothing of A')
  // backups: the data is packed, the oldest packs go
  const { backupData } = await import('../server/backup.mjs')
  const out = path.join(dir, '_backups')
  const first = backupData(dir, out, 2)
  ok(first.ok && first.bytes > 100, 'the data is backed up')
  await new Promise((r) => setTimeout(r, 1100))
  backupData(dir, out, 2)
  await new Promise((r) => setTimeout(r, 1100))
  backupData(dir, out, 2)
  ok(fs.readdirSync(out).length === 2, 'only the newest backups are kept')
  ok(!backupData(path.join(dir, 'nothing-here'), out, 2).ok, 'no data folder: no backup, no crash')
} finally {
  srv.kill()
  fs.rmSync(dir, { recursive: true, force: true })
}
console.log(`${pass} passed, ${fail.length} failed`)
for (const f of fail.slice(0, 15)) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

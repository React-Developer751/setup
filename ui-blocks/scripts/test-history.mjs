// The edit history and the shared picture ratings: pure analysis, then the real server database.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const H = await loadGeneratorModule('memory/editHistory.ts')
const R = await loadGeneratorModule('edit/imageRatings.ts')

// ── commands that are the same command
ok(H.normaliseCommand('Make it BLUE, please!') === H.normaliseCommand('blue make'.split(' ').reverse().join(' ')) || H.normaliseCommand('Make it BLUE, please!') === 'make blue', 'filler words and punctuation do not make a new command')
ok(H.normaliseCommand('button ko center kar do') === 'button ko center', 'Hinglish filler is dropped')

// ── undo is a negative signal
const mk = (text, undone) => ({ ...H.logRow(text, 'yoga studio', 'single', ['accent #123456'], 'rules'), undone })
const rows = [mk('make the heading bigger', true), mk('Make the heading bigger!', true), mk('make heading bigger please', false), mk('menu left', false)]
const st = H.undoStats(rows, 'make the heading bigger')
ok(st.tries === 3 && st.undone === 2, `3 tries, 2 undone (${st.tries}/${st.undone})`)
ok(H.isDoubtful(st), 'undone twice in most cases = doubtful')
ok(!H.isDoubtful(H.undoStats(rows, 'menu left')), 'a command never undone is not doubtful')
ok(!H.isDoubtful(H.undoStats([mk('x y', true), mk('x y', false), mk('x y', false)], 'x y')), 'one undo among many is not doubtful')
ok(/2 of 3/.test(H.doubtQuestion(st, ['heading bigger'], [['other reading']])) && /other reading/.test(H.doubtQuestion(st, ['heading bigger'], [['other reading']])), 'the question says how often and offers the earlier reading')

// ── ratings: events -> store, and the old browser memory moving up
const ev = [
  { key: 'yoga studio', prompt: 'a calm yoga room', seed: 5, liked: true },
  { key: 'yoga studio', prompt: 'a busy street', seed: 9, liked: false },
  { key: 'cafe', prompt: 'a calm yoga room', seed: 5, liked: false },
]
const folded = R.foldRatings(ev)
ok(folded.liked['yoga studio']?.[0]?.seed === 5 && folded.disliked['yoga studio']?.[0] === 'a busy street', 'thumbs fold into liked and disliked')
ok(folded.votes['a calm yoga room'].up === 1 && folded.votes['a calm yoga room'].down === 1, 'votes count over all businesses')
const local = R.rate(R.emptyRatings(), 'bakery', { prompt: 'fresh bread', seed: 3 }, true)
const miss = R.missingEvents(local, folded)
ok(miss.length === 1 && miss[0].prompt === 'fresh bread' && miss[0].liked, 'a thumb only the browser knows is sent to the database')
ok(R.missingEvents(folded, folded).length === 0, 'nothing is sent twice')

// ── the server database
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hist-'))
const PORT = 9300 + Math.floor(Math.random() * 90)
const srv = spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(PORT), EDIT_DATA_DIR: dir }, stdio: 'ignore' })
for (let i = 0; i < 40; i += 1) { try { await fetch(`http://127.0.0.1:${PORT}/api/health`); break } catch { await new Promise((r) => setTimeout(r, 100)) } }
const USER = 'a'.repeat(32)
const call = (p, body) => fetch(`http://127.0.0.1:${PORT}${p}`, body ? { method: 'POST', headers: { 'content-type': 'application/json', 'x-user': USER }, body: JSON.stringify(body) } : { headers: { 'x-user': USER } }).then(async (r) => ({ status: r.status, ...(await r.json()) }))
try {
  const a = H.logRow('menu left', 'yoga', 'single', ['align'], 'rules')
  ok((await call('/api/edit-log', a)).ok, 'a command is stored')
  ok((await call('/api/edit-log', H.logRow('x'.repeat(900), 'yoga', 'single', ['a'], 'rules'))).ok, 'a long command is cut, not refused')
  ok((await call('/api/edit-log/undo', { id: a.id })).ok, 'an undo is stored')
  ok((await call('/api/edit-log/undo', { id: 'nope' })).status === 404, 'an unknown command cannot be undone')
  const listed = (await call('/api/edit-log?key=yoga')).rows
  ok(listed.length === 2 && listed.find((r) => r.id === a.id).undone === true, 'the history comes back with the undo flag')
  ok(listed.every((r) => r.text.length <= 300), 'texts are cut to 300 letters')
  ok((await call('/api/image-ratings', { key: 'yoga', prompt: 'a calm room', seed: 4, liked: true })).ok, 'a thumb is stored')
  ok((await call('/api/image-ratings', { key: '', prompt: 'a', liked: true })).status === 400, 'a bad thumb is refused')
  ok((await call('/api/image-ratings', { key: 'yoga', prompt: 'a calm room', seed: 4, liked: 'yes' })).status === 400, 'liked must be true or false')
  await call('/api/image-ratings', { key: 'yoga', prompt: 'a busy street', seed: 1, liked: false })
  const back = R.foldRatings((await call('/api/image-ratings')).events)
  ok(back.liked.yoga[0].prompt === 'a calm room' && back.disliked.yoga[0] === 'a busy street', 'another browser reads the same thumbs')
  srv.kill()
  await new Promise((r) => setTimeout(r, 300))
  const srv2 = spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(PORT), EDIT_DATA_DIR: dir }, stdio: 'ignore' })
  for (let i = 0; i < 40; i += 1) { try { await fetch(`http://127.0.0.1:${PORT}/api/health`); break } catch { await new Promise((r) => setTimeout(r, 100)) } }
  ok((await call('/api/edit-log?key=yoga')).rows.length === 2 && (await call('/api/image-ratings')).events.length === 2, 'everything is still there after a restart')
  srv2.kill()
} finally {
  srv.kill()
  fs.rmSync(dir, { recursive: true, force: true })
}

console.log(`history: ${pass} checks passed, ${fail.length} failed`)
if (fail.length) {
  console.log(fail.map((f) => ` - ${f}`).join('\n'))
  process.exit(1)
}

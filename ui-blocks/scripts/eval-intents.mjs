// How well do the edit rules recognise the kind of request? Uses the labelled intent examples (never used to write the rules).
import fs from 'node:fs'
import { loadGeneratorModule } from './lib/load-generator.mjs'

const { parseEdit } = await loadGeneratorModule('edit/understand.ts')
const file = process.argv[2] ?? 'src/data/training/edit-intents.test.jsonl'
const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
const OPS = { rename: ['rename'], recolor: ['accent', 'tone'], mode: ['mode'], remove: ['remove', 'removePage'], add: ['add', 'addPage'], set_text: ['text'], replace_text: ['replace'], contact: ['contact'], tier: ['tier'], motion: ['motion'], change_business: ['theme'], rename_section: ['title', 'navLabel'], move_section: ['move', 'movePage'], resize: ['size', 'resetLayout'], align: ['align'] }
const kindOf = (got) => (got.kind === 'control' ? got.control : got.kind === 'newSite' ? 'new_site' : got.kind === 'ops' && got.ops.length ? 'ops' : 'other')
let ok = 0
const per = {}
const misses = []
for (const row of rows) {
  const got = parseEdit(row.text, 'multi')
  const kind = kindOf(got)
  const pass = row.label === kind || (kind === 'ops' && (OPS[row.label] ?? []).includes(got.ops[0].op) && got.ops.every((o) => OPS[row.label].includes(o.op)))
  per[row.label] ??= { ok: 0, n: 0 }
  per[row.label].n += 1
  if (pass) { ok += 1; per[row.label].ok += 1 } else misses.push(`${row.label.padEnd(15)} ${row.text}  =>  ${kind === 'ops' ? got.ops.map((o) => o.op).join('+') : kind}`)
}
console.log(`${ok}/${rows.length} = ${((100 * ok) / rows.length).toFixed(1)}%`)
for (const [label, v] of Object.entries(per)) console.log(`  ${label.padEnd(16)} ${v.ok}/${v.n}`)
console.log(misses.slice(0, Number(process.argv[3] ?? 60)).join('\n'))

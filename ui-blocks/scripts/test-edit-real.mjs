// Edits of a site that is already made: what real people type (three sets of requests, checked by the RESULT on the site) and the rules that keep an edit from doing more than was asked.
import { spawnSync } from 'node:child_process'
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, m) => (c ? pass++ : fail.push(m))
globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }

// the three sets (their own scripts print "n/m = p% ...")
for (const [file, min] of [['eval-edit-real.mjs', 95], ['eval-edit-heldout.mjs', 93], ['eval-edit-blind3.mjs', 88]]) {
  const out = spawnSync(process.execPath, [`scripts/${file}`], { encoding: 'utf8' }).stdout
  const pct = Number(out.match(/= (\d+)%/)?.[1] ?? 0)
  ok(pct >= min, `${file}: ${pct}% of the requests do what was meant (at least ${min}%)\n${out.split('\n').slice(1, 6).join('\n')}`)
}

// an item is not a whole part
const { parseEdit } = await loadGeneratorModule('edit/understand.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { editsFrom } = await loadGeneratorModule('edit/edits.ts')
const base = generateLibraryPage('Meri bakery ke liye website banao, Jaipur me, eggless cakes. gallery aur faq ke saath', 7, undefined, true, 'auto', undefined, true)
const parse = (t) => parseEdit(t, 'multi', { pages: true, library: true, page: base.content })
const opsOf = (t) => { const p = parse(t); return p.kind === 'ops' ? p.ops : [] }
const kinds = (t) => opsOf(t).map((o) => o.op).join(',')
ok(kinds('cookies wali service hata do') === 'item' && !opsOf('cookies wali service hata do').some((o) => o.op === 'remove'), '"cookies wali service hata do" removes one service, not the whole services part')
ok(kinds('remove the FAQ') === 'removePage,remove' || kinds('remove the FAQ') === 'remove', '"remove the FAQ" still removes the part')
ok(opsOf('pehla sawal hata do faq se').some((o) => o.op === 'item' && o.list === 'faq' && o.action === 'remove' && o.index === 1), '"pehla sawal hata do" removes the first question (typo fixer leaves "pehla" alone)')
ok(opsOf('FAQ bhi daalo').some((o) => o.op === 'add' && o.section === 'faq') && !opsOf('FAQ bhi daalo').some((o) => o.op === 'item'), '"FAQ bhi daalo" adds the part, not a question called "bhi daalo?"')
ok(!opsOf('phone number 9876543210 kar do').some((o) => o.op === 'item') && opsOf('phone number 9876543210 kar do').some((o) => o.op === 'contact'), 'a phone number is not a statistic')
ok(opsOf('we are a wedding planner').every((o) => o.op !== 'item'), '"planner" is not a plan')
ok(opsOf('reviews ko about se pehle lagao').some((o) => o.op === 'move') && !opsOf('reviews ko about se pehle lagao').some((o) => o.op === 'item'), 'moving a part is not adding a review')
const named = parse('zebra wali service hata do')
ok(named.kind === 'ops' && named.ops.length === 0 && /could not find/i.test(named.notes[0] ?? ''), 'an item that is not on the page is said, not silently ignored')
const tooFar = parse('10th service hata do')
ok(tooFar.kind === 'ops' && tooFar.ops.length === 0 && /could not find/i.test(tooFar.notes[0] ?? ''), 'a number beyond the list is said')
ok(parse('contact section hata do').kind === 'ops' && opsOf('contact section hata do').some((o) => o.op === 'remove' && o.section === 'contact') && /footer/i.test(parse('contact section hata do').notes.join(' ')), 'the contact part can be removed (and the person is told what is left)')
ok(parseEdit('yeh design kuch alag chahiye', 'multi').kind === 'control', '"another design" is a command of its own')
// the items are applied
const apply = (t) => generateLibraryPage('Meri bakery ke liye website banao, Jaipur me, eggless cakes. gallery aur faq ke saath', 7, undefined, true, 'auto', editsFrom(opsOf(t)), true).content
const before = base.content
ok(apply('2nd service ko "Sound Cakes" naam do').features.items[1].title === 'Sound Cakes' && apply('2nd service ko "Sound Cakes" naam do').features.items.length === before.features.items.length, 'the second service gets the new name, nothing else changes')
ok(apply('last service hata do').features.items.length === before.features.items.length - 1, 'the last service is removed')
const q = apply('add faq: Do you ship? answer: Yes, all India')
ok(q.faq.length === before.faq.length + 1 && q.faq[0].q === 'Do you ship?' && q.faq[0].a === 'Yes, all India' && q.faq[0].own === true, 'a new question comes first (the parts show only the first few), with its answer, and is the person\'s own')
const t = apply('add testimonial: Lovely cake! - Meera')
ok(t.testimonials.some((x) => x.author === 'Meera' && x.quote === 'Lovely cake!') && !t.testimonials.some((x) => /sample/i.test(x.author)), 'a review is added and the sample reviews of the pack go')
console.log(`edit-real: ${pass} checks passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

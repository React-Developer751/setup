// The Code tab: the words a person changes in the page file become the operations of the chat; what cannot be followed is named, a broken file is explained.
import { loadGeneratorModule } from './lib/load-generator.mjs'
globalThis.document = { styleSheets: [] }

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { opsFromEditedCode, contentLiteral, codeWithoutContent } = await loadGeneratorModule('edit/codeSync.ts')

const lib = generateLibraryPage('dental clinic Smile Care in Pune, braces, implants, root canal', 0, 'better')
const lit = contentLiteral(lib.code)
ok(lit && lit.value.brandName === lib.content.brandName, 'the content of the page is found in its code')
const swap = (code, edit) => {
  const found = contentLiteral(code)
  const value = structuredClone(found.value)
  edit(value)
  return `${code.slice(0, found.start)}${JSON.stringify(value, null, 2)}${code.slice(found.end)}`
}

// no change, no operation
const none = opsFromEditedCode(lib.code, lib.content)
ok(none.ops.length === 0 && none.applied.length === 0 && none.unsupported.length === 0, 'an unchanged file changes nothing')

// a word of the first screen: one core operation that carries every block (the others must not go back to the generator's words)
const hero = opsFromEditedCode(swap(lib.code, (c) => (c.hero.title = 'Healthy Smiles For The Whole Family')), lib.content)
const core = hero.ops.find((o) => o.op === 'core')?.data
ok(core?.hero?.title === 'Healthy Smiles For The Whole Family' && hero.applied.join() === 'the first screen', 'a changed headline is applied')
ok(core?.features?.items?.length === lib.content.features.items.length && core.faq?.length === lib.content.faq.length && core.steps?.items?.length === lib.content.steps.items.length, 'the other blocks are carried along unchanged')
ok(core?.features?.items?.[0]?.title === lib.content.features.items[0].title, 'a service is not changed by a change of the headline')

// a service, the name, the phone
const more = opsFromEditedCode(swap(lib.code, (c) => { c.features.items[0].title = 'Teeth Whitening'; c.brandName = 'Bright Smile'; c.contact.phone = '98765 43210' }), lib.content)
ok(more.ops.some((o) => o.op === 'rename' && o.name === 'Bright Smile'), 'a changed name is a rename')
ok(more.ops.some((o) => o.op === 'contact' && o.field === 'phone' && o.value === '98765 43210'), 'a changed phone is a contact change')
ok(more.ops.find((o) => o.op === 'core')?.data.features.items[0].title === 'Teeth Whitening', 'a changed service title is applied')

// what the preview cannot follow is named, and nothing is made up
const gallery = opsFromEditedCode(swap(lib.code, (c) => (c.gallery.captions = ['A', 'B'])), lib.content)
ok(gallery.ops.length === 0 && gallery.unsupported.includes('gallery'), 'a changed gallery is named as not followed')

// a broken file is explained, not applied
const broken = opsFromEditedCode(lib.code.replace('const content = {', 'const content = {,'), lib.content)
ok(!!broken.problem && broken.ops.length === 0, 'a file with broken content says so')
// text sent into the page is cleaned
const dirty = opsFromEditedCode(swap(lib.code, (c) => (c.hero.title = '  Hello\u0007 there  ')), lib.content)
ok(dirty.ops.find((o) => o.op === 'core')?.data.hero.title === 'Hello there', 'control characters are cleaned')
// the rest of the file (imports, sections) is told apart from the words
ok(codeWithoutContent(swap(lib.code, (c) => (c.hero.title = 'X'))) === codeWithoutContent(lib.code), 'a change of words leaves the rest of the file as it is')
ok(codeWithoutContent(lib.code.replace('import { Section', 'import { Sektion')) !== codeWithoutContent(lib.code), 'a change outside the words is noticed')

console.log(`${pass} passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

// One page <-> several pages by chat, and the pages of a site made from the stored components.
import { loadGeneratorModule } from './lib/load-generator.mjs'
globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const { parseEdit } = await loadGeneratorModule('edit/understand.ts')
const { editsFrom } = await loadGeneratorModule('edit/edits.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
let pass = 0
const fail = []
const ok = (c, m) => (c ? pass++ : fail.push(m))
const lib = { pages: true, library: true }
const ops = (t, multi = false) => parseEdit(t, 'single', { ...lib, pages: multi }).ops ?? []
const has = (list, op, key, val) => list.some((o) => o.op === op && (key ? o[key] === val : true))

for (const t of ['make it multiple pages', 'convert to multi page website', 'multiple page me convert karo', 'isko multi page banao', 'add pages', 'single page ko multiple page me badlo', 'website me alag alag pages chahiye', 'mujhe multiple page website chahiye', 'split it into pages', 'convert this into multi-page site', 'pages jodo'])
  ok(has(ops(t), 'pages', 'mode', 'multi'), `"${t}" makes it a site with pages`)
for (const t of ['single page karo', 'ek hi page me karo', 'make it a one page website'])
  ok(has(ops(t, true), 'pages', 'mode', 'single') && !has(ops(t, true), 'theme'), `"${t}" makes it one page (and does not change the business)`)
ok(ops('single page karo').length === 0, 'one page already: nothing to change')
ok(has(ops('add about page and contact page'), 'pages', 'mode', 'multi') && has(ops('add about page and contact page'), 'add', 'section', 'about'), 'naming pages on a one-page site turns it into a site with pages')
ok(has(ops('add a pricing page', true), 'add', 'section', 'pricing') && !has(ops('add a pricing page', true), 'pages'), 'adding a page to a site with pages only adds it')
ok(has(ops('remove the blog page', true), 'remove', 'section', 'blog') && has(ops('gallery page hatao', true), 'remove', 'section', 'gallery'), 'a page is removed')
ok(has(ops('pages me Home About Contact hi rakho', true), 'remove', 'section', 'blog') && has(ops('menu me Home About Services Contact rakho', true), 'remove', 'section', 'gallery'), 'exactly the pages that were named')
ok(!has(ops('change the heading of the pricing section to Rates', true), 'pages'), 'an ordinary change is not about pages')
// the edit reaches the state
ok(editsFrom([{ op: 'pages', mode: 'multi' }]).pagesMode === 'multi' && editsFrom([{ op: 'pages', mode: 'multi' }, { op: 'pages', mode: 'single' }]).pagesMode === 'single', 'the last word wins')

// the pages that a site with pages gets
for (const p of ['dental clinic landing page in Pune', 'cafe website in Jaipur', 'gym website', 'law firm website', 'mujhe cloth ki website banakar do']) {
  const l = generateLibraryPage(p, 3, undefined, true, 'auto', editsFrom([]), true)
  const labels = (l.pages ?? []).map((x) => x.label)
  ok(labels.length >= 4 && labels.includes('Home') && labels.includes('About') && labels.includes('Services') && labels.includes('Contact'), `${p}: a site with pages has Home, About, Services, Contact and more (${labels.join(', ')})`)
  // every page has a part of its own
  for (const page of l.pages ?? []) if (page.path !== '/') ok(l.sections.some((s) => s.page === page.path && s.role !== 'pagehead'), `${p}: the ${page.label} page is not empty`)
  const more = generateLibraryPage(p, 3, undefined, true, 'auto', editsFrom([{ op: 'add', section: 'gallery' }, { op: 'add', section: 'faq' }, { op: 'add', section: 'team' }]), true)
  const lm = (more.pages ?? []).map((x) => x.label)
  ok(lm.includes('Gallery') && lm.includes('FAQ') && lm.includes('Team'), `${p}: the pages that were asked for are there (${lm.join(', ')})`)
}
console.log(`${pass} passed, ${fail.length} failed`)
for (const f of fail.slice(0, 15)) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

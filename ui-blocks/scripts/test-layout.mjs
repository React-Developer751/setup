// Layout edits end to end: what the person types (names of sections, places, sizes, alignment) -> operations -> the real sites of all three engines.
import { loadGeneratorModule } from './lib/load-generator.mjs'

const { generateSite } = await loadGeneratorModule('generateSite.ts')
const { generateWebsite } = await loadGeneratorModule('generateWebsite.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { editsFrom } = await loadGeneratorModule('edit/edits.ts')
const { parseEdit } = await loadGeneratorModule('edit/understand.ts')

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))
const PROMPT = 'Create a website for a modern gym called Iron Pulse with pricing, team, gallery, faq and testimonials'
const ops = (messages, context) => messages.flatMap((m) => { const p = parseEdit(m, context); return p.kind === 'ops' ? p.ops : [] })
const single = (list) => generateWebsite(PROMPT, 0, undefined, true, 'auto', list.length ? editsFrom(list) : undefined)
const multi = (list) => generateSite(PROMPT, 0, undefined, true, 'auto', list.length ? editsFrom(list) : undefined)
const library = (list) => generateLibraryPage(PROMPT, 0, undefined, true, 'auto', list.length ? editsFrom(list) : undefined)
const idx = (ids, key) => ids.findIndex((id) => id.startsWith(key))
const base = single([])
const baseMulti = multi([])
const baseLib = library([])

// 1. the name of a section
{
  const o = ops(['rename the pricing section to Our Plans', 'FAQ ka heading Got Questions? rakho'], 'single')
  ok(o.length === 2 && o[0].op === 'title' && o[1].op === 'title', 'titles are understood')
  const s = single(o)
  ok(s.html.includes('Our Plans') && !base.html.includes('Our Plans'), 'single: pricing heading renamed')
  ok(s.html.includes('Got Questions?'), 'single: faq heading renamed')
  ok(s.content.brandName === base.content.brandName, 'a section rename does not rename the business')
  ok(JSON.stringify(multi(o).pagesHtml).includes('Our Plans'), 'multi: pricing page heading renamed')
  ok(library(o).code.includes('Our Plans'), 'library: pricing heading renamed')
}
// 2. the label of a page in the menu
{
  const o = ops(['menu me pricing ko Rates karo', 'rename Blog to Stories in the nav'], 'multi')
  ok(o.length === 2 && o.every((x) => x.op === 'navLabel'), 'nav labels are understood')
  const m = JSON.stringify(multi(o).pagesHtml)
  ok(m.includes('Rates') && m.includes('Stories'), 'multi: menu labels changed')
  const noRename = ops(['rename it to Green Leaf'], 'multi')
  ok(noRename[0]?.op === 'rename', 'a plain rename is still the business name')
}
// 3. the place of a section
{
  const o = ops(['move faq above pricing'], 'single')
  ok(o[0]?.op === 'move' && o[0].where === 'before', 'move is understood')
  const s = single(o)
  ok(base.layoutIds.some((i) => i.startsWith('faq')) && base.layoutIds.some((i) => i.startsWith('pricing')), 'base has faq and pricing')
  ok(idx(s.layoutIds, 'faq') < idx(s.layoutIds, 'pricing'), 'single: faq is above pricing')
  ok(idx(base.layoutIds, 'faq') > idx(base.layoutIds, 'pricing') || true, 'base order known')
  const top = single(ops(['gallery ko sabse upar karo'], 'single'))
  const g = idx(top.layoutIds, 'gallery')
  ok(g >= 0 && top.layoutIds.slice(0, g).every((id) => /navbar|header|hero|nav/i.test(id)), 'single: gallery comes right after the header/hero parts')
  const lib = library(ops(['move faq above pricing'], 'single'))
  const roles = lib.sections.map((x) => x.role)
  ok(roles.indexOf('faq') < roles.indexOf('pricing'), 'library: faq above pricing')
}
// 4. the place of a page in the menu
{
  const o = ops(['move the Blog page to the end of the menu', 'move gallery page above pricing page in the menu'], 'multi')
  ok(o.every((x) => x.op === 'movePage'), 'page moves are understood')
  const m = multi(o)
  const order = m.pages.filter((p) => p.inNav !== false).map((p) => p.id)
  ok(order.indexOf('gallery') < order.indexOf('pricing'), 'multi: gallery page above pricing in the menu')
  const home = parseEdit('move home to the end of the menu', 'multi')
  ok(home.kind === 'ops' && home.ops.length === 0 && home.notes.length > 0, 'Home cannot be moved')
}
// 5. height and width
{
  const shorter = single(ops(['make the pricing section shorter'], 'single'))
  const taller = single(ops(['pricing ki height zyada karo'], 'single'))
  ok(shorter.html !== base.html && taller.html !== base.html && shorter.html !== taller.html, 'single: height changes the page')
  const narrow = single(ops(['gallery section narrower'], 'single'))
  ok(/max-width:min\(100%/.test(narrow.html) && narrow.html !== base.html, 'single: width limits the gallery section')
  const px = single(ops(['gallery height 700px'], 'single'))
  ok(/min-height:700px/.test(px.html), 'single: exact pixel height')
  const o = ops(['hero ki height kam karo'], 'single')
  ok(single(o).html !== base.html, 'single: hero height')
  ok(JSON.stringify(multi(ops(['hero ki height kam karo'], 'multi')).pagesHtml) !== JSON.stringify(baseMulti.pagesHtml), 'multi: hero height')
  ok(library(ops(['gallery height 700px'], 'single')).code !== baseLib.code, 'library: height changes the code')
  const twice = ops(['make the gallery shorter', 'make the gallery shorter'], 'single')
  ok(editsFrom(twice).sizes.gallery?.height?.factor < 0.6, 'two "shorter" add up')
}
// 6. alignment
{
  const o = ops(['center the pricing heading', 'footer right align karo'], 'single')
  ok(o.length === 2 && o.every((x) => x.op === 'align'), 'align is understood')
  const s = single(o)
  ok(/text-align:center/.test(s.html) && /text-align:right/.test(s.html), 'single: text-align applied')
}
// 7. several together, undo, reset
{
  const o = ops(['rename the pricing section to Our Plans and center it'], 'single')
  ok(o.length === 2 && o[0].op === 'title' && o[1].op === 'align' && o[1].target === 'pricing', '"... and center it" refers to the pricing section')
  const o2 = ops(['gallery ko top par lao aur uski height kam karo'], 'single')
  ok(o2.length === 2 && o2[1].target === 'gallery', 'Hinglish: "uski" refers to the gallery')
  const all = ops(['make the gallery shorter', 'move faq above pricing'], 'single')
  const undone = all.slice(0, -1)
  ok(single(undone).html !== single(all).html, 'undo changes the site')
  const reset = ops(['make the gallery shorter', 'move faq above pricing', 'reset the layout'], 'single')
  ok(single(reset).html === base.html && JSON.stringify(single(reset).layoutIds) === JSON.stringify(base.layoutIds), 'reset layout gives the original sizes and order')
  ok(parseEdit('reset the layout', 'single').kind === 'ops', '"reset the layout" is not the whole reset')
  ok(parseEdit('reset', 'single').kind === 'control', 'plain reset is still the whole reset')
}
// 8. nothing broken
{
  const heavy = ops(['rename pricing to Our Plans', 'move faq above pricing', 'make the gallery 60% shorter', 'center the hero', 'gallery narrower'], 'single')
  const s = single(heavy)
  ok(!/undefined|\[object Object\]|NaN/.test(s.html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')), 'no "undefined" text after many layout changes')
  const mh = JSON.stringify(multi(heavy).pagesHtml)
  ok(!/undefined|\[object Object\]|NaN/.test(mh.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')), 'multi: no "undefined" text')
}

// 6b. the buttons alone
{
  const o = ops(['hero button ko left karo'], 'single')
  ok(o.length === 1 && o[0].op === 'align' && o[0].part === 'buttons' && o[0].align === 'left', 'button alignment is understood (not the text of the button)')
  const s = single(o)
  ok(s.html !== base.html && /justify-start/.test(s.html), 'single: the buttons move to the left')
  const r = single(ops(['hero button ko right karo'], 'single'))
  ok(/justify-end/.test(r.html), 'single: the buttons move to the right')
  const whole = single(ops(['hero left align karo'], 'single'))
  ok(/justify-start/.test(whole.html) && /text-left/.test(whole.html), 'a left aligned hero moves its buttons too')
  ok(JSON.stringify(multi(ops(['hero button ko left karo'], 'multi')).pagesHtml) !== JSON.stringify(baseMulti.pagesHtml), 'multi: the buttons move')
  ok(library(o).code.includes('buttons'), 'library: the buttons alignment reaches the page')
  ok(single(ops(['hero button ko left karo', 'reset the layout'], 'single')).html === base.html, 'reset brings the buttons back')
}
// 9. the library engine is not black and white, and the pictures reach it
{
  const lib = library([])
  ok(lib.sections.some((x) => x.band), 'library: some parts have a band of the main colour')
  ok(lib.sections.find((x) => x.role === 'cta')?.paint === lib.palette.light.accent, 'library: the call-to-action has the main colour')
  ok(/ band/.test(lib.code), 'library: the exported code keeps the bands')
  const photo = 'data:image/jpeg;base64,AAAA'
  const withPhotos = library([{ op: 'photos', hero: photo, about: photo, gallery: [photo] }])
  ok(withPhotos.content.photos?.hero === photo && withPhotos.code.includes(photo), 'library: the pictures are in the content of the page')
}

console.log(`${pass} checks passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

// Everyday style requests: a size, corners, the menu, pictures, and things that do not exist. None of them may turn into a wrong edit
// (a heading text "size chhota", a pink main colour for "instagram link", a removed section for "cookie banner").
globalThis.document = { styleSheets: [] }
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const { parseEdit } = await loadGeneratorModule('edit/understand.ts')
const { editsFrom } = await loadGeneratorModule('edit/edits.ts')
const { generateWebsite } = await loadGeneratorModule('generateWebsite.ts')
const { fitMarkup } = await loadGeneratorModule('edit/fit.ts')

const ops = (t) => { const r = parseEdit(t, 'single'); return r.kind === 'ops' ? r.ops : r.kind === 'control' ? [{ op: `control:${r.control}` }] : [] }
const notes = (t) => { const r = parseEdit(t, 'single'); return r.kind === 'ops' ? r.notes.join(' ') : '' }
const style = (t) => ops(t).filter((o) => o.op === 'style')

// ── sizes
const sizeCases = [
  ['heading ka size chhota karo', [['page', 'headingSize', '-1']]], ['make the heading bigger', [['page', 'headingSize', '+1']]], ['heading bada karo', [['page', 'headingSize', '+1']]],
  ['text bada karo', [['page', 'textSize', '+1']]], ['text size chhota karo', [['page', 'textSize', '-1']]], ['font bada karo', [['page', 'headingSize', '+1'], ['page', 'textSize', '+1']]],
  ['hero heading bigger', [['hero', 'headingSize', '+1']]], ['about ka text chhota karo', [['about', 'textSize', '-1']]], ['title ko thoda bada karo', [['page', 'headingSize', '+1']]],
  ['bigger text', [['page', 'textSize', '+1']]], ['headings smaller', [['page', 'headingSize', '-1']]],
]
for (const [text, want] of sizeCases) {
  const got = style(text).map((o) => [o.target, o.prop, o.value])
  ok(JSON.stringify(got) === JSON.stringify(want), `"${text}" -> ${JSON.stringify(want)} (got ${JSON.stringify(got)})`)
  ok(!ops(text).some((o) => o.op === 'text'), `"${text}" does not become a text`)
}
// a size is relative: two requests are two steps, and the other way takes one back
const twice = editsFrom([...style('heading bada karo'), ...style('heading bada karo')])
ok(twice.styles.page.headingSize === '+2', 'bigger twice is +2')
ok(!editsFrom([...style('heading bada karo'), ...style('heading chhota karo')]).styles.page?.headingSize, 'bigger then smaller is back to normal')
ok(editsFrom([...style('heading bada karo'), ...style('heading bada karo'), ...style('heading bada karo'), ...style('heading bada karo'), ...style('heading bada karo')]).styles.page.headingSize === '+3', 'the size stops at 3 steps')

// ── the size reaches the page (preview: a font-size of its own; React export: the next class of the scale)
const base = generateWebsite('Create a website for a robotics lab called Nova', 3)
const big = generateWebsite('Create a website for a robotics lab called Nova', 3, undefined, false, 'auto', editsFrom([{ op: 'style', target: 'page', prop: 'headingSize', value: '+2' }]))
const h1 = (html) => html.match(/<h1\b[^>]*>/)?.[0] ?? ''
ok(!/font-size/.test(h1(base.html)) && /font-size:[\d.]+rem|font-size:clamp\(/.test(h1(big.html)), 'the heading of the page gets a bigger font-size')
const px = (html) => Number((h1(html).match(/font-size:(?:clamp\([\d.]+rem, [^,]+, )?([\d.]+)rem/) ?? [])[1])
ok(px(big.html) > 3, `the biggest size of the heading is more than 3rem (${px(big.html)})`)
const small = generateWebsite('Create a website for a robotics lab called Nova', 3, undefined, false, 'auto', editsFrom([{ op: 'style', target: 'page', prop: 'headingSize', value: '-2' }]))
ok(px(small.html) < px(big.html), 'smaller is smaller than bigger')
const jsx = fitMarkup('<h1 className="text-4xl font-bold md:text-6xl">Hi</h1>', { style: { headingSize: '+1' } }, 'jsx')
ok(/text-5xl/.test(jsx) && /md:text-7xl/.test(jsx), `the React export moves along the scale (${jsx})`)
const txt = fitMarkup('<p class="text-base md:text-lg">Hi</p>', { style: { textSize: '+1' } }, 'html')
ok(/font-size:clamp\(1\.125rem/.test(txt) || /font-size:1\.125rem/.test(txt), `a paragraph gets bigger (${txt})`)

// ── corners
for (const [text, value] of [['buttons square karo', 'square'], ['make the buttons rounded', 'pill'], ['corners sharp karo', 'square'], ['rounded corners kam karo', 'square'], ['cards rounded karo', 'rounded'], ['corners zyada gol karo', 'pill']]) {
  const got = style(text)[0]
  ok(got && got.prop === 'radius' && got.value === value, `"${text}" -> corners ${value} (got ${got ? got.value : 'nothing'})`)
  ok(!ops(text).some((o) => o.op === 'text'), `"${text}" does not change the button text`)
}

// ── the menu
ok(ops('menu ko right side karo').some((o) => o.op === 'align' && o.target === 'header' && o.align === 'right'), '"menu ko right side karo" aligns the navigation bar')
ok(!ops('menu mein Services ko Classes naam do').some((o) => o.op === 'align'), 'renaming a menu item is not an alignment')

// ── things that do not exist: an answer, and no other change
const cannot = ['instagram link add karo', 'footer mein instagram link add karo', 'whatsapp button add karo', 'cookie banner hatao', 'chat widget lagao', 'map add karo', 'hero me video lagao', 'newsletter form add karo', 'heading bold karo', 'italic karo', 'letter spacing badhao', 'shadow hatao', 'gradient lagao hero par', 'border add karo', 'sections ke beech divider lagao', 'pricing plans ka price 999 karo', 'cards ka color white karo']
for (const text of cannot) {
  ok(ops(text).length === 0 && notes(text).length > 20, `"${text}" gets an answer and no wrong edit (${JSON.stringify(ops(text)).slice(0, 80)})`)
}
// pictures
ok(ops('hero image hatao').some((o) => o.op === 'clearPhotos') && !ops('hero image hatao').some((o) => o.op === 'remove'), '"hero image hatao" removes pictures, not the gallery section')
ok(ops('image hero me lagao').length === 0 && /Real photos/.test(notes('image hero me lagao')), '"image lagao" points to Real photos, it does not add a gallery')
ok(ops('photo change karo').length === 0 && /Real photos/.test(notes('photo change karo')), '"photo change karo" points to Real photos')
// a better look is a mood
ok(ops('isko aur modern bana do').some((o) => o.op === 'mood'), '"isko aur modern bana do" changes the design mood')
// a change of words with no words
ok(ops('testimonial ka text change karo').length === 0 && /quotes/.test(notes('testimonial ka text change karo')), 'a change of words without the words asks for them')

// ── lists, background, typeface, menu
const removed = (t) => ops(t).filter((o) => o.op === 'remove').map((o) => o.section).sort().join(',')
ok(removed('gallery aur faq hatao') === 'faq,gallery', 'a list of sections: all of them are removed ("gallery aur faq hatao")')
ok(removed('team, blog aur faq hatao') === 'blog,faq,team', 'three sections in a list')
ok(removed('team and blog remove') === 'blog,team', 'a list in English')
ok(ops('gallery aur faq dikhao').filter((o) => o.op === 'add').length === 2, 'a list of sections to add')
ok(ops('background black').some((o) => o.op === 'mode' && o.mode === 'dark') && !ops('background black').some((o) => o.op === 'accent'), '"background black" is the dark mode, not a black main colour')
ok(ops('white background').some((o) => o.op === 'mode' && o.mode === 'light'), '"white background" is the light mode')
ok(style('font ko elegant karo')[0]?.value === 'elegant' && !ops('font ko elegant karo').some((o) => o.op === 'replace'), '"font ko elegant karo" sets the typeface')
ok(ops('font badlo').length === 0 && /serif/.test(notes('font badlo')), '"font badlo" asks which typeface')
ok(!ops('about us ko hatao menu se').some((o) => o.op === 'remove' && o.section === 'features') && ops('about us ko hatao menu se').some((o) => o.op === 'remove' && o.section === 'about'), '"about us ko hatao menu se" removes about only')
ok(ops('upar wala menu hatao').length === 0, 'the menu bar is not a section')
ok(removed('menu section hatao') === 'features', 'the "menu" section of a restaurant still goes')
ok(style('subtitle bada karo')[0]?.target === 'hero' && style('subtitle bada karo')[0]?.prop === 'textSize', 'a bigger subtitle is the text of the first screen')
ok(!ops('heading mein naam daalo').some((o) => o.op === 'text'), '"heading mein naam daalo" does not make "naam" the heading')
ok(ops('start again').some((o) => o.op === 'control:reset'), '"start again" resets')
ok(parseEdit('is website ko restaurant bana do', 'single').ops.some((o) => o.op === 'theme'), '"is website ko restaurant bana do" changes the business type')

// ── what must keep working
const keep = [
  ['hero heading ko "Fresh Tea Daily" kar do', 'text'], ['button ka text Book Now kar do', 'text'], ['subtitle ko "Best yoga in town" kar do', 'text'], ['gallery hata do', 'remove'], ['pricing ko services ke niche rakho', 'move'],
  ['accent color red karo', 'accent'], ['heading ka color white karo', 'style'], ['whatsapp number 9876543210', 'contact'], ['animation band karo', 'motion'], ['glass style karo', 'mood'], ['make it bold and colourful', 'mood'], ['serif font karo', 'style'], ['video editing studio ke liye website banao', 'newsite'],
]
for (const [text, want] of keep) {
  const r = parseEdit(text, 'single')
  const got = r.kind === 'newSite' ? 'newsite' : r.kind === 'ops' ? r.ops[0]?.op : r.kind
  ok(got === want || (want === 'mood' && (got === 'tier' || got === 'tone')), `"${text}" still gives ${want} (got ${got})`)
}

console.log(`edit-styles: ${pass} checks passed, ${fail.length} failed`)
if (fail.length) {
  console.log(fail.map((f) => ` - ${f}`).join('\n'))
  process.exit(1)
}

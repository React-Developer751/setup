// The site as a JSON document: write it, change a word of it, and the site changes by exactly that.
globalThis.document = { styleSheets: [] }
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))
const { generateWebsite } = await loadGeneratorModule('generateWebsite.ts')
const { blueprintOf, fromBlueprint } = await loadGeneratorModule('edit/blueprint.ts')
const { editsFrom, cleanOp } = await loadGeneratorModule('edit/edits.ts')
const { setCreativity } = await loadGeneratorModule('creativity.ts')
setCreativity('balanced')

const PROMPT = 'Create a website for a dental clinic called Bright Smile in Pune'
const make = (ops) => generateWebsite(PROMPT, 4, 'premium', true, 'auto', ops.length ? editsFrom(ops) : undefined)
const doc = (ops) => { const e = ops.length ? editsFrom(ops) : undefined; return blueprintOf(generateWebsite(PROMPT, 4, 'premium', true, 'auto', e), e) }
const base = doc([])
const clone = () => JSON.parse(JSON.stringify(base))
const apply = (changed, ops0 = []) => { const r = fromBlueprint(changed, doc(ops0)); return { ...r, site: make([...ops0, ...r.ops.map(cleanOp).filter(Boolean)]) } }

ok(base.version === 1 && base.sections.length >= 8 && base.sections.some((x) => x.id === 'hero' && !!x.heading && !!x.button_text), `the site is a document with ${base.sections.length} panels (a hero with heading and button)`)
ok(base.palette.accent.startsWith('#') && ['light', 'dark'].includes(base.mode) && typeof base.mood === 'string', 'the document has the mood, mode and colours')
ok(JSON.stringify(JSON.parse(JSON.stringify(base))) === JSON.stringify(base), 'the document is plain JSON')
ok(fromBlueprint(clone(), base).ops.length === 0, 'the same document makes no change')

// one word changed = one small operation
const a = clone(); a.sections.find((x) => x.id === 'hero').heading = 'Smile Like You Mean It'
const ra = apply(a)
ok(ra.ops.length === 1 && ra.ops[0].op === 'text' && ra.ops[0].field === 'heroTitle', `a new hero heading is one operation (${JSON.stringify(ra.ops)})`)
ok(ra.site.html.includes('Smile Like You Mean It'), 'and the site shows it')
const b = clone(); b.sections.find((x) => x.id === 'hero').button_text = 'Book Now'
ok(apply(b).site.html.includes('Book Now'), 'the button text changes')
const c = clone(); const featuresAt = c.sections.findIndex((s) => s.id === 'features')
if (featuresAt >= 0) { c.sections[featuresAt].heading = 'What We Do Best'; ok(apply(c).site.html.includes('What We Do Best'), 'a section heading changes') } else ok(true, 'no features panel in this site')
const d = clone(); d.palette.accent = '#16a34a'
const rd = apply(d)
ok(rd.ops.length === 1 && rd.ops[0].op === 'accent' && rd.site.palette.light.accent !== base.palette.accent, 'a new accent colour is one operation')
const e = clone(); e.mood = 'cyberpunk'
const re = apply(e)
ok(re.ops.length === 1 && re.ops[0].mood === 'cyberpunk' && re.site.mood?.id === 'cyberpunk', 'a new mood is one operation')
const f = clone(); f.page.button_color = '#dc2626'
const rf = apply(f)
ok(rf.ops[0]?.prop === 'buttonColor' && /--g-btn:#dc2626/.test(rf.site.html), 'the colour of all buttons is one operation')
const g = clone(); const gh = g.sections.find((x) => x.id === 'hero'); gh.button_color = '#16a34a'; gh.heading_color = '#ffffff'
const rg = apply(g)
ok(rg.ops.length === 2 && /--g-btn:#16a34a/.test(rg.site.html), 'the buttons and the heading of one panel get their own colours')
const h = clone(); const k = h.sections.findIndex((s) => s.id === 'cta'); if (k >= 0) { h.sections[k].background = '#16a34a'; ok(/--g-bg:#16a34a/.test(apply(h).site.html), 'the background of a panel changes') }
const i = clone(); i.font = 'serif'
ok(apply(i).site.tokens.light['--g-font'] === 'Playfair Display', 'the typeface changes')
const j = clone(); j.brand = 'Smile Care'
ok(apply(j).site.html.includes('Smile Care'), 'the brand changes')

// taking panels out, and a new order
const l = clone(); const gone = l.sections.find((s) => !['hero', 'footer', 'header', 'contact', 'cta'].includes(s.id)); l.sections = l.sections.filter((s) => s !== gone)
const rl = apply(l)
ok(rl.ops.length === 1 && rl.ops[0].op === 'remove' && rl.ops[0].section === gone.id, `a panel taken out of the list is removed (${gone.id})`)
ok(rl.site.layoutIds.length === base.sections.length - 1 + (generateWebsite(PROMPT, 4, 'premium').layoutIds.length - base.sections.length), 'and it is gone from the site')
const m = clone()
const body = m.sections.filter((s) => !['hero', 'header', 'footer'].includes(s.id))
if (body.length >= 3) {
  const first = m.sections.indexOf(body[0]); const last = m.sections.indexOf(body[body.length - 1]); ;[m.sections[first], m.sections[last]] = [m.sections[last], m.sections[first]]
  const rm = apply(m)
  ok(rm.ops.length >= 1 && rm.ops.every((o) => o.op === 'move'), `a new order is moves (${rm.ops.length})`)
  const order = (site) => site.layoutIds.filter((id) => !/^(?:navbar|hero|footer)/.test(id)).join()
  ok(order(rm.site) !== order(make([])), 'the sections are in the new order')
}

// a mistake is explained, never half applied
const bad = clone(); bad.palette.accent = 'blue'; bad.sections.find((x) => x.id === 'hero').background = 'red'
const rb = fromBlueprint(bad, base)
ok(rb.problems.length === 2 && rb.ops.length === 0, `wrong colours are explained (${rb.problems.length} problems)`)
ok(fromBlueprint('nonsense', base).problems.length === 1 && fromBlueprint([], base).problems.length === 1, 'a document that is not an object is refused')
const unk = clone(); unk.mood = 'disco'
ok(fromBlueprint(unk, base).ops.map(cleanOp).filter(Boolean).length === 0, 'a mood that does not exist makes no operation')
// the document of an edited site shows the edits
const styled = doc([{ op: 'style', target: 'page', prop: 'radius', value: 'pill' }, { op: 'mood', mood: 'retro' }])
ok(styled.page.radius === 'pill' && styled.mood === 'retro', 'the document of an edited site shows the edits')
ok(fromBlueprint(JSON.parse(JSON.stringify(styled)), styled).ops.length === 0, 'and reading it back changes nothing')

console.log(`${pass} checks passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

// The stored components (src/components): every one compiles and renders, the ones that can be a part of a page are in the pools of the library engine,
// and a library page is made of components that fit their place (no fixed bars, no widgets, no unknown ids).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

// ── the audit: all components render
const out = path.join(os.tmpdir(), `components-${process.pid}.json`)
const run = spawnSync(process.execPath, ['scripts/audit-components.mjs', 'src/components', '--json', out], { encoding: 'utf8', maxBuffer: 20_000_000 })
const rows = JSON.parse(fs.readFileSync(out, 'utf8'))
fs.rmSync(out, { force: true })
ok(run.status === 0, 'the audit runs')
ok(rows.length >= 555, `at least 555 components are stored (${rows.length})`)
const bad = rows.filter((r) => !r.ok)
ok(bad.length === 0, `every stored component compiles and renders (${bad.slice(0, 3).map((r) => r.id).join(', ')})`)
const groups = new Set(rows.map((r) => r.folder))
for (const g of ['hero', 'features', 'blog', 'contact', 'cta', 'footer', 'gallery', 'pricing', 'testimonial', 'teams', 'faq', 'portfolio', 'jumbotron', 'card', 'modal', 'tables', 'tabs', 'sign-and-register', '404-page']) ok(groups.has(g), `the group "${g}" is stored`)

// ── the pools
const R = await loadGeneratorModule('library/libraryRoles.ts')
const byId = new Map(rows.map((r) => [r.id, r]))
const pools = Object.entries(R.rolePools)
const all = pools.flatMap(([role, ids]) => ids.map((id) => ({ role, id })))
ok(all.every(({ id }) => byId.has(id)), `every id of every pool is a stored component (${all.filter(({ id }) => !byId.has(id)).slice(0, 3).map((x) => x.id)})`)
ok(all.length >= 140, `the pools hold ${all.length} components`)
for (const [role, ids] of pools) ok(new Set(ids).size === ids.length, `no component twice in the pool of "${role}"`)
const tiers = Object.entries(R.tierPools).flatMap(([tier, p]) => Object.entries(p).flatMap(([role, ids]) => ids.map((id) => ({ tier, role, id }))))
ok(tiers.every(({ role, id }) => id.startsWith('jumbotron/') || R.rolePools[role].includes(id) || byId.has(id)), 'the pools of the design levels only name stored components')
ok(['faq'].every((role) => R.rolePools[role]?.length >= 5), 'a page has a FAQ role with 5 components')
// components in a pool are page parts: no fixed bars, no JavaScript-only widgets
const fixed = all.filter(({ role, id }) => role !== 'nav' && byId.get(id)?.fixed)
ok(fixed.length === 0, `no pool component is a fixed bar (${fixed.slice(0, 3).map((x) => x.id)})`)
const headings = all.filter(({ role, id }) => !['nav', 'footer', 'gallery', 'hero'].includes(role) && byId.get(id).headings === 0)
ok(headings.length <= 2, `a page part has a heading (${headings.slice(0, 4).map((x) => x.id)})`)
const formy = all.filter(({ role, id }) => !['contact', 'footer', 'hero', 'nav', 'cta', 'pricing'].includes(role) && byId.get(id).forms > 3)
ok(formy.length === 0, `forms only live in contact, hero, call-to-action, pricing (plan switches) and footer components (${formy.slice(0, 3).map((x) => x.id)})`)

// ── library pages: the same prompt gives the same page, and the new components are used
globalThis.document = { styleSheets: [] }
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const seen = new Set()
let faqPages = 0
for (const prompt of ['Create a website for a dental clinic called Smile Care in Pune', 'pizza shop called Slice Hub in Mumbai', 'law firm called Rao and Partners', 'bike shop called Spoke selling cycles and helmets', 'yoga studio called Zen Flow in Goa']) {
  for (let v = 1; v <= 12; v += 1) {
    for (const tier of ['better', 'premium']) {
      const page = generateLibraryPage(prompt, v, tier)
      for (const s of page.sections) {
        seen.add(s.componentId)
        ok(byId.has(s.componentId), `a page uses a stored component (${s.componentId})`)
      }
      if (page.sections.some((s) => s.role === 'faq')) faqPages += 1
    }
  }
}
ok([...seen].filter((id) => /Hero(1[89]|2\d)|Features1[2-9]|Blog([6-9]|1[01])|Contact([4-9]|1[01])|Cta([5-9]|10)|Teams|Faq|Pricing[3-9]|Testimonial([4-9]|10)|Portfolio/.test(id)).length >= 25, `120 pages use the new components (${[...seen].length} different ones)`)
ok(faqPages >= 20, `a long page has a FAQ (${faqPages} of 120 pages)`)
ok(JSON.stringify(generateLibraryPage('bakery called Crumb', 4, 'better').sections) === JSON.stringify(generateLibraryPage('bakery called Crumb', 4, 'better').sections), 'the same prompt gives the same library page')
const normal = generateLibraryPage('bakery called Crumb', 4, 'normal')
ok(!normal.sections.some((s) => s.role === 'faq' || s.role === 'team' || s.role === 'pricing'), 'the short page has no FAQ, team or pricing')

console.log(`components: ${pass} checks passed, ${fail.length} failed`)
if (fail.length) {
  console.log(fail.slice(0, 20).map((f) => ` - ${f}`).join('\n'))
  process.exit(1)
}

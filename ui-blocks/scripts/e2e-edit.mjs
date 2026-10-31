// End to end, like a person: real prompts -> site -> a chat of changes (parsed by the real parser) -> all engines + exports checked after every step.
import { loadGeneratorModule } from './lib/load-generator.mjs'

const { generateSite } = await loadGeneratorModule('generateSite.ts')
const { generateWebsite } = await loadGeneratorModule('generateWebsite.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { editsFrom, describeOp } = await loadGeneratorModule('edit/edits.ts')
const { parseEdit } = await loadGeneratorModule('edit/understand.ts')

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))
const J = (x) => JSON.stringify(x)

// each step: what the person types, then what must be true of the site afterwards
const STORIES = [
  {
    prompt: 'Create a page for an organic green tea cafe named Leafy Premium',
    steps: [
      ['FAQ hatao aur naam Zen Cafe rakho aur buttons neela karo', { brand: 'Zen Cafe', gone: ['faq'], accent: '#2563eb' }],
      ['pricing page bhi hata do', { gone: ['faq', 'pricing'] }],
      ['dark mode default karo', { mode: 'dark' }],
      ['headline: Fresh Tea Every Morning', { has: 'Fresh Tea Every Morning' }],
      ['my phone is 98765 43210', { has: '98765 43210' }],
      ['replace tea with chai', { hasNot: 'Leafy Premium' }],
      ['undo', { undo: 1 }],
      ['no animations', { motion: 'off' }],
      ['make it premium', { tier: 'premium' }],
    ],
  },
  {
    prompt: 'Create a modern landing page for a gym called Iron Pulse',
    steps: [
      ['rename it to Titan Fitness & Co', { brand: 'Titan Fitness & Co' }],
      ['remove the testimonials and add a gallery', { gone: ['testimonials'] }],
      ['make the buttons orange', { accent: '#ea580c' }],
      ['reset', { reset: 1 }],
    ],
  },
  {
    prompt: 'Dental clinic website for Dr. Sharma in Pune',
    steps: [
      ['naam Smile Care Dental rakho', { brand: 'Smile Care Dental' }],
      ['blog hata do', { gone: ['blog'] }],
      ['email hello@smilecare.in rakho', { has: 'hello@smilecare.in' }],
      ['colours thoda warm karo', { tonesAdded: 1 }],
    ],
  },
  {
    prompt: 'Italian pizza restaurant called Forno',
    steps: [
      ['call it Napoli Nights', { brand: 'Napoli Nights' }],
      ['remove the team section', { gone: ['team'] }],
      ['address: 12 MG Road Pune', { has: '12 MG Road Pune' }],
      ['subtitle: Wood fired, always fresh', { has: 'Wood fired, always fresh' }],
    ],
  },
]

for (const story of STORIES) {
  let history = []
  let multiHistory = []
  console.log(`\n▶ ${story.prompt}`)
  for (const [message, expect] of story.steps) {
    for (const context of ['single', 'multi']) {
      const parsed = parseEdit(message, context)
      const list = context === 'single' ? history : multiHistory
      if (parsed.kind === 'control') {
        if (parsed.control === 'undo') list.pop()
        else if (parsed.control === 'reset') list.length = 0
      } else {
        ok(parsed.kind === 'ops' && parsed.ops.length > 0, `understood (${context}) "${message}"`)
        if (parsed.kind === 'ops') list.push(...parsed.ops)
        if (context === 'single') console.log(`  "${message}" → ${parsed.kind === 'ops' ? parsed.ops.map(describeOp).join('; ') : parsed.kind}`)
      }
    }
    const edits = editsFrom(history)
    const single = generateWebsite(story.prompt, 0, undefined, true, 'auto', edits)
    const multi = generateSite(story.prompt, 0, undefined, true, 'auto', editsFrom(multiHistory))
    const library = generateLibraryPage(story.prompt, 0, undefined, true, 'auto', edits)
    // the exports are built from exactly these pages (the browser run below checks the real export files)
    const singleHtml = single.html
    const multiHtml = J(multi.pagesHtml)
    const staticText = J(multi.files.map((f) => f.code))
    const where = `[${message}]`
    if (expect.brand) {
      for (const [n, html] of [['single', singleHtml], ['multi', multiHtml], ['library', library.code], ['static export', staticText]]) ok(html.includes(expect.brand.replace(/&/g, '&amp;')) || html.includes(expect.brand), `${where} brand in ${n}`)
      ok(single.content.brandName === expect.brand && multi.content.brandName === expect.brand && library.content.brandName === expect.brand, `${where} brand in all engines`)
    }
    for (const key of expect.gone ?? []) {
      ok(!multi.pages.some((p) => p.id === key), `${where} no ${key} page (multi)`)
      const layoutKey = { testimonials: 'testimonials', team: 'team', pricing: 'pricing', faq: 'faq', blog: 'blog' }[key]
      ok(!single.layoutIds.some((id) => id.startsWith(layoutKey)), `${where} no ${key} section (single)`)
      ok(!library.sections.some((s) => s.role === ({ testimonials: 'testimonial' }[key] ?? key)), `${where} no ${key} section (library)`)
      ok(!new RegExp(`href=\\\\"#/${key}\\\\"`).test(multiHtml), `${where} no link to ${key} (multi)`)
    }
    if (expect.accent) ok(J(single.palette).toLowerCase().includes(expect.accent.slice(1)) || /edited/.test(single.palette.name), `${where} accent applied`)
    if (expect.mode) ok(single.initialMode === expect.mode && multi.spec.initialMode === expect.mode, `${where} mode`)
    if (expect.has) ok(singleHtml.includes(expect.has) && multiHtml.includes(expect.has), `${where} "${expect.has}" shows`)
    if (expect.hasNot) ok(!singleHtml.includes(expect.hasNot) && !multiHtml.includes(expect.hasNot), `${where} "${expect.hasNot}" is gone`)
    if (expect.motion) ok(single.motion.level === expect.motion, `${where} motion ${expect.motion}`)
    if (expect.tier) ok(single.tier === expect.tier && multi.tier === expect.tier && library.tier === expect.tier, `${where} tier`)
    if (expect.tonesAdded) ok(edits.tones.length >= expect.tonesAdded, `${where} tone recorded`)
    if (expect.reset) ok(singleHtml === generateWebsite(story.prompt, 0, undefined, true, 'auto', undefined).html, `${where} reset = original site`)
    // never broken: every internal link of the multi-page site points to a page that exists
    const paths = new Set(multi.pages.map((p) => p.path))
    const dead = [...multiHtml.matchAll(/href=\\"#(\/[^\\"]*)\\"/g)].map((m) => m[1]).filter((p) => !paths.has(p))
    ok(dead.length === 0, `${where} no dead links (${dead.slice(0, 3)})`)
    ok(!/undefined|\[object Object\]|NaN/.test(singleHtml.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')), `${where} no "undefined" text on the page`)
  }
}

// parsing the same sentence for a multi-page site: page + section pairs
const m = parseEdit('remove the pricing and faq', 'multi')
ok(m.kind === 'ops' && J(m.ops.map((o) => o.op)) === J(['removePage', 'remove', 'removePage', 'remove']), 'multi-page removal gives page + section')
const s = parseEdit('remove the pricing and faq', 'single')
ok(s.kind === 'ops' && s.ops.every((o) => o.op === 'remove'), 'single-page removal gives sections only')
ok(parseEdit('remove the contact form', 'single').ops?.some((o) => o.op === 'remove' && o.section === 'contact'), 'the contact part can be removed (it is their site; they are told what stays)')

console.log(`\n${pass} checks passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

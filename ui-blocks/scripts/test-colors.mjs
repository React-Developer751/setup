// The colours of the generated sites: hand-picked palettes are valid and readable, every site gets its own colours, a colour named in the prompt wins.
import { loadGeneratorModule } from './lib/load-generator.mjs'

const { CURATED } = await loadGeneratorModule('curatedPalettes.ts')
const { contrast, hexToHsl } = await loadGeneratorModule('colorBrain.ts')
const { generateWebsite } = await loadGeneratorModule('generateWebsite.ts')

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

ok(CURATED.length >= 40, `at least 40 hand-picked palettes (${CURATED.length})`)
ok(new Set(CURATED.map((p) => p.name)).size === CURATED.length, 'palette names are unique')
for (const p of CURATED) ok(/^#[0-9a-f]{6}$/i.test(p.accent) && /^#[0-9a-f]{6}$/i.test(p.alt), `valid hex: ${p.name}`)

const prompts = ['bakery in Mumbai', 'gym called Iron Pulse', 'law firm', 'dental clinic', 'tech startup', 'wedding photographer', 'school', 'pest control', 'travel agency', 'salon', 'kids toy shop', 'car garage', 'yoga studio', 'restaurant', 'real estate agency']
const hues = new Set()
let curated = 0
let total = 0
for (const prompt of prompts) {
  for (let v = 1; v <= 24; v += 1) {
    const site = generateWebsite(prompt, v * 37)
    total += 1
    if (!/\+/.test(site.palette.name)) curated += 1
    for (const mode of ['light', 'dark']) {
      const m = site.palette[mode]
      const worst = Math.min(contrast(m.text, m.bg), contrast(m.text, m.surface), contrast(m.muted, m.bg), contrast(m.accent, m.bg))
      ok(worst >= 4.4, `readable ${mode}: ${prompt} #${v} (worst ${worst.toFixed(2)})`)
    }
    hues.add(Math.round(hexToHsl(site.palette.light.accent).h / 20))
  }
}
ok(curated / total > 0.6, `most sites use hand-picked colours (${curated}/${total})`)
ok(hues.size >= 14, `the colours cover the whole wheel (${hues.size} of 18 hue bands)`)
const named = generateWebsite('a red coffee shop', 5)
ok(Math.abs(hexToHsl(named.palette.light.accent).h - 2) < 25 || hexToHsl(named.palette.light.accent).h > 340, 'a colour named in the prompt wins')

console.log(`${pass} checks passed, ${fail.length} failed`)
for (const f of fail.slice(0, 20)) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

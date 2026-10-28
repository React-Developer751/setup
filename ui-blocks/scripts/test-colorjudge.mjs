// The colour judge: every site's colours are checked before the site is made. A palette a designer would not keep is replaced.
import { loadGeneratorModule } from './lib/load-generator.mjs'
const { generateWebsite } = await loadGeneratorModule('generateWebsite.ts')
const { judgePalette, GOOD_ENOUGH } = await loadGeneratorModule('colorJudge.ts')
const { hexToHsl, contrast } = await loadGeneratorModule('colorBrain.ts')

let pass = 0
const fail = []
const ok = (c, n) => (c ? (pass += 1) : fail.push(n))
const { SIGNATURE_MOODS } = await loadGeneratorModule('moods.ts')
const { setCreativity } = await loadGeneratorModule('creativity.ts')
// the colours the generator makes up (not the fixed designs read from live sites) are what the judge is for: wild creativity makes them
setCreativity('wild')
const prompts = ['dental clinic in Pune', 'Italian pizza restaurant in Mumbai', 'law firm Rao and Partners', 'yoga studio in Goa', 'bakery called Crumb', 'gym called Iron Pulse', 'online store for kurtis and sarees', 'kids school in Jaipur', 'plumber in Delhi', 'wedding photographer', 'coding academy', 'interior designer', 'real estate agency Skyline', 'hair salon Glow', 'car repair garage', 'organic farm shop', 'cafe called Brew', 'travel agency', 'accounting firm', 'pet shop']
let total = 0
let low = 0
const worst = []
let unreadable = 0
let strangeHue = 0
for (const prompt of prompts) {
  for (let v = 1; v <= 25; v += 1) {
    for (const tier of ['normal', 'better', 'premium']) {
      const site = generateWebsite(prompt, v, tier)
      const j = judgePalette(site.palette, site.themeKey, prompt)
      // a design read from a live site keeps its own colours (they are checked for contrast in test-moods.mjs)
      if (SIGNATURE_MOODS.has(site.mood?.id)) continue
      total += 1
      if (j.score < GOOD_ENOUGH) { low += 1; worst.push(`${prompt} v${v} ${tier} ${site.palette.name} ${Math.round(j.score * 100)} ${j.problems[0]}`) }
      if (contrast(site.palette.light.text, site.palette.light.bg) < 7 || contrast(site.palette.dark.text, site.palette.dark.bg) < 7) unreadable += 1
      const a = hexToHsl(site.palette.light.accent)
      if (/dental|law|accounting|school/.test(prompt) && a.s > 25 && a.h >= 285 && a.h <= 345) strangeHue += 1
    }
  }
}
console.log(`judged ${total} sites: ${low} below ${GOOD_ENOUGH} after the retries`)
if (low) console.log(worst.slice(0, 8).join('\n'))
ok(low / total <= 0.03, `at most 3% of the sites keep a palette below ${GOOD_ENOUGH} (${low}/${total})`)
ok(unreadable === 0, `the text is readable in every palette (${unreadable})`)
ok(strangeHue === 0, `no pink-purple for a dentist, lawyer, accountant or school (${strangeHue})`)
// a colour the person names is never replaced
const red = generateWebsite('red pizza shop', 3, 'better')
ok(hexToHsl(red.palette.light.accent).h <= 20 || hexToHsl(red.palette.light.accent).h >= 345, 'a named colour stays')
// the judge itself: a neon pink on a dental page is bad, a deep teal is fine
const base = generateWebsite('dental clinic', 1, 'better').palette
const neon = { ...base, light: { ...base.light, accent: '#ff1493', alt: '#00ff55' } }
ok(judgePalette(neon, 'healthcare', 'dental clinic').score < 0.6, 'the judge rejects neon pink + green for a dentist')
ok(judgePalette(base, 'healthcare', 'dental clinic').score >= 0.7, 'the judge accepts the palette of a dental page')
console.log(`colorjudge: ${pass} checks passed, ${fail.length} failed`)
if (fail.length) { console.log(fail.map((f) => ` - ${f}`).join('\n')); process.exit(1) }

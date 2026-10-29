// Taste: the parts of a page are chosen together by what they are like (seven numbers learned from the person's own components), not one by one from a list.
// It must give variety (different variations are different designs), agreement (the parts belong together), the feel of the business, and it must learn
// from the pages the person kept or turned down.
import { loadGeneratorModule } from './lib/load-generator.mjs'
globalThis.document = { styleSheets: [] }

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { setCreativity } = await loadGeneratorModule('creativity.ts')
const { axesOf, AXES, targetFor, learnedCount, composePage } = await loadGeneratorModule('library/taste.ts')
const { rolePools } = await loadGeneratorModule('library/libraryRoles.ts')
const { analyse, partsScore, tasteScore } = await loadGeneratorModule('memory/designMemory.ts')

ok(learnedCount() > 500, `the taste was learned from the person's components (${learnedCount()})`)
ok(['hero/Hero2', 'footer/Footer3', 'gallery/Gallery1', 'refkit/RefHero1'].every((id) => AXES.every((a) => axesOf(id)?.[a] >= 0 && axesOf(id)[a] <= 1)), 'every taste number is between 0 and 1')

const PROMPTS = ['dental clinic Smile Care in Pune', 'italian restaurant Forno Rosso Mumbai', 'gym in Jaipur', 'kurti boutique Jaipur', 'wedding photographer Udaipur', 'SaaS invoicing tool']
const EXCLUDED = ['hero/Hero5', 'hero/Hero11', 'pricing/Pricing2', 'pricing/Pricing3', 'team/Teams3', 'team/Teams6', 'team/Teams7']
const dist = (a, b) => Math.sqrt(AXES.reduce((t, x) => t + ((a[x] - b[x]) / 0.3) ** 2, 0) / AXES.length)
const spreadOf = (page) => {
  const rows = page.sections.filter((s) => !['nav', 'footer', 'banner'].includes(s.role)).map((s) => axesOf(s.componentId)).filter(Boolean)
  const centre = Object.fromEntries(AXES.map((x) => [x, rows.reduce((a, r) => a + r[x], 0) / rows.length]))
  return rows.reduce((a, r) => a + dist(r, centre), 0) / rows.length
}

const result = {}
for (const level of ['safe', 'balanced', 'wild']) {
  setCreativity(level)
  let spread = 0
  let n = 0
  const heroes = new Set()
  for (const prompt of PROMPTS) {
    const seen = new Set()
    for (let v = 0; v < 12; v += 1) {
      const page = generateLibraryPage(prompt, v, 'better', true, 'auto')
      const ids = page.sections.map((s) => s.componentId)
      seen.add(ids.join('|'))
      heroes.add(page.sections.find((s) => s.role === 'hero')?.componentId)
      spread += spreadOf(page)
      n += 1
      ok(!ids.some((id) => EXCLUDED.includes(id)), `${level}: no part the list leaves out is chosen`)
      ok(new Set(ids).size === ids.length, `${level}: no part is used twice (${prompt.slice(0, 16)} #${v})`)
      ok(ids.every((id) => !!axesOf(id)), `${level}: every chosen part has a taste`)
    }
    ok(seen.size >= 11, `${level}: 12 variations of "${prompt.slice(0, 18)}" are different designs (${seen.size})`)
  }
  result[level] = { spread: spread / n, heroes: heroes.size }
}
ok(result.balanced.heroes >= 12 && result.wild.heroes >= 12, `the first screens vary (${result.balanced.heroes} balanced, ${result.wild.heroes} wild)`)
ok(result.balanced.spread < result.safe.spread * 0.92, `balanced parts agree more than parts drawn one by one (${result.balanced.spread.toFixed(2)} against ${result.safe.spread.toFixed(2)})`)

// the feel of the business: a gym's first screens are louder than a clinic's
setCreativity('balanced')
const loud = (prompt) => {
  let sum = 0
  for (let v = 0; v < 12; v += 1) sum += axesOf(generateLibraryPage(prompt, v, 'better', true, 'auto').sections.find((s) => s.role === 'hero').componentId)?.weight ?? 0
  return sum / 12
}
ok(loud('gym in Jaipur with personal training') > loud('dental clinic Smile Care in Pune') - 0.02, 'a gym is as loud as or louder than a clinic')
const gym = targetFor('bold_fitness', undefined, 0, 'balanced')
const clinic = targetFor('healthcare', undefined, 0, 'balanced')
ok(gym.weight > clinic.weight + 0.3 && clinic.soft > gym.soft && targetFor('luxury_minimal', 'maison-noir', 0, 'balanced').dark > 0.6, 'the target taste follows the business and the design')
ok(JSON.stringify(targetFor('healthcare', undefined, 3, 'balanced')) === JSON.stringify(targetFor('healthcare', undefined, 3, 'balanced')) && JSON.stringify(targetFor('healthcare', undefined, 3, 'balanced')) !== JSON.stringify(targetFor('healthcare', undefined, 4, 'balanced')), 'a variation is a fixed place of the taste space, and the next variation is another one')

// the same prompt and variation always give the same page
setCreativity('wild')
const a = generateLibraryPage('kurti boutique Jaipur', 5, 'better').sections.map((s) => s.componentId).join()
const b = generateLibraryPage('kurti boutique Jaipur', 5, 'better').sections.map((s) => s.componentId).join()
ok(a === b, 'the same prompt and variation give the same page')
setCreativity('balanced')

// composePage by itself: every role is filled, a fixed part stays
const roles = Object.keys(rolePools)
const picks = composePage({ roles, theme: 'healthcare', tier: 'better', variation: 2, level: 'balanced', rand: (() => { let s = 7; return () => ((s = (s * 9301 + 49297) % 233280) / 233280) })(), fixed: { hero: 'hero/Hero2' } })
ok(roles.every((r) => !!picks[r]) && picks.hero === 'hero/Hero2', 'every role is filled and a fixed part stays')

// learning from what the person kept and turned down
const record = (id, verdict, parts, key = 'dental clinic') => ({ id, at: '', key, group: 'g', prompt: key, variation: 0, creativity: 'balanced', theme: 'healthcare', niche: '', paletteName: '', kind: 'curated', accent: '#336699', alt: '#996633', hue: 210, sat: 60, light: 40, mode: 'light', tier: 'better', heroLayout: parts[0], layouts: [], heroTitle: '', verdict, parts })
const rows = [record('1', 'good', ['hero/Hero2', 'footer/Footer3']), record('2', 'good', ['hero/Hero2', 'footer/Footer1']), record('3', 'bad', ['hero/Hero8', 'footer/Footer4'])]
const ins = analyse(rows, 'dental clinic')
ok(ins.parts.kept['hero/Hero2'] === 2 && ins.parts.turned['hero/Hero8'] === 1, 'the parts of kept and turned-down pages are counted')
ok(partsScore(['hero/Hero2', 'footer/Footer3'], ins) > 0.6 && partsScore(['hero/Hero8', 'footer/Footer4'], ins) < 0.4 && partsScore(['hero/Hero1'], ins) === 0.5 && partsScore(['hero/Hero2'], analyse([], 'x')) === 0.5, 'kept parts score high, turned-down parts low, unknown parts neutral')
const base = { accent: '#336699', alt: '#996633', hue: 210, sat: 60, light: 40, mode: 'light', tier: 'better', heroLayout: 'hero/Hero2', kind: 'curated', theme: 'healthcare' }
ok(tasteScore({ ...base, parts: ['hero/Hero2', 'footer/Footer3'] }, ins) > tasteScore({ ...base, parts: ['hero/Hero8', 'footer/Footer4'] }, ins), 'the next design leans to what was kept')
ok(analyse(rows, 'gym').parts.kept['hero/Hero2'] === 0.8, 'a kept part of another business counts a little')
ok(ins.summary.some((l) => /Hero2/.test(l)), 'the summary names the parts that were kept')

console.log(`${pass} passed, ${fail.length} failed`)
for (const f of [...new Set(fail)].slice(0, 12)) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

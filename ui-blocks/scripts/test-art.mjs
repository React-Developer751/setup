// The maths pictures: Perlin noise, fractals, L-systems, colour theory, and the judge that keeps only the best.
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const { Perlin } = await loadGeneratorModule('art/perlin.ts')
const { escapeField, expand, turtle, fit, L_SYSTEMS, MANDELBROT_VIEWS } = await loadGeneratorModule('art/fractals.ts')
const { harmony, hexToRgb, rgbToHsl, OFFSETS, SCHEMES, rampAt } = await loadGeneratorModule('art/color.ts')
const { judge, roughness } = await loadGeneratorModule('art/judge.ts')
const { makeArt, randomGenome } = await loadGeneratorModule('art/generate.ts')
const { renderGenome, BASES, OVERLAYS } = await loadGeneratorModule('art/render.ts')
const { newImg } = await loadGeneratorModule('art/buffer.ts')
const { seededRandom } = await loadGeneratorModule('random.ts')

// ── Perlin noise is smooth, static is not
const p = new Perlin(7)
let smooth = 0
let n = 0
let min = 9
let max = -9
for (let i = 0; i < 4000; i += 1) {
  const x = i * 0.013
  const a = p.noise(x, 3.1)
  const b = p.noise(x + 0.013, 3.1)
  smooth += Math.abs(a - b)
  n += 1
  min = Math.min(min, a)
  max = Math.max(max, a)
}
const rand = seededRandom(1)
let whiteNoise = 0
for (let i = 0; i < 4000; i += 1) whiteNoise += Math.abs(rand() * 2 - 1 - (rand() * 2 - 1))
ok(smooth / n < 0.05 && smooth / n < whiteNoise / n / 10, `Perlin neighbours are close (${(smooth / n).toFixed(4)}) while random values are not (${(whiteNoise / n).toFixed(3)})`)
ok(min >= -1.2 && max <= 1.2 && max - min > 0.8, `the noise stays in range and uses it (${min.toFixed(2)} to ${max.toFixed(2)})`)
ok(new Perlin(7).noise(1.3, 2.2) === p.noise(1.3, 2.2) && new Perlin(8).noise(1.3, 2.2) !== p.noise(1.3, 2.2), 'seeded: the same seed gives the same noise')
ok(Math.abs(p.fbm(0.5, 0.5, 5)) <= 1.01, 'several octaves stay in range')

// ── fractals
const field = escapeField(64, 40, MANDELBROT_VIEWS[0], 80)
const values = [...field]
ok(values.some((v) => v === 0) && values.some((v) => v > 0.1) && new Set(values.map((v) => Math.round(v * 40))).size > 8, 'the Mandelbrot field has an inside, an outside and many bands between')
const koch = L_SYSTEMS.find((l) => l.name === 'snowflake')
ok(turtle(expand(koch, 3), koch.angle).length === 3 * 4 ** 3, 'a Koch snowflake of 3 steps has 3 x 4^3 lines')
const tree = L_SYSTEMS.find((l) => l.name === 'tree')
ok(turtle(expand(tree, 4), tree.angle).length > 200, 'an L-system tree grows many branches')
const boxed = fit(turtle(expand(koch, 3), 60), { x: 10, y: 10, w: 100, h: 80 }).segments
ok(boxed.every(([a, b, c, d]) => Math.min(a, c) >= 9.9 && Math.max(a, c) <= 110.1 && Math.min(b, d) >= 9.9 && Math.max(b, d) <= 90.1), 'the drawing is fitted into its box')

// ── colour theory: the colours follow the rule
for (const scheme of SCHEMES) {
  const pal = harmony('#2563eb', scheme, false)
  ok(pal.ramp.length === 5 && pal.hues.length === OFFSETS[scheme].length, `${scheme}: a ramp and the hues of the rule`)
}
const base = rgbToHsl(hexToRgb('#2563eb')).h
const comp = harmony('#2563eb', 'complementary', false).hues
ok(Math.abs(((comp[1] - comp[0] + 360) % 360) - 180) < 1 && Math.abs(comp[0] - base) < 1, 'complementary: the second hue is opposite the first')
const tri = harmony('#2563eb', 'triadic', false).hues
ok(Math.abs(tri[1] - tri[0] - 120) < 1 && Math.abs(tri[2] - tri[0] - 240) < 1, 'triadic: the hues are 120 degrees apart')
const lightEnd = rampAt(harmony('#2563eb', 'analogous', false).ramp, 1)
const deepEnd = rampAt(harmony('#2563eb', 'analogous', false).ramp, 0)
ok(lightEnd[0] + lightEnd[1] + lightEnd[2] > deepEnd[0] + deepEnd[1] + deepEnd[2], 'the ramp goes from deep to light')
const darkRamp = harmony('#2563eb', 'analogous', true).ramp
ok(darkRamp[0][0] + darkRamp[0][1] + darkRamp[0][2] < 120, 'a dark picture stays deep')

// ── the judge
const staticImg = newImg(96, 60)
const r2 = seededRandom(5)
for (let i = 0; i < 96 * 60; i += 1) { staticImg.data[i * 4] = r2() * 255; staticImg.data[i * 4 + 1] = r2() * 255; staticImg.data[i * 4 + 2] = r2() * 255 }
ok(!judge(staticImg, '#2563eb').ok && roughness(staticImg) > 0.2, 'pure random pixels (static) are rejected')
ok(!judge(newImg(96, 60), '#2563eb').ok, 'a blank picture is rejected')

// ── making art: valid, varied, seeded, fast enough
const a1 = makeArt({ seed: 11, accent: '#0d9488', width: 320, height: 200 })
const a2 = makeArt({ seed: 11, accent: '#0d9488', width: 320, height: 200 })
ok(a1.report.ok && a1.report.score >= 0.5, `the art passes the judge (score ${a1.report.score})`)
ok(Buffer.from(a1.image.data).equals(Buffer.from(a2.image.data)), 'seeded: the same seed gives the same picture')
ok(a1.tried > 20 && a1.tried >= a1.rejected, `many designs are tried and only the best is shown (${a1.tried} tried, ${a1.rejected} rejected)`)
const distance = (x, y) => { let d = 0; for (let i = 0; i < x.data.length; i += 16) d += Math.abs(x.data[i] - y.data[i]); return d / (x.data.length / 16) }
const arts = [21, 22, 23, 24, 25, 26].map((s) => makeArt({ seed: s, accent: '#7c3aed', width: 160, height: 100 }))
let minGap = 999
for (let i = 0; i < arts.length; i += 1) for (let j = i + 1; j < arts.length; j += 1) minGap = Math.min(minGap, distance(arts[i].image, arts[j].image))
ok(minGap > 8, `different seeds give clearly different pictures (closest pair differs by ${minGap.toFixed(1)} of 255)`)
ok(arts.every((a) => a.report.ok), 'every picture of the set passes the judge')
ok(new Set(arts.map((a) => `${a.genome.base}+${a.genome.overlay}`)).size >= 4, 'the set uses many kinds of backgrounds and drawings')
// every background and every drawing renders without trouble
let combos = 0
for (const b of BASES) for (const o of OVERLAYS) { const img = renderGenome({ ...randomGenome(seededRandom(3), false), base: b, overlay: o, seed: 9 }, 96, 60, '#dc2626'); if (img.data.length === 96 * 60 * 4) combos += 1 }
ok(combos === BASES.length * OVERLAYS.length, 'all background and drawing kinds render')
for (const accent of ['#2563eb', '#dc2626', '#16a34a', '#ea580c', '#7c3aed', '#0d9488', '#be185d', '#ca8a04', '#111827', '#f9fafb']) {
  const a = makeArt({ seed: 77, accent, width: 120, height: 75, dark: accent === '#111827' })
  ok(a.report.ok, `any base colour works: ${accent} (score ${a.report.score})`)
}
const t0 = Date.now()
makeArt({ seed: 5, accent: '#2563eb', width: 768, height: 480 })
ok(Date.now() - t0 < 2500, `a full-size picture takes under 2.5 seconds (${Date.now() - t0} ms)`)

console.log(`${pass} checks passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

// Reads every stored component (src/components/**/*.tsx), measures how it is built, and writes what it learned to src/data/models/component-taste.json:
// for each component seven numbers between 0 and 1 (its "taste"): how dense, how loud, how soft, how dark, how picture-led, how centred, how airy.
// The generator (src/generator/library/taste.ts) uses them to choose parts that belong together instead of drawing every part on its own.
// It is plain counting of what is in the markup: no model, no network. Run again whenever components are added:  npm run learn:components
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('src/components')
const out = path.resolve('src/data/models/component-taste.json')
const clamp = (v) => Math.max(0, Math.min(1, v))
const count = (text, re) => (text.match(re) ?? []).length
const round = (v) => Math.round(v * 100) / 100

function measure(source) {
  // comments and the dark: variants are left out of the base look
  const code = source.replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
  const lines = code.split('\n').length
  const headings = count(code, /<h[1-6]\b/g)
  const paragraphs = count(code, /<p\b/g)
  const buttons = count(code, /<button\b/g) + count(code, /<a\b[^>]*\b(?:py-\d|px-\d)[^>]*>/g)
  const items = count(code, /<li\b/g) + count(code, /<article\b/g)
  const images = count(code, /<img\b/g)
  const svgs = count(code, /<svg\b/g)
  const inputs = count(code, /<(?:input|textarea|select)\b/g)
  const bgImage = count(code, /bg-cover|bg-\[url|bg-center/g)
  const rounded = count(code, /\brounded-(?:lg|xl|2xl|3xl|full)\b/g)
  const sharp = count(code, /\brounded-none\b|\bborder-(?:2|4)\b|\buppercase\b/g)
  const shadows = count(code, /\bshadow-(?:md|lg|xl|2xl)\b/g)
  const gradients = count(code, /\bbg-gradient|\bfrom-[a-z]|\bvia-[a-z]|\bto-[a-z]/g)
  const bigText = count(code, /\b(?:text-(?:4xl|5xl|6xl|7xl|8xl|9xl)|sm:text-(?:4xl|5xl|6xl)|lg:text-(?:5xl|6xl|7xl))\b/g)
  const bold = count(code, /\bfont-(?:bold|extrabold|black)\b/g)
  const centre = count(code, /\btext-center\b|\bjustify-center\b|\bmx-auto\b/g)
  const split = count(code, /\b(?:lg|md):(?:flex-row|w-1\/2|grid-cols-2)\b|\bgrid-cols-2\b/g)
  const cols = Math.max(0, ...[...code.matchAll(/(?:^|[\s"'`:])(?:grid-cols|columns)-(\d)\b/g)].map((m) => Number(m[1])))
  const padding = [...code.matchAll(/\bpy-(\d{1,2})\b/g)].map((m) => Number(m[1]))
  const avgPad = padding.length ? padding.reduce((a, b) => a + b, 0) / padding.length : 8
  const darkBase = count(code.replace(/\bdark:[^\s"'`]+/g, ''), /\bbg-(?:gray|slate|zinc|neutral|stone)-(?:800|900|950)\b|\bbg-black\b|\bbg-neutral-950\b/g)
  const lightBase = count(code.replace(/\bdark:[^\s"'`]+/g, ''), /\bbg-white\b|\bbg-gray-(?:50|100)\b|\bbg-slate-50\b/g)

  const els = headings + paragraphs + buttons + items + images
  return {
    f: { lines, headings, paragraphs, buttons, items, images, svgs, inputs, cols, split },
    axes: {
      // how much is on the screen: many small things = dense, a headline and a button = sparse
      density: round(clamp((paragraphs * 0.7 + items * 0.45 + buttons * 0.4 + headings * 0.3 + svgs * 0.1) / 16)),
      // how loud: big type, gradients, bold, shadows, pictures, dark
      weight: round(clamp(bigText * 0.22 + gradients * 0.05 + bold * 0.03 + shadows * 0.03 + Math.min(images, 4) * 0.08 + (darkBase > lightBase ? 0.3 : 0) + (bgImage ? 0.2 : 0))),
      // round and friendly (rounded corners, soft shadows) against sharp and formal (hard borders, capitals)
      soft: round(clamp(0.5 + (rounded * 0.06 + shadows * 0.03) - sharp * 0.08 - (rounded === 0 ? 0.1 : 0))),
      dark: round(darkBase > lightBase ? 1 : darkBase > 0 ? 0.4 : 0),
      // led by pictures
      image: round(clamp(images * 0.22 + bgImage * 0.35)),
      // centred layout against split or aligned left
      center: round(clamp(centre / Math.max(4, els) * 1.4 - split * 0.05)),
      // how much air: the padding of its parts
      airy: round(clamp((avgPad - 4) / 20)),
    },
  }
}

const result = {}
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith('.tsx')) {
      const id = path.relative(root, full).replace(/\.tsx$/, '')
      result[id] = measure(fs.readFileSync(full, 'utf8'))
    }
  }
}
walk(root)
const ids = Object.keys(result).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
const sorted = Object.fromEntries(ids.map((id) => [id, result[id]]))
fs.writeFileSync(out, `${JSON.stringify({ version: 1, learnedFrom: ids.length, components: sorted })}\n`)
console.log(`component-taste.json written: ${ids.length} components`)
const sample = ['hero/Hero2', 'hero/Hero8', 'footer/Footer3', 'gallery/Gallery1', 'refkit/RefHero1']
for (const id of sample) if (sorted[id]) console.log(`  ${id.padEnd(18)} ${JSON.stringify(sorted[id].axes)}`)

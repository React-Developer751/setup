// Turns single stored cards (src/components/card) into card sections: a heading, a line of text and the same card three times.
// A lone card is not a page part, so each one is wrapped here and then lives in src/components/cardgrid as CardGrid<n>.
// Usage: node scripts/make-cardgrids.mjs
import fs from 'node:fs'
import path from 'node:path'

const from = 'src/components/card'
const to = 'src/components/cardgrid'
// the cards that still read well when filled with the text of any business (a post with a picture); the others are shop, wallet, course, profile or login cards
const CARDS = [1, 3, 4, 9]

fs.rmSync(to, { recursive: true, force: true })
fs.rmSync('src/components/stepsection', { recursive: true, force: true })
fs.mkdirSync(to, { recursive: true })
for (const n of CARDS) {
  const source = fs.readFileSync(path.join(from, `Card${n}.tsx`), 'utf8')
  const lines = source.split('\n')
  const lead = lines[0].startsWith('// @ts-nocheck') ? lines[0] + '\n' : ''
  const start = source.indexOf('return (') + 'return ('.length
  const end = source.lastIndexOf('\n  )')
  const card = source.slice(start, end).trim()
  const cell = `<div className="flex justify-center">\n${card}\n          </div>`
  const out = `${lead}export default function CardGrid${n}() {
  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="container px-6 py-16 mx-auto">
        <h2 className="text-2xl font-semibold text-center text-gray-800 capitalize lg:text-3xl dark:text-white">Section title</h2>
        <p className="max-w-2xl mx-auto mt-4 text-center text-gray-500 dark:text-gray-300">Section text goes here, a short line that introduces the cards below.</p>
        <div className="grid grid-cols-1 gap-8 mt-12 md:grid-cols-2 xl:grid-cols-3">
          ${cell}
          ${cell}
          ${cell}
        </div>
      </div>
    </section>
  )
}
`
  fs.writeFileSync(path.join(to, `CardGrid${n}.tsx`), out)
}
console.log(`${CARDS.length} card sections written to ${to}`)

// Bare widgets (a stepper, a carousel) get a heading and a line of text above them so they work as a section of a page.
const WRAPPED = [
  { dir: 'stepsection', name: 'StepSection', from: 'stepper', source: 'Stepper', numbers: [3, 6], inner: 'max-w-4xl' },
]
for (const { dir, name, from: folder, source: prefix, numbers, inner } of WRAPPED) {
  fs.mkdirSync(`src/components/${dir}`, { recursive: true })
  for (const n of numbers) {
    const text = fs.readFileSync(path.join('src/components', folder, `${prefix}${n}.tsx`), 'utf8')
    const lead = text.startsWith('// @ts-nocheck') ? text.split('\n')[0] + '\n' : ''
    const body = text.slice(text.indexOf('return (') + 'return ('.length, text.lastIndexOf('\n  )')).trim()
    fs.writeFileSync(
      `src/components/${dir}/${name}${n}.tsx`,
      `${lead}export default function ${name}${n}() {
  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="container px-6 py-16 mx-auto">
        <h2 className="text-2xl font-semibold text-center text-gray-800 capitalize lg:text-3xl dark:text-white">Section title</h2>
        <p className="max-w-2xl mx-auto mt-4 mb-10 text-center text-gray-500 dark:text-gray-300">Section text goes here, a short line that introduces what follows.</p>
        <div className="${inner} mx-auto">
          ${body}
        </div>
      </div>
    </section>
  )
}
`,
    )
  }
  console.log(`${numbers.length} sections written to src/components/${dir}`)
}

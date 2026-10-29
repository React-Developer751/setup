// A component file changed in the Code tab is compiled in the browser: every stored component must compile (so that opening and saving one works),
// a mistake is reported with its position, and a file that imports something other than react is refused before it runs.
import fs from 'node:fs'
import path from 'node:path'
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const { compileSource, requiredModules } = await loadGeneratorModule('library/componentCompile.ts')

// a small component, run with a stand-in for the jsx runtime
const sample = `export default function Box() {\n  return <section className="p-4" data-x="1"><h2>Hi</h2></section>\n}\n`
const compiled = compileSource(sample)
ok('code' in compiled, 'a small component compiles')
const run = (code) => {
  const module = { exports: {} }
  const jsx = (type, props) => ({ type, props })
  new Function('require', 'exports', 'module', code)((name) => ({ 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'frag' } })[name], module.exports, module)
  return module.exports.default
}
const element = run(compiled.code)()
ok(element.type === 'section' && element.props.className === 'p-4' && element.props['data-x'] === '1', 'the compiled component draws the markup it was written with')
ok(requiredModules(compiled.code).join() === 'react/jsx-runtime', 'a component asks only for the jsx runtime')

// a mistake is explained with its place
const broken = compileSource(sample.replace('<h2>Hi</h2>', '<h2>Hi'))
ok('error' in broken && /mistake/.test(broken.error) && /\(\d+:\d+\)/.test(broken.error), 'a broken file says where')
// another import is found before the file runs
const other = compileSource(`import _ from 'lodash'\nexport default function A() { return <p>{_.toString(1)}</p> }\n`)
ok('code' in other && requiredModules(other.code).includes('lodash'), 'an import other than react is seen')
// TypeScript is understood
const typed = compileSource(`type P = { n: number }\nexport default function T({ n }: P) { return <p>{n as number}</p> }\n`)
ok('code' in typed, 'TypeScript types are removed')

// every stored component compiles
const files = []
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith('.tsx')) files.push(full)
  }
}
walk(path.resolve('src/components'))
const bad = []
let imports = 0
for (const file of files) {
  const result = compileSource(fs.readFileSync(file, 'utf8'))
  if ('error' in result) bad.push(`${path.relative('src/components', file)}: ${result.error}`)
  else if (requiredModules(result.code).some((m) => !['react', 'react/jsx-runtime'].includes(m))) imports += 1
}
ok(files.length > 300, `the stored components were found (${files.length})`)
ok(bad.length === 0, `every stored component compiles (${bad.slice(0, 2).join(' | ')})`)
ok(imports === 0, `no stored component imports anything but react (${imports})`)

console.log(`${pass} passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

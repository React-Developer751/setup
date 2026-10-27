// The Vite project of a page made from the stored components (the "Project (.zip)" export) is written to a folder and built with Vite:
// one page and a site with pages. It must build, and the built page must hold the text of the business.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, n) => (c ? (pass += 1) : fail.push(n))

globalThis.document = { styleSheets: [] }
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { libraryProjectEntries, contentTypesFrom } = await loadGeneratorModule('library/projectBuilder.ts')

const src = path.resolve('src')
const read = async (file) => (fs.existsSync(path.join(src, file)) && fs.statSync(path.join(src, file)).isFile() ? fs.readFileSync(path.join(src, file), 'utf8') : undefined)
const env = {
  packageJson: fs.readFileSync('package.json', 'utf8'),
  indexCss: fs.readFileSync('src/index.css', 'utf8'),
  readSource: read,
  readComponent: async (id) => fs.readFileSync(path.join(src, 'components', `${id}.tsx`), 'utf8'),
  contentTypes: () => contentTypesFrom(fs.readFileSync('src/generator/finalPrompt.ts', 'utf8'), fs.readFileSync('src/generator/extraContent.ts', 'utf8'), fs.readFileSync('src/generator/siteTypes.ts', 'utf8')),
  motionTypes: () => {
    const text = fs.readFileSync('src/generator/motionBrain.ts', 'utf8')
    return text.slice(text.indexOf('export type MotionSetting'), text.indexOf('const STYLE_BY_THEME')).trim() + '\n'
  },
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'lib-project-'))
const CASES = [['one page', false, 'dental clinic called Smile Care in Pune'], ['pages', true, 'pizza shop called Slice Hub in Mumbai']]
// ALL_PROJECTS=1 builds a project for many kinds of business (slow: one Vite build each)
if (process.env.ALL_PROJECTS) {
  const prompts = ['law firm called Rao and Partners', 'yoga studio in Goa', 'online store for kurtis and sarees', 'gym called Iron Pulse in Delhi', 'bakery called Crumb', 'kids school in Jaipur', 'plumber in Delhi', 'real estate agency Skyline', 'hair salon Glow', 'pest control company in Pune', 'SaaS startup for invoicing', 'NGO for children']
  prompts.forEach((prompt, i) => CASES.push([`case-${i}${i % 2 ? '-pages' : ''}`, i % 2 === 1, prompt]))
}
for (const [label, multi, prompt] of CASES) {
  const lib = generateLibraryPage(prompt, 3, 'better', true, 'auto', undefined, multi)
  const entries = await libraryProjectEntries(lib, env)
  const dir = path.join(work, label.replace(' ', '-'))
  for (const entry of entries) {
    const target = path.join(dir, entry.path)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, entry.content)
  }
  const root = path.join(dir, entries[0].path.split('/')[0])
  ok(fs.existsSync(path.join(root, 'src/generator/library/ThemeScope.tsx')), `${label}: the runtime is in the project`)
  ok(!fs.readFileSync(path.join(root, 'package.json'), 'utf8').includes('"tsc -b'), `${label}: the build is a plain vite build`)
  // the packages are the ones of this checkout
  fs.symlinkSync(path.resolve('node_modules'), path.join(root, 'node_modules'))
  const built = spawnSync(process.execPath, [path.resolve('node_modules/vite/bin/vite.js'), 'build'], { cwd: root, encoding: 'utf8', timeout: 240000 })
  ok(built.status === 0, `${label}: vite builds the project (${(built.stdout + built.stderr).split('\n').filter((l) => /error|Error|Could not/i.test(l)).slice(0, 3).join(' | ')})`)
  const dist = path.join(root, 'dist')
  const js = fs.existsSync(path.join(dist, 'assets')) ? fs.readdirSync(path.join(dist, 'assets')).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(dist, 'assets', f), 'utf8')).join('\n') : ''
  ok(js.includes(lib.content.brandName), `${label}: the built page has the name of the business`)
  if (multi) ok(js.includes('data-page') && js.includes('hashchange'), `${label}: the built site switches its pages`)
}
// KEEP_PROJECT=folder keeps the built projects there (to open the finished site in a browser)
if (process.env.KEEP_PROJECT) fs.cpSync(work, path.resolve(process.env.KEEP_PROJECT), { recursive: true })
fs.rmSync(work, { recursive: true, force: true })
console.log(`project: ${pass} checks passed, ${fail.length} failed`)
if (fail.length) { console.log(fail.map((f) => ` - ${f}`).join('\n')); process.exit(1) }

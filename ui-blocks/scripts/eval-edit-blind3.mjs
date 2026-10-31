// A third set, written fresh (a different business, different words) AFTER the parser was fixed for the first two: the honest number for requests nobody tuned the parser to.
import { loadGeneratorModule } from './lib/load-generator.mjs'
globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const { parseEdit } = await loadGeneratorModule('edit/understand.ts')
const { editsFrom } = await loadGeneratorModule('edit/edits.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const PROMPT = 'Dental clinic in Pune: braces, implants, root canal, teeth whitening. gallery and faq too'
const base = generateLibraryPage(PROMPT, 4, undefined, true, 'auto', undefined, true)
const single = generateLibraryPage(PROMPT, 4, undefined, true, 'auto', undefined, false)
const txt = (lib) => JSON.stringify(lib.content).toLowerCase()
const has = (...w) => (lib) => w.every((x) => txt(lib).includes(String(x).toLowerCase()))
const noRole = (r) => (lib) => !lib.sections.some((s) => s.role === r)
const look = (_l, e, ops) => ops.some((o) => ['tier', 'accent', 'style', 'mode', 'tone', 'sectionColor', 'mood', 'alt', 'harmony'].includes(o.op))
const ops = (k) => (_l, _e, o) => o.some((x) => x.op === k)
const n = (lib) => lib.content
const CASES = [
  ['clinic ka naam "Bright Smiles Dental" kar do', has('Bright Smiles Dental')],
  ['main heading ko "Painless Dentistry in Pune" se badal do', has('Painless Dentistry in Pune')],
  ['upar wali line me likho: open all days, 9am to 8pm', has('open all days')],
  ['hero ke button pe Book Appointment likhna hai', has('Book Appointment')],
  ['change "Pune" to "Mumbai"', has('Mumbai')],
  ['our services ka heading Treatments rakho', has('Treatments')],
  ['phone 9922334455 hai', has('9922334455')],
  ['email: smile@brightsmiles.in', has('smile@brightsmiles.in')],
  ['address change karo: Shop 4, FC Road, Pune 411004', has('FC Road')],
  ['sunday ko clinic band rehta hai', (lib, e, o) => o.length > 0 && JSON.stringify(lib.content.hours ?? lib.content.contact).toLowerCase().includes('sun')],
  ['third service hata do', (lib) => n(lib).features.items.length === n(base).features.items.length - 1],
  ['teeth whitening wali service ko "Smile Whitening" naam do', has('Smile Whitening')],
  ['2nd faq ka answer: Yes, we accept most insurance plans', has('accept most insurance')],
  ['aakhri sawal hata do', (lib) => n(lib).faq.length === n(base).faq.length - 1],
  ['add faq: Is it painful? answer: No, we use numbing gel', has('Is it painful?', 'numbing gel')],
  ['testimonial jodo: "Best dentist ever" - Rohit', has('Best dentist ever', 'Rohit')],
  ['steps me ek aur step: Free consultation', has('Free consultation')],
  ['dark mode karo', (_l, e) => e.mode === 'dark'],
  ['button green chahiye', look],
  ['text thoda chhota karo', look],
  ['kuch alag design dikhao', (_l, _e, _o, k) => k === 'control'],
  ['pichla change undo karo', (_l, _e, _o, k) => k === 'control'],
  ['gallery hata do', noRole('gallery')],
  ['team section add karo', ops('add')],
  ['faq ko gallery se pehle dikhao', ops('move'), true],
  ['navbar me Contact ko Reach Us likho', ops('navLabel')],
  ['google map lagao', ops('widget')],
  ['appointment booking form chahiye', ops('widget')],
  ['isko pehle jaisa kar do', (_l, _e, _o, k) => k === 'control'],
  ['website pe kya kya change ho sakta hai?', (_l, _e, o, k) => k === 'none' || o.length === 0],
]
let pass = 0
const fails = []
for (const [text, check, one] of CASES) {
  let ok = false
  let note = ''
  try {
    const p = parseEdit(text, one ? 'single' : 'multi', { pages: !one, library: true, page: (one ? single : base).content })
    const o = p.kind === 'ops' ? p.ops : []
    const e = editsFrom(o)
    const lib = o.length ? generateLibraryPage(PROMPT, 4, undefined, true, 'auto', e, !one) : one ? single : base
    ok = !!check(lib, e, o, p.kind)
    note = p.kind === 'ops' ? `ops: ${o.map((x) => x.op).join(',') || '(none)'}${p.notes.length ? ` | ${p.notes[0].slice(0, 60)}` : ''}` : `kind: ${p.kind}`
  } catch (error) { note = `crashed: ${String(error).slice(0, 80)}` }
  if (ok) pass += 1
  else fails.push(`${text}   [${note}]`)
}
console.log(`${pass}/${CASES.length} = ${((100 * pass) / CASES.length).toFixed(0)}% of the fresh requests do what the person meant`)
for (const f of fails) console.log(`  ✗ ${f}`)

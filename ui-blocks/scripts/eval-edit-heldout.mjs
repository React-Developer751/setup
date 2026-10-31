// A second set of real edit requests, written WITHOUT looking at the parser: different words, different order, more indirect. Same check as eval-edit-real.mjs (the result on the site, not the parsed operations).
//   node scripts/eval-edit-heldout.mjs
import { loadGeneratorModule } from './lib/load-generator.mjs'

globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const { parseEdit } = await loadGeneratorModule('edit/understand.ts')
const { editsFrom } = await loadGeneratorModule('edit/edits.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')

const PROMPT = 'Yoga studio in Rishikesh, pricing: drop-in 500 rupees, monthly 3000 rupees, retreat 12000 rupees, gallery and FAQ'
const base = generateLibraryPage(PROMPT, 9, undefined, true, 'auto', undefined, true)
const single = generateLibraryPage(PROMPT, 9, undefined, true, 'auto', undefined, false)
const txt = (lib) => JSON.stringify(lib.content).toLowerCase()
const has = (...w) => (lib) => w.every((x) => txt(lib).includes(String(x).toLowerCase()))
const lacks = (...w) => (lib) => w.every((x) => !txt(lib).includes(String(x).toLowerCase()))
const role = (r) => (lib) => lib.sections.some((s) => s.role === r)
const noRole = (r) => (lib) => !lib.sections.some((s) => s.role === r)
const look = (_l, e, ops) => ops.some((o) => ['tier', 'accent', 'style', 'mode', 'tone', 'sectionColor', 'mood', 'alt', 'harmony'].includes(o.op))
const ops = (kind) => (_l, _e, o) => o.some((x) => x.op === kind)
const planPrice = (name, price) => (lib) => lib.content.pricing.plans.some((p) => p.name.toLowerCase().includes(name) && p.price.replace(/[^\d]/g, '') === String(price))

const CASES = [
  // the words of the page
  ['mera business ka naam ab "Asana Retreats" hoga', has('Asana Retreats')],
  ['homepage pe sabse upar "Find Your Calm" dikhana hai', has('Find Your Calm')],
  ['neeche wali line me likh do: classes every morning at 6am', has('classes every morning at 6am')],
  ['book karne wale button pe "Reserve Spot" likhna', has('Reserve Spot')],
  ['kya aap about wale part ka title "Meet Your Teacher" kar sakte ho', has('Meet Your Teacher')],
  ['I want the services heading to read What We Teach', has('What We Teach')],
  ['bottom banner me "Join our next batch" likho', has('Join our next batch')],
  ['change Rishikesh to Haridwar everywhere', has('Haridwar')],
  ['contact section ka title Get In Touch kar do', has('Get In Touch')],
  // how to reach
  ['call karne ke liye 9899001122 dalo', has('9899001122')],
  ['email id hai namaste@asanaretreats.in', has('namaste@asanaretreats.in')],
  ['humara address hai Tapovan Road, Rishikesh 249192', has('Tapovan Road')],
  ['whatsapp pe 9899001122 par contact karo', has('9899001122')],
  // items
  ['drop-in plan ka price 600 kar do', planPrice('drop', 600)],
  ['retreat wale package ka rate 15000 rupees karo', planPrice('retreat', 15000)],
  ['monthly plan ka naam "Unlimited Monthly" rakho', has('Unlimited Monthly')],
  ['pehla sawal hata do faq se', (lib) => lib.content.faq.length === base.content.faq.length - 1],
  ['add one more faq: Do I need experience? answer: No, beginners are welcome', has('Do I need experience?', 'beginners are welcome')],
  ['2nd service ko "Sound Healing" naam do', has('Sound Healing')],
  ['last wali service delete karo', (lib) => lib.content.features.items.length === base.content.features.items.length - 1],
  ['ek review add karo "Life changing week" by Anita from Delhi', has('Life changing week', 'Anita')],
  ['stats me "12 years of teaching" jodo', has('12')],
  ['pehle step ka title "Choose your class" kar do', has('Choose your class')],
  ['about me yeh likh do: hum 2012 se yoga sikha rahe hain Rishikesh me', has('2012')],
  // looks
  ['buttons ka colour orange kar do', look],
  ['website dark theme me chahiye', (_l, e) => e.mode === 'dark'],
  ['light mode on kar do', (_l, e) => e.mode === 'light'],
  ['thoda calm aur soft look do', look],
  ['bold aur modern lagna chahiye', look],
  ['headings ka font bada karo', look],
  ['yeh design mujhe kuch alag chahiye', (_l, _e, _o, k) => k === 'control'],
  // sections and pages
  ['gallery nahi chahiye', noRole('gallery')],
  ['faq wala part nikal do', noRole('faq')],
  ['team ka section jodo', ops('add')],
  ['pricing ko gallery ke neeche rakh do', ops('move'), true],
  ['sabse upar about dikhao', ops('move'), true],
  ['hero image bada karo', (_l, e) => Object.keys(e.sizes ?? {}).length > 0],
  ['blog ka page bana do', ops('addPage')],
  ['menu me Gallery ko Photos likho', ops('navLabel')],
  // working parts and cannot-do
  ['whatsapp chat button chahiye neeche right me', ops('widget')],
  ['class booking ka form lagao', ops('widget')],
  ['youtube video lagana hai https://youtu.be/abc12345678', ops('widget')],
  // follow-ups
  ['phone ka number badal ke 9811100011 kar do aur email info@asana.in', has('9811100011', 'info@asana.in')],
  ['sab hata ke fir se shuru karo', (_l, _e, _o, kind) => kind === 'control'],
  ['wapas pehle jaisa kar do', (_l, _e, _o, kind) => kind === 'control'],
]
let pass = 0
const fails = []
for (const [text, check, one] of CASES) {
  let verdict = false
  let note = ''
  try {
    const p = parseEdit(text, one ? 'single' : 'multi', { pages: !one, library: true, page: (one ? single : base).content })
    const o = p.kind === 'ops' ? p.ops : []
    const e = editsFrom(o)
    const lib = o.length ? generateLibraryPage(PROMPT, 9, undefined, true, 'auto', e, !one) : one ? single : base
    verdict = !!check(lib, e, o, p.kind)
    note = p.kind === 'ops' ? `ops: ${o.map((x) => x.op).join(',') || '(none)'}${p.notes.length ? ` | ${p.notes[0].slice(0, 60)}` : ''}` : `kind: ${p.kind}`
  } catch (error) {
    note = `crashed: ${String(error).slice(0, 80)}`
  }
  if (verdict) pass += 1
  else fails.push(`${text}   [${note}]`)
}
console.log(`${pass}/${CASES.length} = ${((100 * pass) / CASES.length).toFixed(0)}% of the held-out requests do what the person meant`)
for (const f of fails) console.log(`  ✗ ${f}`)

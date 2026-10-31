// What a real person types to change a site that is already made (not the first description of it): each command is parsed, applied to a made site, and the RESULT is checked, not the parsed operations.
// Hinglish and English, the way people write: with typos, "isko", "wala", numbers inside, quotes or none.   node scripts/eval-edit-real.mjs [--list]
import { loadGeneratorModule } from './lib/load-generator.mjs'

globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const { parseEdit } = await loadGeneratorModule('edit/understand.ts')
const { editsFrom } = await loadGeneratorModule('edit/edits.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')

const PROMPT = 'Meri bakery ke liye website banao, Jaipur me, eggless cakes. gallery aur faq ke saath'
const base = generateLibraryPage(PROMPT, 7, undefined, true, 'auto', undefined, true)
const GYM = 'Gym in Pune with personal training, plans: basic 999 rupees, premium 1999 rupees'
const has = (...words) => (lib) => { const t = JSON.stringify(lib.content).toLowerCase(); return words.every((w) => t.includes(String(w).toLowerCase())) }
const lacks = (...words) => (lib) => { const t = JSON.stringify(lib.content).toLowerCase(); return words.every((w) => !t.includes(String(w).toLowerCase())) }
const role = (r) => (lib) => lib.sections.some((s) => s.role === r)
const noRole = (r) => (lib) => !lib.sections.some((s) => s.role === r)
const page = (label) => (lib) => (lib.pages ?? []).some((p) => p.label.toLowerCase() === label.toLowerCase())
const edits = (fn) => (_lib, e) => fn(e)
const changedLook = (_lib, e, ops) => ops.some((o) => ['tier', 'accent', 'style', 'mode', 'tone', 'sectionColor', 'mood', 'alt', 'harmony', 'theme'].includes(o.op))
const order = (a, b) => (lib) => { const roles = lib.sections.map((s) => s.role); return roles.indexOf(a) >= 0 && roles.indexOf(b) >= 0 && roles.indexOf(a) < roles.indexOf(b) }

// [what is typed, what must be true afterwards, base prompt]
const CASES = [
  // ── words on the page
  ['hero ka title "Fresh Cakes Daily" kar do', has('Fresh Cakes Daily')],
  ['services me 3 naye add karo: Wedding Cakes, Cupcakes, Brownies', (lib) => has('Wedding Cakes', 'Cupcakes', 'Brownies')(lib) && lib.content.features.items.length >= 8 && lib.content.added?.features === 3],
  ['add a new service called Macarons', (lib) => has('Macarons')(lib) && lib.content.features.items.length >= 7],
  ['services me Pastry aur Bread bhi add karo', has('Pastry', 'Bread')],
  ['my channel is called Wander Duo', has('Wander Duo')],
  ['my podcast is called Startup Chai', has('Startup Chai')],
  ['upar wali line me likho: Fresh every morning', (lib) => lib.content.subject === 'Fresh every morning'],
  ['eyebrow badlo: Since 1998', (lib) => lib.content.subject === 'Since 1998'],
  ['headline change karke Best Eggless Cakes in Jaipur karo', has('Best Eggless Cakes in Jaipur')],
  ['change the main heading to Baked With Love', has('Baked With Love')],
  ['subtitle me likho: Order before 6pm for same day delivery', has('Order before 6pm for same day delivery')],
  ['hero button ka text Order Now kar do', has('Order Now')],
  ['change the hero button to Call us', has('Call us')],
  ['about section ka heading Our Story rakho', has('Our Story')],
  ['about me likho ki hum 2010 se cakes bana rahe hain', has('2010')],
  ['business ka naam Sweet Crumbs rakh do', has('Sweet Crumbs')],
  ['naam badal ke Sweet Crumbs karo', has('Sweet Crumbs')],
  ['rename the shop to Cake Corner', has('Cake Corner')],
  ['cta banner ka title "Order your cake today" kar do', has('Order your cake today')],
  ['services wale section ka title Our Specials karo', has('Our Specials')],
  ['contact section ka heading Visit Us karo', has('Visit Us')],
  ['replace Jaipur with Udaipur', has('Udaipur')],
  ['eggless ko 100% eggless likho', has('100% eggless')],
  // ── how to reach
  ['phone number 9876543210 kar do', has('9876543210')],
  ['mera email hello@sweetcrumbs.in hai', has('hello@sweetcrumbs.in')],
  ['email change karke info@cakes.in karo', has('info@cakes.in')],
  ['address: 12 MG Road, Jaipur', has('12 MG Road')],
  ['whatsapp number 9876543210 add karo', has('9876543210')],
  ['timing subah 9 se raat 9 tak', has('9')],
  ['sunday ko band rakho', has('sun')],
  // ── the items inside a part
  ['pehli service ka naam Eggless Cakes karo', has('Eggless Cakes')],
  ['add a service called Wedding Cakes', has('Wedding Cakes')],
  ['services me cupcakes aur brownies jodo', has('cupcakes', 'brownies')],
  ['cookies wali service hata do', (lib) => !JSON.stringify(lib.content.features.items).toLowerCase().includes('cookies')],
  ['service "Birthday Cakes" add karo 700 rupees', has('Birthday Cakes')],
  ['FAQ me naya sawal jodo: Do you deliver? answer: Yes, within Jaipur', has('Do you deliver?', 'within Jaipur')],
  ['faq ka pehla sawal hata do', (lib, e, ops) => ops.length > 0 && JSON.stringify(lib.content.faq) !== JSON.stringify(base.content.faq)],
  ['add testimonial: Amazing cakes! - Priya Sharma', has('Amazing cakes', 'Priya Sharma')],
  ['steps me ek step jodo: Pay online', has('Pay online')],
  ['stats me 500+ happy customers likho', has('500+')],
  // ── looks
  ['button ka color red karo', changedLook],
  ['buttons ko blue kar do', changedLook],
  ['heading ka rang gold karo', changedLook],
  ['background dark kar do', edits((e) => e.mode === 'dark')],
  ['dark mode on', edits((e) => e.mode === 'dark')],
  ['website ko light mode me karo', edits((e) => e.mode === 'light')],
  ['main color green karo', edits((e) => !!e.accent)],
  ['colour theme thoda warm karo', changedLook],
  ['font thoda elegant karo', changedLook],
  ['text size bada karo', changedLook],
  ['corners round karo', changedLook],
  ['navbar ka background black karo', changedLook],
  ['footer ka color dark blue karo', changedLook],
  // ── layout and sections
  ['contact section hata do', noRole('contact')],
  ['remove the FAQ', noRole('faq')],
  ['gallery hatao', noRole('gallery')],
  ['pricing section add karo', role('pricing')],
  ['add a testimonials section', role('testimonial')],
  ['about section ko pricing ke upar rakho', order('about', 'pricing'), true],
  ['faq ko gallery ke upar le jao', order('faq', 'gallery'), true],
  ['hero ko center align karo', edits((e) => JSON.stringify(e.aligns ?? {}).includes('center'))],
  ['gallery ko chhota karo', edits((e) => Object.keys(e.sizes ?? {}).length > 0)],
  ['hero section ko bada karo', edits((e) => Object.keys(e.sizes ?? {}).length > 0)],
  ['animations band karo', edits((e) => e.motion === 'off' || e.motion === 'none')],
  // ── pages and menu
  ['services page add karo', page('Services')],
  ['pricing page hata do', (lib) => !(lib.pages ?? []).some((p) => /pricing/i.test(p.label))],
  ['navbar me Home ko Ghar likh do', (lib) => (lib.pages ?? []).some((p) => p.label === 'Ghar')],
  ['menu me About ka naam Hamare Baare Mein karo', (lib) => (lib.pages ?? []).some((p) => /hamare baare mein/i.test(p.label))],
  ['gallery page add karo', page('Gallery')],
  // ── working parts
  ['booking form add karo', (lib, e, ops) => ops.some((o) => o.op === 'widget')],
  ['google map lagao address ke saath', (lib, e, ops) => ops.some((o) => o.op === 'widget')],
  ['whatsapp button lagao', (lib, e, ops) => ops.some((o) => o.op === 'widget')],
  ['newsletter signup add karo', (lib, e, ops) => ops.some((o) => o.op === 'widget')],
  // ── said in a less direct way
  ['isko thoda aur professional banao', changedLook],
  ['yeh colour mujhe pasand nahi aaya, kuch aur try karo', changedLook],
  ['title chhota aur catchy chahiye: Cakes Made Fresh', has('Cakes Made Fresh')],
  ['mujhe hero me "Celebrate With Us" likhna hai', has('Celebrate With Us')],
  ['website ka naam Delight Bakers kar do aur phone 9812345678 daal do', has('Delight Bakers', '9812345678')],
  ['dark mode lagao aur buttons orange karo', (lib, e, ops) => e.mode === 'dark' && ops.length >= 2],
  ['about hata do aur pricing add karo', (lib) => !lib.sections.some((s) => s.role === 'about') && lib.sections.some((s) => s.role === 'pricing')],
  ['undo', (_l, _e, _o, kind) => kind === 'control'],
  ['sab kuch reset karo', (_l, _e, _o, kind) => kind === 'control'],
]

const only = process.argv.includes('--list')
let pass = 0
const fails = []
const baseSingle = generateLibraryPage(PROMPT, 7, undefined, true, 'auto', undefined, false)
for (const [text, check, single] of CASES) {
  let verdict = false
  let note = ''
  try {
    const parsed = parseEdit(text, 'multi', { pages: true, library: true, page: base.content })
    const ops = parsed.kind === 'ops' ? parsed.ops : []
    const e = editsFrom(ops)
    const lib = ops.length ? generateLibraryPage(PROMPT, 7, undefined, true, 'auto', e, !single) : single ? baseSingle : base
    verdict = !!check(lib, e, ops, parsed.kind)
    note = parsed.kind === 'ops' ? `ops: ${ops.map((o) => o.op).join(',') || '(none)'}` : `kind: ${parsed.kind}`
  } catch (error) {
    note = `crashed: ${String(error).slice(0, 80)}`
  }
  if (verdict) pass += 1
  else fails.push(`${text}   [${note}]`)
}
console.log(`${pass}/${CASES.length} = ${((100 * pass) / CASES.length).toFixed(0)}% of what real people type does what they meant`)
if (!only) for (const f of fails) console.log(`  ✗ ${f}`)
process.exit(0)

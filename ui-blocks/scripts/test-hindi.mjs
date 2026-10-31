// Editing in Hinglish and Hindi (Devanagari): colours of every kind of thing, sections (remove, add, move, resize, align), names, texts, contact details, controls.
// A grid of phrasings is read by the parser; each must give the right operation.
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))
const { parseEdit } = await loadGeneratorModule('edit/understand.ts')
const parse = (t) => parseEdit(t, 'single')
const opsOf = (t) => { const r = parse(t); return r.kind === 'ops' ? r.ops : [] }

const rate = (name, rows, minimum) => {
  const good = rows.filter((r) => r.ok).length
  const share = good / rows.length
  ok(share >= minimum, `${name}: ${good} of ${rows.length} (${Math.round(share * 100)}%), at least ${Math.round(minimum * 100)}% needed. First misses: ${rows.filter((r) => !r.ok).slice(0, 4).map((r) => r.text).join(' | ')}`)
  return share
}

// ── colours: the right thing gets the right colour
const COL = { laal: '#dc2626', neela: '#2563eb', hara: '#16a34a', peela: '#eab308', kala: '#000000', safed: '#ffffff', gulabi: '#ec4899', narangi: '#ea580c', jamuni: '#7c3aed', 'लाल': '#dc2626', 'नीला': '#2563eb', 'हरा': '#16a34a', 'पीला': '#eab308', 'काला': '#000000', 'सफेद': '#ffffff', 'गुलाबी': '#ec4899', 'नारंगी': '#ea580c' }
const VERB = ['karo', 'kar do', 'rakho', 'lagao', 'banao', 'chahiye']
const VERBH = ['करो', 'कर दो', 'रखो', 'लगाओ', 'चाहिए']
const THINGS = {
  buttons: [['buttons ka rang', 'button ko', 'बटन को'], (o) => o.op === 'accent' || (o.op === 'style' && o.prop === 'buttonColor')],
  headings: [['heading ka rang', 'headings ko', 'हेडिंग का रंग'], (o) => o.op === 'style' && o.prop === 'headingColor'],
  footer: [['footer ko', 'footer ka background', 'फुटर को'], (o) => o.op === 'sectionColor' && o.target === 'footer'],
  navbar: [['navbar ko', 'header ka rang', 'नेवबार को'], (o) => o.op === 'sectionColor' && o.target === 'header'],
  hero: [['hero ka background', 'hero ko'], (o) => o.op === 'sectionColor' && o.target === 'hero'],
  site: [['website ka rang', 'poori site ko', 'वेबसाइट का रंग'], (o) => o.op === 'accent'],
}
for (const [kind, [phrases, isRight]] of Object.entries(THINGS)) {
  const rows = []
  for (const p of phrases) for (const [c, hex] of Object.entries(COL)) {
    const hindi = /[ऀ-ॿ]/.test(p) || /[ऀ-ॿ]/.test(c)
    for (const v of hindi ? VERBH : VERB) {
      const text = `${p} ${c} ${v}`.replace(/\s+/g, ' ')
      const o = opsOf(text)[0]
      rows.push({ text, ok: !!o && isRight(o) && (o.hex === hex || o.value === hex) })
    }
  }
  rate(`colour of ${kind}`, rows, 0.98)
}

// ── sections
const SEC = { pricing: 'pricing', faq: 'faq', gallery: 'gallery', about: 'about', team: 'team', blog: 'blog', testimonials: 'testimonials', services: 'features', 'प्राइसिंग': 'pricing', 'गैलरी': 'gallery', 'टीम': 'team', 'ब्लॉग': 'blog', 'एफएक्यू': 'faq' }
const groups = { remove: [], add: [], edge: [], less: [], more: [], align: [], relative: [] }
for (const [name, key] of Object.entries(SEC)) {
  const dev = /[ऀ-ॿ]/.test(name)
  const test = (g, text, pred) => groups[g].push({ text, ok: opsOf(text).some(pred) })
  for (const v of dev ? ['हटाओ', 'हटा दो', 'नहीं चाहिए'] : ['hatao', 'hata do', 'nahi chahiye', 'remove karo']) test('remove', `${name} ${v}`, (x) => x.op === 'remove' && x.section === key)
  for (const v of dev ? ['जोड़ो', 'चाहिए', 'लगाओ'] : ['jodo', 'chahiye', 'add karo', 'lagao']) test('add', `${name} ${v}`, (x) => x.op === 'add' && x.section === key)
  for (const v of dev ? ['सबसे ऊपर करो', 'सबसे नीचे करो'] : ['sabse upar karo', 'sabse neeche karo', 'sabse upar rakho', 'sabse niche karo']) test('edge', `${name} ko ${v}`, (x) => x.op === 'move' && x.section === key && ['top', 'bottom'].includes(x.where))
  for (const v of dev ? ['छोटा करो', 'कम करो'] : ['chhota karo', 'kam karo', 'height kam karo']) test('less', `${name} ${v}`, (x) => x.op === 'size' && x.target === key && x.factor < 1)
  for (const v of dev ? ['बड़ा करो'] : ['bada karo', 'height zyada karo', 'lamba karo']) test('more', `${name} ${v}`, (x) => x.op === 'size' && x.target === key && x.factor > 1)
  for (const v of dev ? ['सेंटर करो'] : ['center karo', 'beech me karo', 'left karo', 'right karo']) test('align', `${name} ${v}`, (x) => x.op === 'align' && x.target === key)
}
const latin = Object.keys(SEC).filter((k) => !/[ऀ-ॿ]/.test(k))
for (const a of latin) for (const b of latin) if (a !== b) {
  groups.relative.push({ text: `${a} ko ${b} ke upar rakho`, ok: opsOf(`${a} ko ${b} ke upar rakho`).some((x) => x.op === 'move' && x.section === SEC[a] && x.where === 'before' && x.target === SEC[b]) })
  groups.relative.push({ text: `${a} ko ${b} ke neeche karo`, ok: opsOf(`${a} ko ${b} ke neeche karo`).some((x) => x.op === 'move' && x.section === SEC[a] && x.where === 'after' && x.target === SEC[b]) })
}
for (const [g, rows] of Object.entries(groups)) rate(`sections: ${g}`, rows, 0.98)

// ── names, texts, contact, controls
const CASES = [
  ['website ka naam Sharma Sweets rakho', (o) => o[0]?.op === 'rename' && o[0].name === 'Sharma Sweets'],
  ['business ka naam badal kar Royal Cafe karo', (o) => o[0]?.op === 'rename' && /Royal Cafe/.test(o[0].name)],
  ['mera business ka naam Raj Traders hai', (o) => o[0]?.op === 'rename' && /Raj Traders/.test(o[0].name)],
  ['isko Green Leaf naam do', (o) => o[0]?.op === 'rename' && /Green Leaf/.test(o[0].name)],
  ['naam Priya Beauty Parlour kar do', (o) => o[0]?.op === 'rename' && /Priya Beauty Parlour/.test(o[0].name)],
  ['दुकान का नाम गुप्ता स्टोर रखो', (o) => o[0]?.op === 'rename' && /गुप्ता/.test(o[0].name)],
  ['नाम बदलकर शर्मा स्वीट्स रखो', (o) => o[0]?.op === 'rename' && /शर्मा स्वीट्स/.test(o[0].name)],
  ['heading me likho Best Mithai In Jaipur', (o) => o[0]?.field === 'heroTitle' && /Best Mithai In Jaipur/.test(o[0].text)],
  ['headline badal kar Fresh Sweets Daily karo', (o) => o[0]?.field === 'heroTitle' && /Fresh Sweets Daily/.test(o[0].text)],
  ['headline likho: Taza Mithai Roz', (o) => o[0]?.field === 'heroTitle' && o[0].text === 'Taza Mithai Roz'],
  ['हेडलाइन: ताज़ा मिठाई रोज़', (o) => o[0]?.field === 'heroTitle'],
  ['हेडिंग में लिखो सबसे अच्छी मिठाई', (o) => o[0]?.field === 'heroTitle'],
  ['subtitle badlo: Ghar jaisa swaad', (o) => o[0]?.field === 'heroSubtitle' && o[0].text === 'Ghar jaisa swaad'],
  ['subtitle me likho: Har din taaza', (o) => o[0]?.field === 'heroSubtitle'],
  ['button par Order Now likho', (o) => o[0]?.field === 'heroButton' && /Order Now/.test(o[0].text)],
  ['button ka naam Call Karo rakho', (o) => o[0]?.field === 'heroButton'],
  ['बटन पर ऑर्डर करें लिखो', (o) => o[0]?.field === 'heroButton'],
  ['pricing ka naam Hamare Plans rakho', (o) => o[0]?.op === 'title' && o[0].target === 'pricing'],
  ['email info@sharma.in rakho', (o) => o[0]?.field === 'email'],
  ['mera phone 98765 43210 hai', (o) => o[0]?.field === 'phone'],
  ['whatsapp no 9876543210', (o) => o[0]?.field === 'whatsapp'],
  ['address: 12 MG Road, Jaipur', (o) => o[0]?.field === 'address'],
  ['dukaan ka pata 12 MG Road Jaipur hai', (o) => o[0]?.field === 'address'],
  ['timing subah 9 se raat 9 tak', (o) => o[0]?.field === 'hours'],
  ['services: laddoo 300, barfi 500, jalebi 200', (o) => o[0]?.op === 'services' && o[0].items.length === 3],
  ['kaju katli ko kaju barfi likho', (o) => o[0]?.op === 'replace'],
  ['sab jagah store ki jagah dukaan likho', (o) => o[0]?.op === 'replace'],
  ['animation band karo', (o) => o[0]?.op === 'motion' && o[0].level === 'off'],
  ['zyada premium banao', (o) => o[0]?.op === 'tier' && o[0].tier === 'premium'],
  ['simple rakho', (o) => o[0]?.op === 'tier' && o[0].tier === 'normal'],
  ['site ko restaurant ke liye badlo', (o) => o[0]?.op === 'theme'],
  ['cyberpunk style chahiye', (o) => o[0]?.op === 'mood' && o[0].mood === 'cyberpunk'],
  ['रेट्रो लुक चाहिए', (o) => o[0]?.op === 'mood' && o[0].mood === 'retro'],
  ['minimal dark theme lagao', (o) => o[0]?.op === 'mood' && o[0].mood === 'minimal-dark'],
  ['mood badlo', (o) => o[0]?.op === 'mood'],
  ['mujhe kuch alag rang chahiye', (o) => o[0]?.op === 'accent'],
  ['kone nukile karo', (o) => o[0]?.prop === 'radius' && o[0].value === 'square'],
  ['कोने गोल करो', (o) => o[0]?.prop === 'radius'],
  ['buttons ko gol banao', (o) => o[0]?.prop === 'radius' && o[0].value === 'pill'],
  ['serif font lagao', (o) => o[0]?.prop === 'font' && o[0].value === 'serif'],
  ['hero button ko left karo', (o) => o[0]?.op === 'align' && o[0].part === 'buttons' && o[0].align === 'left'],
  ['बटन को बाएं करो', (o) => o[0]?.op === 'align' && o[0].part === 'buttons' && o[0].align === 'left'],
  ['बटन को सफेद करो', (o) => o[0]?.op !== 'mode'],
]
const caseRows = CASES.map(([text, pred]) => ({ text, ok: (() => { try { return !!pred(opsOf(text)) } catch { return false } })() }))
rate('names, texts, contact, looks', caseRows, 0.97)
for (const [text, control] of [['undo karo', 'undo'], ['pichla change cancel karo', 'undo'], ['ye galat hai', 'undo'], ['sab reset karo', 'reset'], ['सब कुछ पहले जैसा कर दो', 'reset'], ['redo karo', 'redo'], ['wapas laao', 'redo']]) { const r = parse(text); ok(r.kind === 'control' && r.control === control, `control: ${text}`) }
// the sentences that are not edits must not become edits
for (const text of ['namaste kaise ho', 'aaj mausam kaisa hai', 'mujhe samajh nahi aaya']) ok(opsOf(text).length === 0, `not an edit: ${text}`)

console.log(`${pass} checks passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

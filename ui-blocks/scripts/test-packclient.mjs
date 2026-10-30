// What the page trusts of the Content AI's niche answer (edit/packClient.ts): the answers it gives for typos and short words are used, the guesses for requests with no trade are not.
import { loadGeneratorModule } from './lib/load-generator.mjs'
globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const { trustPack } = await loadGeneratorModule('edit/packClient.ts')
const { detectNiche } = await loadGeneratorModule('niche/applyNiche.ts')
const { setNicheHint } = await loadGeneratorModule('niche/hints.ts')
const { NICHES } = await loadGeneratorModule('niche/niches.ts')
let pass = 0
const fail = []
const ok = (c, m) => (c ? pass++ : fail.push(m))
const ans = (id, confidence, keywords, notes = [], extra = {}) => ({ id, label: id, theme: 'x', niche: id, keywords, confidence, source: 'niche pack', notes, problems: 0, ...extra })
ok(trustPack('cctv website', ans('cctv_security_install', 0.609, ['cctv installation', 'cctv camera'])), 'a short trade word that is a keyword of the niche is trusted')
ok(trustPack('dentsit website', ans('dental_clinic', 1, ['dentist', 'dental clinic'], ['Corrected typing mistakes: dentsit to dentist'])), 'a corrected typing mistake is trusted')
ok(trustPack('modern cctv website with animation, premium colours and a gallery', ans('cctv_security_install', 0.609, ['cctv installation'])), 'look words around a trade do not matter')
ok(!trustPack('a website that nobody has seen before', ans('catering_service', 1, ['catering service', 'caterer'])), 'a request with no trade is not given a niche, however sure the Content AI is')
ok(!trustPack('premium website with high class animation', ans('yoga_studio', 0.55, ['yoga class', 'yoga studio'])), '"class" alone does not make a yoga studio')
ok(!trustPack('car repair garage website', ans('bike_repair_garage', 0.529, ['bike repair', 'garage', 'repair shop'])), 'a niche that shares some words but not the main one ("car") is not used')
ok(!trustPack('coaching institute for UPSC', ans('ielts_language_coaching', 0.13, ['ielts coaching'], ['Several niches fit about equally well (a, b, c); this is the closest.'])), 'one of several equal guesses is not used')
ok(!trustPack('pottery studio', ans('type_general_business', 0, [], [], { niche: null })), 'a business-type pack is not a niche')
ok(!trustPack('cctv website', ans('not_a_niche_of_this_page', 1, ['cctv'])), 'a niche this page has no text for is not used')
ok(!trustPack('cctv website', ans('cctv_security_install', 1, ['cctv'], [], { problems: 2 })), 'an answer that failed its own check is not used')
// the hint is used only where the keywords found nothing
const id = 'cctv_security_install'
ok(!detectNiche('xyzzy trade website', NICHES), 'no hint: nothing found')
setNicheHint('xyzzy trade website', id)
ok(detectNiche('xyzzy trade website', NICHES)?.id === id, 'a hint is found by detectNiche')
setNicheHint('dental clinic', id)
ok(detectNiche('dental clinic', NICHES)?.id === 'dental_clinic', 'the own keywords win over a hint')
console.log(`${pass} passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

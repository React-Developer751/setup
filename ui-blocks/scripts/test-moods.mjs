// Design moods (a look made of rules), the colour of each panel, and the style edits (buttons, headings, text, corners, typeface) in every engine.
globalThis.document = { styleSheets: [] }
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, name) => (c ? (pass += 1) : fail.push(name))

const { MOODS, MOOD_IDS, moodFromText, moodPalette, chooseMood } = await loadGeneratorModule('moods.ts')
const { MOOD_CHOICES, editsFrom, cleanOp, FONT_KEYS } = await loadGeneratorModule('edit/edits.ts')
const { generateWebsite } = await loadGeneratorModule('generateWebsite.ts')
const { generateSite } = await loadGeneratorModule('generateSite.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { parseEdit } = await loadGeneratorModule('edit/understand.ts')
const { contrast } = await loadGeneratorModule('colorBrain.ts')
const { setCreativity } = await loadGeneratorModule('creativity.ts')
const { FONT_CHOICES, fontLinksFor } = await loadGeneratorModule('fonts.ts')
const { seededRandom } = await loadGeneratorModule('random.ts')
const { buildStandalone, sourceFromPage } = await loadGeneratorModule('exportSite.ts')
setCreativity('safe')

const PROMPT = 'Create a website for a bakery called Sweet Crumbs in Mumbai'
const ops = (messages) => messages.flatMap((m) => { const p = parseEdit(m, 'single'); return p.kind === 'ops' ? p.ops : [] })

// ── the moods
ok(MOOD_IDS.length === 10 && new Set(MOOD_IDS).size === 10, 'ten moods')
ok(JSON.stringify([...MOOD_IDS, 'none', 'auto']) === JSON.stringify([...MOOD_CHOICES]), 'the moods of edits.ts are the moods of moods.ts')
for (const mood of MOODS) {
  for (const hue of [5, 60, 140, 210, 280, 330]) {
    const { palette } = moodPalette(mood, hue, hue + 150)
    for (const m of ['light', 'dark']) {
      const p = palette[m]
      const worst = Math.min(contrast(p.text, p.bg), contrast(p.text, p.surface), contrast(p.muted, p.bg), contrast(p.accent, p.bg))
      ok(worst >= 4.3, `${mood.id} hue ${hue} ${m}: readable (${worst.toFixed(1)})`)
    }
  }
}
const looks = MOODS.map((m) => { const s = generateWebsite(PROMPT, 3, undefined, true, 'auto', editsFrom([{ op: 'mood', mood: m.id }])); return { id: m.id, bg: s.palette[s.initialMode].bg, html: s.html, mode: s.initialMode, font: s.tokens.light['--g-font'] } })
ok(new Set(looks.map((l) => l.bg)).size >= 9, 'every mood has its own page colour')
ok(new Set(looks.map((l) => l.html)).size === 10, 'every mood makes a different site')
ok(looks.find((l) => l.id === 'cyberpunk').mode === 'dark' && looks.find((l) => l.id === 'retro').mode === 'light', 'a mood starts in its own mode')
ok(new Set(looks.map((l) => l.font)).size >= 7, 'moods bring their own typefaces')
ok(/shadow-\[0_0_22px/.test(looks.find((l) => l.id === 'cyberpunk').html) && /uppercase/.test(looks.find((l) => l.id === 'cyberpunk').html), 'cyberpunk: glow and wide capitals')
ok(/--g-shadow-d/.test(looks.find((l) => l.id === 'soft-neo').html), 'soft: shadow colours in the page')
ok(/border-2/.test(looks.find((l) => l.id === 'retro').html), 'retro: thick outlines')
ok(/rounded-none/.test(looks.find((l) => l.id === 'bold-contrast').html), 'bold: sharp corners')

// ── the colour of each panel
const cyber = generateWebsite(PROMPT, 3, 'premium', true, 'auto', editsFrom([{ op: 'mood', mood: 'cyberpunk' }]))
ok(Object.keys(cyber.html.match(/style="--g-bg:[^"]*"/g) ?? []).length >= 3, 'the panels carry colours of their own')
const plain = generateWebsite(PROMPT, 3, 'premium', true, 'auto', editsFrom([{ op: 'mood', mood: 'soft-neo' }]))
ok((plain.html.match(/style="--g-bg:/g) ?? []).length <= (cyber.html.match(/style="--g-bg:/g) ?? []).length, 'the soft mood keeps one surface, the cyber mood paints its panels')
const cleared = generateWebsite(PROMPT, 3, 'premium', true, 'auto', editsFrom([{ op: 'mood', mood: 'cyberpunk' }, { op: 'clearSectionColor', target: 'footer' }, { op: 'clearSectionColor', target: 'hero' }, { op: 'clearSectionColor', target: 'cta' }, { op: 'clearSectionColor', target: 'stats' }]))
ok((cleared.html.match(/style="--g-bg:/g) ?? []).length < (cyber.html.match(/style="--g-bg:/g) ?? []).length, 'a panel the person cleared loses the colour of the mood')
const owned = generateWebsite(PROMPT, 3, 'premium', true, 'auto', editsFrom([{ op: 'mood', mood: 'cyberpunk' }, { op: 'sectionColor', target: 'footer', hex: '#16a34a' }]))
ok(/--g-bg:#16a34a/.test(owned.html), 'a colour the person asked for wins over the mood')
const m2 = generateSite(PROMPT, 3, 'premium', true, 'auto', editsFrom([{ op: 'mood', mood: 'retro' }]))
ok(JSON.stringify(m2.pagesHtml).includes('--g-bg:'), 'multi-page: the panels are painted too')
ok(generateLibraryPage(PROMPT, 3, 'premium', true, 'auto', editsFrom([{ op: 'mood', mood: 'cyberpunk' }])).sections.some((s) => !!s.paint), 'library: panels are painted')

// ── choosing
setCreativity('safe')
ok(chooseMood('a gym', 'bold_fitness', seededRandom(1), 0.1) === undefined, 'safe: the look of the business type, no mood')
ok(chooseMood('a cyberpunk gym', 'bold_fitness', seededRandom(1), 0.1)?.id === 'cyberpunk', 'a mood named in the prompt is used at any creativity')
const wild = new Set()
for (let i = 0; i < 40; i += 1) wild.add(chooseMood('a bakery', 'food_dining', seededRandom(i), 0.9)?.id)
ok(wild.size >= 4, `wild: many different moods for one business (${wild.size})`)
ok(moodFromText('make it minimal dark')?.id === 'minimal-dark' && moodFromText('retro diner')?.id === 'retro', 'moods are read from words')

// ── edits that choose a mood
ok(ops(['make it cyberpunk'])[0]?.op === 'mood' && ops(['retro look do'])[0]?.mood === 'retro' && ops(['neumorphism style'])[0]?.mood === 'soft-neo', 'a mood can be asked for in chat')
ok(ops(['make the buttons glass']).every((o) => o.op !== 'mood'), 'a part is not a whole look')
ok(ops(['back to the default look'])[0]?.mood === 'none', 'the look of the business type can be asked back')
ok(editsFrom([{ op: 'mood', mood: 'retro' }, { op: 'mood', mood: 'none' }]).mood === 'none', 'the last mood counts')
ok(!cleanOp({ op: 'mood', mood: 'disco' }), 'a mood that does not exist is refused')
const none = generateWebsite(PROMPT, 3, undefined, true, 'auto', editsFrom([{ op: 'mood', mood: 'retro' }, { op: 'mood', mood: 'none' }]))
ok(none.mood === undefined, 'mood none: the business look again')

// ── style edits: buttons, headings, text, corners, typeface
const base = generateWebsite(PROMPT, 3)
const sOps = ops(['hero button green', 'headings blue', 'paragraph text dark gray', 'round the corners', 'serif font'])
ok(sOps.length === 5 && sOps.every((o) => o.op === 'style'), `five style edits are understood (${sOps.map((o) => o.prop)})`)
const styled = generateWebsite(PROMPT, 3, undefined, true, 'auto', editsFrom(sOps))
ok(/--g-btn:#16a34a/.test(styled.html), 'the buttons of the hero have their own colour (--g-btn)')
ok(/<h[12][^>]*style="[^"]*color:#2563eb/.test(styled.html), 'headings take their colour')
ok(/<p[^>]*style="[^"]*color:#374151/.test(styled.html), 'text takes its colour')
ok(styled.tokens.light['--g-font'] === 'Playfair Display' && styled.tokens.light['--font-sans'].includes('Playfair'), 'the typeface is changed in the tokens')
ok(/family=Playfair\+Display/.test(buildStandalone(sourceFromPage(styled))) && fontLinksFor('food_dining', styled.tokens.light).includes('Playfair'), 'the chosen typeface is linked in the page')
ok(styled.html !== base.html && styled.code.includes('text-[#2563eb]'), 'the React export carries the style too')
const accentOnly = generateWebsite(PROMPT, 3, undefined, true, 'auto', editsFrom(ops(['buttons sirf orange karo'])))
ok(accentOnly.tokens.light['--g-btn'] === '#ea580c' && accentOnly.palette.light.accent === base.palette.light.accent, '"only the buttons orange" does not change the accent of the site')
const legacy = generateWebsite(PROMPT, 3, undefined, true, 'auto', editsFrom(ops(['make the buttons blue'])))
ok(legacy.palette.light.accent !== base.palette.light.accent, '"make the buttons blue" still changes the main colour (as before)')
const square = generateWebsite(PROMPT, 3, undefined, true, 'auto', editsFrom(ops(['sharp corners'])))
ok(!/rounded-xl|rounded-2xl|rounded-3xl/.test(square.html.replace(/rounded-full/g, '')) || (square.html.match(/rounded-none/g) ?? []).length > (base.html.match(/rounded-none/g) ?? []).length, 'sharp corners: the rounded classes become square')
const pill = generateWebsite(PROMPT, 3, undefined, true, 'auto', editsFrom(ops(['pill buttons'])))
ok((pill.html.match(/rounded-full/g) ?? []).length > (base.html.match(/rounded-full/g) ?? []).length, 'pill buttons: round ends')
const back = generateWebsite(PROMPT, 3, undefined, true, 'auto', editsFrom([...sOps, ...ops(['default corners'])]))
ok(back.html !== styled.html, 'a style can be taken back')
ok(generateWebsite(PROMPT, 3, undefined, true, 'auto', editsFrom([...sOps, { op: 'resetLayout' }])).html === base.html, 'reset the layout also takes back the styles')
ok(!cleanOp({ op: 'style', target: 'page', prop: 'font', value: 'comic' }) && !cleanOp({ op: 'style', target: 'page', prop: 'buttonColor', value: 'blue' }) && !cleanOp({ op: 'style', target: 'nowhere', prop: 'radius', value: 'pill' }), 'bad style values are refused')
ok(FONT_KEYS.every((k) => FONT_CHOICES[k]), 'every typeface key has a typeface')
const multi = generateSite(PROMPT, 3, undefined, true, 'auto', editsFrom(sOps))
ok(JSON.stringify(multi.pagesHtml).includes('--g-btn:#16a34a') && multi.spec.tokens.light['--g-font'] === 'Playfair Display', 'multi-page: styles reach every page')

// ── the new look is never broken
for (const m of MOOD_IDS) {
  const s = generateWebsite('Law firm Lexa & Partners', 5, 'premium', true, 'auto', editsFrom([{ op: 'mood', mood: m }, ...sOps]))
  ok(!/undefined|NaN|\[object/.test(s.html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<[^>]+>/g, ' ')), `${m}: no broken text`)
}
setCreativity('balanced')

console.log(`${pass} checks passed, ${fail.length} failed`)
for (const f of fail.slice(0, 30)) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

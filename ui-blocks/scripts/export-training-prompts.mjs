// Writes training-prompts/: for every kind of website the generator can make, a prompt for the content AI and a prompt for the image AI.
//   node scripts/export-training-prompts.mjs
// The two AIs (cont = Core-Craft, normal = PixelMath) are not touched: these are plain files to give them.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadGeneratorModule } from './lib/load-generator.mjs'

globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'training-prompts')
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'))
const write = (p, text) => { fs.mkdirSync(path.dirname(path.join(out, p)), { recursive: true }); fs.writeFileSync(path.join(out, p), text) }
const jsonl = (rows) => rows.map((r) => JSON.stringify(r)).join('\n') + '\n'

const niches = fs.readdirSync(path.join(root, 'src/data/niches')).filter((f) => /^batch-.*\.json$/.test(f)).sort().flatMap((f) => readJson(`src/data/niches/${f}`))
const scenes = readJson('src/data/imageScenes.json')
const concepts = readJson('src/data/concepts.json').families
const { MOODS } = await loadGeneratorModule('moods.ts')
const { THEME_KEYS } = await loadGeneratorModule('themes.ts')

const THEME_LABEL = {
  modern_tech: 'software, SaaS, IT and technology', organic_nature: 'organic, farm, nature and eco', bold_fitness: 'gym, sports and fitness', luxury_minimal: 'luxury and high-end brands',
  playful_vibrant: 'kids, toys, fun and colourful brands', professional_services: 'consulting, legal, finance and other professionals', healthcare: 'clinics, hospitals and medical', food_dining: 'restaurants, cafes and food',
  education: 'schools, coaching and training', creative_studio: 'design, photo, video and creative studios', general_business: 'a general local business', real_estate: 'property, builders and rentals',
  travel_tourism: 'travel, tours and hotels', automotive: 'cars, bikes, garages and dealers', beauty_wellness: 'salon, spa, yoga and wellness', events_wedding: 'weddings, events and decor',
  pets_animals: 'pets, vets and animal care', fashion_retail: 'clothing, boutique and fashion shops', home_services: 'plumber, electrician, cleaning, repair and other home services', nonprofit: 'NGO, charity and foundation',
}
const label = (theme) => THEME_LABEL[theme] ?? theme.replace(/_/g, ' ')

// ───────── the catalogue
const catalogue = {
  note: 'Every kind of website the generator makes. niches = specific businesses with hand-written text; themes = the business types they belong to; designStyles = the looks a page can wear; colourFamilies = the colour ideas.',
  counts: { niches: niches.length, themes: THEME_KEYS.length, designStyles: MOODS.length, colourFamilies: concepts.length },
  themes: THEME_KEYS.map((key) => ({ key, about: label(key), niches: niches.filter((n) => n.theme === key).map((n) => n.id) })),
  niches: niches.map((n) => ({ id: n.id, label: n.label, theme: n.theme, keywords: n.keywords, services: n.features.map((f) => f.title), hasMenu: !!n.menu })),
  designStyles: MOODS.map((m) => ({ id: m.id, label: m.label, about: m.blurb, mode: m.mode, keywords: m.keywords })),
  colourFamilies: concepts.map((f) => ({ id: f.id, themes: f.themes, niches: f.niches, palettes: f.seeds.map((s) => ({ name: s.name, why: s.why, bg: s.bg, ink: s.ink, accent: s.accent })) })),
  pageKinds: ['one landing page', 'a site of several pages (Home, About, Services, Gallery, Pricing or Menu, FAQ, Contact)', 'a menu board (food businesses)', 'a pricing page', 'a gallery page', 'a blog list'],
}
write('website-types.json', JSON.stringify(catalogue, null, 1))

// ───────── ways a person asks for the site (English, Hinglish, short, vague, long)
const kw = (n) => n.keywords.filter((k) => /^[a-z ]+$/.test(k))
const asks = (n) => {
  const a = n.label.toLowerCase().split(/\s*(?:,| and )\s*/)[0]
  const k = kw(n)
  return [
    `${a} website`,
    `Create a website for a ${a} in Jaipur`,
    `mujhe ${k[1] ?? a} ki website banakar do`,
    `meri ${k[2] ?? a} ki dukaan ke liye website banao, with online contact and WhatsApp`,
    `modern ${a} website with animation, premium colours and a gallery`,
    `${a} landing page, short, with pricing and FAQ`,
  ]
}

// ───────── CONTENT AI
const SPEC = fs.readFileSync(path.join(root, 'src/data/niches/NICHE_SPEC.md'), 'utf8')
write('content-ai/system-prompt.md', `# System prompt for the content AI (Core-Craft)

You write the text of a business website. You never invent facts about a real business: no customer counts, years, ratings, awards, percentages,
no medical, legal or financial promises. Every text is about the business it is for, and different from every other text.
Answer with ONE JSON object only, in exactly the shape below. No markdown, no comments.

${SPEC.replace(/^# .*\n/, '')}

## Extra rules for training
* Write for the business of the request, in its own words: a bakery page never talks about cars; use the real things of that trade (items, steps, tools).
* The request may be English, Hinglish (Roman Hindi) or Hindi. The JSON is in English unless the request asks for Hindi; then write Devanagari for every text field and keep the keys in English.
* If the request names a business name, use it where the spec says {brand}; if it names a city, use it once in the hero subtitle or the contact text.
* If the request is vague ("unique website", "business website"), keep the text honest and general (a local business that serves its neighbours); never invent a trade.
* A food business also gets "menu": { "title": "On The Menu", "lead": "one or two sentences", "categories": [{ "name": "Coffee", "items": ["Espresso | single or double", "Americano", "Flat white | smooth and strong"] }] } (3 to 4 categories, 5 to 6 items each; an item is "Name" or "Name | short note"; no prices on the menu board).
`)

const contentRows = niches.map((n) => ({
  id: n.id,
  label: n.label,
  theme: n.theme,
  user_requests: asks(n),
  prompt: `Write the website content pack for this business: "${n.label}" (business type: ${label(n.theme)}).
Words people use to ask for it: ${n.keywords.slice(0, 10).join(', ')}.
Cover these services in "features" (keep the list to 6, in this spirit): ${n.features.map((f) => f.title).join(', ')}.
${n.menu ? 'It is a food business: add the "menu" block as well.\n' : ''}Follow the system prompt exactly (all fields, the counts, the rules).
Return the JSON object only.`,
  target_file_shape: 'NICHE_SPEC.md one niche object',
}))
const themeRows = THEME_KEYS.map((t) => ({
  id: `theme:${t}`,
  label: label(t),
  theme: t,
  user_requests: [`${label(t).split(',')[0]} website`, `Create a modern website for ${label(t)}`, `mujhe ${label(t).split(/,| and /)[0]} ki website chahiye`],
  prompt: `Write the general website content pack for any business of this type: ${label(t)}.
It is the fallback text for a business of this type that has no pack of its own, so it must be true for every business of the type (no one trade, no brand name, use {brand}).
Follow the system prompt exactly. Return the JSON object only.`,
  target_file_shape: 'NICHE_SPEC.md one niche object with id "general_<theme>"',
}))
write('content-ai/prompts.jsonl', jsonl([...contentRows, ...themeRows]))
write('content-ai/hinglish-and-hindi.jsonl', jsonl(niches.flatMap((n) => [
  { id: `${n.id}:hinglish`, request: `mujhe ${kw(n)[1] ?? n.label.toLowerCase()} ki website banakar do, premium dikhe`, prompt: `Same task as ${n.id} in prompts.jsonl, but the person writes Hinglish. Keep English text in the JSON, plain and warm, with the Hindi words a shop owner would use only where they are the real name of a thing.` },
  { id: `${n.id}:hindi`, request: `${n.keywords.find((k) => /[ऀ-ॿ]/.test(k)) ?? n.label} की वेबसाइट बनाइए`, prompt: `Same task as ${n.id} in prompts.jsonl, but write every text field in simple Hindi (Devanagari). Keys stay English.` },
])))

// ───────── IMAGE AI
const STYLE = 'friendly flat illustration, clean vector shapes, soft shading, one clear subject, rich but harmonious colours, no text, no letters, no logo, no watermark, no real brand, no real person\'s face'
const moodWord = (m) => `${m.label} (${m.blurb.replace(/\.$/, '')})`
write('image-ai/system-prompt.md', `# System prompt for the image AI (PixelMath)

You draw the pictures of a business website. One request = one picture for one place on the page.
* Every picture has ONE clear subject of the business and plenty of calm space around it (a headline will sit on it).
* No text, no letters, no numbers, no logos, no watermarks, no real brands, no recognisable real people; people are shown as simple illustrated characters, seen from the side or the back when possible.
* The pictures of one site belong together: the same drawing style, the same lighting, the same palette. The palette is given in the request (accent, background).
* Sizes: hero 1600x900 (16:9, subject on the right or centre, empty left), about 1200x900 (4:3), gallery 900x900 (1:1), card 800x600, team portrait 600x600 (illustrated character, shoulders up), background texture 1600x900 (no subject).
* Default style: ${STYLE}. When the request names another style (photo-like, 3D, sketch, line art), use that instead.
* A cafe, bakery or food business is warm and appetising: steam, crumbs, wood, soft window light. A clinic is calm and clean. A gym is energetic. A tech business is clean and geometric. Follow the mood given.
`)
const sceneOf = (n) => scenes.niches[n.id] ?? scenes.themes[n.theme] ?? scenes.themes.general_business
const palettes = (n) => {
  const f = concepts.find((c) => c.niches.includes(n.id)) ?? concepts.find((c) => c.themes.includes(n.theme)) ?? concepts.find((c) => c.id === 'general')
  return f.seeds.slice(0, 3).map((s) => ({ name: s.name, accent: s.accent, background: s.bg }))
}
const slot = (name, size, what, n, pal) => ({ slot: name, size, prompt: `${what}, for a ${n.label.toLowerCase()} website. ${STYLE}. Palette: accent ${pal.accent} on ${pal.background}. ${name === 'hero' ? 'Empty calm space on the left for a headline.' : ''}`.replace(/\s+/g, ' ').trim() })
const imageRows = niches.map((n) => {
  const sc = sceneOf(n)
  const [pal] = palettes(n)
  const slots = [
    ...(sc.hero ?? []).slice(0, 3).map((h, i) => slot(`hero-${i + 1}`, '1600x900', h, n, pal)),
    slot('about', '1200x900', sc.about ?? `the people and tools of a ${n.label.toLowerCase()} at work`, n, pal),
    ...n.gallery.captions.map((c, i) => slot(`gallery-${i + 1}`, '900x900', `${c} (${n.label.toLowerCase()})`, n, pal)),
    ...n.features.slice(0, 6).map((f, i) => slot(`card-${i + 1}`, '800x600', `${f.title}: ${f.text.split('.')[0]}`, n, pal)),
    ...n.team.roles.slice(0, 3).map((r, i) => slot(`team-${i + 1}`, '600x600', `portrait of a friendly ${r.toLowerCase()}, illustrated character, shoulders up`, n, pal)),
    slot('background', '1600x900', `soft abstract background texture in the mood of a ${n.label.toLowerCase()}, no subject`, n, pal),
  ]
  return { id: n.id, label: n.label, theme: n.theme, palettes: palettes(n), user_requests: asks(n).slice(0, 3), slots }
})
write('image-ai/prompts.jsonl', jsonl(imageRows))
write('image-ai/themes.jsonl', jsonl(THEME_KEYS.map((t) => {
  const sc = scenes.themes[t] ?? scenes.themes.general_business
  const f = concepts.find((c) => c.themes.includes(t)) ?? concepts.find((c) => c.id === 'general')
  const pal = { accent: f.seeds[0].accent, background: f.seeds[0].bg }
  const n = { label: label(t) }
  return { id: `theme:${t}`, label: label(t), palettes: f.seeds.slice(0, 3).map((s) => ({ name: s.name, accent: s.accent, background: s.bg })), slots: [...sc.hero.slice(0, 3).map((h, i) => slot(`hero-${i + 1}`, '1600x900', h, n, pal)), slot('about', '1200x900', sc.about, n, pal), ...sc.gallery.map((g, i) => slot(`gallery-${i + 1}`, '900x900', g, n, pal))] }
})))
write('image-ai/design-styles.jsonl', jsonl(MOODS.map((m) => ({ id: m.id, label: m.label, mode: m.mode, art_direction: `${moodWord(m)}. ${m.mode === 'dark' ? 'Dark background, glowing accents, deep shadows.' : 'Light background, airy, soft shadows.'} Use together with any prompt of image-ai/prompts.jsonl: keep its subject, change the look to this style.` }))))

write('README.md', `# Training prompts for the two AIs

Made by \`node scripts/export-training-prompts.mjs\` (run it again after the generator gets new niches). The generator is the same in both: ${niches.length} business packs (niches), ${THEME_KEYS.length} business types (themes), ${MOODS.length} design styles, ${concepts.length} colour families.

| file | for | what it holds |
|---|---|---|
| \`website-types.json\` | both | the catalogue: every kind of website, its services, keywords, design styles, colour families |
| \`content-ai/system-prompt.md\` | content AI | the rules and the exact JSON shape of a content pack |
| \`content-ai/prompts.jsonl\` | content AI | ${niches.length} business prompts + ${THEME_KEYS.length} fallback prompts (one line each: id, user_requests, prompt) |
| \`content-ai/hinglish-and-hindi.jsonl\` | content AI | the same businesses asked in Hinglish and in Hindi |
| \`image-ai/system-prompt.md\` | image AI | the picture rules (sizes, no text, same style) |
| \`image-ai/prompts.jsonl\` | image AI | per business: hero, about, 6 gallery, 6 card, 3 team and a background picture, each with size and palette |
| \`image-ai/themes.jsonl\` | image AI | the same for the ${THEME_KEYS.length} business types (for a business with no pack) |
| \`image-ai/design-styles.jsonl\` | image AI | the look of each of the ${MOODS.length} design styles, to combine with any picture prompt |

How to train: give the system prompt first, then each line's \`prompt\` (content) or each slot's \`prompt\` (image), and keep the answers that follow the rules (the content AI's answer can be checked with \`node scripts/check-niches.mjs\`). The \`user_requests\` are the sentences a person will really type for that business: use them as the inputs the AI must answer well.
`)
console.log(`niches ${niches.length}, themes ${THEME_KEYS.length}, styles ${MOODS.length}, content prompts ${contentRows.length + themeRows.length}, image prompts ${imageRows.length} (${imageRows.reduce((a, r) => a + r.slots.length, 0)} pictures)`)

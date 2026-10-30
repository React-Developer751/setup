// The bugs that real prompts showed (found by running the real page with the Content AI and the image AI): each one is checked here so it stays fixed.
import { loadGeneratorModule } from './lib/load-generator.mjs'
globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const { decideCore } = await loadGeneratorModule('edit/corecraft.ts')
const { hasLookWord } = await loadGeneratorModule('hinglish.ts')
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
let pass = 0
const fail = []
const ok = (c, m) => (c ? pass++ : fail.push(m))

ok(hasLookWord('alag type') && hasLookWord('animation ho') && hasLookWord('banakar do') && !hasLookWord('wood-fired pizza') && !hasLookWord('dental implants'), 'request and look words are told from services')

const page = (over = {}) => ({
  brand: 'X', lang: 'en', business_type: 'restaurant', type_label: 'Restaurant', location: 'Mumbai', niche: 'restaurant', hero_heading: 'Wood-fired pizza in Mumbai', tagline: 'Pizza and pasta, baked fresh every day in Mumbai.', about_title: 'About', about: ['We bake.'],
  features_title: 'On the menu', features: [{ title: 'Pizza', text: 'Baked.' }, { title: 'Pasta', text: 'Fresh.' }, { title: 'Tiramisu', text: 'Sweet.' }], highlights: [], steps_title: 'Steps', steps: [{ title: 'Order', text: 'Call.' }], faq: [{ q: 'Open?', a: 'Yes.' }],
  cta_primary: 'Book A Table', cta_secondary: '', cta_title: 'Hungry?', ui: {}, generated_by: { business_type: 'restaurant', mode: 'strict', items_from_prompt: ['pizza', 'pasta'] }, needs_review: [], ...over,
})
const ours = { niche: 'restaurant_dining', heroTitle: 'A Table Is Waiting', subject: 'restaurant', theme: 'food_dining', prompt: 'mere restaurant ki website banao, pizza aur pasta', brand: 'Forno' }
const good = decideCore(page(), ours)
ok(good.use && good.blocks?.hero?.title === 'Wood-fired pizza in Mumbai', 'a good Core-Craft page is used')
const site = decideCore(page({ hero_heading: "Mumbai's restaurant website and pizza" }), ours)
ok(site.use && !site.blocks?.hero?.title, 'a headline that talks about the website is not used (the built-in headline stays)')
const looks = decideCore(page({ hero_heading: 'Alag type and animation ho, without the jargon', generated_by: { business_type: 'x', mode: 'strict', items_from_prompt: ['alag type', 'animation ho'] } }), { ...ours, prompt: 'mujhe kuch alag type ki website chahiye jisme animation ho' })
ok(!looks.use, 'a page built on "alag type" and "animation ho" as services is not used')

// a clothing store is not a jewellery or footwear shop on its first screen, and "cloth" is a clothing store
const heads = new Set()
for (let v = 1; v <= 30; v += 1) heads.add(generateLibraryPage('mujhe cloth ki website banakar do', v, undefined, true, 'auto').content.hero.title)
ok([...heads].every((t) => !/footwear|jewel|saree|gift|watch/i.test(t)), `no other goods in the headlines of a clothing store (${[...heads].find((t) => /footwear|jewel|gift/i.test(t))})`)
ok(generateLibraryPage('mujhe cloth ki website banakar do', 3, undefined, true, 'auto').content.subject !== '', '"cloth" gives the business a subject')
console.log(`${pass} passed, ${fail.length} failed`)
for (const f of fail) console.log(`  ✗ ${f}`)
process.exit(fail.length ? 1 : 0)

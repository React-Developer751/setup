// Businesses nobody wrote a pack for, asked the way people ask: a person with an audience (influencer, YouTuber, podcast, freelancer), software with its own list of features, names that are really a platform or a tool.
// The page must be about what was said, in the right voice, with the right name.   node scripts/test-open-world.mjs
import { loadGeneratorModule } from './lib/load-generator.mjs'

globalThis.document = { styleSheets: [] }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { decideCore } = await loadGeneratorModule('edit/corecraft.ts')
let passed = 0
let failed = 0
const ok = (cond, label) => { if (cond) passed += 1; else { failed += 1; console.log(` - ${label}`) } }
const page = (p) => generateLibraryPage(p, 7, undefined, true, 'auto', undefined, true)
const text = (lib) => JSON.stringify(lib.content).toLowerCase()

const inf = page('Website for an influencer: fashion and lifestyle creator with 250k followers on Instagram, brand collaborations, reels, sponsored posts')
ok(inf.content.voice === 'me' && !/we reply|tell us what you need/.test(text(inf)), 'influencer: written in the first person, not as a service business')
ok(inf.content.stats.some((s) => s.value === '250K+') && inf.content.stats.length >= 2, 'influencer: the audience number is a stat, with a second one so there is a strip')
ok(!/instagram/.test(inf.content.brandName.toLowerCase()) && !/followers on instagram/.test(JSON.stringify(inf.content.features.items).toLowerCase()), 'influencer: Instagram is not a name or a service')
ok(['Brand Collaborations', 'Reels', 'Sponsored Posts'].every((t) => inf.content.features.items.some((i) => i.title === t)), 'influencer: the things listed are the cards')
ok(inf.content.hero.button === 'Work With Me', 'influencer: the button is about working together')

const yt = page('YouTuber website: tech reviews, 1.2M subscribers, sponsorships, merch store')
ok(yt.content.brandName !== 'M' && /channel/i.test(yt.content.brandName), 'YouTuber: "1.2M" is not a name')
ok(!/ask about an item|1 2m/i.test(text(yt)) && yt.content.stats.some((s) => s.value === '1.2M+'), 'YouTuber: not a shop, the number is kept whole')

const pod = page('Podcast website: weekly show about startups, guests, episodes, listen on Spotify')
ok(pod.content.brandName === 'My Podcast' && /startups/i.test(pod.content.hero.title), 'podcast: Spotify is not the name, the topic is in the headline')
ok(!/do you do (?:guests|weekly)/i.test(text(pod)), 'podcast: "guests" and "weekly show" are not services')

const office = page('Office management software website: desk booking, meeting rooms, visitor management, facility requests for companies')
ok(['Desk Booking', 'Meeting Rooms', 'Visitor Management', 'Facility Requests'].every((t) => office.content.features.items.some((i) => i.title === t)), 'office software: the features the person listed are the cards')
ok(!/cloud-native|next-gen/i.test(JSON.stringify(office.content.features)), 'office software: no cards or title of another kind of software')
ok(/office management software/i.test(office.content.hero.title), 'office software: the headline is about the product')
ok(!/for companies\./i.test(JSON.stringify(office.content.features.items)) && /for companies/i.test(office.content.hero.subtitle), 'office software: "for companies" is who it is for, not a card')

const hr = page('HR and payroll software for small companies, attendance, leave, salary slips')
ok(/^An HR/.test(hr.content.hero.title) && !/small companies:/i.test(JSON.stringify(hr.content.features.items)), 'HR software: "An HR", and "small companies" is not a service')
ok(!/^royal and/i.test(hr.content.brandName), 'HR software: the invented name does not start with "and"')

const dj = page('Wedding DJ and sound services in Delhi')
ok(!dj.content.bespoke && /dj/i.test(dj.content.brandName), 'wedding DJ: the niche pack is used, "Wedding DJ" is not the business name')

const course = page('Online course creator selling a Python course for beginners, 3000 students')
ok(course.content.brandName !== 'Python', 'course creator: Python is not the name')

const food = page('Food blogger Ananya, recipes, restaurant reviews, 50k subscribers, brand shoots')
ok(food.content.brandName === 'Ananya' && !/food blogger ananya/i.test(JSON.stringify(food.content.features.items)), 'food blogger: the person is the name, not a service')

const gamer = page('Gaming streamer on Twitch, Valorant and Minecraft, sponsors, discord community')
ok(!/valorant/i.test(gamer.content.brandName), 'streamer: the games are not the name')

const designer = page('Freelance graphic designer Kabir: logos, social media posts, brand identity')
ok(designer.content.voice === 'me' && designer.content.hero.button === 'Start A Project' && !/we tell you/i.test(text(designer)), 'freelance designer: first person')

const prop = page('Property management software for landlords: rent collection, tenant portal, maintenance tickets')
ok(prop.content.hero.button === 'Request A Demo' && prop.content.features.items.some((i) => i.title === 'Rent Collection'), 'property software: a demo, not a quote; "landlords" is the audience')

const app = page('Mobile app development agency: Flutter apps, MVPs, UI design for startups')
ok(app.content.brandName !== 'Flutter' && /MVPs/.test(JSON.stringify(app.content.features.items)), 'app agency: Flutter is not the name, "MVPs"')

// Core-Craft AI does not write the page of a person: its texts say "we sell"
const decision = decideCore({ features: [{ title: 'a', text: 'b' }], about: ['x'], generated_by: { mode: 'strict', items_from_prompt: ['reels', 'sponsored posts'] } }, { personal: true, heroTitle: '', subject: '', theme: 'creative_studio', prompt: '', brand: '' })
ok(decision.use === false, 'a personal page is not given to Core-Craft AI')

// Core-Craft AI took "Office" (a word of the subject) for the name: the page keeps its own name
const core = decideCore({ brand: 'Office', hero_heading: 'Desks and rooms', tagline: 'Office delivers visitor management.', cta_primary: 'Start', features_title: 'What it does', features: [{ title: 'Desk booking', text: 'Office books desks.' }, { title: 'Meeting rooms', text: 'x' }], about_title: 'About', about: ['Office is a tool.'], highlights: [], steps_title: 'Steps', steps: [], faq: [], cta_title: 'Go', generated_by: { mode: 'strict', items_from_prompt: ['desk booking', 'meeting rooms'] } }, { heroTitle: '', subject: 'office management software', theme: 'modern_tech', prompt: '', brand: 'Summit Labs' })
ok(core.use && JSON.stringify(core.blocks).includes('Summit Labs delivers') && !/Office delivers/.test(JSON.stringify(core.blocks)), 'Core-Craft: a word of the subject taken for the name is swapped for the name of the page')

const game = page('Gaming streamer on Twitch, Valorant and Minecraft, sponsors, discord community')
ok(!game.content.features.items.some((i) => /^(?:valorant|minecraft)$/i.test(i.title)) && /valorant/i.test(game.content.hero.subtitle), 'streamer: the games are in the line under the headline, not cards of their own')

const { scenePlan, creatorSceneKey } = await loadGeneratorModule('imageAi.ts')
const plan = scenePlan('playful_vibrant', creatorSceneKey('Gaming streamer on Twitch', true), 0)
ok(![plan.hero, plan.about, ...plan.gallery].some((x) => /balloon|ice cream|swing|gift box|kids/.test(x.prompt)), 'streamer: pictures are of a gamer, not of the colourful theme (balloons, ice cream)')
ok(creatorSceneKey('Gaming streamer', false) === undefined, 'other pages get no creator scenes')

console.log(`open-world: ${passed} checks passed, ${failed} failed`)
process.exit(failed ? 1 : 0)

// Dummy data for the extra pages of a multi-page site (history, opening hours ...).
// Everything is drawn from a seeded random generator: the same prompt gives the same data, a new variation
// gives slightly different data (other years, other numbers, other milestones).
import { applyBusiness, findBusiness, fits, getPool, type PoolPost } from './dataPool'
import { fromKits } from './kits'
import type { Plan } from './extraContent'
import { repeatsAWord } from './creativeBrain'
import type { WebsiteContent } from './finalPrompt'
import { LEXICONS } from './lexicon'
import type { Lexicon } from './lexiconTypes'
import {
  BIO_PATTERNS, BLOG_QUOTES, BLOG_SECTIONS, CITIES, CONCLUSION_PATTERNS, EXTRA_ROLES, FIRST_NAMES, GENERIC_FAQ,
  GENERIC_QUOTES, GENERIC_ROLES, INTRO_PATTERNS, KNOWN_CITIES, LAST_NAMES, STREETS, type LocaleId,
} from './siteBanks'
import type { LegalBlock, LegalDocs, Post, PostBlock } from './siteTypes'
import type { Milestone, OpeningHours } from './siteTypes'
import type { ThemeKey } from './themes'
import { nicheSiteData } from './niche/applyNiche'
import type { Niche } from './niche/types'

const DAYS = {
  weekdays: 'Mon - Fri',
  weekend: 'Sat - Sun',
}

// two opening-hours patterns per business type
const HOURS: Record<ThemeKey, OpeningHours[][]> = {
  modern_tech: [
    [{ day: DAYS.weekdays, time: '9:00 - 18:00' }, { day: 'Saturday', time: '10:00 - 14:00' }, { day: 'Sunday', time: 'Closed' }],
    [{ day: DAYS.weekdays, time: '8:30 - 19:00' }, { day: DAYS.weekend, time: 'Online support only' }],
  ],
  luxury_minimal: [
    [{ day: 'Tue - Sat', time: '10:00 - 19:00' }, { day: 'Sun - Mon', time: 'By appointment' }],
    [{ day: 'Mon - Sat', time: '11:00 - 18:30' }, { day: 'Sunday', time: 'Private viewings' }],
  ],
  organic_nature: [
    [{ day: 'Mon - Sat', time: '8:00 - 19:00' }, { day: 'Sunday', time: '9:00 - 15:00' }],
    [{ day: DAYS.weekdays, time: '7:30 - 18:00' }, { day: DAYS.weekend, time: '9:00 - 16:00' }],
  ],
  bold_fitness: [
    [{ day: DAYS.weekdays, time: '5:00 - 23:00' }, { day: DAYS.weekend, time: '7:00 - 21:00' }],
    [{ day: 'Every day', time: 'Open 24 hours' }],
  ],
  playful_vibrant: [
    [{ day: 'Mon - Sat', time: '10:00 - 19:00' }, { day: 'Sunday', time: '11:00 - 17:00' }],
    [{ day: DAYS.weekdays, time: '9:30 - 18:00' }, { day: DAYS.weekend, time: '10:00 - 18:00' }],
  ],
  professional_services: [
    [{ day: DAYS.weekdays, time: '9:00 - 17:30' }, { day: 'Saturday', time: 'By appointment' }, { day: 'Sunday', time: 'Closed' }],
    [{ day: DAYS.weekdays, time: '8:30 - 18:00' }, { day: DAYS.weekend, time: 'Closed' }],
  ],
  healthcare: [
    [{ day: DAYS.weekdays, time: '8:30 - 18:00' }, { day: 'Saturday', time: '9:00 - 13:00' }, { day: 'Sunday', time: 'Closed' }],
    [{ day: 'Mon - Sat', time: '9:00 - 19:00' }, { day: 'Sunday', time: 'Emergency only' }],
  ],
  food_dining: [
    [{ day: 'Mon - Thu', time: '12:00 - 22:30' }, { day: 'Fri - Sat', time: '12:00 - 23:30' }, { day: 'Sunday', time: '12:00 - 22:00' }],
    [{ day: 'Tue - Sun', time: '11:30 - 23:00' }, { day: 'Monday', time: 'Closed' }],
  ],
  education: [
    [{ day: DAYS.weekdays, time: '9:00 - 20:00' }, { day: 'Saturday', time: '9:00 - 15:00' }, { day: 'Sunday', time: 'Closed' }],
    [{ day: 'Mon - Sat', time: '8:00 - 21:00' }, { day: 'Sunday', time: 'Closed' }],
  ],
  creative_studio: [
    [{ day: DAYS.weekdays, time: '10:00 - 18:00' }, { day: DAYS.weekend, time: 'By appointment' }],
    [{ day: 'Mon - Sat', time: '10:00 - 19:00' }, { day: 'Sunday', time: 'Closed' }],
  ],
  general_business: [
    [{ day: DAYS.weekdays, time: '8:30 - 17:30' }, { day: 'Saturday', time: '9:00 - 13:00' }, { day: 'Sunday', time: 'Closed' }],
    [{ day: 'Mon - Sat', time: '8:00 - 18:00' }, { day: 'Sunday', time: 'Closed' }],
  ],
  ...fromKits((kit): OpeningHours[][] => kit.hours),
}

export const writeHours = (theme: ThemeKey, rand: () => number): OpeningHours[] => {
  const options = HOURS[theme] ?? HOURS.general_business
  return options[Math.floor(rand() * options.length)]
}

// ───────────── company story ─────────────
const MIDDLE: [string, string][] = [
  ['The first {customers} customers', 'Word of mouth did the work. People came back, and they brought friends.'],
  ['A bigger home', 'We moved into a larger space so we could keep up with demand.'],
  ['Recognised by our community', 'Local press and customers began recommending {brand} by name.'],
  ['A team of {team}', 'The team grew, and every new person was chosen for care before skill.'],
  ['A fresh look', 'We refreshed our service, our space and our brand to match the way we work.'],
  ['Listening harder', 'We started asking every customer one question, and rebuilt around the answers.'],
]

const pickFrom = <T,>(items: T[], rand: () => number) => items[Math.floor(rand() * items.length)]

export function writeTimeline(brand: string, rand: () => number, thisYear = new Date().getFullYear()): Milestone[] {
  const customers = pickFrom(['250', '500', '1,000', '2,500', '5,000'], rand)
  const team = String(8 + Math.floor(rand() * 33))
  const fill = (text: string) => text.split('{brand}').join(brand).split('{customers}').join(customers).split('{team}').join(team)

  // three distinct middle milestones, framed by the beginning and today
  const pool = [...MIDDLE]
  const middle: [string, string][] = []
  while (middle.length < 3) middle.push(pool.splice(Math.floor(rand() * pool.length), 1)[0])

  const first = thisYear - (6 + Math.floor(rand() * 14))
  const span = thisYear - first
  const years = [first]
  for (let i = 1; i <= 3; i++) years.push(Math.min(thisYear - 1, first + Math.round((span / 4) * i + (rand() - 0.5))))
  years.sort((a, b) => a - b)
  years.push(thisYear)

  const milestones: [string, string][] = [
    ['Where it began', `${brand} opened with a small team, a clear idea and a lot of patience.`],
    ...middle,
    ['Today', 'Still focused on the same thing: doing the work properly, every time.'],
  ]
  return milestones.map(([title, text], i) => ({ year: String(years[i]), title: fill(title), text: fill(text) }))
}

// ═════════════════════════ Phase 2: the data of every page ═════════════════════════

// ───────────── small helpers ─────────────
const take = <T,>(items: T[], rand: () => number) => items[Math.floor(rand() * items.length)]

/** Draws from a list without repeating until it is used up. */
function drawer<T>(items: T[], rand: () => number) {
  let pool = [...items]
  return () => {
    if (!pool.length) pool = [...items]
    return pool.splice(Math.floor(rand() * pool.length), 1)[0]
  }
}

const fill = (text: string, values: Record<string, string>) =>
  Object.entries(values).reduce((out, [key, value]) => out.split(`{${key}}`).join(value), text)

const lower = (s: string) => (/^[A-Z]{2,}/.test(s) ? s : s.toLowerCase())
const slugify = (s: string) =>
  s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

// ───────────── locale: currency, names, phone, address ─────────────
export type Locale = {
  id: LocaleId
  currency: string
  /** multiply a dollar price by this */
  rate: number
  grouping: string
  names: 'indian' | 'western' | 'world' | 'mixed'
  /** a city named in the prompt, e.g. "Pune 411001" */
  city?: string
}

const LOCALES: Record<LocaleId, Locale> = {
  global: { id: 'global', currency: '$', rate: 1, grouping: 'en-US', names: 'mixed' },
  us: { id: 'us', currency: '$', rate: 1, grouping: 'en-US', names: 'western' },
  in: { id: 'in', currency: '₹', rate: 80, grouping: 'en-IN', names: 'indian' },
  uk: { id: 'uk', currency: '£', rate: 0.8, grouping: 'en-GB', names: 'western' },
  ae: { id: 'ae', currency: 'AED ', rate: 3.7, grouping: 'en-US', names: 'world' },
}

const LOCALE_WORDS: [LocaleId, string[]][] = [
  ['in', ['india', 'indian', 'mumbai', 'delhi', 'bangalore', 'bengaluru', 'pune', 'hyderabad', 'chennai', 'kolkata', 'jaipur', 'ahmedabad', 'surat', 'lucknow', 'indore', 'noida', 'gurgaon', 'gurugram']],
  ['uk', ['uk', 'london', 'manchester', 'england', 'britain', 'british', 'scotland', 'bristol', 'leeds']],
  ['ae', ['dubai', 'uae', 'abu', 'dhabi', 'sharjah', 'emirates']],
  ['us', ['usa', 'america', 'american', 'york', 'california', 'texas', 'chicago', 'austin', 'seattle', 'boston']],
]

/** Reads a country or city out of the prompt: it decides the currency, the names, the phone and the address. */
export function detectLocale(prompt: string): Locale {
  const words = prompt.toLowerCase().split(/[^a-z]+/)
  // a known city is the strongest clue: it fixes the country and the address
  const cityWord = words.find((w) => w in KNOWN_CITIES)
  if (cityWord) return { ...LOCALES[KNOWN_CITIES[cityWord].locale], city: KNOWN_CITIES[cityWord].line }
  const hit = LOCALE_WORDS.find(([, list]) => words.some((w) => list.includes(w)))
  return LOCALES[hit?.[0] ?? 'global']
}

/** "$29 /month" -> "₹2,300 /month". Two significant digits, so the numbers look like real prices. */
export function localizePrice(price: string, locale: Locale): string {
  const match = /^\$([\d,]+(?:\.\d+)?)(.*)$/.exec(price)
  if (!match || locale.rate === 1) return price
  const usd = parseFloat(match[1].replace(/,/g, ''))
  if (usd === 0) return `${locale.currency}0${match[2]}`
  const value = usd * locale.rate
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(value)) - 1)
  const rounded = Math.max(1, Math.round(value / magnitude) * magnitude)
  return `${locale.currency}${rounded.toLocaleString(locale.grouping)}${match[2]}`
}

export function writeContact(locale: Locale, brand: string, rand: () => number) {
  const digits = (n: number) => Array.from({ length: n }, () => Math.floor(rand() * 10)).join('')
  const number = 10 + Math.floor(rand() * 90)
  const street = take(STREETS[locale.id], rand)
  const city = locale.city ?? take(CITIES[locale.id], rand)
  const domain = slugify(brand).replace(/-/g, '') || 'yourbusiness'
  const phone = {
    global: `+1 (555) 01${digits(2)}-${digits(4)}`,
    us: `+1 (555) 01${digits(2)}-${digits(4)}`,
    in: `+91 98${digits(3)} ${digits(5)}`,
    uk: `+44 20 7946 0${digits(3)}`,
    ae: `+971 4 ${digits(3)} ${digits(4)}`,
  }[locale.id]
  const address = {
    global: `${number} ${street}, ${city}`,
    us: `${number} ${street}, ${city}`,
    in: `${number}, ${street}, ${city}`,
    uk: `${number} ${street}, ${city}`,
    ae: `Office ${number}, ${street}, ${city}`,
  }[locale.id]
  return { email: `hello@${domain}.example`, phone, address }
}

// ───────────── people ─────────────
/** n different full names that fit the locale. */
export function writePeople(locale: Locale, n: number, rand: () => number): string[] {
  const group = locale.names === 'mixed' ? null : locale.names
  const names = new Set<string>()
  let guard = 0
  while (names.size < n && guard++ < 200) {
    const pool = group ?? take(['indian', 'western', 'world'] as const, rand)
    names.add(`${take(FIRST_NAMES[pool], rand)} ${take(LAST_NAMES[pool], rand)}`)
  }
  return [...names]
}

const lexiconFor = (theme: ThemeKey): Lexicon => LEXICONS[theme] ?? LEXICONS.general_business

export function writeTeam(theme: ThemeKey, brand: string, locale: Locale, rand: () => number, size = 6) {
  const lex = lexiconFor(theme)
  const names = writePeople(locale, size, rand)
  const roles = drawer([...lex.teamRoles, ...EXTRA_ROLES.filter((r) => !lex.teamRoles.includes(r))], rand)
  const noun = drawer([...lex.nouns.thing, ...lex.nouns.quality].map(lower), rand)
  return names.map((name) => ({
    name,
    role: roles(),
    bio: fill(take(BIO_PATTERNS, rand), {
      first: name.split(' ')[0],
      brand,
      n: String(4 + Math.floor(rand() * 15)),
      noun: noun(),
    }),
  }))
}

export function writeReviews(theme: ThemeKey, brand: string, locale: Locale, rand: () => number, count = 6) {
  const lex = lexiconFor(theme)
  const roles = [...new Set([...lex.quotes.map(([, role]) => role), ...GENERIC_ROLES])]
  const nextRole = drawer(roles, rand)
  // the business's own quotes first, topped up with general ones
  const pool: [string, string | null][] = [...lex.quotes.map(([q, role]): [string, string | null] => [q, role]), ...GENERIC_QUOTES.map((q): [string, string | null] => [q, null])]
  const next = drawer(pool, rand)
  const names = writePeople(locale, count, rand)
  const seen = new Set<string>()
  const reviews: { quote: string; author: string; role: string }[] = []
  while (reviews.length < count) {
    const [quote, role] = next()
    const text = fill(quote, { brand })
    if (seen.has(text)) continue
    seen.add(text)
    reviews.push({ quote: text, author: names[reviews.length], role: role ?? nextRole() })
  }
  return reviews
}

export function writeFaq(theme: ThemeKey, brand: string, rand: () => number, count = 8) {
  const lex = lexiconFor(theme)
  const next = drawer([...lex.faq, ...GENERIC_FAQ], rand)
  const seen = new Set<string>()
  const items: { q: string; a: string }[] = []
  while (items.length < count) {
    const [q, a] = next()
    if (seen.has(q)) continue
    seen.add(q)
    items.push({ q: fill(q, { brand }), a: fill(a, { brand }) })
  }
  return items
}

export function writeGalleryCaptions(theme: ThemeKey, rand: () => number, count = 12) {
  const lex = lexiconFor(theme)
  const captions = new Set<string>()
  const next = drawer(lex.gallery, rand)
  for (let i = 0; i < lex.gallery.length && captions.size < count; i++) captions.add(next())
  // top up with "Adjective Noun" captions made from the business's own vocabulary
  const adj = drawer(lex.adjectives.thing, rand)
  const noun = drawer(lex.nouns.thing, rand)
  for (let guard = 0; captions.size < count && guard < 60; guard++) {
    const caption = `${adj()} ${noun()}`
    if (!repeatsAWord(caption)) captions.add(caption)
  }
  return [...captions].slice(0, count)
}

export function writePricing(plans: Plan[], locale: Locale): Plan[] {
  return plans.map((plan) => ({ ...plan, price: localizePrice(plan.price, locale) }))
}

// ───────────── blog ─────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const formatDate = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`

const wordCount = (blocks: PostBlock[]) =>
  blocks.reduce((sum, b) => sum + (b.type === 'list' ? b.items.join(' ') : b.text).split(/\s+/).length, 0)

export function writePosts(
  theme: ThemeKey,
  brand: string,
  subject: string,
  locale: Locale,
  rand: () => number,
  count = 9,
  today = new Date(),
): Post[] {
  const lex = lexiconFor(theme)
  const subjectText = subject || 'your business'
  const nounPool = [...lex.nouns.thing, ...lex.nouns.quality]
  const nextNoun = drawer(nounPool, rand)
  const nextAdj = drawer([...lex.adjectives.thing, ...lex.adjectives.quality], rand)
  const nextVerb = drawer([...lex.verbs.thing, ...lex.verbs.quality], rand)
  const nextTag = drawer(lex.blogTags, rand)
  const nextSection = drawer(BLOG_SECTIONS, rand)
  const nextQuote = drawer(BLOG_QUOTES, rand)
  const people = writePeople(locale, 4, rand)
  const nextRole = drawer(lex.teamRoles, rand)
  const authors = people.map((name) => ({ name, role: nextRole() }))

  const titlePatterns: ((p: { adj: string; noun: string; verb: string; n: number }) => string)[] = [
    ({ n, verb, adj, noun }) => `${n} Ways To ${verb} ${adj} ${noun}`,
    ({ adj, noun }) => `The Beginner's Guide To ${adj} ${noun}`,
    ({ adj, noun }) => `Behind The Scenes Of ${adj} ${noun}`,
    ({ adj, noun }) => `What We've Learned About ${adj} ${noun}`,
    ({ adj, noun }) => `${adj} ${noun}: A Practical Guide`,
    ({ noun }) => `Common Mistakes With ${noun}, And How To Avoid Them`,
    ({ noun }) => `Your Questions About ${noun}, Answered`,
    ({ noun }) => `How ${brand} Approaches ${noun}`,
  ]
  const patternUses = new Array(titlePatterns.length).fill(0)

  const titles = new Set<string>()
  const posts: Post[] = []
  let date = new Date(today)
  date.setDate(date.getDate() - (2 + Math.floor(rand() * 10)))

  for (let guard = 0; posts.length < count && guard < 200; guard++) {
    // pick a title pattern that has not been used too often, without repeating a word
    let patternIndex = Math.floor(rand() * titlePatterns.length)
    if (patternUses[patternIndex] >= 2) patternIndex = patternUses.indexOf(Math.min(...patternUses))
    const noun = nextNoun()
    const title = titlePatterns[patternIndex]({ n: 3 + Math.floor(rand() * 7), verb: nextVerb(), adj: nextAdj(), noun })
    if (titles.has(title) || repeatsAWord(title.split(brand).join(''))) continue
    titles.add(title)
    patternUses[patternIndex]++

    const values = { brand, subject: subjectText, noun: lower(noun) }
    const [h1, p1] = nextSection()
    const [h2, p2] = nextSection()
    const bullets = [...lex.points].sort(() => rand() - 0.5).slice(0, 4)
    const body: PostBlock[] = [
      { type: 'p', text: fill(take(INTRO_PATTERNS, rand), values) },
      { type: 'h2', text: h1 },
      { type: 'p', text: fill(p1, values) },
      { type: 'quote', text: nextQuote() },
      { type: 'h2', text: h2 },
      { type: 'p', text: fill(p2, values) },
      { type: 'list', items: bullets },
      { type: 'p', text: fill(take(CONCLUSION_PATTERNS, rand), values) },
    ]
    const author = authors[posts.length % authors.length]
    const first = body[0].type === 'p' ? body[0].text : ''
    posts.push({
      slug: slugify(title) || `post-${posts.length + 1}`,
      title,
      tag: nextTag(),
      excerpt: first,
      author: author.name,
      role: author.role,
      date: formatDate(date),
      readTime: `${Math.min(8, Math.max(2, Math.round(wordCount(body) / 70)))} min read`,
      body,
    })
    date = new Date(date)
    date.setDate(date.getDate() - (6 + Math.floor(rand() * 12)))
  }
  return posts
}

// ───────────── your own data (src/data/dataPool.json) ─────────────
// What the pool holds is placed first, a different selection and order for every prompt and variation; the generator
// fills what is missing. With mode "only" nothing is invented for a section that has at least one entry of its own.
type Seed = { theme: ThemeKey; prompt: string; brand: string; subject: string }

const shuffled = <T,>(items: T[], rand: () => number) => {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const personal = (text: string, seed: Seed) => text.split('{brand}').join(seed.brand).split('{subject}').join(seed.subject || 'our work')

/** Pool entries first, then the generated ones, up to `count`; generated duplicates (same key) are skipped. */
function blend<T>(own: T[], generated: T[], count: number, key: (item: T) => string): T[] {
  // a big pool is sampled: every site shows `count` of the entries (a different selection each time)
  const mine = own.slice(0, count)
  if (getPool().mode === 'only' && mine.length) return mine
  const seen = new Set(mine.map(key))
  return [...mine, ...generated.filter((item) => !seen.has(key(item)))].slice(0, count)
}

const parsedTime = (text: string) => {
  const time = Date.parse(text)
  return Number.isNaN(time) ? undefined : time
}

function mergePosts(generated: Post[], seed: Seed, rand: () => number, count = 9): Post[] {
  const own = shuffled(getPool().posts.filter((post) => fits(post, seed.theme, seed.prompt)), rand)
  if (!own.length) return generated
  const used = new Set<string>()
  const converted = own.map((post: PoolPost, i): Post => {
    const base = generated[i % generated.length]
    const title = personal(post.title, seed)
    let slug = slugify(post.slug || title) || `post-${i + 1}`
    for (let n = 2; used.has(slug); n++) slug = `${slugify(post.slug || title)}-${n}`
    used.add(slug)
    const body = post.body.map((block): PostBlock => (block.type === 'list' ? { type: 'list', items: block.items.map((t) => personal(t, seed)) } : { type: block.type, text: personal(block.text, seed) }))
    const first = body.find((block) => block.type === 'p')
    const excerptSource = post.excerpt ?? (first && first.type === 'p' ? first.text : '')
    const time = post.date ? parsedTime(post.date) : undefined
    return {
      slug,
      title,
      tag: post.tag ?? base.tag,
      excerpt: personal(excerptSource.length > 170 ? `${excerptSource.slice(0, 167).replace(/\s+\S*$/, '')}...` : excerptSource, seed),
      author: post.author ?? base.author,
      role: post.role ?? base.role,
      // an undated post borrows the date of a generated one, so the list still runs newest to oldest
      date: time !== undefined ? formatDate(new Date(time)) : base.date,
      readTime: post.readTime ?? `${Math.min(12, Math.max(1, Math.round(wordCount(body) / 200)))} min read`,
      body,
    }
  })
  const posts = blend(converted, generated, count, (post) => post.slug)
  // The generated posts only fill up the list: they get older dates than the person's own posts, so the real ones come first
  // (and on the home page), instead of being pushed down by made-up articles from "last week".
  const ownSlugs = new Set(converted.map((post) => post.slug))
  const ownTimes = posts.filter((post) => ownSlugs.has(post.slug)).map((post) => parsedTime(post.date) ?? 0)
  let filler = ownTimes.length ? Math.min(...ownTimes) : 0
  const dated = posts.map((post) => {
    if (ownSlugs.has(post.slug) || !filler) return post
    filler -= (6 + Math.floor(rand() * 12)) * 86400000
    return { ...post, date: formatDate(new Date(filler)) }
  })
  // newest first
  return dated.sort((a, b) => (parsedTime(b.date) ?? 0) - (parsedTime(a.date) ?? 0))
}

function mergeTeam(generated: ReturnType<typeof writeTeam>, seed: Seed, rand: () => number, size = 6) {
  const own = shuffled(getPool().team.filter((person) => fits(person, seed.theme, seed.prompt)), rand).map((person, i) => ({
    name: person.name,
    role: person.role,
    bio: person.bio ? personal(person.bio, seed) : generated[i % generated.length].bio.split(generated[i % generated.length].name.split(' ')[0]).join(person.name.split(' ')[0]),
  }))
  return blend(own, generated, size, (person) => person.name)
}

function mergeReviews(generated: ReturnType<typeof writeReviews>, seed: Seed, rand: () => number, count = 6) {
  const own = shuffled(getPool().reviews.filter((review) => fits(review, seed.theme, seed.prompt)), rand).map((review, i) => ({
    quote: personal(review.quote, seed),
    author: review.author,
    role: review.role ?? generated[i % generated.length].role,
  }))
  return blend(own, generated, count, (review) => review.quote)
}

function mergeFaq(generated: ReturnType<typeof writeFaq>, seed: Seed, rand: () => number, count = 8) {
  const own = shuffled(getPool().faq.filter((item) => fits(item, seed.theme, seed.prompt)), rand).map((item) => ({ q: personal(item.q, seed), a: personal(item.a, seed) }))
  return blend(own, generated, count, (item) => item.q)
}

function mergeGallery(generated: string[], seed: Seed, rand: () => number, count = 12) {
  const own = shuffled(getPool().gallery.filter((item) => fits(item, seed.theme, seed.prompt)), rand).map((item) => personal(item.caption, seed))
  return blend(own, generated, count, (caption) => caption)
}

/**
 * The same pool, for the single page of the "92 components" engine: its team, reviews, FAQ, gallery captions and blog teasers
 * keep their usual number, but come from the pool first.
 */
export function applyPoolToContent(content: WebsiteContent, theme: ThemeKey, prompt: string, rand: () => number, nicheOwn = false): WebsiteContent {
  content = applyBusiness(content, findBusiness(prompt, theme))
  // a business with a text pack of its own keeps the pack's gallery, questions and articles: the pool's lines are for its kind of business (a restaurant's "The pass at lunch service" on a cafe)
  if (nicheOwn) return content
  const seed: Seed = { theme, prompt, brand: content.brandName, subject: content.subject }
  const pool = getPool()
  const fit = <T extends { for: string[] }>(items: T[]) => shuffled(items.filter((item) => fits(item, theme, prompt)), rand)

  const members = blend(
    fit(pool.team).map((person) => ({ name: person.name, role: person.role, bio: person.bio ? personal(person.bio, seed) : undefined })),
    content.team.members,
    content.team.members.length,
    (person) => person.name,
  )
  const quotes = blend(
    fit(pool.reviews).map((review, i) => ({ quote: personal(review.quote, seed), author: review.author, role: review.role ?? content.testimonials[i % content.testimonials.length]?.role ?? '' })),
    content.testimonials,
    content.testimonials.length,
    (review) => review.quote,
  )
  const faq = blend(
    fit(pool.faq).map((item) => ({ q: personal(item.q, seed), a: personal(item.a, seed) })),
    content.faq,
    content.faq.length,
    (item) => item.q,
  )
  const captions = blend(
    fit(pool.gallery).map((item) => personal(item.caption, seed)),
    content.gallery.captions,
    content.gallery.captions.length,
    (caption) => caption,
  )
  const posts = blend(
    fit(pool.posts).map((post) => ({ tag: post.tag ?? content.blog.posts[0]?.tag ?? 'News', title: personal(post.title, seed) })),
    content.blog.posts,
    content.blog.posts.length,
    (post) => post.title,
  )
  return {
    ...content,
    team: { ...content.team, members },
    testimonials: quotes,
    testimonial: quotes[0] ?? content.testimonial,
    faq,
    gallery: { ...content.gallery, captions },
    blog: { ...content.blog, posts },
  }
}

// ───────────── everything for one site ─────────────
/** The extra data a multi-page site needs, merged on top of the single page's content. */
// ───────────── legal pages ─────────────
// General templates, not legal advice. They only claim what a static site really does (no accounts, no database).
const LAW: Record<LocaleId, string> = {
  global: 'the laws that apply where we operate',
  in: 'the laws of India',
  us: 'the laws of the state in which we are based',
  uk: 'the laws of England and Wales',
  ae: 'the laws of the United Arab Emirates',
}

export function writeLegal(brand: string, email: string, locale: Locale): LegalDocs {
  const now = new Date()
  const updated = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
  const privacy: LegalBlock[] = [
    { heading: 'Who we are', text: [`${brand} runs this website. If you have a question about how we handle your information, write to us at ${email}.`] },
    {
      heading: 'What we collect',
      text: [
        'We only collect what you choose to send us: your name, email address and message when you use the contact form, and your email address if you subscribe to our updates.',
        'The website does not ask you to create an account and does not take payments by itself.',
      ],
    },
    {
      heading: 'How we use it',
      text: ['We use your details to reply to your message, to provide what you asked for and, if you subscribed, to send you updates. You can ask us to stop at any time.'],
    },
    {
      heading: 'Cookies and storage',
      text: ['This website does not use advertising or tracking cookies. It may remember your light or dark colour choice in your browser, which stays on your device.'],
    },
    {
      heading: 'Sharing',
      text: ['We do not sell your information. We only share it with people who help us run the business (for example an email or booking service), or when the law requires it.'],
    },
    {
      heading: 'Your choices',
      text: [`You can ask to see, correct or delete the information we hold about you by writing to ${email}. We keep it only as long as we need it for the reasons above.`],
    },
    { heading: 'Changes', text: ['If we change this policy we will update the date at the top of the page.'] },
  ]
  const terms: LegalBlock[] = [
    { heading: 'Using this website', text: [`By using the ${brand} website you agree to these terms. Please do not use the site for anything unlawful or harmful.`] },
    { heading: 'Information on the site', text: ['We work hard to keep everything accurate and up to date, but prices, opening hours and availability can change. Please confirm details with us before you rely on them.'] },
    { heading: 'Bookings and orders', text: ['Any booking or order is agreed with us directly and confirmed by us. The conditions we give you at that point apply to it.'] },
    { heading: 'Our content', text: [`The text, images and design of this website belong to ${brand} or are used with permission. Please ask before you copy or share them commercially.`] },
    { heading: 'Links to other sites', text: ['Our pages may link to other websites. We are not responsible for what they contain or how they handle your information.'] },
    { heading: 'Our responsibility', text: ['We are responsible for the services we provide to you, as the law says. We are not responsible for losses that we could not reasonably have foreseen, or for interruptions to the website.'] },
    { heading: 'Governing law', text: [`These terms are governed by ${LAW[locale.id]}.`] },
    { heading: 'Contact', text: [`Questions about these terms? Write to ${email}.`] },
  ]
  return { updated, privacy, terms }
}

export function writeSiteData(
  theme: ThemeKey,
  brand: string,
  subject: string,
  prompt: string,
  content: WebsiteContent,
  rand: () => number,
  /** a niche pack: its own team roles, FAQ, reviews, gallery and blog instead of the kit's */
  niche?: Niche,
): { content: WebsiteContent; locale: Locale } {
  const locale = detectLocale(prompt)
  // a real business from the pool (its own tagline, services, prices, contact and hours) comes before anything invented
  const business = findBusiness(prompt, theme)
  content = applyBusiness(content, business)
  const contact = { ...writeContact(locale, brand, rand), ...(business?.email ? { email: business.email } : {}), ...(business?.phone ? { phone: business.phone } : {}), ...(business?.address ? { address: business.address } : {}) }
  const seed: Seed = { theme, prompt, brand, subject }
  const posts = mergePosts(writePosts(theme, brand, subject, locale, rand), seed, rand)
  const reviews = mergeReviews(writeReviews(theme, brand, locale, rand), seed, rand)

  const base = {
    ...content,
    timeline: writeTimeline(brand, rand),
    hours: business?.hours.length ? business.hours : writeHours(theme, rand),
    posts,
    team: { ...content.team, members: mergeTeam(writeTeam(theme, brand, locale, rand), seed, rand) },
    gallery: { ...content.gallery, captions: mergeGallery(writeGalleryCaptions(theme, rand), seed, rand) },
    faq: mergeFaq(writeFaq(theme, brand, rand), seed, rand),
    testimonials: reviews,
    testimonial: reviews[0],
    pricing: { ...content.pricing, plans: writePricing(content.pricing.plans, locale) },
    blog: { ...content.blog, posts: posts.slice(0, 3).map((p) => ({ tag: p.tag, title: p.title, slug: p.slug })) },
    contact: { ...content.contact, ...contact },
    legal: writeLegal(brand, contact.email, locale),
  }
  return { locale, content: niche ? nicheSiteData(base, content, niche, locale, rand) : base }
}

// Copywriting brain: writes the whole page's text, not just the headlines.
//
// How it stays sensible
//   1. Typed words   : every noun, adjective and verb belongs to a kind (thing / quality / group, see
//                      lexiconTypes.ts) and a phrase only combines words of the SAME kind, so "Automate Smart
//                      Workflows" can happen but "Dream Your Imagination" cannot.
//   2. Patterns      : sentence skeletons ("{verb} Your {adjective} {noun} {benefit}") with slots.
//   3. No repeats    : words are drawn without replacement, so one page never reuses a word, and a quality gate
//                      rejects any line that repeats a word or is too long.
//   4. Mixing        : feature cards, FAQ, stats, quotes ... are picked from hand-written banks AND generated,
//                      so the text is polished but never the same twice.
//   5. Seeded        : everything comes from a seeded random generator: the same prompt always gives the same
//                      page, a new variation number gives a new one.
import { contentTemplates } from './contentTemplates'
import { temperature } from './creativity'
import { LEXICONS } from './lexicon'
import { Markov, newLine } from './markovCopy'
import { seededRandom } from './random'
import type { Plan } from './extraContent'
import type { Kind, Lexicon } from './lexiconTypes'
import type { ThemeKey } from './themes'

export type CreativeCopy = {
  heroTitle: string
  heroSubtitle: string
  featureTitle: string
  ctaTitle: string
  aboutTitle: string
  stepsTitle: string
}

export type CreativeContent = CreativeCopy & {
  button: string
  features: { title: string; text: string }[]
  stats: { value: string; label: string }[]
  steps: { title: string; text: string }[]
  about: { paragraphs: [string, string]; points: [string, string, string] }
  pricing: { title: string; plans: Plan[] }
  gallery: { title: string; captions: string[] }
  testimonials: { quote: string; author: string; role: string }[]
  faq: { q: string; a: string }[]
  blog: { title: string; posts: { tag: string; title: string }[] }
  team: { title: string; members: { name: string; role: string }[] }
  contactText: string
  /** short words for the scrolling strip */
  marquee: string[]
}

// ───────────── small text helpers ─────────────
/** lower-case a vocabulary phrase for the middle of a sentence, but keep acronyms ("SaaS", "AI") intact */
const lowerFirst = (s: string) => (/^[A-Z]{2,}/.test(s) ? s : s.toLowerCase())
const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const titleCase = (s: string) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase())

const IRREGULAR_GERUND: Record<string, string> = { Equip: 'Equipping', Visit: 'Visiting', Offer: 'Offering', Open: 'Opening', Enter: 'Entering', Gather: 'Gathering', Deliver: 'Delivering' }

/** a short verb that ends consonant-vowel-consonant doubles its last letter: get -> getting, plan -> planning, ship -> shipping */
const doublesLastLetter = (word: string) => /^[^aeiou]*[aeiou][^aeiouwxy]$/i.test(word) && word.length <= 4

/** "Empower" -> "Empowering", "Care For" -> "Caring For", "Get" -> "Getting" (only the first word changes) */
function gerund(verb: string) {
  const [first, ...rest] = verb.split(' ')
  const ing =
    IRREGULAR_GERUND[first] ??
    (first.endsWith('e') && !first.endsWith('ee')
      ? `${first.slice(0, -1)}ing`
      : doublesLastLetter(first)
        ? `${first}${first.slice(-1)}ing`
        : `${first}ing`)
  return [ing, ...rest].join(' ')
}

/** Takes items from a list without repeating one until the list is used up. */
function drawer<T>(items: T[], rand: () => number) {
  let pool = [...items]
  return () => {
    if (!pool.length) pool = [...items]
    return pool.splice(Math.floor(rand() * pool.length), 1)[0]
  }
}

function shuffle<T>(items: T[], rand: () => number) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// ───────────── quality gate ─────────────
const MAX_TITLE = 64
const FILLER = new Set(['your', 'the', 'with', 'that', 'and', 'for', 'from', 'this', 'every', 'each', 'into', 'than', 'then', 'made', 'come', 'together'])

/** Reduces a word to a rough root: "growth" -> "grow", "purity" and "pure" -> "pur", "handcrafted" -> "handcraft". */
const root = (word: string) =>
  (word === 'built' ? 'build' : word)
    .replace(/(ing|ed|es|s|ity|th)$/, '')
    .replace(/e$/, '')

/** True when the same word, or a form of it, appears twice: "Blending ... Blends", "Grow ... Growth", "handcrafted ... hand". */
export function repeatsAWord(text: string) {
  const roots: string[] = []
  for (const word of text.toLowerCase().split(/[^a-z']+/)) {
    if (word.length <= 3 || FILLER.has(word)) continue
    const r = root(word)
    // one root being the start of another ("hand" / "handcraft") counts, as long as the short one is a real word
    if (roots.some((seen) => seen === r || (Math.min(seen.length, r.length) >= 4 && (seen.startsWith(r) || r.startsWith(seen))))) return true
    roots.push(r)
  }
  return false
}

/** the two halves of a sentence frame must go together ("Ready To ...?", "Your Next Chapter Of ... Starts Here.", "Where ... Come Together"): a chain that took the start of one and the end of another is not used */
const coherent = (text: string) => {
  const q = /^Ready To\b/i.test(text)
  if (q !== text.endsWith('?')) return false
  const chapter = /Chapter Of/i.test(text)
  if (chapter !== /Starts Here\.$/.test(text)) return false
  if (chapter && !/^Your Next Chapter/i.test(text)) return false
  if (/\bToday\.$/.test(text) && !/^Start\b/i.test(text)) return false
  if (/^Start\b/i.test(text) && !/\bToday\.$/.test(text)) return false
  if (/^Let's/i.test(text) !== /\bTogether\.$/.test(text) && !/Come Together$/.test(text)) return false
  if (/^Where\b/i.test(text) !== /Come Together$/.test(text)) return false
  return true
}

/** the headlines of a business type that the Markov chain learns from: the hand-written ones, and the ones the pattern writer makes without it */
const corpora = new Map<ThemeKey, { hero: Markov; feature: Markov; cta: Markov }>()
function corpusFor(theme: ThemeKey) {
  const cached = corpora.get(theme)
  if (cached) return cached
  // only the hand-written headlines of THIS business type (another type's would leak its words into the chain)
  const hand = contentTemplates[theme]
  const sets = hand ? [hand, ...hand.alternatives] : []
  const hero = sets.map((h) => h.heroTitle)
  const feature = sets.map((h) => h.featureTitle)
  const cta = sets.map((h) => h.ctaTitle)
  for (let i = 0; i < 60; i += 1) {
    const written = writeContent(theme, 'Brand', seededRandom(1000 + i * 7919), true)
    for (const [list, line] of [[hero, written.heroTitle], [feature, written.featureTitle], [cta, written.ctaTitle]] as const) if (!/Brand/.test(line)) list.push(line)
  }
  const made = { hero: new Markov(hero), feature: new Markov(feature), cta: new Markov(cta) }
  corpora.set(theme, made)
  return made
}

/** the business of the prompt as a phrase ("bike rental", "dog grooming"): without the request, the brand name, the place; '' when the prompt says nothing particular */
const REQUEST_WORDS = new Set(['create', 'make', 'build', 'generate', 'design', 'a', 'an', 'the', 'website', 'site', 'web', 'page', 'landing', 'for', 'my', 'our', 'me', 'i', 'need', 'want', 'new', 'please'])
const businessPhrase = (prompt: string | undefined) => {
  if (!prompt) return ''
  const head = prompt.split(/\b(?:called|named)\b/i)[0].split(/\s+(?:in|at|near|from)\s+(?=[A-Z])/)[0]
  let words = head
    .split(/\s+/)
    .filter((w, i) => !(i > 0 && /^[A-Z][\p{L}&'-]*$/u.test(w)) && !REQUEST_WORDS.has(w.toLowerCase().replace(/[^\p{L}]/gu, '')) )
    .map((w) => w.replace(/[^\p{L}\p{N}'&-]+/gu, ''))
    .filter(Boolean)
  while (words.length > 2 && /^(?:service|services|company|firm|business|agency)$/i.test(words[words.length - 1])) words = words.slice(0, -1)
  const phrase = words.join(' ').toLowerCase()
  if (phrase.length < 4 || words.length > 5) return ''
  if (/^(?:business|website|site|company|startup|brand|page|store|shop|project)$/.test(phrase)) return ''
  return phrase
}

export function writeContent(theme: ThemeKey, brand: string, rand: () => number, plain = false, userPrompt?: string): CreativeContent {
  const lex: Lexicon = LEXICONS[theme] ?? LEXICONS.general_business

  // ── typed word drawers
  const hasGroup = !!(lex.nouns.group?.length && lex.adjectives.group?.length && lex.verbs.group?.length)
  const draws = (['thing', 'quality', 'group'] as Kind[]).reduce(
    (acc, kind) => {
      if (kind === 'group' && !hasGroup) return acc
      acc[kind] = { noun: drawer(lex.nouns[kind]!, rand), adjective: drawer(lex.adjectives[kind]!, rand), verb: drawer(lex.verbs[kind]!, rand) }
      return acc
    },
    {} as Partial<Record<Kind, { noun: () => string; adjective: () => string; verb: () => string }>>,
  )

  /** things most of the time, qualities some of the time, people occasionally (only where the pattern allows) */
  const pickKind = (allowGroup = false): Kind => {
    const r = rand()
    return allowGroup && hasGroup && r > 0.85 ? 'group' : r < 0.6 ? 'thing' : 'quality'
  }
  const phrase = (kind: Kind = pickKind()) => {
    const d = draws[kind]!
    return { kind, noun: d.noun(), adj: d.adjective(), verb: d.verb() }
  }

  const anyBenefit = drawer(lex.benefits, rand)
  const benefit = () => anyBenefit()
  /** after a noun for people, a benefit that starts with "For" would name people twice ("Hosting Happy Couples For The Whole Family") */
  const benefitAfter = (kind: Kind) => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const text = anyBenefit()
      if (kind !== 'group' || !/^for\b/i.test(text)) return text
    }
    return 'From Day One'
  }
  const audience = drawer(lex.audiences, rand)
  const promise = drawer(lex.promises, rand)

  /** Runs a pattern builder until the result is short enough and does not repeat a word. */
  const write = (builders: (() => string)[], max = MAX_TITLE) => {
    let text = ''
    for (let attempt = 0; attempt < 14; attempt++) {
      text = builders[Math.floor(rand() * builders.length)]()
      if (text.length <= max && !repeatsAWord(text.split(brand).join(''))) return text
    }
    return text
  }

  // ── headlines
  const heroPlain = write([
    () => { const p = phrase(pickKind(true)); return `${p.verb} Your ${p.adj} ${p.noun} ${benefitAfter(p.kind)}` },
    () => { const p = phrase(pickKind(true)); return `${gerund(p.verb)} ${p.adj} ${p.noun} ${benefitAfter(p.kind)}` },
    () => { const p = phrase(); return `${brand}: ${p.adj} ${p.noun}, ${benefit()}` },
    () => { const p = phrase(); return `${p.verb} ${p.adj} ${p.noun}. ${benefit()}.` },
    () => { const a = phrase(); const b = phrase(); return `Where ${a.adj} ${a.noun} And ${b.adj} ${b.noun} Come Together` },
    () => { const p = phrase(); return `${p.adj} ${p.noun} For ${titleCase(audience())}` },
  ])

  // a new headline in the voice of this business type (Markov chain over its headlines), most often when the creativity is high; the pattern headline is the fallback
  const temp = temperature()
  const markov = !plain && temp >= 0.3 ? corpusFor(theme) : undefined
  const mixRand = markov ? seededRandom(Math.floor(rand() * 2 ** 31)) : rand
  const fresh = (model: Markov | undefined, plainTitle: string) => {
    if (!model || mixRand() >= 0.75 * temp) return plainTitle
    return newLine(model, temp, mixRand, { maxLength: MAX_TITLE, repeats: (t) => repeatsAWord(t.split(brand).join('')), coherent }) ?? plainTitle
  }
  // a business the theme words do not describe ("bike rental" under the car theme): headlines and a subtitle that name the business itself
  const biz = plain ? '' : businessPhrase(userPrompt)
  const bizRand = biz ? seededRandom(Math.floor(rand() * 2 ** 31)) : rand
  const Biz = titleCase(biz)
  const oneWord = !biz.includes(' ')
  const bizTitles = oneWord ? [`Your Trusted ${Biz}`, `${Biz} You Can Count On`, `Better ${Biz} Starts Here`] : [`${Biz}, Done Right`, `${Biz} You Can Count On`, `Better ${Biz} Starts Here`, `${Biz} Made Simple`]
  const heroMarkov = fresh(markov?.hero, heroPlain)
  const heroTitle = biz && bizRand() < 0.65 ? bizTitles[Math.floor(bizRand() * bizTitles.length)] : heroMarkov

  const heroSubtitlePlain = write(
    [
      () => { const p = phrase(); return `${brand} brings ${lowerFirst(p.adj)} ${lowerFirst(p.noun)} to ${audience()}, ${lowerFirst(benefit())}.` },
      () => { const p = phrase(); return `${p.verb} ${lowerFirst(p.adj)} ${lowerFirst(p.noun)} with a team that ${promise()}.` },
      () => { const p = phrase(); return `Designed for ${audience()}: ${lowerFirst(p.adj)} ${lowerFirst(p.noun)}, ${lowerFirst(benefit())}.` },
      () => { const p = phrase(); return `A team that ${promise()}, so ${audience()} can enjoy ${lowerFirst(p.adj)} ${lowerFirst(p.noun)} ${lowerFirst(benefit())}.` },
    ],
    140,
  )
  const brandHasBiz = !!biz && brand.toLowerCase().includes(biz)
  const heroSubtitle = biz && !brandHasBiz && bizRand() < 0.7 ? [`${brand} makes ${biz} simple: ${lowerFirst(benefit())}.`, `${sentence(biz)} done properly, ${lowerFirst(benefit())}.`, `Friendly ${biz} from ${brand}, ${lowerFirst(benefit())}.`][Math.floor(bizRand() * 3)] : heroSubtitlePlain

  const featurePlain = write([
    () => `Why ${titleCase(audience())} Choose ${brand}`,
    () => { const p = phrase(); return `${p.adj} ${p.noun}, Done Right` },
    () => { const p = phrase(); return `Everything You Need For ${p.adj} ${p.noun}` },
    () => { const p = phrase(); return `Built Around ${p.adj} ${p.noun}` },
  ])

  const ctaPlain = write([
    () => { const p = phrase(pickKind(true)); return `Ready To ${p.verb} Your ${p.noun}?` },
    () => { const p = phrase('thing'); return `Let's ${p.verb} ${p.adj} ${p.noun} Together.` },
    () => { const p = phrase(); return `Start ${gerund(p.verb)} ${p.adj} ${p.noun} Today.` },
    () => { const p = phrase(); return `Your Next Chapter Of ${p.adj} ${p.noun} Starts Here.` },
  ])

  const featureTitle = fresh(markov?.feature, featurePlain)
  const ctaTitle = fresh(markov?.cta, ctaPlain)

  const aboutTitle = write([
    () => `The Story Behind ${brand}`,
    () => { const p = phrase('thing'); return `${brand}: ${p.adj} By Design` },
    () => { const p = phrase(); return `Built On ${p.adj} ${p.noun}` },
  ])

  const stepsTitle = write([
    () => `How ${brand} Works`,
    () => { const p = phrase(); return `Three Simple Steps To ${p.adj} ${p.noun}` },
    () => { const p = phrase(); return `From First Hello To ${p.adj} ${p.noun}` },
  ])

  // ── feature cards: hand-written ones mixed with generated ones
  const fromBank = drawer(lex.features, rand)
  const usedTitles = new Set<string>()
  const features: { title: string; text: string }[] = []
  for (let i = 0; i < 4; i++) {
    const [title, text] = fromBank()
    if (usedTitles.has(title)) continue
    usedTitles.add(title)
    features.push({ title, text })
  }
  for (let attempt = 0; features.length < 6 && attempt < 20; attempt++) {
    const p = phrase(rand() < 0.65 ? 'thing' : 'quality')
    const title = `${p.adj} ${p.noun}`
    if (usedTitles.has(title) || repeatsAWord(title)) continue
    const texts = [
      sentence(`${lowerFirst(p.adj)} ${lowerFirst(p.noun)}, ${lowerFirst(benefit())}.`),
      `Made for ${audience()}: ${lowerFirst(p.adj)} ${lowerFirst(p.noun)}, ${lowerFirst(benefit())}.`,
      `A team that ${promise()}, so ${audience()} can enjoy ${lowerFirst(p.adj)} ${lowerFirst(p.noun)}.`,
    ]
    const text = texts[Math.floor(rand() * texts.length)]
    if (repeatsAWord(text)) continue
    usedTitles.add(title)
    features.push({ title, text })
  }
  // fall back to the bank if generation could not fill every slot
  while (features.length < 6) {
    const [title, text] = fromBank()
    if (!usedTitles.has(title)) {
      usedTitles.add(title)
      features.push({ title, text })
    }
  }

  // ── steps, stats, faq, perks, plans
  const stepSet = lex.steps[Math.floor(rand() * lex.steps.length)]
  const steps = stepSet.map(([title, text]) => ({ title, text }))

  const nextStat = drawer(lex.stats, rand)
  const stats = [0, 1, 2].map(() => nextStat()).map(([value, label]) => ({ value, label }))

  const withBrand = (text: string) => text.split('{brand}').join(brand)
  const nextFaq = drawer(lex.faq, rand)
  const faq = [0, 1, 2].map(() => nextFaq()).map(([q, a]) => ({ q: withBrand(q), a: withBrand(a) }))

  const ladder = lex.plans[Math.floor(rand() * lex.plans.length)]
  const nextPerk = drawer(lex.perks, rand)
  const plans: Plan[] = ladder.names.map((name, i) => ({
    name,
    price: ladder.prices[i][0],
    period: ladder.prices[i][1],
    perks: [nextPerk(), nextPerk(), nextPerk()],
  }))
  const pricingTitle = [`Plans For ${titleCase(audience())}`, 'Simple, transparent pricing', 'Pick the plan that fits'][Math.floor(rand() * 3)]

  // ── about, gallery, testimonials, blog, team
  const belief = drawer(lex.beliefs, rand)
  const closing = drawer(lex.closings, rand)
  const nextPoint = drawer(lex.points, rand)
  const about: CreativeContent['about'] = {
    paragraphs: [withBrand(belief()), withBrand(closing())],
    points: [nextPoint(), nextPoint(), nextPoint()],
  }

  const nextCaption = drawer(lex.gallery, rand)
  const gallery = {
    title: [`A Look Inside ${brand}`, 'Take a closer look', `Life At ${brand}`][Math.floor(rand() * 3)],
    captions: [0, 1, 2, 3, 4, 5].map(() => nextCaption()),
  }

  const nextQuote = drawer(lex.quotes, rand)
  const testimonials = [0, 1, 2].map(() => nextQuote()).map(([quote, role]) => ({ quote: withBrand(quote), author: 'Sample Customer', role }))

  const nextTag = drawer(lex.blogTags, rand)
  const posts = [0, 1, 2].map(() => {
    const p = phrase(rand() < 0.6 ? 'thing' : 'quality')
    const count = 3 + Math.floor(rand() * 7)
    const titles = [
      `${count} Ways To ${p.verb} ${p.adj} ${p.noun}`,
      `The Beginner's Guide To ${p.adj} ${p.noun}`,
      `Behind The Scenes Of ${p.adj} ${p.noun}`,
      `What We've Learned About ${p.adj} ${p.noun}`,
    ]
    return { tag: nextTag(), title: titles[Math.floor(rand() * titles.length)] }
  })
  const blog = { title: [`Fresh From ${brand}`, 'From the journal', 'Latest stories'][Math.floor(rand() * 3)], posts }

  const NAMES = ['Aarav Mehta', 'Sofia Reyes', 'Liam Carter', 'Mei Tanaka', 'Noah Okafor', 'Isla Fraser', 'Omar Haddad', 'Zoe Laurent', 'Kabir Shah', 'Elena Rossi', 'Daniel Kim', 'Amara Nwosu']
  const nextName = drawer(NAMES, rand)
  const nextRole = drawer(lex.teamRoles, rand)
  const team = {
    title: [`The People Behind ${brand}`, 'Meet the team'][Math.floor(rand() * 2)],
    members: [0, 1, 2].map(() => ({ name: nextName(), role: nextRole() })),
  }

  const contactText = [
    "Questions, ideas or just want to say hello? Send us a message and we'll reply within one business day.",
    'Tell us a little about what you need and we will get back to you quickly.',
    `We would love to hear from you. Drop ${brand} a line and we will take it from there.`,
  ][Math.floor(rand() * 3)]

  // keyword strip: striking adjectives and qualities, no two alike
  const marquee: string[] = []
  for (const word of shuffle([...lex.adjectives.thing, ...lex.nouns.quality, ...lex.adjectives.quality], rand)) {
    if (!repeatsAWord([...marquee, word].join(' ')) && !marquee.includes(word)) marquee.push(word)
    if (marquee.length === 8) break
  }

  return {
    heroTitle,
    heroSubtitle,
    featureTitle,
    ctaTitle,
    aboutTitle,
    stepsTitle,
    button: lex.buttons[Math.floor(rand() * lex.buttons.length)],
    features: shuffle(features, rand),
    stats,
    steps,
    about,
    pricing: { title: pricingTitle, plans },
    gallery,
    testimonials,
    faq,
    blog,
    team,
    contactText,
    marquee,
  }
}

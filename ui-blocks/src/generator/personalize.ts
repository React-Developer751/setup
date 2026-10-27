// Makes the page about THIS business: the services, the place and the little promises the person wrote in the prompt
// ("pest control for homes and offices in Pune, 24x7, free inspection") are put into the hero line, the feature cards, the FAQ and the
// keyword strip. Only what the prompt says is used: nothing is invented (no numbers, no years unless the person wrote them).
import type { WebsiteContent } from './finalPrompt'
import { KNOWN_CITIES } from './siteBanks'

export type Facts = {
  /** what the business does or sells, as short phrases ("termite treatment") */
  services: string[]
  /** who it is for ("homes and offices") */
  audience?: string
  place?: string
  /** promises: 24/7, home delivery, free inspection ... */
  perks: { kind: 'always' | 'delivery' | 'free' | 'online'; text: string }[]
  years?: number
  /** offers named in the prompt ("Free shipping above ₹999", "Cash on delivery", "7-day returns"), as short ready-to-show phrases */
  offers: string[]
  /** when it is open, if the prompt says ("Open on Sunday") */
  hours?: string
  /** prices named for something ("monthly membership 1999") */
  prices: { name: string; amount: number }[]
}

const ACRONYMS = /\b(?:gst|itr|ac|cctv|dj|pg|seo|ai|it|ev|ngo|hr|ui|ux|gps|llc|pvc|upvc|ro|uv|led|pcb|crm|erp|tv|cv|hvac|mri|ecg|ielts|toefl|gre|gmat|neet|jee|cbse|icse|ca|cs|emi|fd|sip|kyc|pan|rto|ott|b2b|b2c|saas|api|vr|ar|3d|2d|ups|cnc|diy)\b/gi
const fixAcronyms = (s: string) => s.replace(ACRONYMS, (m) => m.toUpperCase())
const titleCase = (s: string) => fixAcronyms(s.replace(/(^|[\s/-])([a-z])/g, (_m, a: string, c: string) => a + c.toUpperCase()))
const lowerFirst = (s: string) => (/^[A-Z]{2,}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1))
const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const AUDIENCE = new Set(['homes', 'home', 'houses', 'offices', 'office', 'shops', 'shop owners', 'businesses', 'business', 'companies', 'families', 'family', 'startups', 'students', 'kids', 'children', 'brides', 'bride', 'grooms', 'couples', 'tourists', 'travellers', 'travelers', 'women', 'men', 'ladies', 'pets', 'patients', 'professionals', 'beginners', 'weddings', 'wedding', 'events', 'parties', 'corporates', 'schools', 'hotels', 'restaurants', 'apartments', 'societies', 'individuals', 'seniors', 'teachers', 'farmers', 'freelancers', 'residents', 'commercial', 'residential', 'everyone'])
const NOISE = new Set(['the', 'a', 'an', 'my', 'our', 'your', 'all', 'various', 'many', 'some', 'best', 'good', 'great', 'quality', 'affordable', 'cheap', 'professional', 'top', 'reliable', 'trusted', 'premium', 'modern', 'simple', 'beautiful', 'new', 'and', 'or', 'with', 'also', 'etc'])
const GENERIC = new Set(['business', 'website', 'site', 'page', 'company', 'services', 'service', 'shop', 'store', 'products', 'product', 'things', 'work', 'stuff'])

const cleanItem = (raw: string) => {
  const words = raw.toLowerCase().replace(/[^\p{L}\p{N}&' /+-]/gu, ' ').split(/\s+/).filter(Boolean)
  while (words.length && NOISE.has(words[0])) words.shift()
  while (words.length && NOISE.has(words[words.length - 1])) words.pop()
  return words.join(' ').trim()
}

const splitList = (text: string) => text.split(/\s*(?:,|;|&|\band\b|\baur\b|\bplus\b|\+|\/)\s*/i).map(cleanItem).filter(Boolean)

/** "called Name" is the name, not a description: it is cut out (up to the next word that starts a description) */
const described = (prompt: string) =>
  prompt.replace(/(?<![\p{L}])(?:called|named|naam)(?![\p{L}])\s+[^,.;]*?(?=\s+(?:with|for|in|at|near|selling|offering|providing|offers|which|that|who|and|including|ke liye|me|mein)(?![\p{L}])|[,.;]|$)/giu, ' ').replace(/\s+/g, ' ').trim()

/** things that are promises, not services */
const PERK_ITEM = /^(?:\d+\s*[x×/]\s*7(?:\s+\w+)?|\d+\+?\s*(?:years?|saal)\b.*|(?:years?|saal)\s+(?:of\s+)?experience|(?:great|good|friendly|best)\s+(?:service|prices?|staff)|prices?|pricing|staff|quality|24\s*hours?|24\/7|round the clock|free\b.*|home delivery|doorstep delivery|cash on delivery|cod|(?:easy\s+)?(?:\d+[\s-]*days?\s+)?(?:returns?|refunds?|exchange)|(?:fast\s+)?(?:shipping|delivery)(?:\s+(?:above|over)\s+.*)?|\d{1,2}\s*%\s*(?:off|discount)|online\b.*|open\b.*|available\b.*|affordable|best price|low cost|cheap|fast|quick|experienced|certified|licensed|trusted)$/

const stem = (w: string) => w.replace(/(?:ing|ers?|es|s)$/, '')
const significant = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3 && !GENERIC.has(w) && !NOISE.has(w)).map(stem)

/**
 * `avoid` = words that already describe the business itself (the niche's label, keywords and feature titles): a service that only
 * repeats them ("packers", "scrap dealer") says nothing new.
 */
export function extractFacts(prompt: string, subject: string, avoid: string[] = []): Facts {
  // a person's title and name ("Dr. Sharma") is the brand, not a service
  const text = described(prompt).replace(/\b(?:Dr|Mr|Mrs|Ms|Prof|Er|Adv)\.?\s+[A-Z][\p{L}-]+(?:\s+[A-Z][\p{L}-]+)?/gu, ' ').replace(/\s+/g, ' ').trim()
  const facts: Facts = { services: [], perks: [], offers: [], prices: [] }

  // place: a capitalised word after in / at / near, or a city we know
  const placeMatch = text.match(/(?<![\p{L}])(?:in|at|near|around|based in|across)\s+([A-Z][\p{L}-]+(?:\s+[A-Z][\p{L}-]+)?)/u)
  const known = text.toLowerCase().split(/[^a-z]+/).find((w) => w in KNOWN_CITIES)
  const place = placeMatch?.[1] ?? (known ? titleCase(known) : undefined)
  if (place && !/^(?:India|The|My|Our)$/.test(place)) facts.place = place

  // promises
  if (/24\s*[x×/]\s*7|round the clock|all day and night/i.test(text)) facts.perks.push({ kind: 'always', text: '24/7' })
  if (/(?:home|doorstep|free)\s+(?:delivery|pick-?up)|delivery at home|ghar\s+(?:tak|par)\s+delivery/i.test(text)) facts.perks.push({ kind: 'delivery', text: /pick-?up/i.test(text) ? 'free pickup' : 'home delivery' })
  const free = text.match(/free\s+(quote|consultation|inspection|estimate|trial|demo|checkup|check-up|site visit|first class|sample)/i)
  if (free) facts.perks.push({ kind: 'free', text: free[1].toLowerCase() })
  const onlineWhat = text.match(/online\s+((?:table\s+|room\s+|class\s+|slot\s+)?(?:classes|consultation|booking|orders?|sessions?|appointments?))/i)
  if (onlineWhat) facts.offers.push(`Online ${onlineWhat[1].toLowerCase()}`.replace(/orders?$/, 'ordering'))
  if (/online\s+(?:classes|consultation|booking|orders?|sessions?|appointments?)/i.test(text)) facts.perks.push({ kind: 'online', text: (text.match(/online\s+(classes|consultation|booking|orders?|sessions?|appointments?)/i)?.[0] ?? 'online').toLowerCase() })
  const years = text.match(/(\d{1,2})\+?\s*(?:years?|saal)\s+(?:of\s+)?(?:experience|experienced)/i) ?? text.match(/experience\s+of\s+(\d{1,2})\s*years?/i)
  if (years) facts.years = Number(years[1])

  // offers and opening days: short phrases the page shows in its announcement bar and its contact part
  const money = (n: string) => `${/\$|dollar|usd/i.test(text) ? '$' : '₹'}${Number(n.replace(/,/g, '')).toLocaleString(/\$|dollar|usd/i.test(text) ? 'en-US' : 'en-IN')}`
  const shipping = text.match(/free\s+(?:home\s+)?(?:shipping|delivery)(?:\s+(?:above|over|on\s+(?:orders?\s+)?(?:above|over))\s+(?:rs\.?\s*|₹\s*|inr\s*|\$\s*)?(\d[\d,]*))?/i)
  if (shipping) facts.offers.push(shipping[1] ? `Free shipping above ${money(shipping[1])}` : 'Free shipping')
  if (/cash\s+on\s+delivery|(?<![\p{L}])cod(?![\p{L}])/iu.test(text)) facts.offers.push('Cash on delivery')
  const returns = text.match(/(\d+)[\s-]*days?\s+(?:easy\s+)?(?:returns?|refunds?|exchange)/i)
  if (returns) facts.offers.push(`${returns[1]}-day returns`)
  else if (/easy\s+returns?|free\s+returns?/i.test(text)) facts.offers.push('Easy returns')
  const trial = text.match(/free\s+(\d+)[\s-]*days?\s+(?:trial|demo|access)/i)
  if (trial) facts.offers.push(`Free ${trial[1]}-day trial`)
  const off = text.match(/(\d{1,2})\s*%\s*(?:off|discount)/i)
  if (off) facts.offers.push(`${off[1]}% off`)
  const open = text.match(/open\s+(?:on\s+|all\s+)?(sundays?|7\s+days(?:\s+a\s+week)?|all\s+days|24\s*(?:hours|hrs))/i)
  if (open) facts.hours = /sunday/i.test(open[1]) ? 'Open on Sundays too' : /24/.test(open[1]) ? 'Open 24 hours' : 'Open 7 days a week'

  // services and audience: what comes after "for / selling / offering ...", and lists before "for"
  const intro = text.replace(/^(?:please\s+)?(?:create|build|make|design|generate|i\s+(?:need|want)|need|want)\s+(?:me\s+)?(?:a|an|the)?\s*(?:[\w-]+\s+){0,2}?(?:landing\s*page|web\s*site|website|web\s*page|page|site)\s+(?:for|of)\s+(?:a|an|my|our|the)?\s*/i, '')
  const withoutPlace = intro.replace(/(?<![\p{L}])(?:in|at|near|around|based in|across)\s+[A-Z][\p{L}-]+(?:\s+[A-Z][\p{L}-]+)?/gu, ' ').replace(/\s+/g, ' ').trim()
  const lists: string[] = []
  // what the person listed on purpose (after "with", "selling" ...) is shown even when the kind of business already has such a card
  const explicit = new Set<string>()
  const after = withoutPlace.match(/(?:selling|sells|offering|offers|providing|provides|specialis(?:ing|es)\s+in|specializ(?:ing|es)\s+in|dealing\s+in|deals\s+in|including|includes|such as|known for|focus(?:ed)?\s+on|featuring|teaching|serving|having|that\s+has|which\s+has|with|for)\s+(.+)$/i)
  if (after) {
    lists.push(after[1].replace(/[.,;]+$/, ''))
    // "with ...", "including ...", "selling ..." name things on purpose; a plain "for my kirana store" only names the business
    const prefix = withoutPlace.slice(0, after.index ?? 0).toLowerCase()
    const businessBefore = significant(subject).some((w) => w.length >= 4 && prefix.includes(w))
    if (!/^(?:for)\s/i.test(after[0].trim()) || (businessBefore && /,|\band\b|\baur\b|&/i.test(after[1]))) explicit.add(after[1].replace(/[.,;]+$/, ''))
  }
  // a brand name at the end ("pet shop and vet clinic Happy Paws") is not one more item of the list
  const head = withoutPlace.replace(/\s+(?:for|selling|offering|providing|with|including|that|which)\s+[\s\S]*$/i, '').replace(/(?<=[a-z])(?:\s+[A-Z][\p{L}&'-]*)+$/u, '')
  if (/,|&|\band\b|\baur\b/i.test(head) && head.split(/\s+/).length <= 9) lists.push(head)
  // a list that stands on its own after the name and the place ("naam Forno Rosso, wood fired pizza, fresh pasta, tiramisu aur weekend brunch"): the short phrases are the offer
  if (!lists.length) {
    const META = /(?<![\p{L}])(?:website|web\s*site|site|page|landing|single|multiple|multi|chahiye|chahie|banao|bana|banani|mujhe|please|create|build|make|premium|naam|name|called|named|ke\s+liye|ki|ka|ke|mein|me|want|need|for|pages?)(?![\p{L}])/iu
    const parts = withoutPlace.split(/\s*(?:,|;)\s*|\s+(?:aur|and|&)\s+/i).map((x) => x.trim()).filter(Boolean)
    const items = parts.filter((x) => !META.test(x) && x.split(/\s+/).length <= 5 && !/^\d+$/.test(x))
    if (parts.length >= 3 && items.length >= 2) {
      lists.push(items.join(', '))
      explicit.add(items.join(', '))
    }
  }
  const audience: string[] = []
  const seen = new Set<string>()
  const fromExplicit = new Set(lists.filter((l) => explicit.has(l)).flatMap(splitList))
  for (const raw0 of lists.flatMap(splitList)) {
    // "monthly membership 1999": the thing and its price
    const priced = /(?<![\p{L}])(?:above|over|under|below|minimum|min|off|discount|returns?|days?|trial|shipping|delivery|orders?)(?![\p{L}])/iu.test(raw0) ? null : raw0.match(/^(.*?[a-z])\s*(?:@|at|for|rs\.?|₹)?\s*(\d{3,6})$/i)
    if (priced) facts.prices.push({ name: cleanItem(priced[1]), amount: Number(priced[2]) })
    // "kurti and saree online store": the last item ends with the kind of business, which is not a product
    const whole = priced ? cleanItem(priced[1]) : raw0
    // the business itself ("dental clinic") is not one of its services, also when it is cut down to "dental"
    if (subject && cleanItem(subject) === whole) continue
    const raw = whole.replace(/\s+(?:online\s+)?(?:store|shop|boutique|studio|clinic|centre|center|restaurant|cafe|bakery|salon|dukaan)$/i, '').trim()
    if (!raw) continue
    const words = raw.split(/\s+/)
    if (words.every((w) => AUDIENCE.has(w) || AUDIENCE.has(raw)) || AUDIENCE.has(raw)) {
      audience.push(raw)
      continue
    }
    if (words.length > 5 || raw.length > 36 || raw.length < 3) continue
    if (GENERIC.has(raw) || words.every((w) => GENERIC.has(w)) || PERK_ITEM.test(raw)) continue
    // it only repeats what the business already is (the subject, or the niche's own words)
    const mine = significant(raw)
    const known = new Set([...significant(subject), ...avoid.flatMap(significant)])
    if (!fromExplicit.has(raw0) && (!mine.length || mine.every((w) => known.has(w)))) continue
    // the business itself ("pest control services") is not one of its services
    if (subject && cleanItem(subject) === raw) continue
    if (seen.has(raw)) continue
    seen.add(raw)
    facts.services.push(raw)
  }
  if (audience.length) facts.audience = [...new Set(audience)].slice(0, 3).join(audience.length > 1 ? ' and ' : '')
  facts.services = facts.services.slice(0, 6)
  facts.offers = [...new Set(facts.offers)].slice(0, 4)
  facts.prices = facts.prices.slice(0, 3)
  return facts
}

const CARD_TEXT = [
  '{S}, explained in plain words and done properly the first time.',
  'Tell us what you need for {s} and we reply with a clear plan.',
  '{S} handled by people who do this every day.',
  'Straight answers and fair terms for {s}.',
  'Ask us about {s}: we tell you honestly what makes sense.',
  '{S} with clear steps from the first message to the finish.',
]

/** a feature-card sentence for a service the person listed (no invented claims) */
export const serviceText = (name: string, index: number) => CARD_TEXT[index % CARD_TEXT.length].replaceAll('{S}', upperFirst(fixAcronyms(name))).replaceAll('{s}', lowerFirst(fixAcronyms(name)))

const list = (items: string[]) => (items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`)

/** Puts the facts of the prompt on the page; with no facts the content is returned as it is. */
export function personalize(content: WebsiteContent, facts: Facts, size: 'compact' | 'full', rand: () => number, hasNiche = false): WebsiteContent {
  const { services, place, audience, perks, years, offers, hours, prices } = facts
  if (!services.length && !place && !perks.length && !years && !audience && !offers.length && !hours && !prices.length) return content
  let next = content

  // the line under the headline says what the business does, for whom and where. A niche page already has a good line: it only gets the
  // place, the audience and the promises added; a kit page gets a line made of the services.
  const perkLine = perks.find((p) => p.kind === 'always') ? 'Available 24/7.' : perks.find((p) => p.kind === 'delivery') ? `${upperFirst(perks.find((p) => p.kind === 'delivery')!.text)} available.` : perks.find((p) => p.kind === 'free') ? `Free ${perks.find((p) => p.kind === 'free')!.text}.` : ''
  if (hasNiche) {
    const where = place ? `Serving ${audience ? `${audience} in ` : ''}${place}.` : audience ? `For ${audience}.` : ''
    // what the person named comes into the line: "Wood fired pizza, fresh pasta and tiramisu."
    const named = services.length >= 2 ? `${upperFirst(list(services.slice(0, 3).map((s) => lowerFirst(fixAcronyms(s)))))}.` : ''
    const extra = [named, where, perkLine].filter(Boolean).join(' ')
    const base = next.hero.subtitle.replace(/\s*$/, '')
    if (extra && base.length + extra.length + 1 <= 215) next = { ...next, hero: { ...next.hero, subtitle: `${base} ${extra}` } }
  } else if (services.length >= 2) {
    const shown = services.slice(0, 3).map((s, i) => (i === 0 ? upperFirst(lowerFirst(fixAcronyms(s))) : lowerFirst(fixAcronyms(s))))
    const subtitle = `${list(shown)}${audience ? ` for ${audience}` : ''}${place ? ` in ${place}` : ''}.${perkLine ? ` ${perkLine}` : ''}`
    if (subtitle.length <= 150) next = { ...next, hero: { ...next.hero, subtitle } }
  } else if (place && !next.hero.subtitle.includes(place) && next.hero.subtitle.length < 120) {
    next = { ...next, hero: { ...next.hero, subtitle: `${next.hero.subtitle.replace(/[.]?$/, '.')} Serving ${place}.` } }
  }

  // one feature card per service the person named (the first cards)
  if (services.length) {
    const cards = services.slice(0, 6).map((s, i) => ({
      title: titleCase(s).slice(0, 32),
      text: CARD_TEXT[(i + Math.floor(rand() * CARD_TEXT.length)) % CARD_TEXT.length].replaceAll('{S}', upperFirst(fixAcronyms(s))).replaceAll('{s}', lowerFirst(fixAcronyms(s))),
    }))
    const rest = next.features.items.filter((item) => !cards.some((c) => c.title.toLowerCase() === item.title.toLowerCase()))
    const keep = size === 'full' ? 6 : 3
    next = { ...next, features: { ...next.features, items: [...cards, ...rest].slice(0, keep) }, marquee: [...new Set([...services.slice(0, 4).map((s) => titleCase(s).slice(0, 16)), ...next.marquee])].slice(0, 8) }
  }

  // questions people would ask about exactly these things
  const questions: { q: string; a: string }[] = []
  if (services[0]) questions.push({ q: `Do you offer ${lowerFirst(fixAcronyms(services[0]))}?`, a: `Yes, ${lowerFirst(fixAcronyms(services[0]))} is something we do regularly. Send us a message with the details and we will tell you how we can help.` })
  if (place) questions.push({ q: 'Where are you based?', a: `We are based in ${place}. Get in touch to check that we cover your area.` })
  for (const perk of perks) {
    if (perk.kind === 'delivery') questions.push({ q: `Do you offer ${perk.text}?`, a: 'Yes, we bring it to your door. Ask us about delivery areas and timing when you get in touch.' })
    if (perk.kind === 'always') questions.push({ q: 'Are you available 24/7?', a: 'Yes, you can reach us at any hour. Call or send a message and we will respond as soon as we can.' })
    if (perk.kind === 'free') questions.push({ q: `Is the ${perk.text} free?`, a: `Yes, the ${perk.text} is free. Tell us what you need and we will arrange it.` })
    if (perk.kind === 'online') questions.push({ q: 'Can I do this online?', a: 'Yes, we work online as well as in person. Get in touch and we will set it up.' })
  }
  if (questions.length) next = { ...next, faq: [...questions, ...next.faq.filter((f) => !questions.some((q) => q.q === f.q))].slice(0, 6) }

  // the two facts the person gave in numbers
  const stats = [...next.stats]
  if (years && stats.length) stats[0] = { value: `${years}+`, label: 'Years of experience' }
  const always = perks.find((p) => p.kind === 'always')
  if (always && stats.length > 1 && !stats.some((s) => /24\s*\/\s*7/.test(s.value))) stats[1] = { value: '24/7', label: 'Always reachable' }
  if (years || always) next = { ...next, stats }
  // numbers the person named come first: "free shipping above 999", "7 day returns", "monthly membership 1999", "free 14 day trial"
  const given: { value: string; label: string; fact: true }[] = []
  for (const offer of offers) {
    const amount = offer.match(/^Free shipping above\s+(\S+)$/i)
    const days = offer.match(/^(\d+)-day returns$/i)
    const trial = offer.match(/^Free (\d+)-day trial$/i)
    const off = offer.match(/^(\d+)% off$/i)
    if (amount) given.push({ value: amount[1], label: 'Free shipping above', fact: true })
    else if (days) given.push({ value: `${days[1]} days`, label: 'Easy returns', fact: true })
    else if (trial) given.push({ value: `${trial[1]} days`, label: 'Free trial', fact: true })
    else if (off) given.push({ value: `${off[1]}%`, label: 'Off', fact: true })
  }
  const currency = /^[^\d\s]+/.exec(next.pricing.plans[0]?.price ?? '')?.[0] ?? '₹'
  for (const price of prices.slice(0, 2)) given.push({ value: `${currency}${price.amount.toLocaleString(currency === '$' ? 'en-US' : 'en-IN')}`, label: titleCase(price.name).slice(0, 26), fact: true })
  if (given.length) {
    const labels = new Set(given.map((g) => g.label.toLowerCase()))
    const rest = next.stats.filter((s) => !labels.has(s.label.toLowerCase()))
    next = { ...next, stats: [...given, ...rest].slice(0, Math.max(next.stats.length, 3)) }
  }

  // what the person named is also what the 'about' part stands for
  if (services.length >= 3 && next.about.points.length) next = { ...next, about: { ...next.about, points: services.slice(0, Math.max(3, next.about.points.length)).map((s) => upperFirst(fixAcronyms(s))) } }
  if (offers.length) next = { ...next, offers }
  if (hours) next = { ...next, contact: { ...next.contact, hoursText: hours } }
  // a price named for something is the first plan of the price list (the currency of the plans that are there)
  if (prices.length && next.pricing.plans.length) {
    const currency = /^[^\d\s]+/.exec(next.pricing.plans[0].price)?.[0] ?? '₹'
    const plans = next.pricing.plans.map((plan, i) => (prices[i] ? { ...plan, name: titleCase(prices[i].name).slice(0, 28), price: `${currency}${prices[i].amount.toLocaleString(currency === '$' ? 'en-US' : 'en-IN')}` } : plan))
    next = { ...next, pricing: { ...next.pricing, plans } }
  }

  if (place) {
    next = {
      ...next,
      contact: { ...next.contact, address: next.contact.address.replace(/(?:Your City|Sample City)$/i, place) },
      about: next.about.paragraphs.length ? { ...next.about, paragraphs: [`${next.about.paragraphs[0].replace(/\s*$/, '')} We work from ${place}.`, ...next.about.paragraphs.slice(1)] } : next.about,
    }
  }
  return next
}

const PLAIN_STATS = [
  { value: 'Clear', label: 'Pricing up front' },
  { value: 'Local', label: 'Friendly team' },
  { value: 'Quick', label: 'Replies to every message' },
  { value: 'Honest', label: 'Advice, no pressure' },
  { value: 'Free', label: 'First conversation' },
  { value: 'Simple', label: 'Booking' },
]

/**
 * The kits come with example numbers ("15 years", "5k+ meals", "100%", "30 days"). On a real business page they would be claims the
 * business never made, so they are replaced by plain statements. Kept: "24/7" and what the person wrote (their years of experience).
 */
export function plainStats(stats: { value: string; label: string; fact?: boolean }[], rand: () => number): { value: string; label: string; fact?: boolean }[] {
  const bank = [...PLAIN_STATS].sort(() => rand() - 0.5)
  let next = 0
  const used = new Set<string>()
  return stats.map((stat) => {
    let out = stat
    if (!stat.fact && /\d/.test(stat.value) && !/^24\s*\/\s*7$/.test(stat.value) && stat.label !== 'Years of experience') out = bank[next++ % bank.length]
    // the same word twice in a row of tiles ("Fresh", "Fresh") says nothing: the next free statement takes its place
    if (used.has(out.value.toLowerCase()) && !out.fact) out = bank.find((b) => !used.has(b.value.toLowerCase())) ?? out
    used.add(out.value.toLowerCase())
    return out
  })
}

// A business nobody wrote a text pack for ("kite making workshop", "escape room", "board game cafe", "reptile pet shop"): the page is written from the person's own words, not from the pack of another business
// (a escape room must not get "Premium Homes", an astrologer must not get "Ethnic Wear", a game studio must not get "Team Workspaces"). Nothing here claims what the business is or does beyond what was said:
// the cards, the steps and the questions say what the visitor can ask for and how to reach the business. The person adds the facts (services, prices, hours) in the chat and the page uses them.
import type { WebsiteContent } from './finalPrompt'
import type { Niche } from './niche/types'

export type Mode = 'shop' | 'class' | 'experience' | 'service' | 'creative' | 'community'

const has = (text: string, re: RegExp) => re.test(text)
/** what kind of business it is, by its own words (the order matters: the first that fits) */
export function modeOf(subject: string, prompt = ''): Mode {
  const s = `${subject} ${prompt}`.toLowerCase()
  if (has(s, /\b(?:classes|class|workshops?|courses?|coaching|academy|training|school|lessons?|tuition|institute|bootcamp|teach(?:ing)?|learn(?:ing)?)\b/)) return 'class'
  if (has(s, /\b(?:studio|photograph(?:y|er|ers)|films?|production|podcast|animation|illustration|portfolio|music|band|writer)\b/) && !has(s, /\b(?:cafe|café|bar|club|lounge|spa|salon|gym|yoga|dance)\b/)) return 'creative'
  if (has(s, /\b(?:rides?|tours?|trips?|adventures?|escape\s+rooms?|experiences?|safari|trek(?:s|king)?|parks?|arena|rentals?|hire|events?|party|parties|camp(?:s|ing)?|retreats?|games?|gaming|lounge|cafe|café|bar|club)\b/) && !has(s, /\b(?:shop|store|selling|sells)\b/)) return 'experience'
  if (has(s, /\b(?:shop|store|boutique|mart|dukaan|dukan|selling|sells|outlet|showroom|vendor|supplier|dealer|wholesale|market|emporium|bazaar)\b/)) return 'shop'
  if (has(s, /\b(?:studio|design(?:er|ers)?|photograph(?:y|er|ers)|films?|video|production|podcast|music|band|artists?|portfolio|illustration|animation|writer|writing|creative|crafts?|makers?)\b/)) return 'creative'
  if (has(s, /\b(?:community|club|society|group|network|meetups?|ngo|foundation|trust|association|volunteers?)\b/)) return 'community'
  return 'service'
}

const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'our', 'you', 'are', 'all', 'any', 'one', 'can', 'has', 'have', 'its', 'about', 'into', 'near', 'best', 'top'])
// words that do not say what the business is (a kind of place, a quality)
const TYPE_WORDS = new Set(['italian', 'chinese', 'indian', 'south', 'north', 'mexican', 'thai', 'japanese', 'korean', 'french', 'german', 'continental', 'mughlai', 'punjabi', 'bengali', 'gujarati', 'rajasthani', 'vegan', 'vegetarian', 'veg', 'halal', 'artisan', 'handmade', 'homemade', 'boutique', 'kids', 'children', 'ladies', 'gents', 'unisex', 'mens', 'womens', 'bridal', 'multi', 'cuisine', 'fine', 'dining', 'fast', 'food', 'cloud', 'shop', 'store', 'stores', 'shops', 'service', 'services', 'studio', 'studios', 'centre', 'center', 'agency', 'company', 'firm', 'business', 'solution', 'solutions', 'online', 'local', 'new', 'small', 'family', 'organic', 'premium', 'luxury', 'modern', 'affordable', 'professional', 'quality', 'best', 'famous', 'popular', 'good', 'great', 'traditional', 'authentic', 'pure', 'fresh', 'home', 'house', 'point', 'hub', 'corner', 'world', 'zone', 'club', 'India', 'indian'])
const stem = (w: string) => w.toLowerCase().replace(/(?:ing|ed|es|s)$/, '')
const wordsOf = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3 && !STOP.has(w)).map(stem)

/**
 * The words of the subject that the pack of the niche knows nothing about: "board game cafe" under the cafe pack has "board" and "game" (the pack talks about coffee), "reptile pet shop" under the pet pack has "reptile".
 * Empty when the niche covers what was said.
 */
export function nicheGap(subject: string, niche: Niche): string[] {
  const known = new Set(wordsOf([niche.label, ...niche.keywords, ...niche.features.flatMap((f) => [f.title, f.text]), ...niche.heroTitles, ...niche.heroSubtitles, niche.featureTitle].join(' ')))
  return [...new Set(wordsOf(subject).filter((w) => !TYPE_WORDS.has(w) && !TYPE_WORDS.has(`${w}s`) && !known.has(w)))]
}

const upper = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const titleCase = (s: string) => s.split(/\s+/).map((w) => (/^(?:and|or|of|the|a|an|in|for|to|with)$/i.test(w) ? w.toLowerCase() : upper(w))).join(' ').replace(/^./, (c) => c.toUpperCase())
const article = (s: string) => (/^[aeiou]/i.test(s) && !/^(?:uni|use|user|one)/i.test(s) ? 'an' : 'a')

type Pack = {
  heroTitle: (S: string, inPlace: string, place?: string) => string[]
  sub: string
  button: string
  featuresTitle: string
  cards: [string, string][]
  verb: string
  ask: string
  steps: [string, string][]
  sentence: string
}
const PACKS: Record<Mode, Pack> = {
  shop: {
    heroTitle: (S, inPlace, place) => [`${S}${inPlace}`, `Welcome To Our ${S}`, ...(place ? [`Your ${S} In ${place}`] : [`Your Local ${S}`])],
    sub: 'Tell us what you are looking for and we will help you find it.',
    button: 'Ask About An Item',
    featuresTitle: 'What We Offer',
    cards: [['The Range', 'Tell us what you are looking for and we show you what is available.'], ['Help Choosing', 'Not sure what suits you? Tell us the need and the budget and we suggest options.'], ['Orders And Delivery', 'Ask us how to order, pick up or have it delivered.'], ['Gifts And Bulk Orders', 'Buying for an occasion or in numbers? Message us the details.']],
    verb: 'order',
    ask: 'What do you have in stock?',
    steps: [['Tell Us What You Want', 'Message or call with what you are looking for.'], ['See The Options', 'We tell you what is available and what it costs.'], ['Order Or Visit', 'Place the order or come and see it.']],
    sentence: 'Tell us what you are looking for and we will tell you what we have.',
  },
  class: {
    heroTitle: (S, inPlace) => [`${S}${inPlace}`, `Learn At Our ${S}`, `${S} For Every Level`],
    sub: 'Tell us your level and what you want to learn, and we suggest the right batch.',
    button: 'Join A Class',
    featuresTitle: 'What You Can Learn',
    cards: [['Who It Is For', 'Tell us your age and your level and we say which class fits.'], ['What You Learn', 'Ask for the plan of a class before you join.'], ['Batches And Timings', 'Ask which batch has a seat and when it meets.'], ['Fees And Enrolment', 'Message us for the fee and how to enrol.']],
    verb: 'enrol',
    ask: 'What will I learn?',
    steps: [['Tell Us Your Level', 'Say what you already know and what you want to learn.'], ['Pick A Batch', 'We tell you the batches and the timings.'], ['Start Learning', 'Join the first class.']],
    sentence: 'Tell us your level and we will tell you which class fits.',
  },
  experience: {
    heroTitle: (S, inPlace) => [`${S}${inPlace}`, `Book Your ${S}`, `${S}: Come And Try`],
    sub: 'Pick a date, tell us your group, and we confirm the booking.',
    button: 'Book Now',
    featuresTitle: 'What To Expect',
    cards: [['The Experience', 'Ask what it includes and how long it takes.'], ['Booking And Timings', 'Tell us the date and we say what is free.'], ['Groups And Occasions', 'A birthday, a team outing or a day out: tell us the group size.'], ['Before You Come', 'Ask what to bring, what to wear and any age or health limits.']],
    verb: 'book',
    ask: 'What does it include?',
    steps: [['Pick A Date', 'Tell us when you would like to come.'], ['Book Your Spot', 'We confirm the booking and the price.'], ['Come And Enjoy', 'Arrive and have a good time.']],
    sentence: 'Tell us the date and the group and we will tell you what is possible.',
  },
  service: {
    heroTitle: (S, inPlace) => [`${S}${inPlace}`, `Talk To Us About ${S}`],
    sub: 'Tell us what you need and we reply with a clear plan and price.',
    button: 'Get A Quote',
    featuresTitle: 'What We Do',
    cards: [['What We Do', 'Describe what you need and we tell you if and how we can do it.'], ['How We Work', 'We explain the options and the price before anything starts.'], ['Quotes And Timing', 'Send us the details for a quote and a date.'], ['Where We Work', 'Ask if we cover your area.']],
    verb: 'get a quote',
    ask: 'What exactly do you do?',
    steps: [['Tell Us What You Need', 'Call or send a message with a few details.'], ['We Explain The Options', 'You hear what is possible, the time and the price.'], ['We Do The Work', 'Once you agree, we start.']],
    sentence: 'Tell us what you need and we will tell you honestly what we can do.',
  },
  creative: {
    heroTitle: (S, inPlace) => [`${S}${inPlace}`, `${S}: Start With An Idea`],
    sub: 'Share your idea and we tell you how we would approach it.',
    button: 'Start A Project',
    featuresTitle: 'What We Make',
    cards: [['Our Work', 'Ask to see work like what you have in mind.'], ['How We Work', 'You share the idea, we plan it with you and show it before it is final.'], ['Projects We Take', 'Large or small: tell us the brief.'], ['Quotes', 'Send the brief for a quote and a date.']],
    verb: 'start a project',
    ask: 'What kind of work do you take?',
    steps: [['Share Your Idea', 'Tell us what you have in mind.'], ['We Plan It Together', 'We agree the approach, the time and the price.'], ['We Deliver', 'You get the finished work.']],
    sentence: 'Share your idea and we will tell you how we would approach it.',
  },
  community: {
    heroTitle: (S, inPlace) => [`${S}${inPlace}`, `Join Our ${S}`, `Welcome To The ${S}`],
    sub: 'Say hello, see what we do and join in.',
    button: 'Join Us',
    featuresTitle: 'What We Do',
    cards: [['What We Do', 'Ask what we do and how you can take part.'], ['Who Can Join', 'Tell us about yourself and we say how to join.'], ['Events And Meetups', 'Ask when we meet next.'], ['How To Help', 'Want to support the work? Message us.']],
    verb: 'join',
    ask: 'What do you do?',
    steps: [['Say Hello', 'Send us a message.'], ['Come To A Meeting', 'We tell you when and where.'], ['Join In', 'Take part in what we do.']],
    sentence: 'Say hello and we will tell you how to take part.',
  },
}

/** the page of a business without a text pack, written from its subject (see the top of this file) */
export function bespokeContent(content: WebsiteContent, o: { subject: string; prompt: string; place?: string; rand: () => number }): WebsiteContent {
  const subject = o.subject.trim().toLowerCase()
  if (!subject) return content
  const mode = modeOf(subject, o.prompt)
  const pack = PACKS[mode]
  const S = titleCase(subject)
  const inPlace = o.place ? ` In ${o.place}` : ''
  const brand = content.brandName
  const titles = pack.heroTitle(S, inPlace, o.place)
  // a headline the creative step wrote about the business is kept (the wild and the safe creativity differ there)
  const written = content.hero.title
  const title = written && written.toLowerCase().includes(subject) ? written : titles[Math.floor(o.rand() * titles.length)]
  const cards = pack.cards.map(([t, text]) => ({ title: t, text }))
  const verb = pack.verb
  const plural = /[^s]s$/.test(subject) && !/(?:glass|class|business|process)$/.test(subject)
  const aboutLine = plural ? `${brand} offers ${subject}${o.place ? ` in ${o.place}` : ''}.` : `${brand} is ${article(subject)} ${subject}${o.place ? ` based in ${o.place}` : ''}.`
  const titleHas = title.toLowerCase().includes(subject)
  return {
    ...content,
    bespoke: true,
    hero: { title, subtitle: titleHas ? pack.sub : `${upper(subject)}. ${pack.sub}`, button: pack.button },
    features: { title: pack.featuresTitle, items: cards },
    // no figures of the pack (they would be claims about another business): the person gives their own ("500+ customers") and the strip appears
    stats: [],
    cta: { title: `Questions About ${S}?`, button: pack.button },
    about: {
      title: `About ${brand}`,
      paragraphs: [`${aboutLine} ${pack.sentence}`, 'Ask us anything before you decide: a message is enough to start.'],
      points: ['Ask anything', 'Clear answers', 'Easy to reach'],
    },
    steps: { title: 'How It Works', items: pack.steps.map(([t, text]) => ({ title: t, text })) },
    faq: [
      { q: pack.ask, a: 'Message us what you are looking for and we explain it.' },
      { q: `How do I ${verb}?`, a: 'Send us a message or call: we reply with the next step.' },
      { q: 'What does it cost?', a: 'The price depends on what you need: message us the details for an exact figure.' },
      { q: 'Can I ask a question first?', a: 'Of course: message us and we will answer.' },
    ],
    gallery: { ...content.gallery, title: S, captions: [...cards.map((c) => c.title), subject, brand].slice(0, 6) as [string, string, string, string, string, string] },
    marquee: cards.map((c) => c.title).slice(0, 8),
    contact: { ...content.contact, text: `Message us about ${subject}${o.place ? ` in ${o.place}` : ''} and we reply.` },
    // the pack of another business is not kept: its example reviews and posts say things about that business
    testimonials: content.testimonials.map((t) => ({ ...t, quote: t.quote })),
  }
}

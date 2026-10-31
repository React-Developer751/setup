// A business nobody wrote a text pack for ("kite making workshop", "escape room", "board game cafe", "reptile pet shop"): the page is written from the person's own words, not from the pack of another business
// (a escape room must not get "Premium Homes", an astrologer must not get "Ethnic Wear", a game studio must not get "Team Workspaces"). Nothing here claims what the business is or does beyond what was said:
// the cards, the steps and the questions say what the visitor can ask for and how to reach the business. The person adds the facts (services, prices, hours) in the chat and the page uses them.
import type { WebsiteContent } from './finalPrompt'
import type { Niche } from './niche/types'

export type Mode = 'shop' | 'class' | 'experience' | 'service' | 'creative' | 'community' | 'creator' | 'software'

const has = (text: string, re: RegExp) => re.test(text)
/** what kind of business it is, by its own words (the order matters: the first that fits) */
export function modeOf(subject: string, prompt = ''): Mode {
  const s = `${subject} ${prompt}`.toLowerCase()
  // a person with an audience (an influencer, a YouTuber, a podcast, a freelancer): the page is theirs, in the first person
  if (has(s, /\b(?:influencers?|youtubers?|youtube\s+channel|vloggers?|vlogs?|bloggers?|content\s+creators?|creators?|podcasts?|podcasters?|streamers?|instagrammers?|tiktokers?|reels|followers|subscribers)\b/) && !has(s, /\b(?:agency|software|platform|tool|app|course|classes|school|academy)\b/)) return 'creator'
  // a person on their own (a freelance designer, a solo photographer): the page is theirs too
  if (has(s, /\b(?:freelanc\w*|independent|solo)\b/) && has(s, /\b(?:designer|photographer|videographer|illustrator|writer|copywriter|editor|developer|artist|musician|animator|consultant|coach|trainer|tutor)\b/)) return 'creator'
  // software and apps: a demo, not a quote
  if (has(s, /\b(?:software|saas|platform|app|application|tool|system|portal|crm|erp)\b/) && !has(s, /\b(?:agency|company|studio|training|classes|course|repair|shop|store)\b/)) return 'software'
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
const TYPE_WORDS = new Set(['service', 'services', 'company', 'business', 'solutions', 'solution', 'agency', 'creator', 'online', 'professional', 'freelance', 'freelancer', 'independent', 'italian', 'chinese', 'indian', 'south', 'north', 'mexican', 'thai', 'japanese', 'korean', 'french', 'german', 'continental', 'mughlai', 'punjabi', 'bengali', 'gujarati', 'rajasthani', 'vegan', 'vegetarian', 'veg', 'halal', 'artisan', 'handmade', 'homemade', 'boutique', 'kids', 'children', 'ladies', 'gents', 'unisex', 'mens', 'womens', 'bridal', 'multi', 'cuisine', 'fine', 'dining', 'fast', 'food', 'cloud', 'shop', 'store', 'stores', 'shops', 'service', 'services', 'studio', 'studios', 'centre', 'center', 'agency', 'company', 'firm', 'business', 'solution', 'solutions', 'online', 'local', 'new', 'small', 'family', 'organic', 'premium', 'luxury', 'modern', 'affordable', 'professional', 'quality', 'best', 'famous', 'popular', 'good', 'great', 'traditional', 'authentic', 'pure', 'fresh', 'home', 'house', 'point', 'hub', 'corner', 'world', 'zone', 'club', 'India', 'indian'])
const stem = (w: string) => w.toLowerCase().replace(/(?:ing|ed|es|s|e)$/, '')
const wordsOf = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3 && !STOP.has(w)).map(stem)

/**
 * The words of the subject that the pack of the niche knows nothing about: "board game cafe" under the cafe pack has "board" and "game" (the pack talks about coffee), "reptile pet shop" under the pet pack has "reptile".
 * Empty when the niche covers what was said.
 */
export function nicheGap(subject: string, niche: Niche): string[] {
  const known = new Set(wordsOf([niche.label, ...niche.keywords, ...niche.features.flatMap((f) => [f.title, f.text]), ...niche.heroTitles, ...niche.heroSubtitles, niche.featureTitle].join(' ')))
  return [...new Set(wordsOf(subject).filter((w) => !TYPE_WORDS.has(w) && !TYPE_WORDS.has(`${w}s`) && !TYPE_STEMS.has(w) && !known.has(w)))]
}

const TYPE_STEMS = new Set([...TYPE_WORDS].map(stem))
const upper = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const ACRO = /^(?:dj|hr|ai|seo|crm|erp|saas|ngo|ui|ux|tv|vr|ar|it|pg|ca|api|diy|ev|gst|cctv|sms|pdf|3d|2d)$/i
const titleCase = (s: string) => s.split(/\s+/).map((w) => (ACRO.test(w) ? w.toUpperCase() : /^(?:and|or|of|the|a|an|in|for|to|with)$/i.test(w) ? w.toLowerCase() : upper(w))).join(' ').replace(/^./, (c) => c.toUpperCase())
const article = (s: string) => (/^[AEFHILMNORSX](?:[A-Z]|\b)(?![a-z])/.test(s) && /^[A-Z]{1,4}\b/.test(s) ? 'an' : /^[aeiou]/i.test(s) && !/^(?:uni|use|user|one)/i.test(s) ? 'an' : 'a')

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
const PACKS: Record<Exclude<Mode, 'creator'>, Pack> = {
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
  software: {
    heroTitle: (S, inPlace) => [`${S}${inPlace}`, `${S}, Built For How You Work`, `${S} Without The Spreadsheets`],
    sub: 'See how it works and ask for a demo.',
    button: 'Request A Demo',
    featuresTitle: 'What It Does',
    cards: [['See It Working', 'Ask for a walk-through with your own use case.'], ['Setup', 'Tell us how you work today and we explain how to set it up.'], ['Plans And Pricing', 'Message us your team size for the plan that fits.'], ['Support', 'Ask how we help you get started and what happens after.']],
    verb: 'get a demo',
    ask: 'How does it work?',
    steps: [['Tell Us How You Work', 'Share your process and the size of your team.'], ['See A Demo', 'We show how it would fit.'], ['Get Started', 'We set it up with you.']],
    sentence: 'Tell us how you work and we will show you how it would fit.',
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

const ROLE_WORDS = /\b(?:graphic|designers?|photographers?|videographers?|illustrators?|copywriters?|writers?|developers?|editors?|artists?|musicians?|animators?|consultants?|tutors?|coach|trainers?|twitch|discord|spotify|influencers?|youtubers?|youtube|channel|vloggers?|vlogs?|bloggers?|blog|content|creators?|podcasts?|podcasters?|streamers?|instagrammers?|instagram|tiktok|reels|website|web|site|page|weekly|daily|monthly|show|shows|about|on|for|with|my|our|the|a|an|of|followers|subscribers|freelance|freelancer|personal|new|latest)\b/g
const CREATOR_ROLES: [RegExp, string][] = [[/graphic\s+designer/, 'Graphic Designer'], [/designer/, 'Designer'], [/photographer/, 'Photographer'], [/videographer/, 'Videographer'], [/illustrator/, 'Illustrator'], [/copywriter/, 'Copywriter'], [/writer/, 'Writer'], [/developer/, 'Developer'], [/editor/, 'Editor'], [/artist/, 'Artist'], [/musician/, 'Musician'], [/animator/, 'Animator'], [/consultant/, 'Consultant'], [/tutor/, 'Tutor'], [/coach/, 'Coach'], [/trainer/, 'Trainer'], [/podcast/, 'Podcast'], [/youtub|vlog/, 'YouTube Creator'], [/influencer|instagrammer/, 'Influencer'], [/blogger|blog/, 'Blogger'], [/streamer|twitch/, 'Streamer'], [/creator/, 'Content Creator']]
/** "250k followers", "1.2M subscribers": the audience in numbers, as the person wrote it */
function audienceStats(prompt: string) {
  const out: { value: string; label: string; fact: true }[] = []
  for (const m of prompt.matchAll(/(\d[\d.,]*)\s*([kKmMlL]?)\+?\s+(followers|subscribers|listeners|fans|downloads|views|members|readers)\b/g)) {
    out.push({ value: `${m[1]}${m[2].toUpperCase()}+`.replace(/\++$/, '+'), label: upper(m[3]), fact: true })
  }
  return out.slice(0, 3)
}

/** an influencer, a YouTuber, a podcast: collaborations, content and how to work together, written in the first person (nothing is claimed about reach or results beyond the numbers the person gave) */
function creatorContent(content: WebsiteContent, o: { subject: string; prompt: string; place?: string; rand: () => number }): WebsiteContent {
  const text = `${o.subject} ${o.prompt}`.toLowerCase()
  const role = CREATOR_ROLES.find(([re]) => re.test(text))?.[1] ?? 'Content Creator'
  const podcast = role === 'Podcast'
  const freelance = !podcast && /\b(?:freelanc\w*|independent|solo)\b/.test(text) && !/\b(?:influencer|youtub\w*|vlog\w*|blogger|streamer|creator|instagrammer)\b/.test(text)
  const aboutTopic = o.prompt.match(/\babout\s+([^,.;:]{3,40})/i)?.[1]
  const topic0 = titleCase(o.subject.toLowerCase().replace(ROLE_WORDS, ' ').replace(/\s+/g, ' ').replace(/^(?:and|or)\s+|\s+(?:and|or)$/g, '').trim())
  const topic = topic0 || (aboutTopic ? titleCase(aboutTopic.trim().toLowerCase()) : '')
  const T = topic || (podcast ? 'The Show' : 'My Content')
  const titles = podcast
    ? [`${topic ? `${topic}: ` : ''}Listen In`, `${topic ? `${topic}, ` : ''}One Episode At A Time`]
    : freelance
      ? [`${topic ? `${topic} ` : ''}${role}, For Your Next Project`, `Work With A ${topic ? `${topic} ` : ''}${role}`]
      : role === 'YouTube Creator'
      ? [`Watch ${T}`, `${T}, On Camera`]
      : [`${T}, With A Point Of View`, `Work With A ${topic ? `${topic} ` : ''}${role}`, `${T} Content, Made To Share`]
  const title = titles[Math.floor(o.rand() * titles.length)]
  const brand = content.brandName
  const stats = audienceStats(o.prompt)
  const cards: { title: string; text: string }[] = freelance
    ? [{ title: 'Portfolio', text: 'Ask to see work like what you have in mind.' }, { title: 'How We Would Work', text: 'You share the brief, I send ideas and a quote, and we agree before anything starts.' }]
    : podcast
    ? [{ title: 'Be A Guest', text: 'Have a story or an idea for the show? Message me and tell me about it.' }, { title: 'Sponsor The Show', text: 'Ask about sponsor slots and what they include.' }]
    : [{ title: 'Media Kit And Rates', text: 'Ask for the media kit: audience details, past work and rates.' }, { title: 'How We Would Work', text: 'You share the brief, I send ideas and a plan, and we agree before anything is made.' }]
  const verb = podcast ? 'be a guest' : 'work together'
  return {
    ...content,
    bespoke: true,
    voice: 'me',
    subject: `${topic ? `${topic.toLowerCase()} ` : ''}${role.toLowerCase()}`,
    labels: { ...content.labels, quote: podcast ? 'Sponsor the show' : freelance ? 'Get a quote' : 'Work with me' } as WebsiteContent['labels'],
    hero: {
      title,
      subtitle: freelance ? 'Tell me about your project and I reply with ideas, a timeline and a quote.' : podcast ? 'New episodes, guest stories and where to listen. Say hello, or pitch a guest.' : role === 'YouTube Creator' ? 'New videos, reviews and ways to work together. Say hello, or ask for the media kit.' : 'Collaborations, content and campaigns. Tell me about your brand and I reply with ideas and rates.',
      button: podcast ? 'Say Hello' : freelance ? 'Start A Project' : 'Work With Me',
    },
    features: { title: podcast ? 'On The Show' : freelance ? 'What I Do' : 'What I Make', items: cards },
    // one number alone makes no strip: the person is also open to what the page is for
    stats: freelance ? [] : stats.length === 1 ? [...stats, { value: 'Open', label: podcast ? 'To guest ideas' : 'To collaborations', fact: true }] : stats,
    cta: { title: podcast ? 'Have An Idea For The Show?' : freelance ? 'Have A Project In Mind?' : 'Let’s Make Something Together', button: podcast ? 'Say Hello' : freelance ? 'Start A Project' : 'Work With Me' },
    about: {
      title: `About ${brand}`,
      paragraphs: [`${podcast ? 'This is a podcast' : `I am ${article(`${topic ? `${topic.toLowerCase()} ` : ''}${role}`)} ${topic ? `${topic.toLowerCase()} ` : ''}${role.toLowerCase()}`}${topic && podcast ? ` about ${topic.toLowerCase()}` : ''}. Tell me what you have in mind and I will tell you honestly if it is a fit.`, 'A message is enough to start: I reply with the next step.'],
      points: ['Reply to every message', 'Clear rates', 'Easy to reach'],
    },
    steps: { title: 'How It Works', items: freelance ? [{ title: 'Send The Brief', text: 'Tell me what you need, the size of it and the date.' }, { title: 'We Agree The Plan', text: 'I reply with ideas, a timeline and a quote.' }, { title: 'I Deliver', text: 'You see it, ask for changes and get the final files.' }] : podcast ? [{ title: 'Send Your Idea', text: 'Tell me the story, the guest or the offer.' }, { title: 'We Talk It Through', text: 'I reply with questions and a time.' }, { title: 'It Goes Live', text: 'We agree and I publish it.' }] : [{ title: 'Send Your Brief', text: 'Tell me about your brand, your product and the goal.' }, { title: 'We Agree The Plan', text: 'I reply with ideas, timing and rates.' }, { title: 'I Create And Publish', text: 'You approve the content, then it goes live.' }] },
    faq: [
      { q: podcast ? 'How can I be a guest?' : freelance ? 'What do you need to start?' : 'How do I send you a brief?', a: 'Message me the details: I reply with the next step.' },
      { q: podcast ? 'Where can I listen?' : freelance ? 'Can I see your work?' : 'How do I get the media kit?', a: podcast ? 'Message me and I send you the links.' : freelance ? 'Message me and I send examples like what you have in mind.' : 'Message me and I send it.' },
      { q: podcast ? 'Can I sponsor an episode?' : freelance ? 'What does a project cost?' : 'What does a collaboration cost?', a: 'It depends on what you need: message me the details for exact rates.' },
      { q: `How do I ${verb}?`, a: 'Send me a message: a few lines are enough to start.' },
    ],
    gallery: { ...content.gallery, title: podcast ? 'Episodes' : freelance ? 'Selected Work' : 'Recent Work', captions: [...cards.map((c) => c.title), T, brand].slice(0, 6) as [string, string, string, string, string, string] },
    marquee: cards.map((c) => c.title).slice(0, 8),
    contact: { ...content.contact, text: `Message me${podcast ? ' to be a guest or to sponsor' : freelance ? ' about your project' : ' about a collaboration'} and I reply.` },
  }
}

/** the page of a business without a text pack, written from its subject (see the top of this file) */
export function bespokeContent(content: WebsiteContent, o: { subject: string; prompt: string; place?: string; rand: () => number }): WebsiteContent {
  const subject = o.subject.trim().toLowerCase()
  if (!subject) return content
  const mode = modeOf(subject, o.prompt)
  if (mode === 'creator') return creatorContent(content, o)
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
  const aboutLine = plural || /software$/.test(subject) ? `${brand} offers ${subject}${o.place ? ` in ${o.place}` : ''}.` : `${brand} is ${article(subject)} ${subject}${o.place ? ` based in ${o.place}` : ''}.`
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

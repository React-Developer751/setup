// Pulls the business name out of the prompt ("... called Leafy Premium", "... named zen yoga").
import { KNOWN_CITIES } from './siteBanks'
const KNOWN_CITY_WORDS = new Set(Object.keys(KNOWN_CITIES))
import { isBusinessWord } from './themeClassifier'

const STOP_WORDS = new Set(['with', 'that', 'which', 'for', 'and', 'in', 'on', 'at', 'selling', 'offering', 'who', 'where'])

const DEFAULT_NAME = 'My Business'
const MAX_NAME_LENGTH = 24

const titleCase = (s: string) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase())

// Capitalised words that are NOT a business name: acronyms, places, and the verbs a prompt starts with.
const NOT_A_NAME = new Set([
  // products and services that are written with capitals but are not the name of the business
  'whatsapp', 'gst', 'upi', 'google', 'instagram', 'facebook', 'youtube', 'shopify', 'amazon', 'zoom', 'excel', 'pdf', 'wordpress', 'tally', 'paytm', 'phonepe', 'gpay', 'sms', 'emi', 'cod',
  'saas', 'ai', 'crm', 'erp', 'it', 'ui', 'ux', 'seo', 'api', 'b2b', 'b2c', 'i', 'create', 'build', 'make', 'design', 'generate',
  'need', 'want', 'please', 'india', 'usa', 'uk', 'uae', 'new', 'york', 'online', 'indian', 'american', 'british', 'italian',
  'french', 'chinese', 'japanese', 'family', 'premium', 'luxury', 'modern', 'simple', 'website', 'landing', 'page', 'site',
  'ngo', 'pg', 'hr', 'ac', 'cctv', 'gst', 'himachal', 'goa', 'kerala', 'gujarat', 'punjab', 'rajasthan', 'maharashtra', 'karnataka', 'tamil', 'nadu', 'bengal',
  ...Object.keys(KNOWN_CITIES),
])

// Hindi / Hinglish glue words: a prompt that uses them is not an English "for <business>" phrase
const HINGLISH = new Set(['mere', 'meri', 'mera', 'ke', 'ki', 'ka', 'liye', 'banao', 'bana', 'do', 'hai', 'hain', 'jo', 'karti', 'karta', 'wali', 'wala', 'aur', 'se', 'me', 'mein', 'ko', 'dukan', 'chahiye', 'apni', 'apna'])

// words that end the business description: "boutique hotel that offers ..." -> "boutique hotel"
const CUT_WORDS = /\s+(?:that|which|who|whose|where|offers?|offering|with|having|has|and\s+has|jo|ke\s+liye)\b[\s\S]*$/i

/** "gym Iron Pulse" has no "called", but "Iron Pulse" is clearly the name: capitalised words inside the prompt. */
function nameFromCapitals(rawPrompt: string) {
  // "Dr. Sharma": the full stop after a title is not the end of a sentence
  const userPrompt = rawPrompt.replace(/\b(Dr|Mr|Mrs|Ms|Prof|Er|Adv)\.\s+(?=[A-Z])/g, '$1 ')
  for (const match of userPrompt.matchAll(/[A-Z][\w&'-]*(?:\s+(?:(?:&|and)\s+)?[A-Z][\w&'-]*){0,3}/g)) {
    let parts = match[0].split(/\s+/)
    // a city or a word like "India" at either end is the place, not the name ("Sharma Sweets Jaipur")
    while (parts.length > 1 && NOT_A_NAME.has(parts[parts.length - 1].toLowerCase())) parts = parts.slice(0, -1)
    const words = parts.filter((w) => !NOT_A_NAME.has(w.toLowerCase()))
    if (!words.length || words.length !== parts.length) continue
    // at the very start of the prompt a single capitalised word is just the first word of a sentence
    if (match.index === 0 && words.length < 2) continue
    // an acronym after "for" or "of" ("coaching institute for UPSC", "classes for NEET") is what the business teaches, not its name
    if (words.every((w) => /^(?:[A-Z]{2,6}|and|&)$/.test(w)) && (words.length > 1 || /(?:\bfor|\bof|\bin|\babout|\bon)\s+$/i.test(userPrompt.slice(0, match.index)))) continue
    return parts.join(' ').replace(/^(Dr|Mr|Mrs|Ms|Prof|Er|Adv) /, '$1. ')
  }
  return undefined
}

const MAX_SUBJECT_WORDS = 5
const MAX_SUBJECT_LENGTH = 44

const clean = (raw: string) =>
  raw
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\w&' -]/g, ' ')
    // "yoga studio in Jaipur" / "plumber near me": the place is not part of the business
    .replace(/\s+(?:in|at|near|around)\s+\S[\s\S]*$/i, '')
    .replace(CUT_WORDS, '')
    .replace(/\b(?:web\s*site|landing\s+page|page|site)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()

/** The words around the first business word of the prompt: "mobile repair" from "... jo mobile repair karti hai". */
function subjectFromBusinessWords(userPrompt: string) {
  const words = userPrompt.split(/[^\w&'-]+/).filter(Boolean)
  const at = words.findIndex((w) => isBusinessWord(w) && !HINGLISH.has(w.toLowerCase()))
  if (at < 0) return ''
  let start = at
  let end = at
  // one describing word in front ("mobile", "boutique", "organic"), more business words after ("repair shop")
  if (start > 0 && !HINGLISH.has(words[start - 1].toLowerCase()) && !/^(?:an?|the|my|our|for|of|in|on|at|i|me)$/i.test(words[start - 1])) start--
  while (end + 1 < words.length && end - start < 2 && isBusinessWord(words[end + 1]) && !HINGLISH.has(words[end + 1].toLowerCase())) end++
  return words.slice(start, end + 1).join(' ')
}

/** What the site is about: "organic green tea cafe" from "... for an organic green tea cafe named Leafy". */
function extractSubject(userPrompt: string) {
  const withoutName = userPrompt.replace(/\b(?:called|named)\b[\s\S]*$/i, ' ')
  const hinglish = withoutName.toLowerCase().split(/[^a-z]+/).some((w) => HINGLISH.has(w) && w.length > 2)
  const afterFor = withoutName.match(/\b(?:web\s*site|landing\s+page|page|site)\s+(?:for|of)\s+(?:an?\s+|the\s+|my\s+|our\s+)?([^,.]+)/i)?.[1] ?? withoutName.slice(0, 40).match(/\bfor\s+(?:an?\s+|the\s+|my\s+|our\s+)?([^,.]+)/i)?.[1]
  const stripped = withoutName.replace(
    /^\s*(?:please\s+)?(?:create|build|make|generate|design|i\s+want|i\s+need)\s+(?:me\s+)?(?:an?\s+)?(?:(?:clean|simple|modern|attractive|unique|beautiful)\s+)*(?:landing\s+page|web\s*site|page|site)?\s*/i,
    '',
  )
  // "online clothing store for men": the business is in front of "for", "men" is the audience
  const beforeFor = stripped.split(/\s+for\s+/i)[0].trim()
  const afterHasBusiness = (afterFor ?? '').split(/\W+/).some(isBusinessWord)
  const lead = afterFor && !afterHasBusiness && beforeFor !== stripped.trim() && beforeFor.split(/\W+/).some(isBusinessWord) ? beforeFor : afterFor
  const candidates = hinglish ? [] : [lead, stripped]
  for (const candidate of candidates) {
    const raw = clean(candidate ?? '')
    const count = raw.split(/\s+/).filter(Boolean).length
    if (raw && count <= MAX_SUBJECT_WORDS && raw.length <= MAX_SUBJECT_LENGTH) return raw.toLowerCase()
  }
  // a long prompt that starts with the business ("kurti and saree online store, free shipping above 999, ..."): its first part is the subject
  const firstPart = clean(withoutName.split(/[,.;]/)[0])
  if (firstPart && firstPart.split(/\s+/).length <= MAX_SUBJECT_WORDS && firstPart.split(/\s+/).some(isBusinessWord) && !hinglish) return firstPart.toLowerCase()
  // a long or Hinglish prompt: the business words in it are the subject
  return subjectFromBusinessWords(withoutName).toLowerCase()
}

const FRESH_WORDS = ['Bright', 'Golden', 'Prime', 'Royal', 'Urban', 'True', 'Happy', 'Noble', 'Evergreen', 'Blue Door', 'Maple', 'Summit', 'Harbor', 'Oak', 'Nova']

const GENERIC_TAIL = new Set(['company', 'companies', 'service', 'services', 'business', 'shop', 'store', 'centre', 'center', 'firm'])

// kinds of business that read well after a made-up first word ("Golden Bakery"); a person ("dentist") becomes the trade
const PLACES = new Set(['bakery', 'cafe', 'gym', 'restaurant', 'hospital', 'clinic', 'salon', 'spa', 'studio', 'school', 'academy', 'store', 'shop', 'hotel', 'resort', 'boutique', 'agency', 'garage', 'kitchen', 'bistro', 'institute', 'firm'])
const PERSON_TO_PLACE: Record<string, string> = { dentist: 'dental', lawyer: 'legal', plumber: 'plumbing', electrician: 'electrical', photographer: 'photography', tutor: 'tutoring', doctor: 'clinic', chef: 'kitchen' }

/** A prompt with no name: invent a short one from the subject ("bakery" -> "Golden Bakery"), the same one every time. */
// what a business of this type is called when the prompt says nothing usable ("Golden Kitchen")
const THEME_NOUN: Record<string, string> = {
  modern_tech: 'Labs', organic_nature: 'Harvest', bold_fitness: 'Fitness', luxury_minimal: 'Atelier', playful_vibrant: 'Play', professional_services: 'Associates',
  healthcare: 'Care', food_dining: 'Kitchen', education: 'Academy', creative_studio: 'Studio', real_estate: 'Homes', travel_tourism: 'Journeys',
  automotive: 'Motors', beauty_wellness: 'Wellness', events_wedding: 'Events', pets_animals: 'Pet Care', fashion_retail: 'Style', home_services: 'Services',
  nonprofit: 'Foundation',
}

function inventName(subject: string, userPrompt: string, themeKey?: string, nicheLabel?: string) {
  const name = inventPlainName(subject, userPrompt, themeKey, nicheLabel)
  return name.replace(/\bSaas\b/g, 'SaaS')
}

/** names that suit a kind of business better than a made-up first word and its label ("Kaffeehaus Linde" for a German cafe) */
const NICHE_NAMES: Record<string, string[]> = { 'German cafe': ['Kaffeehaus Linde', 'Cafe Edelweiss', 'Brezel und Bohne', 'Zum Goldenen Kuchen', 'Kaffeehaus Eiche'] }

function inventPlainName(subject: string, userPrompt: string, themeKey?: string, nicheLabel?: string) {
  // a niche knows what the business is called in plain words ("Pest control" -> "Harbor Pest Control")
  if (nicheLabel && NICHE_NAMES[nicheLabel]) {
    const pick = [...userPrompt.toLowerCase()].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 11)
    return NICHE_NAMES[nicheLabel][pick % NICHE_NAMES[nicheLabel].length]
  }
  if (nicheLabel) {
    const first = [...userPrompt.toLowerCase()].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
    return `${FRESH_WORDS[first % FRESH_WORDS.length]} ${titleCase(nicheLabel.toLowerCase())}`.replace(/\b(?:Ngo|Pg|Hr|Ac|Cctv|Gst|Seo|Ev|Dj|Diy)\b/g, (m) => m.toUpperCase())
  }
  const words = subject.split(/\s+/).filter((w) => w && !GENERIC_TAIL.has(w))
  const last = words.pop() ?? ''
  // "car rental company" -> "car rental"; "bakery" -> "bakery"; "dentist" -> "dental"
  const head = PERSON_TO_PLACE[last] ?? (PLACES.has(last) || isBusinessWord(last) ? [...words.slice(-1), last].join(' ') : '')
  const seed = [...userPrompt.toLowerCase()].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
  if (!head || head.length > 22 || !/^[a-z' -]+$/.test(head)) {
    // nothing usable in the prompt: the business type still says what it is
    const noun = themeKey && THEME_NOUN[themeKey]
    return noun ? `${FRESH_WORDS[seed % FRESH_WORDS.length]} ${noun}` : DEFAULT_NAME
  }
  return `${FRESH_WORDS[seed % FRESH_WORDS.length]} ${titleCase(head).replace(/\b(?:Ngo|Pg|Hr|Ac|Cctv|Gst|Seo|Ev)\b/g, (m) => m.toUpperCase())}`
}

export function extractContentDetails(userPrompt: string, themeKey?: string, nicheLabel?: string) {
  // 1) "called/named" followed by capitalised words: "named Leafy Premium"
  const capitalised = userPrompt.match(/\b(?:called|named)\s+([A-Z][\w&'-]*(?:\s+(?:&|and(?=\s+[A-Z])|[A-Z][\w&'-]*)){0,3})/)?.[1]

  // 2) otherwise up to 3 words, cut at the first filler word: "named zen yoga studio for beginners"
  const loose = userPrompt.match(/\b(?:called|named)\s+([\w&'-]+(?:\s+[\w&'-]+){0,2})/i)?.[1]
  const words = loose?.split(/\s+/) ?? []
  const stop = words.findIndex((w) => STOP_WORDS.has(w.toLowerCase()))
  const fromLoose = titleCase((stop >= 0 ? words.slice(0, stop) : words).join(' '))

  let subject = extractSubject(userPrompt)
  // a Hinglish prompt ("mujhe ek premium Italian restaurant ki website chahiye") must not leave its filler words in the subject
  subject = subject.replace(/^(?:(?:ek|mujhe|meri|mera|mere|apni|apna|apne|hamari|hamara|humari|ek\s+aur|koi)\s+)+/i, '').replace(/\s+(?:ki|ka|ke|ko)$/i, '').trim()
  // "called Iron Pulse Delhi": the city at the end is the place: the city at the end is the place
  const dropCity = (name: string | undefined) => {
    let parts = (name ?? '').split(/\s+/).filter(Boolean)
    while (parts.length > 1 && KNOWN_CITY_WORDS.has(parts[parts.length - 1].toLowerCase())) parts = parts.slice(0, -1)
    return parts.join(' ')
  }
  const named = (dropCity(capitalised) || fromLoose || nameFromCapitals(userPrompt) || '').slice(0, MAX_NAME_LENGTH).trim()
  // the name of the business is not what the business is: "italian restaurant forno rosso" is "italian restaurant"
  if (named && subject.toLowerCase().includes(named.toLowerCase())) subject = subject.toLowerCase().replace(named.toLowerCase(), ' ').replace(/\s+/g, ' ').trim()
  // only an adjective is left ("premium"): the words after it in the prompt are the business ("premium Italian restaurant ki website" -> "italian restaurant")
  const ADJECTIVES = /^(?:premium|luxury|luxurious|best|top|modern|new|famous|popular|small|big|good|great|nice|beautiful|professional|elegant|classic)$/i
  if (ADJECTIVES.test(subject)) {
    const after = userPrompt.match(new RegExp(`\\b${subject}\\s+([A-Za-z]+(?:\\s+[A-Za-z]+){0,2})`, 'i'))?.[1].split(/\s+/) ?? []
    const stop = after.findIndex((w) => HINGLISH.has(w.toLowerCase()) || /^(?:website|site|page|for|in|with|called|named|naam)$/i.test(w))
    const words = (stop >= 0 ? after.slice(0, stop) : after).filter(Boolean)
    subject = words.join(' ').toLowerCase()
  }
  // nothing that names a kind of business is left: the niche says what the business is
  if (nicheLabel && !subject.split(/\s+/).some((w) => isBusinessWord(w))) subject = nicheLabel.toLowerCase()
  return { businessName: named || inventName(subject, userPrompt, themeKey, nicheLabel), subject }
}

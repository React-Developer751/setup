// Changes INSIDE a part of a site that is already made, in English, Hinglish or a mix: "cookies wali service hata do", "pehli service ka naam Eggless Cakes karo", "FAQ me naya sawal jodo: Do you deliver? answer: Yes",
// "add testimonial: Amazing cakes - Priya", "premium plan ka price 2500 kar do", "about me likho ki hum 2010 se cakes bana rahe hain", "mujhe hero me 'Celebrate With Us' likhna hai".
// The first part reads WHICH item (counted: "2nd", "last", "pehli"; or named: "the cookies service") and WHAT to do with it; applyEdits.applyItem does it. The second part sets the single texts of the page.
import type { WebsiteContent } from '../finalPrompt'
import type { EditOp, ItemList, TextField } from './edits'

export type ItemResult = { ops: EditOp[]; notes: string[] }
/** the page on the screen (when known): a named item is looked for in it, so that a miss is said instead of nothing happening */
export type PageFacts = Pick<WebsiteContent, 'features' | 'faq' | 'steps' | 'stats' | 'testimonials' | 'pricing' | 'about' | 'gallery' | 'blog' | 'brandName'> & { hours?: { day: string; time: string }[] }

const U = (re: string) => `(?<![\\p{L}\\p{N}])(?:${re})(?![\\p{L}\\p{N}])`
const R = (re: string, flags = 'iu') => new RegExp(re, flags)

const REMOVE = U('remove|delete|hata(?:o|do|de|na|ana|\\s+do|\\s+de)?|nikal(?:o|do|de|na|\\s+do|\\s+de)?|mita(?:o|do|de|na|\\s+do|\\s+de)?|cancel')
const ADD = U('add|jodo|jod(?:na|\\s+do|\\s+de)?|daalo|daal(?:na|\\s+do|\\s+de)?|dalo|dal(?:na|\\s+do|\\s+de)?|insert|include|create|naya|nayi|new|ek\\s+aur|one\\s+more|banao|bana\\s+do|lagao|laga\\s+do|put')
const SETV = U('dikhana|dikhani|dikhao|dikha\\s+do|show|display|change|badlo|badal(?:na|\\s+do|\\s+de)?|replace|update|edit|set|kar\\s*do|kardo|karo|kar\\s+de|likho|likh(?:na|\\s+do|\\s+de)?|rakho|rakh\\s+do|rakhna|make|ho\\s+jaye|ho\\s+jana|chahiye|chaiye|write')

const ORDINALS: [RegExp, number][] = [
  [R(U('first|1st|pehla|pehli|pahla|pahli|pehle|pahle|ek\\s+number|number\\s+1|no\\.?\\s*1|#1|1')), 1],
  [R(U('second|2nd|dusra|dusri|doosra|doosri|dusre|number\\s+2|no\\.?\\s*2|#2|2')), 2],
  [R(U('third|3rd|teesra|teesri|tisra|tisri|teesre|number\\s+3|no\\.?\\s*3|#3|3')), 3],
  [R(U('fourth|4th|chautha|chauthi|chauthe|number\\s+4|no\\.?\\s*4|#4|4')), 4],
  [R(U('fifth|5th|paanchwa|paanchwi|panchva|panchvi|number\\s+5|no\\.?\\s*5|#5|5')), 5],
  [R(U('sixth|6th|chhatha|chhathi|number\\s+6|no\\.?\\s*6|#6|6')), 6],
  [R(U('last|final|aakhri|akhri|aakhiri|antim')), 0],
]
const ORD_SRC = `${ORDINALS.map(([re]) => re.source).join('|')}|(?<![\\p{L}\\p{N}])\\d{1,2}(?:st|nd|rd|th)(?![\\p{L}])`
const ordinalOf = (text: string): number | undefined => {
  const big = text.match(/(?<![\p{L}\p{N}])(\d{1,2})(?:st|nd|rd|th)(?![\p{L}])/iu)
  return big ? Number(big[1]) : ORDINALS.find(([re]) => re.test(text))?.[1]
}

type Noun = { list: ItemList; re: string; label: string }
const NOUNS: Noun[] = [
  { list: 'faq', re: 'faqs?|questions?|sawals?|sawaal|prashn|answers?|jawab|jawaab', label: 'question' },
  { list: 'testimonials', re: 'testimonials?|reviews?|feedbacks?', label: 'review' },
  { list: 'steps', re: 'steps?|stages?', label: 'step' },
  { list: 'stats', re: 'stats?|statistics|highlights?|figures?|numbers?\\s+(?:section|strip|bar|part)', label: 'number' },
  { list: 'plans', re: 'plans?|packages?|pricing\\s+items?|price\\s+plans?', label: 'plan' },
  { list: 'gallery', re: 'captions?|photos?|pictures?|images?|tasveer|tasveeren|photo', label: 'picture' },
  { list: 'blog', re: 'blog\\s*posts?|notes?|articles?', label: 'note' },
  { list: 'features', re: 'services?|sewa|sewayein|seva|cards?|features?|offerings?|products?|items?|menu\\s+items?', label: 'service' },
]
const nounOf = (text: string): Noun | undefined => NOUNS.find((n) => R(U(n.re)).test(text))

const FIELD_WORDS: Record<string, { field: string; re: string }[]> = {
  features: [{ field: 'title', re: 'naam|name|title|heading|nam' }, { field: 'text', re: 'description|text|detail|details|vivaran|line|about' }],
  faq: [{ field: 'q', re: 'question|sawal|sawaal|prashn' }, { field: 'a', re: 'answer|jawab|jawaab|reply|uttar' }],
  steps: [{ field: 'title', re: 'naam|name|title|heading' }, { field: 'text', re: 'description|text|detail|details' }],
  stats: [{ field: 'value', re: 'number|value|figure|count' }, { field: 'label', re: 'label|text|naam|name|title' }],
  testimonials: [{ field: 'author', re: 'naam|name|author|customer|writer' }, { field: 'quote', re: 'quote|review|text|feedback|comment' }, { field: 'role', re: 'role|designation' }],
  plans: [{ field: 'price', re: 'price|rate|kimat|keemat|daam|cost|charges?|fee' }, { field: 'name', re: 'naam|name|title' }, { field: 'perks', re: 'perks|benefits|features|includes?' }, { field: 'period', re: 'period|duration|per' }],
  gallery: [{ field: 'caption', re: 'caption|text|title|naam' }],
  paragraphs: [{ field: 'text', re: 'text|paragraph|description' }],
  points: [{ field: 'text', re: 'text|point' }],
  blog: [{ field: 'title', re: 'title|naam|name|heading' }, { field: 'tag', re: 'tag|category' }],
}
const DEFAULT_FIELD: Record<ItemList, string> = { features: 'title', faq: 'q', steps: 'title', stats: 'label', testimonials: 'quote', plans: 'name', gallery: 'caption', paragraphs: 'text', points: 'text', blog: 'title' }

const unquote = (s: string) => s.trim().replace(/^[\s"'“”‘’`]+|[\s"'“”‘’`.,]+$/g, '').trim()
const TAIL_VERB = R(`\\s*(?:${SETV}|${ADD})(?:\\s+(?:do|de|dena|diya))?\\s*[.!]*$`, 'iu')
const LEAD_FILLER = R('^(?:ki|ke|ka|me|mein|mai|ko|to|as|into|with|by|:|=|-|–|—|that|saying|likho|rakho|set)\\s+', 'iu')
/** what is written after the words that point at the item: "... ka naam Eggless Cakes karo" -> "Eggless Cakes" */
function valueOf(rest: string): string {
  let v = rest.trim()
  const q = v.match(/["“”'‘’`]([^"“”'‘’`]{1,300})["“”'‘’`]/)
  if (q) return unquote(q[1])
  v = v.replace(R('^(?:[:=\\-–—]|\\bto\\b|\\bko\\b|\\bas\\b|\\bme\\b|\\bmein\\b|\\bki\\b|\\bke\\b|\\bka\\b)\\s*', 'iu'), '')
  for (let i = 0; i < 3; i += 1) v = v.replace(LEAD_FILLER, '')
  v = v.replace(TAIL_VERB, '')
  return unquote(v)
}

/** which field of the item ("naam", "answer", "price") is named in the words after the noun, and what is left */
function fieldAndValue(list: ItemList, rest: string): { field: string; value: string } {
  const words = FIELD_WORDS[list] ?? []
  const m = words.map((f) => ({ f, hit: rest.match(R(`^\\s*(?:(?:ka|ki|ke|ko|me|mein|of|the)\\s+)?(?:new\\s+)?(?:${f.re})(?![\\p{L}])`)) })).find((x) => x.hit)
  if (m?.hit) return { field: m.f.field, value: valueOf(rest.slice(m.hit[0].length)) }
  return { field: DEFAULT_FIELD[list], value: valueOf(rest) }
}

const money = (s: string) => s.replace(/(?:rupees?|rs\.?|₹|\/-|inr)/gi, '').replace(/[^\d.,]/g, '').trim()

function itemOf(list: ItemList, action: 'set' | 'add' | 'remove', pos: { index?: number; match?: string }, fields?: Record<string, string>): EditOp {
  return { op: 'item', list, action, ...(pos.index !== undefined ? { index: pos.index } : {}), ...(pos.match ? { match: pos.match } : {}), ...(fields ? { fields } : {}) }
}

/** the words of an item that can be said before "wali service": "cookies", "birthday cakes" */
const NAME = `[\\p{L}\\p{N}'&.\\- ]{2,40}?`

/** is there an item with these words on the page (when the page is known)? */
function known(list: ItemList, match: string, page?: PageFacts): boolean {
  if (!page) return true
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, ' ')
  const texts: string[] =
    list === 'features' ? page.features.items.map((i) => `${i.title} ${i.text}`)
    : list === 'faq' ? page.faq.map((q) => `${q.q} ${q.a}`)
    : list === 'steps' ? page.steps.items.map((i) => `${i.title} ${i.text}`)
    : list === 'stats' ? page.stats.map((s) => `${s.value} ${s.label}`)
    : list === 'testimonials' ? page.testimonials.map((t) => `${t.author} ${t.quote}`)
    : list === 'plans' ? page.pricing.plans.map((p) => p.name)
    : list === 'gallery' ? page.gallery.captions
    : list === 'blog' ? page.blog.posts.map((p) => p.title)
    : list === 'points' ? page.about.points
    : page.about.paragraphs
  const words = norm(match).split(' ').filter((w) => w.length >= 2)
  return words.length > 0 && texts.some((t) => words.some((w) => norm(t).includes(w.replace(/s$/, ''))))
}
const count = (list: ItemList, page?: PageFacts): number | undefined =>
  !page ? undefined : list === 'features' ? page.features.items.length : list === 'faq' ? page.faq.length : list === 'steps' ? page.steps.items.length : list === 'stats' ? page.stats.length : list === 'testimonials' ? page.testimonials.length : list === 'plans' ? page.pricing.plans.length : list === 'gallery' ? page.gallery.captions.length : list === 'blog' ? page.blog.posts.length : list === 'points' ? page.about.points.length : page.about.paragraphs.length

const MISS = (label: string, what: string) => ({ ops: [] as EditOp[], notes: [`I could not find ${label} "${what}" on the page. Say it with its number ("first ${label}") or with words that are on it.`] })

const STOP = new Set(['do', 'de', 'kar', 'karo', 'the', 'a', 'an', 'this', 'that', 'my', 'our', 'ye', 'yeh', 'is', 'us', 'woh', 'wo', 'vo', 'ek', 'all', 'sab', 'saari', 'it', 'isko', 'usko', 'item', 'items'])

/** removal of one item */
function removeItem(plain: string, page?: PageFacts): ItemResult | undefined {
  if (!R(REMOVE).test(plain)) return undefined
  const noun = nounOf(plain)
  if (!noun) return undefined
  const n = R(U(noun.re)).exec(plain)!
  const before = plain.slice(0, n.index)
  const after = plain.slice(n.index + n[0].length)
  const ord = ordinalOf(`${before} ${after}`)
  // "faq section hata do", "remove the services part": the whole part, not an item (the other parser does that)
  const wholePart = R(`^\\s*(?:(?:ka|ki|ke|ko|the|this|ye|yeh|is|poora|pura|whole|entire)\\s+)*(?:section|part|page|block)`, 'iu').test(after) || R(`(?:section|part|page|block)\\s*$`, 'iu').test(before.trim())
  if (wholePart && ord === undefined) return undefined
  // by position: "pehli service hata do", "remove the 2nd step", "service number 2 hata do", "faq ka pehla sawal hata do"
  if (ord !== undefined) {
    const total = count(noun.list, page)
    if (total !== undefined && ord > total) return MISS(noun.label, `number ${ord}`)
    return { ops: [itemOf(noun.list, 'remove', { index: ord })], notes: [] }
  }
  // by name: "cookies wali service hata do", "remove the cookies service", "delivery wala sawal hata do", "remove the question about delivery", "delivery ke baare me sawal hata do"
  const named =
    before.match(R(`(?:${REMOVE})?\\s*(?:the\\s+)?(?<name>${NAME})\\s+(?:wali|wala|waali|vali|wale|named|called|naam\\s+(?:ki|ka|wali|wala)|ke\\s+baare\\s+(?:me|mein)|related)\\s*$`, 'iu'))?.groups?.name ??
    before.match(R(`(?:${REMOVE})\\s+(?:the\\s+|that\\s+|ye\\s+|yeh\\s+)?(?<name>${NAME})\\s*$`, 'iu'))?.groups?.name ??
    after.match(R(`^\\s*(?:about|named|called|naam|for|on|regarding|ke\\s+baare\\s+(?:me|mein))\\s+(?<name>${NAME})\\s*(?:${REMOVE})?[.!]*$`, 'iu'))?.groups?.name ??
    after.match(R(`^\\s*(?:ka|ko|ki)?\\s*(?<name>${NAME})\\s+(?:${REMOVE})[.!]*$`, 'iu'))?.groups?.name
  const name = named ? unquote(named).replace(R('^(?:the|a|an|this|that|my|our|ye|yeh|is|woh|wo|vo|us|usko|isko|ek|apni|meri|mera)\\s+', 'iu'), '') : ''
  if (STOP.has(name.toLowerCase()) || name.toLowerCase().split(/\s+/).every((w) => FILLER.has(w) || STOP.has(w))) return undefined
  if (name && name.length >= 2 && !R(U('section|part|page|all|saari|sab|sabhi|poori')).test(name)) {
    if (!known(noun.list, name, page)) return MISS(noun.label, name)
    return { ops: [itemOf(noun.list, 'remove', { match: name })], notes: [] }
  }
  return undefined
}

const FILLER = new Set(['bhi', 'also', 'too', 'page', 'pages', 'section', 'part', 'add', 'daalo', 'daal', 'dalo', 'jodo', 'jod', 'karo', 'kar', 'do', 'de', 'please', 'pls', 'plz', 'thanks', 'thank', 'you', 'aur', 'and', 'then', 'ek', 'a', 'an', 'the', 'one', 'more', 'naya', 'nayi', 'new', 'remove', 'hata', 'hatao', 'go', 'premium', 'dark', 'mode', 'on', 'kindly', 'could', 'can', 'me', 'mein', 'mai', 'ko', 'to', 'we', 'i', 'want', 'need', 'chahiye', 'lagao', 'laga', 'dikhao', 'rakho', 'daal'])
/** nothing but filler words where the content of the new item should be ("FAQ bhi daalo", "add an faq page, thanks") */
const thin = (payload: string) => {
  const words = payload.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  return words.length === 0 || (words.length <= 6 && words.every((w) => FILLER.has(w))) || /^[,;]/.test(payload.trim())
}

/** one more item, with what was said about it after a colon, a dash or "called" */
function addItem(plain: string, page?: PageFacts): ItemResult | undefined {
  // "reviews ko about se pehle lagao", "faq ko blog ke baad lagao": moving a part, not adding an item
  if (R(U('before|after|above|below|upar|neeche|niche|baad|bottom|top|se\\s+pehle|ke\\s+pehle')).test(plain.split(':')[0])) return undefined
  // "stats me 500+ happy customers likho": a number and what it counts
  const stat = plain.match(R(`^\\s*(?:the\\s+)?(?:stats?|numbers?|highlights?)\\s+(?:me|mein|mai|ko|:)\\s*(?<v>[\\p{Sc}]?\\d[\\d,.]*\\s*[+%kKmM]*\\+?)\\s*(?<l>[\\p{L} ]{3,40}?)\\s*(?:${SETV}|${ADD})?\\s*[.!]*$`, 'iu'))
  if (stat?.groups && !R(REMOVE).test(plain)) return { ops: [itemOf('stats', 'add', {}, { value: stat.groups.v.trim(), label: unquote(stat.groups.l) })], notes: [] }
  if (!R(ADD).test(plain)) return undefined
  const noun = nounOf(plain)
  if (!noun) return undefined
  const n = R(U(noun.re)).exec(plain)!
  const rest = plain.slice(n.index + n[0].length)
  // "services me Cupcakes aur Brownies bhi add karo", "add 3 new services: A, B, C": services are added to the ones the page has (a plain list of services replaces them, that is the other parser)
  if (noun.list === 'features') {
    const colon = rest.indexOf(':')
    let body = colon >= 0 && rest.slice(0, colon).split(/\s+/).filter(Boolean).length <= 6 ? rest.slice(colon + 1) : rest
    body = body.replace(R(`\\s*(?:${SETV}|${ADD})(?:\\s+(?:do|de|dena|diya))?\\s*(?:hai|h)?\\s*[.!]*$`, 'iu'), '').replace(R('^\\s*(?:me|mein|mai|ko|:|called|named|naam|naya|nayi|naye|new|ek|a|an|\\d+|teen|do|char|more|aur|bhi|also|add|jodo|jod|daalo|daal|and)(?![\\p{L}])\\s*', 'iu'), '')
    for (let i = 0; i < 5; i += 1) body = body.replace(R('^\\s*(?:me|mein|mai|ko|:|called|named|naam|naya|nayi|naye|new|ek|a|an|\\d+|teen|char|more|aur|bhi|also|add|and)(?![\\p{L}])\\s*', 'iu'), '')
    body = body.replace(R('\\s+(?:bhi|also|too)\\s*$', 'iu'), '')
    body = body.replace(R(`\\s*(?:${SETV}|${ADD})\\s*$`, 'iu'), '').replace(R('\\s+(?:bhi|also|too)\\s*$', 'iu'), '')
    const names = body.split(R('\\s*(?:,|;|\\s+aur\\s+|\\s+and\\s+|\\s*&\\s*)\\s*', 'iu')).map((x) => unquote(x.trim())).filter(Boolean)
    const bad = (x: string) => x.length < 2 || x.length > 40 || x.split(/\s+/).length > 5 || R(U('section|page|part|block|with|for|about|price|pricing|photo|image|button|color|colour')).test(x) || /\d{3,}/.test(x)
    if (!names.length || names.some(bad) || names.length > 6 || R(REMOVE).test(plain)) return undefined
    return { ops: names.map((title) => itemOf('features', 'add', {}, { title: title.charAt(0).toUpperCase() + title.slice(1) })), notes: [] }
  }
  // what was said about the new item: after a colon when there is one ("FAQ me naya sawal jodo: Q? answer: A"), else after the filler words
  const colon = rest.indexOf(':')
  let lead = colon >= 0 && !/^\s*:/.test(rest) && rest.slice(0, colon).split(/\s+/).filter(Boolean).length <= 8 ? rest.slice(colon + 1) : rest
  for (let i = 0; i < 6; i += 1) lead = lead.replace(R(`^\\s*(?:me|mein|mai|ko|naya|nayi|naye|new|ek|aur|question|sawal|sawaal|add|jodo|jod|daalo|daal|called|named|naam|ka|ki|ke|likho|jisme|which\\s+says|saying|[:=\\-–—])(?![\\p{L}])\\s*`, 'iu'), '')
  const payload = unquote(lead)
  if (thin(payload)) return undefined
  const total = count(noun.list, page)
  if (total !== undefined && total >= 12) return { ops: [], notes: [`There are already ${total} ${noun.label}s: that is the most the page shows.`] }
  switch (noun.list) {
    case 'faq': {
      if (!payload) return undefined
      const m = payload.match(R('^(?<q>.+?\\?)\\s*(?:answer|jawab|jawaab|ans|a)?\\s*[:\\-–—]?\\s*(?<a>.*)$', 'isu')) ?? payload.match(R('^(?<q>.+?)\\s+(?:answer|jawab|jawaab|ans)\\s*[:\\-–—]?\\s*(?<a>.+)$', 'isu'))
      const q = unquote(m?.groups?.q ?? payload)
      const a = unquote(m?.groups?.a ?? '')
      if (q.length < 4) return undefined
      return { ops: [itemOf('faq', 'add', {}, { q: /\?$/.test(q) ? q : `${q}?`, ...(a ? { a } : {}) })], notes: a ? [] : ['I added the question with a placeholder answer: tell me the answer ("faq 1 ka answer ...").'] }
    }
    case 'testimonials': {
      if (!payload) return undefined
      const parts = payload.split(R('\\s+[-–—]\\s+|\\s+by\\s+|\\s*~\\s*|\\s*,\\s*(?=[A-Z][\\p{L}]+(?:\\s+[A-Z][\\p{L}]+)?\\s*$)', 'u'))
      const author = parts.length > 1 ? unquote(parts[parts.length - 1]) : ''
      const quote = unquote(parts.length > 1 ? parts.slice(0, -1).join(' - ') : payload)
      if (quote.length < 4) return undefined
      return { ops: [itemOf('testimonials', 'add', {}, { quote, ...(author ? { author } : {}) }), { op: 'add', section: 'testimonials' }], notes: [] }
    }
    case 'steps': {
      if (!payload) return undefined
      const [title, ...text] = payload.split(R('\\s+[-–—:]\\s+', 'u'))
      return { ops: [itemOf('steps', 'add', {}, { title: unquote(title), ...(text.length ? { text: unquote(text.join(' - ')) } : {}) })], notes: [] }
    }
    case 'stats': {
      const m = payload.match(R('^(?<value>[\\p{Sc}]?\\d[\\d,.]*\\s*[+%kKmM]*\\+?)\\s*(?<label>.*)$', 'u'))
      if (!m?.groups) return undefined
      return { ops: [itemOf('stats', 'add', {}, { value: m.groups.value.trim(), label: unquote(m.groups.label) || 'customers' })], notes: [] }
    }
    case 'plans': {
      const m = payload.match(R(`^(?<name>${NAME})\\s*(?:[:\\-–—@]|\\bat\\b|\\bka\\b)?\\s*(?<price>[\\p{Sc}]?\\s*\\d[\\d,]*)\\s*(?:rupees?|rs\\.?|₹|/-)?\\s*(?<period>/\\s*\\p{L}+|per\\s+\\p{L}+)?\\s*$`, 'iu'))
      if (!m?.groups) return undefined
      return { ops: [itemOf('plans', 'add', {}, { name: unquote(m.groups.name), price: money(m.groups.price), ...(m.groups.period ? { period: m.groups.period.startsWith('/') ? `/ ${m.groups.period.slice(1).trim()}` : `/ ${m.groups.period.replace(/^per\s+/i, '')}` } : {}) })], notes: [] }
    }
    case 'blog':
      return payload ? { ops: [itemOf('blog', 'add', {}, { title: payload }), { op: 'add', section: 'blog' }], notes: [] } : undefined
    default:
      return undefined
  }
}

/** a change of one item, found by its position or by its name */
function setItem(plain: string, page?: PageFacts): ItemResult | undefined {
  // about: "about me likho ki hum 2010 se cakes bana rahe hain", "about section ka text: ...", "about paragraph badlo: ..."
  const about = plain.match(R(`^\\s*(?:the\\s+)?about(?:\\s+(?:us|section|part|page|text|paragraph|description|content))*\\s*(?:ka|ki|ke|me|mein|mai)?\\s*(?:text|paragraph|description|content|matter)?\\s*(?:ka|ki|ke|me|mein|mai)?\\s*(?:${SETV})?\\s*(?:[:=\\-–—]|\\bki\\b|\\bke\\b|\\bthat\\b|\\bto\\b)?\\s*(?<value>.{12,})$`, 'iu'))
  if (about?.groups && !R(U('title|heading|naam|name|hata|remove|delete|hide|move|upar|neeche|size|color|colour|rang|height|width|zyada|kam|padding|spacing|gap|bigger|smaller|taller|wider|bada|chhota')).test(plain.slice(0, 40))) {
    const value = valueOf(about.groups.value)
    if (value.length >= 12 && (R(SETV).test(plain) || /[:]/.test(plain.slice(0, 40)))) return { ops: [itemOf('paragraphs', 'set', { index: 1 }, { text: value })], notes: [] }
  }
  // by position: "pehli service ka naam X karo", "2nd step ka description Y", "service number 3 ka price 500", "faq 2 ka answer Z"
  const posA = plain.match(R(`^(?:.*?)(?<ord>${ORD_SRC})\\s+(?:wali\\s+|wala\\s+)?(?<![\\p{L}])(?<noun>${NOUNS.map((n) => n.re).join('|')})(?![\\p{L}])(?<rest>.*)$`, 'iu'))
  const posB = plain.match(R(`^(?:.*?)(?<![\\p{L}])(?<noun>${NOUNS.map((n) => n.re).join('|')})(?![\\p{L}])\\s+(?:number\\s+|no\\.?\\s*|#)?(?<ord>\\d{1,2})\\b(?<rest>.*)$`, 'iu'))
  const hit = posA?.groups ?? posB?.groups
  if (hit && !R(REMOVE).test(plain)) {
    const noun = nounOf(hit.noun)!
    const index = ordinalOf(hit.ord) ?? Number(hit.ord)
    const { field, value } = fieldAndValue(noun.list, hit.rest)
    if (value.length >= 1 && field) {
      const total = count(noun.list, page)
      if (total !== undefined && index > total) return MISS(noun.label, `number ${index}`)
      return { ops: [itemOf(noun.list, 'set', { index }, { [field]: field === 'price' ? money(value) : value })], notes: [] }
    }
  }
  // a plan by its name: "premium plan ka price 2500 kar do", "basic plan 999", "monthly plan ka naam Starter"
  const plan = plain.match(R(`^\\s*(?:the\\s+)?(?<name>${NAME})\\s+(?:plans?|packages?)(?![\\p{L}])\\s*(?:ka|ki|ke)?\\s*(?<rest>.*)$`, 'iu'))
  if (plan?.groups && !R(REMOVE).test(plain) && !R(ADD).test(plain.slice(0, 12))) {
    const name = unquote(plan.groups.name)
    if (R(U('pricing|section|heading|title|rename|menu|navbar|page|our|your|the|and|aur|center|align')).test(name)) return undefined
    const priceOnly = plan.groups.rest.match(R('^(?:price|rate|kimat|keemat|daam|cost)?\\s*(?:ko|to|:|=|at)?\\s*(?<n>[\\p{Sc}]?\\s*\\d[\\d,]*)\\s*(?:rupees?|rs\\.?|₹|/-)?(?:\\s*(?:kar\\s*do|karo|kardo|rakho|rakh\\s+do|set|ho\\s+jaye|chahiye))?\\s*[.!]*$', 'iu'))
    const fv = fieldAndValue('plans', plan.groups.rest)
    const fields = priceOnly?.groups ? { price: money(priceOnly.groups.n) } : fv.value ? { [fv.field]: fv.field === 'price' ? money(fv.value) : fv.value } : undefined
    if (fields && Object.values(fields).every(Boolean)) {
      if (!known('plans', name, page)) return MISS('plan', name)
      return { ops: [itemOf('plans', 'set', { match: name }, fields)], notes: [] }
    }
  }
  return undefined
}

// ── single texts of the page
const TEXT_TARGETS: { field: TextField | 'brand'; re: string }[] = [
  { field: 'subject', re: '(?:upar|oopar|top)\\s+(?:wali|wala)\\s+(?:choti\\s+|chhoti\\s+)?line|(?:small|chhoti|choti)\\s+line\\s+(?:above|upar)\\s+(?:the\\s+)?(?:title|heading|headline)|line\\s+above\\s+(?:the\\s+)?(?:title|heading|headline)|eyebrow(?:\\s+(?:text|line))?|kicker|tag\\s*line\\s+above' },
  { field: 'heroSubtitle', re: '(?:under|below)\\s+(?:the\\s+)?(?:title|heading|headline)|(?:neeche|niche|neechay)\\s+wali\\s+line|(?:hero\\s+)?(?:sub\\s*-?\\s*(?:title|heading|headline)|tagline|tag\\s+line|description|line\\s+(?:below|under|neeche)\\s+(?:the\\s+)?(?:title|heading|headline)|intro)' },
  { field: 'heroButton', re: '(?:hero\\s+|main\\s+|first\\s+)?(?:button|btn|cta\\s+button)(?:\\s+(?:text|label))?' },
  { field: 'aboutTitle', re: 'about(?:\\s+us)?(?:\\s+section)?\\s+(?:title|heading|headline|ka\\s+(?:title|heading|naam))' },
  { field: 'featuresTitle', re: '(?:services?|features?|offerings?)(?:\\s+section)?\\s+(?:wale\\s+|ka\\s+)?(?:title|heading|headline|naam)' },
  { field: 'ctaTitle', re: '(?:cta|call\\s+to\\s+action|banner|bottom\\s+banner)(?:\\s+section)?\\s+(?:ka\\s+)?(?:title|heading|headline|text|naam)|(?:bottom|last|end|neeche\\s+wala|aakhri)\\s+banner|cta\\s+banner' },
  { field: 'contactTitle', re: 'contact(?:\\s+us)?(?:\\s+section)?\\s+(?:ka\\s+)?(?:title|heading|headline|naam)' },
  { field: 'brand', re: '(?:business|website|site|shop|store|company|brand|dukaan|dukan|firm|studio|clinic|restaurant|cafe|bakery|salon|gym)(?:\\s+(?:ka|ki))?\\s+(?:name|naam)|(?:name|naam)\\s+(?:of\\s+(?:the\\s+)?)?(?:business|website|site|shop|store|company|brand)' },
  { field: 'heroTitle', re: '(?:homepage|home\\s*page|front\\s*page|website|site)\\s*(?:pe|par|me|mein|ke)?\\s*(?:sabse\\s+)?(?:upar|top)|sabse\\s+upar|(?:hero|main|home\\s*page|top|first|page|site|website)?\\s*(?:title|heading|headline|h1|header\\s+text)|hero(?:\\s+section)?|home\\s*page\\s+text' },
]
/** a colour, a size or a font where a text should be ("button color: red"): that is a look, not words for the page */
const styleWord = (v: string) => /^(?:#[0-9a-f]{3,8}|(?:dark|light|deep|bright|pastel)?\s*(?:red|blue|green|yellow|orange|purple|pink|black|white|gr[ae]y|brown|gold|golden|silver|teal|navy|lal|neela|hara|peela|kala|safed|gulabi|bigger|smaller|bold|italic|big|small|large|round|sharp|rounded|bada|chhota|chota|thoda|zyada)\b.*)$/i.test(v.trim()) && v.trim().split(/\s+/).length <= 3

function textOps(plain: string): ItemResult | undefined {
  const lc = plain.toLowerCase()
  const hasPayload = /["“”‘’`]|:/.test(plain)
  if (R(REMOVE).test(lc) || (!hasPayload && R(U('color|colour|rang|size|font|bold|bigger|smaller|bada|chhota|align|center|left|right|upar|neeche|move|section\\s+hata')).test(lc.slice(0, 60)))) return undefined
  const quoted = plain.match(/["“”‘’`]([^"“”‘’`]{2,200})["“”‘’`]/)
  for (const t of TEXT_TARGETS) {
    const m = R(`(?<![\\p{L}])(?:${t.re})(?![\\p{L}])`).exec(plain)
    if (!m) continue
    // "pricing heading Our Plans", "stats section ka heading ...": another part is named, so a bare "heading" is not the hero's
    if (t.field === 'heroTitle' && !/(?:hero|main|home\s*page|top|first|site|website|page)\s*(?:title|heading|headline|h1)/i.test(plain) && R(U('pricing|packages?|gallery|team|testimonials?|reviews?|blog|faq|steps?|stats?|about|services?|features?|cta|contact|navbar|menu|footer')).test(plain)) continue
    let rest = plain.slice(m.index + m[0].length)
    if (!quoted && rest.includes(':')) rest = rest.slice(rest.indexOf(':') + 1)
    rest = rest.replace(R('^\\s*(?:ka|ki)\\s+(?:naam|name|text|label)\\s+', 'iu'), '')
    let value = quoted ? unquote(quoted[1]) : valueOf(rest.replace(R('^\\s*(?:me|mein|mai|ka|ki|ke|ko|to|as|:|=)\\s*', 'iu'), ''))
    // "hero me likho X", "mujhe hero me X likhna hai"
    if (!value || value.length < 2) value = valueOf(plain.slice(0, m.index).replace(R(`.*?(?:${SETV})\\s*`, 'iu'), ''))
    value = value.replace(R('\\s*(?:likhna|likhni|likhwana|rakhna|chahta\\s+hu|chahti\\s+hu|chahta\\s+hoon|karna|karni)\\s*(?:hai|h|hu)?\\s*$', 'iu'), '').trim()
    if (value.length < 2 || value.length > 160 || styleWord(value)) continue
    if (/^(?:in|me|mein|mai|ka|ki|ke|ko|to|naam|name)(?:\s|$)/i.test(value)) continue
    if (t.field === 'brand') return { ops: [{ op: 'rename', name: value.slice(0, 40) }], notes: [] }
    const SECTION_TITLE: Partial<Record<string, 'about' | 'features' | 'cta' | 'contact'>> = { aboutTitle: 'about', featuresTitle: 'features', ctaTitle: 'cta', contactTitle: 'contact' }
    const sec = SECTION_TITLE[t.field]
    if (sec) return { ops: [{ op: 'title', target: sec, text: value }], notes: [] }
    return { ops: [{ op: 'text', field: t.field as TextField, text: value }], notes: [] }
  }
  return undefined
}

const DAYS: [RegExp, string][] = [
  [R(U('sunday|sun|ravivar|itwar|ravivaar')), 'Sun'], [R(U('monday|mon|somvar|somvaar')), 'Mon'], [R(U('tuesday|tue|tues|mangalvar|mangalvaar')), 'Tue'], [R(U('wednesday|wed|budhvar|budhvaar')), 'Wed'],
  [R(U('thursday|thu|thur|thurs|guruvar|guruvaar|brihaspativar')), 'Thu'], [R(U('friday|fri|shukravar|shukravaar')), 'Fri'], [R(U('saturday|sat|shanivar|shanivaar')), 'Sat'],
]
/** "sunday ko band rakho", "sunday ko clinic band rehta hai", "we are closed on mondays": one day off, the other opening hours stay */
function closedDay(plain: string, page?: PageFacts): ItemResult | undefined {
  if (!R(U('band|closed|close|off|holiday|chhutti|chutti|nahi\\s+khulta|nahi\\s+khulti|bandh')).test(plain)) return undefined
  if (R(REMOVE).test(plain) || R(U('section|page|gallery|faq|menu')).test(plain)) return undefined
  const day = DAYS.find(([re]) => re.test(plain))
  if (!day) return undefined
  const rows = (page?.hours ?? []).filter((h) => !day[0].test(h.day)).map((h) => `${h.day} ${h.time}`)
  return { ops: [{ op: 'contact', field: 'hours', value: [...rows, `${day[1]} closed`].join('; ') }], notes: [] }
}

/** "eggless ko 100% eggless likho", "Jaipur ki jagah Udaipur likho": a phrase of the page becomes another one (only when the phrase is on the page, so that "button ko blue karo" is not taken for it) */
function replacePhrase(plain: string, page?: PageFacts): ItemResult | undefined {
  if (!page) return undefined
  const m = plain.match(R(`^\\s*(?:the\\s+)?["“'‘]?(?<from>[^"“”'‘’]{2,60}?)["”'’]?\\s+(?:ko|ki\\s+jagah|ke\\s+badle)\\s+["“'‘]?(?<to>[^"“”‘’]{2,80}?)["”'’]?\\s+(?:likho|likh\\s+do|karo|kar\\s+do|kardo|badlo|badal\\s+do|rakho|rakh\\s+do|bana\\s+do|se\\s+badlo)\\s*[.!]*$`, 'iu'))
  if (!m?.groups) return undefined
  const from = unquote(m.groups.from)
  const to = unquote(m.groups.to)
  const text = JSON.stringify(page).toLowerCase()
  // a layout or style request is not a change of words ("hero ko center align karo", "gallery ko chhota karo", "pricing ko gallery ke neeche rakh do")
  const LAYOUT = U('upar|neeche|before|after|above|below|bottom|top|center|centre|left|right|align|chhota|chota|chhoti|bada|badi|size|bigger|smaller|taller|wider|color|colour|rang|font|bold|section|page|hata|remove|delete|hide|move|gallery|pricing|faq|hero|about|contact|footer|navbar|menu|team|blog|steps|stats|testimonials?|reviews?|services?|features?|cta|banner')
  if (R(LAYOUT).test(to) || R(LAYOUT).test(from)) return undefined
  if (!from || !to || from.toLowerCase() === to.toLowerCase() || !text.includes(from.toLowerCase())) return undefined
  return { ops: [{ op: 'replace', from, to }], notes: [] }
}

/** `page`: the page on the screen, so that a named item is checked (undefined = not known) */
export function itemOps(plain: string, page?: PageFacts): ItemResult | undefined {
  return closedDay(plain, page) ?? removeItem(plain, page) ?? addItem(plain, page) ?? setItem(plain, page) ?? replacePhrase(plain, page)
}
export const textOpsOf = (plain: string): ItemResult | undefined => textOps(plain)

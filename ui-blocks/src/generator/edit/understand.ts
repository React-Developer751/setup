// Turns what a person types ("remove the FAQ and rename it to Zen Cafe", "buttons ko neela karo") into EditOps.
// Rule based, offline, in English, Hinglish and Hindi: the text is split into commands, and every command is read for its
// subject (section, page, colour, text field, contact detail ...) and what to do with it. The result is only a list of
// operations (see edits.ts); the learned model (intent.ts) produce the same thing.
import { itemOps, textOpsOf, type PageFacts } from './itemParse'
import { extraOps, unsupportedNote } from './extraParse'
import { layoutOps } from './layoutParse'
import { widgetOps } from './widgetParse'
import { pagesOps } from './pagesParse'
import { decideTheme, isBusinessWord } from '../themeClassifier'
import type { ThemeKey } from '../themes'
import { styleOps } from './styleParse'
import { cleanOp, type EditOp, type FitTarget, type StyleProp, type Harmony, type ServiceItem, type PageKey, type SectionKey, type Target, type TextField, type Tone, TONES } from './edits'
import {
  COLOR_HEX,
  COLOR_NOUNS,
  RISKY_COLORS,
  FIELD_TERMS,
  HARMONY_TERMS,
  LIKE_WORDS,
  SECOND_COLOR_TERMS,
  TARGET_TERMS,
  THING_COLORS,
  MOTION_TERMS,
  PAGE_OF_SECTION,
  SECTION_TERMS,
  TIER_TERMS,
  TONE_TERMS,
  VERBS,
  wordRegex,
} from './lexicon'

export type EditContext = 'single' | 'multi'
/** `redesign`: "kuch alag design chahiye", "another look": the same business, another design (the button "Another design") */
export type Control = 'undo' | 'redo' | 'reset' | 'redesign'

export type Understood =
  | { kind: 'ops'; ops: EditOp[]; notes: string[] }
  | { kind: 'control'; control: Control }
  | { kind: 'newSite' }
  | { kind: 'none'; reason: string }

const re = {
  remove: wordRegex(VERBS.remove),
  add: wordRegex(VERBS.add),
  negate: wordRegex(VERBS.negate.map((v) => v.trim())),
  undo: wordRegex(VERBS.undo),
  redo: wordRegex(VERBS.redo),
  reset: wordRegex(VERBS.reset),
  rename: wordRegex(VERBS.rename),
  motionTopic: wordRegex(MOTION_TERMS.topic),
  motionOff: wordRegex(MOTION_TERMS.off),
  motionSubtle: wordRegex(MOTION_TERMS.subtle),
  motionRich: wordRegex(MOTION_TERMS.rich),
  colorNoun: wordRegex(COLOR_NOUNS),
}

const longestFirst = (terms: string[]) => [...terms].sort((a, b) => b.length - a.length)
const SECTION_RE = Object.fromEntries(Object.entries(SECTION_TERMS).map(([key, terms]) => [key, wordRegex(longestFirst(terms))])) as Record<SectionKey, RegExp>
const COLOR_RE = wordRegex(longestFirst(Object.keys(COLOR_HEX)))
const TONE_RE = Object.fromEntries(Object.entries(TONE_TERMS).map(([key, terms]) => [key, wordRegex(longestFirst(terms))])) as Record<Tone, RegExp>
const FIELD_RE = Object.entries(FIELD_TERMS).map(([field, terms]) => ({ field: field as TextField, re: wordRegex(longestFirst(terms)), longest: Math.max(...terms.map((t) => t.length)) }))
const TIER_RE = { normal: wordRegex(TIER_TERMS.normal), premium: wordRegex(TIER_TERMS.premium), better: wordRegex(TIER_TERMS.better) }

const THING_RE = wordRegex(longestFirst(Object.keys(THING_COLORS)))
const LIKE_RE = wordRegex(longestFirst(LIKE_WORDS))
const SECOND_RE = wordRegex(longestFirst(SECOND_COLOR_TERMS))
const TARGET_RE = Object.fromEntries(Object.entries(TARGET_TERMS).map(([key, terms]) => [key, wordRegex(longestFirst(terms))])) as Record<'header' | 'hero' | 'footer', RegExp>
const HARMONY_RE = Object.fromEntries(Object.entries(HARMONY_TERMS).map(([key, terms]) => [key, wordRegex(longestFirst(terms))])) as Record<Harmony, RegExp>
const COLOR_RE_G = new RegExp(COLOR_RE.source, 'giu')

// ───────────── helpers ─────────────
const CLOSERS = ['rakho', 'rakh do', 'rakh de', 'rakhiye', 'karo', 'kar do', 'kardo', 'kar de', 'karde', 'karna', 'likho', 'likh do', 'likhna', 'set karo', 'set kar do', 'set', 'banao', 'bana do', 'bana de', 'badlo', 'badal do', 'please', 'pls', 'plz', 'ok', 'okay', 'thanks', 'thank you', 'hai', 'chahiye', 'chaiye', 'kijiye', 'kr do', 'kro', 'dena', 'do', 'de', 'yaar', 'bhai', 'thank you so much', 'thank you', 'karna hai', 'rakhna hai', 'rakhdo', 'hona chahiye', 'hona', 'hoga', 'hogi', 'from now on', 'rakh dijiye', 'rakhiye', 'dijiye', 'rakh dena', 'रख दीजिए', 'रख दो', 'रख दें', 'दीजिए', 'कर दीजिए', 'लिखिए', 'रखिए', 'daalo', 'dalo', 'daal do', 'add karo', 'रखो', 'रखें', 'करो', 'कर दो', 'कर दीजिए', 'लिखो', 'लिख दो', 'दो', 'कीजिए']
const CLOSER_RE = new RegExp(`(?:^|\\s+)(?:${longestFirst(CLOSERS).join('|')})\\s*[.!]*$`, 'i')
const OPENER_RE = /^(?:to|as|is|be|=|:|-|ko|se|into|should be|will be|called|named)\s+/i

const ABBREVIATION = /(?:^|\s)(?:Co|Inc|Ltd|Jr|Sr|Dr|Mr|Mrs|Ms|St|Pvt|Corp|Bros)\.$/
/** the closing full stop of a sentence goes; a full stop that belongs to the text stays ("Co.", "Move well. Live well.") */
const trimStop = (text: string) => {
  if (/[!]+$/.test(text)) return text.replace(/[!]+$/, '')
  if (/\?$/.test(text)) return /[.!?]\s/.test(text) || !/\s/.test(text) ? text : text.replace(/\?+$/, '')
  if (/\.$/.test(text) && !ABBREVIATION.test(text) && !/[.!?]\s/.test(text)) return text.replace(/\.+$/, '')
  return text
}

const stripEnds = (value: string) => {
  let text = value.trim().replace(/[?!]+\s+(?:thank|thanks|please|pls|ok|okay|bro|yaar)\b.*$/iu, '').replace(/[.]\s+(?:thank|thanks|please|pls)\b.*$/i, '')
  for (let i = 0; i < 4; i += 1) {
    const next = trimStop(text.replace(CLOSER_RE, '').replace(OPENER_RE, '').replace(/^[\s:=,;-]+|[\s,;]+$/g, '').trim())
    if (next === text) break
    text = next
  }
  return text
}

type Quoted = { text: string; quotes: string[] }

/** quoted pieces are taken out so that their words are not read as commands: §0§ */
function hideQuotes(raw: string): Quoted {
  const quotes: string[] = []
  const keep = (_m: string, inner: string) => `§${quotes.push(inner.trim()) - 1}§`
  const text = raw
    .replace(/[“”„«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/"([^"]{1,200})"/g, keep)
    .replace(/(?<![\p{L}\p{N}])'([^']{1,200})'(?![\p{L}\p{N}])/gu, keep)
  return { text, quotes }
}

const showQuotes = (text: string, quotes: string[]) => text.replace(/§(\d+)§/g, (_m, i: string) => quotes[Number(i)] ?? '')
const hasQuote = (text: string) => /§\d+§/.test(text)

const hexOf = (text: string): string | undefined => {
  const m = text.match(/#([0-9a-f]{6}|[0-9a-f]{3})(?![0-9a-z])/i)
  if (!m) return undefined
  const h = m[1].toLowerCase()
  return `#${h.length === 3 ? [...h].map((c) => c + c).join('') : h}`
}

/** the colour word of a text is an everyday word too ("rose", "wine", "sage") */
const riskyColor = (text: string) => {
  const m = text.match(COLOR_RE)
  return !!m && RISKY_COLORS.has(m[0].toLowerCase())
}

/** a new, pleasant accent colour: the hue is anywhere on the wheel, saturation and lightness stay in a range that works for buttons */
export function freshAccent(random: () => number = Math.random): string {
  const h = Math.floor(random() * 360)
  const s = 62 + Math.floor(random() * 18)
  const l = 38 + Math.floor(random() * 10)
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

const colorOf = (text: string): string | undefined => {
  // "dark blue" -> navy, "light blue" -> sky blue
  if (/(?<![\p{L}])(?:light|baby|halka|halki|halke)\s+(?:blue|neela|nila)/iu.test(text)) return COLOR_HEX['sky blue']
  const hex = hexOf(text)
  if (hex) return hex
  // "like the ocean", "Spotify jaisa", "trustworthy colours": a thing, place, brand or mood stands for the colour
  const thing = thingColor(text)
  if (thing) return thing
  const m = text.match(COLOR_RE)
  return m ? COLOR_HEX[m[0].toLowerCase().replace(/\s+/g, ' ')] : undefined
}

/** the colour of a thing ("ocean", "mango", "Zomato"), only when colours are the topic and the word is not a plain colour name already */
function thingColor(text: string): string | undefined {
  const m = text.match(THING_RE)
  if (!m) return undefined
  const word = m[0].toLowerCase()
  if (word in COLOR_HEX) return undefined
  // "sky blue" and "royal blue" are colour names of their own
  for (const c of text.matchAll(COLOR_RE_G)) if (m.index !== undefined && c.index <= m.index && m.index < c.index + c[0].length) return undefined
  const topic = re.colorNoun.test(text) || LIKE_RE.test(text) || /(?<![\p{L}])(?:theme|buttons?|links?|accent|vibe)(?![\p{L}])/iu.test(text)
  return topic ? THING_COLORS[word] : undefined
}

type Mention<T> = { value: T; at: number; end: number }

/** the parts of the page named in a text (navigation bar, first screen, footer, sections), in the order written */
function partMentions(text: string): Mention<Target>[] {
  const found: Mention<Target>[] = []
  for (const key of ['header', 'hero', 'footer'] as const) {
    const m = TARGET_RE[key].exec(text)
    if (m) found.push({ value: key, at: m.index, end: m.index + m[0].length })
  }
  for (const key of SECTION_ORDER) {
    const m = SECTION_RE[key].exec(text)
    if (m && !found.some((f) => m.index < f.end && f.at < m.index + m[0].length)) found.push({ value: key, at: m.index, end: m.index + m[0].length })
  }
  return found.sort((a, b) => a.at - b.at)
}

/** the colours named in a text, in the order written ("header red footer green") */
function colorMentions(raw: string): Mention<string>[] {
  const text = raw.replace(/(?<![\p{L}])(?:light|baby|halka|halki|halke)\s+(?:blue|neela|nila)/giu, (m) => 'sky blue'.padEnd(m.length, ' '))
  const found: Mention<string>[] = []
  for (const m of text.matchAll(/#(?:[0-9a-f]{6}|[0-9a-f]{3})(?![0-9a-z])/gi)) found.push({ value: hexOf(m[0]) as string, at: m.index, end: m.index + m[0].length })
  for (const m of text.matchAll(COLOR_RE_G)) {
    if (RISKY_COLORS.has(m[0].toLowerCase()) && !/(?<![\p{L}])(?:colou?r|rang|shade|theme)(?![\p{L}])/iu.test(text)) continue
    found.push({ value: COLOR_HEX[m[0].toLowerCase().replace(/\s+/g, ' ')], at: m.index, end: m.index + m[0].length })
  }
  if (!found.length) {
    const thing = thingColor(text)
    const m = thing && text.match(THING_RE)
    if (thing && m) found.push({ value: thing, at: m.index ?? 0, end: (m.index ?? 0) + m[0].length })
  }
  return found.sort((a, b) => a.at - b.at)
}

// ───────────── lists the person types: services with prices, opening hours ─────────────
const PRICE_AT_END = /^(.*?)[\s:=-]*(?:at|@|for)?\s*(?:rs\.?|inr|₹|\$|£|usd|aed)?\s*(\d[\d,]*(?:\.\d+)?)\s*(?:rs\.?|₹|\/-|(\/\s*[a-z]+))?\s*$/i

/** "services: haircut 300, facial 800, spa" -> [{haircut, 300}, {facial, 800}, {spa}] */
export function parseServices(text: string): ServiceItem[] | undefined {
  const m = text.match(/^(?:please\s+)?(?:(?:my|our|meri|hamari|mere|hamare)\s+)?(?:services?|menu|price\s*list|prices?|rates?|rate\s*list)\s*(?:are|hain|is|[:=-])\s*(.+)$/i)
  if (!m) return undefined
  const items: ServiceItem[] = []
  for (const raw of m[1].split(/\s*[,;\n]\s*|\s+and\s+|\s+aur\s+/i)) {
    const part = raw.replace(/^[-*•\d.)\s]+(?=[A-Za-z\u0900-\u097F])/, '').trim()
    if (!part) continue
    const priced = part.match(PRICE_AT_END)
    const name = (priced && priced[1].trim().length >= 2 ? priced[1] : part).replace(/[:\s-]+$/, '').trim()
    if (name.length < 2 || name.length > 40 || /^\d+$/.test(name)) continue
    items.push({ name: name.charAt(0).toUpperCase() + name.slice(1), ...(priced && priced[1].trim().length >= 2 ? { price: `${priced[2]}${priced[3] ? priced[3].replace(/\s+/g, '') : ''}` } : {}) })
  }
  return items.length ? items.slice(0, 8) : undefined
}

/** "opening hours: Mon-Sat 9am-7pm, Sun closed" -> the text after the keyword */
export function parseHoursText(text: string): string | undefined {
  const m =
    text.match(/^(?:please\s+)?(?:(?:my|our|meri|hamari|mera|hamara)\s+)?(?:(?:opening|business|working|shop|store|clinic|office)\s+)?(?:hours|timings?)\s*(?:are|is|hai|hain|[:=-])?\s*(.+)$/i) ??
    text.match(/^(?:we\s+are\s+|we'?re\s+|shop\s+is\s+)?open(?:s)?\s+(?:from\s+|daily\s+|every\s*day\s+)?(.+)$/i) ??
    text.match(/khulne\s+ka\s+(?:time|samay)\s*(?:hai|:|-)?\s*(.+)$/i)
  const value = m?.[1]?.replace(/^(?:(?:change|badlo|badal do|badal|update|set|add|likho|rakho|karo|kar do|to)\b[\s:=-]*)+/i, '').replace(/[.\s]+$/, '').trim()
  return value && /\d|closed|24\s*hours|all day/i.test(value) && value.length <= 120 ? value : undefined
}

// ───────────── control, new site ─────────────
const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length
const anySection = (text: string) => (Object.keys(SECTION_RE) as SectionKey[]).some((key) => SECTION_RE[key].test(text))

const near = (a: string, b: string) => {
  if (Math.abs(a.length - b.length) > 1) return false
  // one insertion, deletion, substitution or swap of two letters
  if (a.length === b.length) {
    let diff = 0
    let swap = -1
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) { diff += 1; if (swap < 0) swap = i }
    return diff === 1 || (diff === 2 && a[swap] === b[swap + 1] && a[swap + 1] === b[swap])
  }
  const [long, short] = a.length > b.length ? [a, b] : [b, a]
  for (let i = 0; i < long.length; i += 1) if (long.slice(0, i) + long.slice(i + 1) === short) return true
  return false
}
function controlOf(text: string): Control | undefined {
  const words = wordCount(text)
  if (words > 9) return undefined
  const sections = anySection(text)
  // "undo the undo", "undo cancel karo": taking an undo back is a redo
  if (/(?<![\p{L}])un-?undo|undo\s+(?:the\s+)?undo|undo\s+ko\s+undo|revert\s+the\s+undo|(?:undo|undone)\b.*\b(?:cancel|reverse|restore|wapas|revert|kiya tha)|(?:cancel|reverse|restore|apply|bring back|take back|revert)\b.*\b(?:undo|undone)\b/iu.test(text)) return 'redo'
  if (/सब\s+बदलाव\s+(?:हटा|वापस|रीसेट)/u.test(text)) return 'reset'
  // "sab hata ke fir se shuru karo": start over
  if (words <= 8 && /(?<![\p{L}])(?:sab(?:kuch)?|everything|all)\s+(?:hata|delete|remove|mita)\w*\s*(?:ke|kar|do)?\s*(?:phir|fir|again)\s+(?:se\s+)?(?:shuru|start)/iu.test(text)) return 'reset'
  // another design for the same business (not a colour, not a part): "yeh design kuch alag chahiye", "show me a different look", "try another style"
  if (words <= 9 && !sections && /(?<![\p{L}])(?:(?:kuch\s+)?(?:alag|aur|naya|nayi|different|another|new|else)\s+(?:wala\s+)?(?:design|look|style|version|layout|template)|(?:design|look|style|layout|version)\b.{0,24}\b(?:kuch\s+)?(?:alag|different|badlo|change|naya)|(?:design|look|style)\s+(?:pasand\s+nahi|nahi\s+(?:pasand|achha|accha))|redesign|try\s+(?:another|a\s+different)|something\s+(?:different|else|new))(?![\p{L}])/iu.test(text) && !/(?:colou?r|rang|font|button|heading|text|size)/i.test(text)) return 'redesign'
  if (words <= 5 && /(?<![\p{L}])(?:start\s+(?:again|over|fresh)|from\s+scratch|fresh\s+start|shuru\s+se|phir\s+se\s+shuru|dobara\s+shuru)(?![\p{L}])/iu.test(text)) return 'reset'
  if (re.reset.test(text) && !/(?<![\p{L}\p{M}])(?:साइज़|साइज|लेआउट|layout|sizes?|heights?|widths?|alignments?|spacing|positions?|order)(?![\p{L}])/iu.test(text)) return 'reset'
  if (!sections && re.redo.test(text)) return 'redo'
  if (!sections && /(?<![\p{L}\p{M}])(?:wapas|wapis|वापस)\s+(?:lagao|laga do|laga de|apply|chahiye|do|laao|lao)/iu.test(text)) return /wapas\s+(?:chahiye|laao|lao|do)/i.test(text) ? (/(?:old|pehle|purana)/i.test(text) ? 'undo' : 'redo') : 'redo'
  if (re.undo.test(text) && !(sections && (re.remove.test(text) || re.add.test(text) || /lagao|laga do|dikhao/i.test(text)) && !/undo|revert/i.test(text))) return 'undo'
  if (words <= 5 && /(?<![\p{L}])(?:that|this)\s+(?:was|is)\s+(?:wrong|bad|not right|not good)|galat\s+(?:ho gaya|hai|tha)|ye galat|yeh galat/iu.test(text) && !/(?:business|type|site)/i.test(text)) return 'undo'
  // a single word with a typo: "undoo", "redoo", "rset"
  if (words === 1) {
    const w = text.toLowerCase().replace(/[^a-z]/g, '')
    if (w.length >= 4 && near(w, 'undo')) return 'undo'
    if (w.length >= 4 && near(w, 'redo')) return 'redo'
    if (w.length >= 4 && near(w, 'reset')) return 'reset'
  }
  return undefined
}

const CREATE = /(?<![\p{L}])(?:create|make|build|generate|design|develop|banao|bana\s+do|bana\s+de|banado|chahiye|chaiye|want|need|i'?d like|looking for|setup|set up|banwana|banwao|बनाओ|बना\s+दो|बनाइए|चाहिए|चाहिये)(?![\p{L}\p{M}])/iu
const SITE_WORD = /(?<![\p{L}])(?:websites?|sites?|web\s*sites?|web\s*pages?|webpage|portfolio|landing\s*page|web\s*app|store\s*front|online\s*store|vebsite|वेबसाइट|साइट)(?![\p{L}\p{M}])/iu
const THIS_SITE = /(?<![\p{L}])(?:the|this|my|our|current|is|iss?|iska|isko|yeh|ye|uska)\s+(?:website|site|web\s*site|page)(?![\p{L}])/iu

function isNewSite(text: string): boolean {
  if (/^(?:a\s+)?(?:new|naya|nayi|naye)\s+(?:website|site|web\s*page|portfolio)(?![\p{L}])/iu.test(text.trim())) return true
  if (/(?<![\p{L}])(?:need|want|chahiye|create|make|build)(?![\p{L}]).*(?<![\p{L}])(?:whole new|brand new|completely new|naya|nayi|new)\s+(?:\w+\s+)?(?:websites?|sites?)(?![\p{L}])/iu.test(text)) return true
  if (!CREATE.test(text) || !SITE_WORD.test(text)) return false
  if (colorOf(text) && re.colorNoun.test(text)) return false
  if (THIS_SITE.test(text) && !/(?<![\p{L}])(?:new|naya|nayi|naye|another|ek aur|dusra|different)(?![\p{L}])/iu.test(text)) return false
  if (re.remove.test(text) && !/(?<![\p{L}])(?:banao|create|build)(?![\p{L}])/iu.test(text)) return false
  // "a portfolio page" / "gallery section" is a part of this site, not a new site
  if (/(?<![\p{L}])(?:page|section)(?![\p{L}])/iu.test(text.replace(/landing\s*page|web\s*page/gi, ' ')) && !/(?<![\p{L}])(?:websites?|sites?|web\s*app|वेबसाइट|साइट)(?![\p{L}\p{M}])/iu.test(text)) return false
  return /(?<![\p{L}])(?:for|ke liye|ki|ka|ke|of|about|mere liye|मेरे लिए|के लिए|की|का)(?![\p{L}\p{M}])/iu.test(text)
}

// ───────────── one command ─────────────
type ClauseResult = { ops: EditOp[]; notes: string[] }

/** adding or removing a section: in a multi-page site the page of that section goes (or comes) first */
export function sectionChange(key: SectionKey, verb: 'remove' | 'add', context: EditContext): EditOp[] {
  const page = PAGE_OF_SECTION[key]
  const ops: EditOp[] = []
  if (context === 'multi' && page) ops.push({ op: verb === 'remove' ? 'removePage' : 'addPage', page: page as PageKey })
  ops.push({ op: verb, section: key })
  return ops
}

const SECTION_ORDER = Object.keys(SECTION_TERMS) as SectionKey[]

/** section keys named in a text, in the order they are written */
function sectionsIn(text: string): SectionKey[] {
  const found: { key: SectionKey; at: number }[] = []
  for (const key of SECTION_ORDER) {
    const m = SECTION_RE[key].exec(text)
    if (m) found.push({ key, at: m.index })
  }
  // "contact" inside "contact us" and "about" inside "about us" are one word each: nothing doubles
  return found.sort((a, b) => a.at - b.at).map((f) => f.key)
}

function clauseOps(rawClause: string, context: EditContext, quotes: string[], carry: { verb?: 'remove' | 'add'; last?: string; target?: string }): ClauseResult {
  const notes: string[] = []
  const ops: EditOp[] = []
  const clause = rawClause.trim()
  if (!clause) return { ops, notes }
  const shown = (s: string) => stripEnds(showQuotes(s, quotes))
  const push = (op: EditOp | undefined) => {
    const ok = op && cleanOp(op)
    if (ok) ops.push(ok)
  }

  const extra = extraOps(showQuotes(clause, quotes))
  if (extra) return { ops: extra.ops.flatMap((op) => (cleanOp(op) ? [cleanOp(op) as EditOp] : [])), notes: extra.notes }

  // layout: names of sections, places, sizes, alignment ─────────
  const layout = layoutOps(clause, context, quotes, stripEnds, carry.target)
  if (layout) {
    for (const op of layout.ops) push(op)
    const t = layout.ops.map((o) => ('section' in o ? o.section : 'page' in o ? (o.page === 'services' ? 'features' : o.page) : 'target' in o ? o.target : undefined)).find((v) => typeof v === 'string' && v !== 'page')
    if (t) carry.target = t
    return { ops, notes: layout.notes }
  }

  // contact details ─────────
  const waNumber = clause.match(/whats\s*app(?:\s*(?:number|no\.?|num))?\s*(?:is|=|:|-|ko|par|pe)?\s*(\+?\(?\d[\d\s().-]{6,}\d)/i) ?? clause.match(/(\+?\(?\d[\d\s().-]{6,}\d)\s*(?:is|hai)?\s*(?:my|mera|meri|our|hamara)?\s*whats\s*app/i)
  if (waNumber) {
    push({ op: 'contact', field: 'whatsapp', value: waNumber[1].trim() })
    return { ops, notes }
  }
  const email = clause.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)
  if (email) {
    push({ op: 'contact', field: 'email', value: email[0] })
    return { ops, notes }
  }
  const where =
    clause.match(/(?:we are located at|we're located at|we are at|we're at|we are in|we're in|visit us at|find us at|our (?:office|shop|store|clinic) (?:is at|is in|moved to|is located at)|located at|located in|office moved to|moved to|we moved to)\s+(.+)/i) ??
    clause.match(/^(?:dukaan|dukan|office|shop|clinic|hum)\s+(.+?)\s+(?:par|pe|me|mein)\s+(?:hai|he|hain)$/i) ??
    clause.match(/(?:put|set|use|keep|rakho|daalo)\s+(.+?)\s+(?:as|for)\s+(?:our\s+|the\s+|my\s+)?(?:address|addess|adress|adres|pata)\b/i) ??
    clause.match(/^(.+?)\s+(?:ko\s+)?(?:address|pata)\s+(?:me|mein|banao|karo|rakho|rakh do)/i)
  if (where && stripEnds(where[1]).length >= 4 && !/@/.test(clause)) {
    push({ op: 'contact', field: 'address', value: shown(where[1]).replace(/\s+(?:par|pe|me|mein)\s+(?:hai|he|hain)$/i, '') })
    return { ops, notes }
  }
  const addr = clause.match(/(?:address|pata|पता|location)\s*(?:is|to|=|:|ko|-|should be|ho)?\s*(.+)/i)
  const addrFirst = clause.match(/^(.+?)\s+(?:ko\s+)?(?:address|pata)\s+(?:rakho|rakh do|karo|kar do|set karo|banao)$/i)
  if (addr && stripEnds(addr[1]) && !/(?<![\p{L}])email(?![\p{L}])/iu.test(addr[1])) {
    const value = shown(addr[1]).replace(/^(?:(?:change|badlo|badal do|badal|update|set|add|likho|rakho|karo|kar do|to)\b[\s:=-]*)+/i, '')
    if (value && !re.remove.test(clause)) {
      push({ op: 'contact', field: 'address', value })
      return { ops, notes }
    }
  }
  if (addrFirst) {
    push({ op: 'contact', field: 'address', value: shown(addrFirst[1]) })
    return { ops, notes }
  }
  const phone = clause.match(/(\+?\(?\d[\d\s().-]{5,}\d)/)
  if (phone && (/(?<![\p{L}])(?:phone|number|mobile|call|whatsapp|contact|tel|telephone|no\.?|nambar|fone|नंबर|फोन)(?![\p{L}])/iu.test(clause) || clause.replace(phone[0], '').replace(/[^\p{L}]/gu, '').length < 14)) {
    push({ op: 'contact', field: 'phone', value: phone[1].trim() })
    return { ops, notes }
  }

  // "my shop is called X" / "business called X" is a name, before anything else
  const called = clause.match(/(?:\bis|\bare|\bnamed|\bcalled)\s+(?:called|named)\s+(§\d+§|[^,;]+)/i) ?? clause.match(/(?<![\p{L}])(?:called|named)\s+(§\d+§|[^,;]+)/iu)
  if (called && !/(?<![\p{L}])(?:rename|replace)(?![\p{L}])/iu.test(clause) && /(?:my|our|the|mera|meri|hamara|is|this)\s+\w*\s*(?:shop|store|business|brand|company|site|website|clinic|gym|cafe|restaurant|salon|channel|podcast|page|blog|studio|show|agency|firm)/i.test(clause)) {
    const name = shown(called[1])
    if (name.length >= 2) {
      push({ op: 'rename', name })
      return { ops, notes }
    }
  }

  // replace one word with another ─────────
  const cleanFrom = (v: string) => stripEnds(showQuotes(v, quotes)).replace(/^(?:the (?:word|text)|word|text|jahan bhi|jaha bhi|everywhere|all|every|sab jagah|har jagah|सब जगह)\s+/i, '').replace(/\s+(?:likha hai|likhi hai|hai|everywhere)$/i, '')
  const cleanTo = (v: string) => stripEnds(stripEnds(showQuotes(v, quotes)).replace(/\s+(?:everywhere|all over|on the (?:site|website)|sab jagah|har jagah|सब जगह)$/i, '')).replace(/^(?:the (?:word|text)|word|text)\s+/i, '')
  const arrow = clause.match(/^(§\d+§|\S+(?:\s\S+)?)\s*(?:->|=>|→|⇒)\s*(§\d+§|.+)$/)
  const findMake = clause.match(/^(?:find|search)\s+(.+?)\s+and\s+(?:make it|change (?:it )?to|replace (?:it )?with)\s+(.+)/i)
  const dontSay = clause.match(/(?:don'?t|do not|stop|never)\s+(?:say|saying|use|write)\s+(.+?)[\s,]+(?:say|use|write|put|instead)\s+(.+)/i)
  const itSays = clause.match(/(?:wherever|whenever|every time|jahan(?:\s+bhi)?|jaha(?:\s+bhi)?)\s+(?:it\s+)?(?:says?|is written|appears?|likha hai)\s+(.+?)[\s,]+(?:i want|write|put|use|make it|change (?:it )?to|likho|wahan|waha|there)\s*(?:there\s+)?(.+)/i)
  const shouldBe = clause.match(/^(.+?)\s+should be\s+(.+?)\s+(?:throughout|everywhere|across|all over|on all|in all)\b.*$/i)
  const hataKe = clause.match(/(.+?)\s+(?:hata ke|hata kar|hatake|hatakar|हटाकर|हटा कर)\s+(.+)/i)
  const rather = clause.match(/(?:i'?d rather have|i prefer|prefer)\s+(§\d+§|\S+)\s+(?:than|over|instead of)\s+(§\d+§|\S+)/i)
  const quick = arrow ?? findMake ?? dontSay ?? itSays ?? shouldBe ?? hataKe
  if (rather) {
    push({ op: 'replace', from: cleanFrom(rather[2]), to: cleanTo(rather[1]) })
    return { ops, notes }
  }
  if (quick && !(hataKe && quick === hataKe && !/(?:likh|rakh|karo|kar do|use|put|write)/i.test(clause)) && !FIELD_RE.some((f) => f.re.test(quick[1])) && !(anySection(quick[1]) && quick === shouldBe)) {
    const from = cleanFrom(quick[1]).replace(/^(?:sab jagah|har jagah|everywhere)\s+/i, '').replace(/\s+word$/i, '')
    const to = cleanTo(quick[2]).replace(/\s+(?:likh do|likho|karo|kar do|rakho)$/i, '')
    if (from && to) {
      push({ op: 'replace', from, to })
      return { ops, notes }
    }
  }
  const insteadFirst = clause.match(/instead of\s+(.+?)\s+(?:write|use|put|say|show|likho|rakho)\s+(.+)/i)
  const rep =
    insteadFirst ??
    clause.match(/(?:replace|swap|substitute)\s+(?:all\s+|every\s+)?(.+?)\s+(?:with|by|for|to)\s+(.+)/i) ??
    clause.match(/(?:everywhere|all|sab jagah|har jagah|jahan bhi|jaha bhi|सब जगह)?\s*(§\d+§|\S+(?:\s+\S+)?)\s+(?:ki jagah|ke badle|की जगह|ki jagah par|ki jagah pe)\s+(.+)/i) ??
    clause.match(/(?:जहाँ भी|जहां भी|jahan bhi|jaha bhi)\s+(§\d+§|\S+)\s+(?:लिखा है|likha hai)\s+(?:उसे|उसको|usse|usko|use)\s+(§\d+§|.+?)\s+(?:कर दो|करो|likho|kar do|karo)/iu) ??
    clause.match(/^(.+?)\s+ko\s+(.+?)\s+se\s+(?:badal|replace|badlo)/i)
  if (rep) {
    push({ op: 'replace', from: cleanFrom(rep[1]), to: cleanTo(rep[2]) })
    return { ops, notes }
  }
  const instead = clause.match(/(?:write|use|put|show|say|likho|rakho)\s+(.+?)\s+instead of\s+(.+)/i) ?? clause.match(/(.+?)\s+instead of\s+(.+)/i)
  if (instead && /^(?:the\s+)?(?:current|old|existing|previous)(?:\s+(?:one|name))?$/i.test(cleanFrom(instead[2]))) return { ops, notes }
  if (instead) {
    push({ op: 'replace', from: cleanFrom(instead[2]), to: cleanTo(instead[1].replace(/^(?:write|use|put|show|say)\s+/i, '')) })
    return { ops, notes }
  }
  const bare = clause.match(/(?:jahan bhi|jaha bhi|jahan|jaha|wherever|everywhere|sab jagah|har jagah)\s+(.+?)\s+(?:likha hai|likhi hai|hai|is written|appears?)[\s,]+(?:wahan|waha|there|vahan)?\s*(.+?)\s+(?:likho|rakho|karo|kar do|use)/i)
  if (bare) {
    push({ op: 'replace', from: cleanFrom(bare[1]), to: cleanTo(bare[2]) })
    return { ops, notes }
  }
  const changeTo = clause.match(/^(?:(?:change|make|turn|badlo|badal do)\s+)?((?:all|every|the word|sab|har)\s+)?(§\d+§|[\p{L}]{3,20})\s+(?:to|into|ko|as)\s+(§\d+§|.+)/iu)
  if (changeTo) {
    const marked = !!changeTo[1] || /(?:everywhere|sab jagah|har jagah|word)/i.test(clause)
    const word = changeTo[2]
    if ((hasQuote(word) || marked) && !COLOR_RE.test(word) && !FIELD_RE.some((f) => f.re.test(word)) && (marked || !anySection(word)) && !/^(?:it|this|that)$/i.test(word)) {
      push({ op: 'replace', from: cleanFrom(word), to: cleanTo(changeTo[3]) })
      return { ops, notes }
    }
  }
  const koKar = clause.match(/^(?:(?:sab|har)\s+jagah\s+|सब जगह\s+|हर जगह\s+)?(§\d+§|[\p{L}\p{M}]+(?:\s+[\p{L}\p{M}]+){0,2})(?:\s+word)?\s+ko\s+(§\d+§|[\p{L}\p{M}]+(?:\s+[\p{L}\p{M}]+){0,2})\s+(?:likho|kar do|karo|kardo|bana do|rakho|कर दो|करो|लिखो)$/iu)
  if (koKar && !/^(?:design|dizain|look|site|website|page|colou?rs?|theme|rang|it|isko|ise)$/i.test(koKar[1]) && !COLOR_RE.test(koKar[1]) && !COLOR_RE.test(koKar[2]) && !anySection(koKar[1]) && !partMentions(koKar[1]).length && !FIELD_RE.some((f) => f.re.test(koKar[1]))) {
    push({ op: 'replace', from: cleanFrom(koKar[1]), to: cleanTo(koKar[2]) })
    return { ops, notes }
  }

  // rename ─────────
  const nameValue = (value: string | undefined) => {
    const v = stripEnds(showQuotes(value ?? '', quotes)).replace(/^(?:galat hai|wrong|is wrong|badlo)[,\s]+/i, '').replace(/^(?:the\s+)?(?:name|naam)\s+/i, '')
    return v
  }
  let rename: string | undefined
  const renameAt = clause.search(/(?<![\p{L}\p{M}])(?:rename|name|naam|nam|call|नाम)(?![\p{L}\p{M}])/iu)
  const fieldAt = FIELD_RE.map((f) => f.re.exec(clause)?.index ?? -1).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? -1
  const fieldFirst = fieldAt >= 0 && renameAt > fieldAt
  const A = clause.match(/\brename\b\s*(?:it|this|that|the\s+\w+|my\s+\w+|our\s+\w+|business|brand|site|website|shop|store)?\s*(?:to|as|into)?\s*(.+)/i)
  const B = clause.match(/\b(?:call|name)\s+(?:it|this|that|the\s+(?:shop|business|site|website|store|brand|company|clinic|gym|cafe|restaurant|salon)|my\s+\w+|our\s+\w+)\s*(?:as|to)?\s*(.+)/i)
  const C = clause.match(/(?:(?:business|brand|company|shop|store|site|website|restaurant|cafe|clinic|gym|salon|hotel|iska|isko|uska|mera|meri|hamara|apna)\s+)?(?<![\p{L}\p{M}])(?:naam|nam|name|नाम)(?![\p{L}\p{M}])\s*(?:should be|will be|change(?:\s+(?:karke|kar ke|karo|kar do|to))?|badal(?:\s+ke|\s+kar|\s+do)?|badlo|बदलकर|बदल कर|बदलो|is|to|ko|=|:)?\s*(.+)/iu)
  const D = clause.match(/^(.+?)\s+(?:naam|nam|name)\s+(?:rakho|rakh do|rakh de|kar do|karo|do|de do|dedo|rakhiye)$/i)
  const E = clause.match(/(?:naam|name)[^,]*,\s*(.+)/i)
  const F = clause.match(/^(.+?)\s+(?:is|hai|he)\s+(?:our|my|mera|hamara|meri)\s+(?:name|brand|naam)/i)
  const G = clause.match(/\buse\s+(.+?)\s+as\s+(?:the\s+|our\s+|my\s+)?(?:site|business|brand|shop|company|website|store)?\s*name\b/i)
  const H = clause.match(/^(.+?)\s+(?:naam|name)\s+(?:rakhna hai|rakh lo|rakhiye|chahiye)/i)
  const J = clause.match(/should say\s+(§\d+§|.+?)\s+as\s+(?:the\s+|our\s+|my\s+)?(?:company|business|brand|shop|site|store|website)\s+name/i)
  const I = clause.match(/(?:rebrand(?:ing)?|re-brand)\s+(?:as|to)\s+(.+)/i) ?? clause.match(/(?:brand|logo text|logo name|store name|shop name|business name|site name)\s*(?:=|:|should be|should read|to read|read|reads|is|ko)\s*(.+)/i) ?? clause.match(/(?:can|could|please)?\s*(?:the\s+)?logo text (?:read|say|be)\s+(.+)/i)
  if (fieldFirst) rename = undefined
  else if (F) rename = nameValue(F[1])
  else if (G) rename = nameValue(G[1])
  else if (J) rename = nameValue(J[1])
  else if (H) rename = nameValue(H[1])
  else if (I) rename = nameValue(I[1])
  else if (E && /(?:naam|name)\s+(?:badlo|badal|change|kar|karo)/i.test(clause)) rename = nameValue(E[1])
  else if (A) rename = nameValue(A[1])
  else if (B) rename = nameValue(B[1])
  else if (D) rename = nameValue(D[1])
  else if (C && !FIELD_RE.some((f) => f.re.test(clause)) && !/(?<![\p{L}])(?:first|last|user|file|domain|font)\s+name/iu.test(clause)) rename = nameValue(C[1])
  if (rename) {
    rename = rename.replace(/^(?:badal(?:\s+ke|\s+kar|\s+do)?|change|karke|kar ke|बदलकर|बदल कर)\s+/i, '').replace(/^(?:to|as)\s+/i, '')
    if (rename.length >= 2) {
      push({ op: 'rename', name: rename })
      return { ops, notes }
    }
  }

  // text of a headline, subtitle, button, title ─────────
  const titleWord = /(?<![\p{L}\p{M}])(?:title|heading|headline|text)(?![\p{L}\p{M}])/iu.test(clause) && !/(?<![\p{L}])(?:hero|main|subtitle|sub|button|btn)(?![\p{L}])/iu.test(clause)
  const titled = titleWord ? sectionsIn(clause).find((key) => key === 'features' || key === 'about' || key === 'cta' || key === 'contact') : undefined
  const TITLE_OF: Record<string, TextField> = { features: 'featuresTitle', about: 'aboutTitle', cta: 'ctaTitle', contact: 'contactTitle' }
  const fieldHit = (titled ? [{ field: TITLE_OF[titled], re: /(?<![\p{L}\p{M}])(?:title|heading|headline|text)(?![\p{L}\p{M}])/iu, longest: 99 }] : FIELD_RE).map((f) => ({ ...f, m: f.re.exec(clause) }))
    .filter((f) => f.m)
    .sort((a, b) => b.longest - a.longest || (a.m as RegExpExecArray).index - (b.m as RegExpExecArray).index)[0]
  // a field is "talked about" with a colour word or an on/off word: that is a different command
  const colorTalk = (re.colorNoun.test(clause) || !!hexOf(clause) || !!COLOR_RE.test(clause)) && !hasQuote(clause)
  if (fieldHit && !(colorTalk && !/likho|write|text|label|says|say/i.test(clause))) {
    const at = (fieldHit.m as RegExpExecArray).index
    const after = clause.slice(at + (fieldHit.m as RegExpExecArray)[0].length)
    const before = clause.slice(0, at)
    let value: string | undefined
    const q = clause.match(/§(\d+)§/)
    if (q) value = quotes[Number(q[1])]
    else {
      const POST = /^[\s:]*(?:(?:text|line|label|me|mein|par|pe|ko|ka|ki|ke|section|says?|reads?|write|writes|put|type|should say|should read|likho|likhiye|likhie|लिखो|लिखिए|पर|में|को|का|की|के)(?![\p{L}\p{M}])[\s:]*)*/iu
      let rest = after.replace(/^\s*(?:of|for)\s+(?:the\s+)?(?:\S+\s+){0,3}?(?:section|area|part|page)\b/i, '').replace(POST, '')
      const intro = /^(?:change\s+(?:to|karke|kar ke)\s+|badal\s+(?:ke|kar)\s+|badlo\s+|badalkar\s+|badal do\s+|बदलकर\s+|बदलो\s+|should be\s+|should say\s+|should read\s+|will be\s+|to\s+|as\s+|is\s+|set\s+(?:to\s+)?|likho\s+|लिखो\s+|likh do\s+|rakho\s+|[:=-]\s*)/i
      const hadIntro = intro.test(rest) || /^[\s]*[:=]/.test(after) || /^\s*(?:text|label|says?|reads?)?\s*[:=]/i.test(after)
      rest = rest.replace(intro, '')
      const closed = CLOSER_RE.test(rest.trim())
      if (rest.trim() && (hadIntro || closed || /^[\p{Lu}\p{Lo}\d]/u.test(rest.trim()))) value = stripEnds(showQuotes(rest, quotes))
      else {
        const b2 = before.match(/(?:write|put|set|likho|rakho|type)\s+(.+?)\s+(?:on|in|as|for|par|pe|me|mein|as the)?\s*(?:the\s+)?$/i)
        if (b2) value = stripEnds(showQuotes(b2[1], quotes))
      }
    }
    // "buttons bade karo" asks for a style (size, shape), not for the words "bade" on the button
    if (value && !hasQuote(clause) && wordCount(value) <= 2 && /^(?:bad[ae]|badi|chh?ot[ae]|chh?oti|big(?:ger)?|small(?:er)?|large(?:r)?|round(?:ed)?|sharp|bold|thin|thick|zyada|jyada|kam|bigger|smaller|gol|moti|patli|patla)$/i.test(value.trim())) {
      // a shape is a style edit now (round / square corners); a size of a button is still not possible
      if (/^(?:round(?:ed)?|gol|sharp)$/i.test(value.trim())) {
        const parts2 = partMentions(clause).map((p) => p.value as FitTarget)
        for (const target of parts2.length ? parts2 : (['page'] as FitTarget[])) push({ op: 'style', target, prop: 'radius', value: /sharp/i.test(value) ? 'square' : 'pill' })
        return { ops, notes }
      }
      notes.push('I cannot change the size of buttons yet. I can change the button text, colour, corners and place.')
      return { ops, notes }
    }
    // words of a command are not a new text ("heading ka rang gol karo" must not become the heading "rang gol")
    if (value && !hasQuote(clause) && /(?<![\p{L}\p{M}])(?:size|saiz|naam|name|daalo|dalo|bold|italic|underline|font|spacing|bada|badi|bade|chhota|chhoti|chhote|badhao|ghatao|karo|kardo|krdo|hatao|hata|upar|niche|left|right|center|centre|color|colour|rang|square|rounded|corners?|animation|dark|light)(?![\p{L}\p{M}])/iu.test(value) && wordCount(value) <= 6) {
      notes.push('I did not change the text. To set new words, give them in quotes: for example heading "Your new heading".')
      return { ops, notes }
    }
    if (value && value.length >= 1 && !(colorMentions(value).length > 0 && wordCount(value) <= 3 && !hasQuote(clause))) {
      push({ op: 'text', field: fieldHit.field, text: value })
      return { ops, notes }
    }
  }

  // animations ─────────
  if (re.motionTopic.test(clause)) {
    const level = re.motionSubtle.test(clause) ? 'subtle' : /(?<![\p{L}])static(?![\p{L}])/iu.test(clause) || re.motionOff.test(clause) || re.negate.test(clause) ? 'off' : 'rich'
    if (level) {
      push({ op: 'motion', level })
      return { ops, notes }
    }
  }

  // mode ─────────
  const aboutAPart = partMentions(clause).length > 0
  // "website ko light mode me karo", "dark theme on": the words say it, whatever else is in the clause
  const explicitMode = /(?<![\p{L}])(light|dark)\s+(?:mode|theme)(?![\p{L}])/iu.exec(clause)
  if (explicitMode && !/(?:button|link|heading|header|footer|navbar|menu|hero|about|section|card|text|font)\b/i.test(clause.replace(explicitMode[0], ' '))) {
    push({ op: 'mode', mode: /dark/i.test(explicitMode[1]) ? 'dark' : 'light' })
    return { ops, notes }
  }
  const modeText = clause.replace(/(?<![\p{L}])(?:dark|light|night|deep)\s+(?:blue|red|green|gray|grey|purple|pink|brown|orange|yellow|neela|lal|hara|golden|gold)/giu, ' ')
  const darkWord = /(?<![\p{L}])(?:dark|night|andhera|andheri|andhere|डार्क|अंधेरा|नाइट|ब्लैक)(?![\p{L}\p{M}])/iu.test(modeText)
  const lightWord = /(?<![\p{L}])(?:light|day|daylight|ujala|bright|लाइट|उजाला|सफेद|सफ़ेद|व्हाइट)(?![\p{L}\p{M}])/iu.test(modeText)
  const modeCtx = /(?<![\p{L}])(?:mode|मोड|थीम|theme|default|start(?:s|ing)?|background|screen|version|wala|wali|style|look|appearance|interface)(?![\p{L}])/iu.test(modeText)
  const blackWhiteTheme = /(?<![\p{L}])(?:black|white|kala|kaala|safed)\s+(?:theme|background|mode|version)(?![\p{L}])/iu.exec(modeText)
  if (blackWhiteTheme && !aboutAPart && !/(?:button|link|colou?r|rang|accent|heading|text)/i.test(clause)) {
    push({ op: 'mode', mode: /black|kal/i.test(blackWhiteTheme[0]) ? 'dark' : 'light' })
    return { ops, notes }
  }
  if (!aboutAPart && (darkWord || lightWord) && !(darkWord && lightWord) && (modeCtx || wordCount(clause) <= 4 || /go\s+(?:dark|light)|make it (?:dark|light)|(?:dark|light)\s+(?:karo|kar do|rakho|chahiye|do)/i.test(clause)) && !/button|link|heading|text colou?r|font|बटन|हेडिंग|लिंक/i.test(modeText)) {
    push({ op: 'mode', mode: darkWord ? 'dark' : 'light' })
    return { ops, notes }
  }

  // the look of one kind of thing: the colour of buttons, headings or text, round or sharp corners, the typeface ─────────
  const parts = partMentions(clause)
  // "background green", "page ka background blue": the background of the page, which is the background of every part between the menu and the footer
  if (!parts.length && /(?<![\p{L}])(?:background|bg)(?![\p{L}])/iu.test(clause) && !/(?<![\p{L}])(?:buttons?|btns?|accent|links?|text|font|heading|headings)(?![\p{L}])/iu.test(clause)) {
    const colours = colorMentions(clause)
    if (colours.length) {
      for (const target of ['hero', 'stats', 'features', 'about', 'steps', 'gallery', 'pricing', 'team', 'testimonials', 'blog', 'faq', 'cta', 'contact'] as Target[]) push({ op: 'sectionColor', target, hex: colours[0].value })
      notes.push('Every part of the page (the menu and the footer keep their own colour) now has that background. Say "header green" or "footer dark" to colour those as well.')
      return { ops, notes }
    }
  }
  {
    const quoted = hasQuote(clause)
    const targets = parts.length ? parts.map((p) => p.value as FitTarget) : (['page'] as FitTarget[])
    const style = (prop: StyleProp, value: string) => targets.forEach((target) => push({ op: 'style', target, prop, value }))
    const colour = colorOf(clause)
    const BUTTONS = /(?<![\p{L}\p{M}])(?:buttons?|btns?|बटन)(?![\p{L}\p{M}])/iu.test(clause)
    const HEADINGS = /(?<![\p{L}\p{M}])(?:headings?|headlines?|headers?\s+text|titles?|हेडिंग)(?![\p{L}\p{M}])/iu.test(clause)
    const TEXT = /(?<![\p{L}\p{M}])(?:body\s+text|paragraphs?|text|writing|likhai|font\s+colou?r|टेक्स्ट)(?![\p{L}\p{M}])/iu.test(clause)
    const ALONE = /(?<![\p{L}\p{M}])(?:only|just|sirf|keval|alone|alag|separately|akele|सिर्फ)(?![\p{L}\p{M}])/iu.test(clause)
    const valueTalk = quoted || /(?<![\p{L}])(?:likho|write|says?|naam|name|label)(?![\p{L}])|[:=]/iu.test(clause) || /\b(?:to|as)\s+[A-Z]/.test(clause)
    if (colour && !valueTalk && !re.remove.test(clause)) {
      // the colour of the buttons of one part, or "only the buttons" (else "the buttons blue" keeps meaning the main colour of the site, below)
      if (BUTTONS && (parts.length > 0 || ALONE) && !HEADINGS) {
        style('buttonColor', colour)
        return { ops, notes }
      }
      if ((HEADINGS || TEXT) && !BUTTONS) {
        if (HEADINGS) style('headingColor', colour)
        if (TEXT && !(HEADINGS && /(?<![\p{L}])(?:heading|title)s?\s+text(?![\p{L}])/iu.test(clause))) style('textColor', colour)
        return { ops, notes }
      }
    }
    // corners
    const sharp = /(?<![\p{L}\p{M}])(?:sharp|square|squared|boxy|flat|edgy|no\s+round(?:ed)?|na\s+gol|noki\w*|nuki\w*|nukeel\w*|नुकीले|नुकीला|नुकीली|चौकोर)(?![\p{L}\p{M}])/iu.test(clause)
    const round = /(?<![\p{L}\p{M}])(?:round(?:ed)?|pill|circular|curved|smooth\s+corners|gol|golai|गोल)(?![\p{L}\p{M}])/iu.test(clause)
    const cornerWord = /(?<![\p{L}\p{M}])(?:corners?|edges?|borders?|shape|buttons?|cards?|boxes|kone|कोने)(?![\p{L}\p{M}])/iu.test(clause)
    if ((sharp || round) && cornerWord && !valueTalk && !re.remove.test(clause) && !colorMentions(clause).length) {
      style('radius', sharp && !round ? 'square' : /pill/i.test(clause) || (BUTTONS && round) ? 'pill' : 'rounded')
      return { ops, notes }
    }
    if (/(?<![\p{L}])(?:default|normal|original|pehle jaise|reset)\s+(?:corners?|edges?|font|typeface|button\s+colou?r|heading\s+colou?r|text\s+colou?r)/iu.test(clause)) {
      const what = /font|typeface/i.test(clause) ? 'font' : /corner|edge/i.test(clause) ? 'radius' : /button/i.test(clause) ? 'buttonColor' : /heading/i.test(clause) ? 'headingColor' : 'textColor'
      style(what as StyleProp, 'default')
      return { ops, notes }
    }
    // the typeface
    if (/(?<![\p{L}])(?:fonts?|typeface|lettering|aksar|फॉन्ट)(?![\p{L}])/iu.test(clause) && !valueTalk && !colour) {
      const kinds: [RegExp, string][] = [
        [/(?<![\p{L}])(?:elegant|fancy|luxury|luxurious|wedding|calligraph\w*)(?![\p{L}])/iu, 'elegant'],
        [/(?<![\p{L}])(?:serif|classic|classical|traditional|newspaper|book)(?![\p{L}])/iu, 'serif'],
        [/(?<![\p{L}])(?:mono|monospace|typewriter|code|coding|retro)(?![\p{L}])/iu, 'mono'],
        [/(?<![\p{L}])(?:rounded|friendly|playful|cute|soft|kids|bubbly)(?![\p{L}])/iu, 'rounded'],
        [/(?<![\p{L}])(?:futuristic|tech|techy|display|sci-?fi|cyber|robotic)(?![\p{L}])/iu, 'display'],
        [/(?<![\p{L}])(?:sans|sans-serif|modern|clean|simple|plain|minimal)(?![\p{L}])/iu, 'sans'],
      ]
      const hit = kinds.find(([re2]) => re2.test(clause))
      if (hit) {
        push({ op: 'style', target: 'page', prop: 'font', value: hit[1] })
        return { ops, notes }
      }
    }
  }

  // parts with a colour of their own ("header red, footer green", "make the gallery dark") ─────────
  if (parts.length && !re.remove.test(clause) && !/(?<![\p{L}])(?:buttons?|links?|accent|font|text colou?r|btn)(?![\p{L}])/iu.test(clause)) {
    const colours = colorMentions(clause)
    const darkOnly = !colours.length && /(?<![\p{L}])(?:dark|andhera|andhere)(?![\p{L}])/iu.test(clause)
    const lightOnly = !colours.length && !darkOnly && /(?<![\p{L}])(?:light|halka|halki)(?![\p{L}])/iu.test(clause)
    if (!colours.length && !darkOnly && !lightOnly && /(?<![\p{L}])(?:normal|default|original|reset|pehle jaisa|wapas|sahi)(?![\p{L}])/iu.test(clause) && re.colorNoun.test(clause)) {
      for (const part of parts) push({ op: 'clearSectionColor', target: part.value })
      return { ops, notes }
    }
    if (colours.length || darkOnly || lightOnly) {
      const fallback = darkOnly ? '#111827' : '#f3f4f6'
      // each colour goes to the part it stands next to (after the part first: "header red footer green"); one colour for several parts means all of them
      const pairs = parts
        .flatMap((part) => colours.map((colour) => ({ part, colour, gap: colour.at >= part.end ? colour.at - part.end : part.at - colour.end + 0.5 })))
        .sort((x, y) => x.gap - y.gap)
      const given = new Map<Target, string>()
      const used = new Set<Mention<string>>()
      for (const { part, colour } of pairs) {
        if (given.has(part.value) || (used.has(colour) && colours.length >= parts.length)) continue
        given.set(part.value, colour.value)
        used.add(colour)
      }
      for (const part of parts) push({ op: 'sectionColor', target: part.value, hex: given.get(part.value) ?? (colours.length ? colours[0].value : fallback) })
      if (ops.length) return { ops, notes }
    }
  }

  // a colour that goes with the main one, or the second colour of the palette ─────────
  if (!colorMentions(clause).length || SECOND_RE.test(clause)) {
    const talk = re.colorNoun.test(clause) || /(?<![\p{L}])(?:buttons?|accent|links?|highlights?|brand)(?![\p{L}])/iu.test(clause)
    const kind = (['split', 'triadic', 'complementary', 'analogous'] as Harmony[]).find((k) => HARMONY_RE[k].test(clause))
    if (kind && talk && !SECOND_RE.test(clause)) {
      push({ op: 'harmony', kind })
      return { ops, notes }
    }
  }
  const second = SECOND_RE.test(clause) ? colorMentions(clause.replace(SECOND_RE, ' ')) : []
  if (second.length) {
    push({ op: 'alt', hex: second[0].value })
    return { ops, notes }
  }

  // colours ─────────
  const color = colorOf(clause)
  const AMBIGUOUS = /^(?:cool|soft|calm|bright|warm|subtle|dull|light|dark)$/i
  const makeish = re.colorNoun.test(clause) || /(?<![\p{L}])(?:make|more|thoda|kuch|karo|kar|chahiye|chaiye|want|need|rakho|banao|should|too|bit|little|bohot|bahut)(?![\p{L}])/iu.test(clause)
  const toneHits = TONES.filter((tone) => {
    const hit = TONE_RE[tone].exec(clause)
    return !!hit && (makeish || !AMBIGUOUS.test(hit[0]))
  })
  const sections = sectionsIn(clause)
  const designTalk = /(?<![\p{L}])(?:design|dizain|look|style)(?![\p{L}])/iu.test(clause)
  if (designTalk && !color && !sections.length) {
    const t = /(?<![\p{L}\p{M}])(?:halka|halki|light|lighter|हल्का)(?![\p{L}\p{M}])/iu.test(clause) ? 'normal' : TIER_RE.premium.test(clause) ? 'premium' : TIER_RE.normal.test(clause) ? 'normal' : TIER_RE.better.test(clause) ? 'better' : undefined
    if (t) {
      push({ op: 'tier', tier: t })
      return { ops, notes }
    }
  }
  const needsContext = !!color && riskyColor(clause) && !hexOf(clause)
  const talkContext = re.colorNoun.test(clause) || /(?<![\p{L}])(?:buttons?|links?|theme|accent|highlights?|header|navbar|brand|primary|main|btn|jaisa|jaisi|like|type|wala|wali|shade)(?![\p{L}])/iu.test(clause)
  // "surprise me": a fresh colour that fits
  if (/(?<![\p{L}])(?:surprise me|random colou?r|any colou?r|koi (?:bhi )?(?:naya )?(?:colou?r|rang)|naya (?:colou?r|rang)|nayi (?:colou?r|rang)|different colou?r|another colou?r|new colou?r|kuch naya colou?r|try (?:a |another )?(?:different )?colou?r|colou?r change karo|rang badlo|rang change karo)(?![\p{L}])/iu.test(clause) && !color) {
    push({ op: 'accent', hex: freshAccent() })
    notes.push('I picked a fresh colour for you. Say "another colour" for a different one, or "undo".')
    return { ops, notes }
  }
  const colorWanted = color && (!needsContext || talkContext) && (re.colorNoun.test(clause) || /(?<![\p{L}])(?:buttons?|links?|theme|accent|highlights?|header|navbar|brand|site|website|primary|main|everything|sab|pura|poora|btn)(?![\p{L}])/iu.test(clause) || !sections.length)
  if (colorWanted || (toneHits.length && !sections.length)) {
    if (colorWanted && color) push({ op: 'accent', hex: color })
    // "darker blue" is a colour; "darker colours" a tone. Words that already gave the colour do not count twice.
    for (const tone of toneHits) {
      if (color && /light|dark|deep|halka|gehra/i.test(tone) && /(?:dark|light|deep|halka|gehra|baby)\s+(?:blue|neela|nila)/i.test(clause)) continue
      push({ op: 'tone', tone })
    }
    if (ops.length) return { ops, notes }
  }

  // remove / add sections and pages ─────────
  if (sections.length) {
    const wantsOut = re.remove.test(clause) || re.negate.test(clause) || /(?<![\p{L}])(?:nahi|nhi|nai|mat)\s+(?:chahiye|chaiye|dikhao|dikha|rakho|chahiye)/iu.test(clause)
    const wantsIn = !wantsOut && (re.add.test(clause) || (!carry.verb && /(?<![\p{L}])(?:bhi|also|too)(?![\p{L}])/iu.test(clause)))
    const verb: 'remove' | 'add' | undefined = wantsOut ? 'remove' : wantsIn ? 'add' : carry.verb
    if (verb) {
      carry.verb = verb
      for (const key of sections) {
        if (key === 'contact' && verb === 'remove') {
          // it is their site: the contact part goes, and they are told what that means
          for (const op of sectionChange(key, verb, context)) push(op)
          notes.push('Removed the contact part. The phone and e-mail you gave still show in the footer; say "add contact" to bring it back.')
          continue
        }
        for (const op of sectionChange(key, verb, context)) push(op)
      }
      return { ops, notes }
    }
  }

  // design level ─────────
  const tier = designTalk && /(?<![\p{L}\p{M}])(?:halka|halki|light|lighter|हल्का)(?![\p{L}\p{M}])/iu.test(clause) ? 'normal' : TIER_RE.premium.test(clause) ? 'premium' : TIER_RE.normal.test(clause) ? 'normal' : TIER_RE.better.test(clause) ? 'better' : undefined
  if (tier && !sections.length && !(carry.last === 'motion' && wordCount(clause) <= 3)) {
    push({ op: 'tier', tier })
    return { ops, notes }
  }

  // "it is actually a restaurant" ─────────
  const explicit =
    clause.match(/business type\s+(?:galat hai|is wrong|wrong|badlo)?[,\s]*(.+?)(?:\s+(?:karo|kar do|banao|rakho))?$/i) ??
    clause.match(/(?:change|set|make|switch)\s+(?:the\s+)?(?:business|type)(?:\s+type)?\s+(?:to|as)\s+(?:a|an)?\s*(.+)/i) ??
    clause.match(/(?:i own|i run|i have|we own|we run|i'?m running|we'?re running)\s+(?:a|an)?\s*(.+)/i) ??
    clause.match(/should be for\s+(?:a|an|the)?\s*(.+)/i) ??
    clause.match(/mera business\s+(.+?)\s+(?:ka|ki)\s+(?:hai|he)/i) ??
    clause.match(/^(?:ye|yeh|yah)\s+(.+?)\s+(?:nahi|nhi)[,\s]+(.+?)\s+(?:hai|he)$/i)
  if (explicit) {
    const phrase = stripEnds(showQuotes(explicit[explicit.length - 1] ?? '', quotes)).replace(/^(?:a|an|the)\s+/i, '')
    if (phrase && wordCount(phrase) <= 6) {
      const decision = decideTheme(phrase)
      if (decision.source !== 'default') {
        push({ op: 'theme', theme: decision.theme as ThemeKey })
        return { ops, notes }
      }
    }
  }
  const biz =
    clause.match(/^(?:hum|main|mai|mein)\s+(.+?)\s+(?:hain|hoon|hu|hun)\b/i) ??
    clause.match(/^(.+?)\s+(?:hoon|hu|hun)\s+(?:main|mai)\b/i) ??
    clause.match(/(?:मेरा काम|मेरा बिज़नेस|हमारा काम)\s+(.+?)\s+(?:का|की)\s+है/u) ??
    clause.match(/(.+?)\s+(?:wala|wali)\s+(?:theme|look|style|design)/i) ??
    clause.match(/(?:we are|we're|i am|i'm|my business is|my shop is|our business is|our shop is|we run|i run|mera business|hamara business|meri shop|meri dukaan)\s+(?:a|an|the)?\s*(.+?)(?:\s*,|\s+and\s+|$)/i) ??
    clause.match(/(?:this is|it is|it'?s|its|this one is|actually|treat(?:\s+it)?(?:\s+as)?|consider(?:\s+it)?(?:\s+as)?|make it (?:a|an)|yeh|ye|yah|यह)\s+(?:a|an|ek|the)?\s*(.+?)(?:\s*,|\s+not\s+|\s+nahi\b|\s+nhi\b|\s+instead\b|\s+hai\b|\s+ki\s+(?:site|website)\b|\s+ka\s+(?:business|website|site)\b|\s+site\b|\s+website\b|\s+business\b|$)/i) ??
    clause.match(/^(.+?)\s+(?:ki|ka|ke)\s+(?:site|website|business)\s+(?:hai|he)\b/i) ??
    clause.match(/^(.+?)\s+(?:site|website|business|shop|dukaan)\s+(?:hai|he)$/i) ??
    clause.match(/^(.+?)\s+hai\s+(?:yeh|ye|yah)$/i)
  if (biz) {
    const phrase = stripEnds(showQuotes(biz[1], quotes))
    if (phrase && wordCount(phrase) <= 6) {
      const decision = decideTheme(phrase)
      const known = phrase.split(/\s+/).some((w) => isBusinessWord(w))
      if (decision.source !== 'default' && (known || decision.confidence >= 0.45)) {
        push({ op: 'theme', theme: decision.theme as ThemeKey })
        return { ops, notes }
      }
    }
  }
  return { ops, notes }
}

// ───────────── splitting a text into commands ─────────────
const STARTERS = [
  ...VERBS.remove,
  ...VERBS.add,
  ...VERBS.rename,
  ...VERBS.replace,
  'make', 'change', 'set', 'use', 'move', 'shift', 'align', 'right align', 'left align', 'center align', 'center', 'centre', 'increase', 'decrease', 'reduce', 'shrink', 'expand', 'shorten', 'widen', 'narrow', 'reset', 'restore', 'bring', 'put', 'send', 'badhao', 'ghatao', 'uski', 'iski', 'uska', 'iska', 'usko', 'isko', 'ise', 'उसे', 'इसे', 'उसकी', 'इसकी', 'height', 'width', 'phir', 'fir', 'then', 'switch', 'turn', 'update', 'edit', 'keep', 'give', 'let', 'also', 'dark', 'light', 'no', 'not', 'phone', 'email', 'address', 'call', 'write', 'treat', 'consider', 'this is', 'it is', 'its', 'डार्क', 'लाइट', 'मोड', 'headline', 'button', 'title', 'subtitle',
  ...Object.values(SECTION_TERMS).flat(),
  ...Object.values(TARGET_TERMS).flat(),
  ...Object.keys(COLOR_HEX),
  ...Object.values(TONE_TERMS).flat(),
  ...MOTION_TERMS.topic,
  ...COLOR_NOUNS,
  ...Object.values(TIER_TERMS).flat(),
]
const STARTER_RE = new RegExp(`^${wordRegex(longestFirst(STARTERS)).source}`, 'iu')
// words that begin a command whatever came before: verbs, the word "the colour", a field name
const STRONG = ['a bit', 'a little', 'bit', 'little', 'go', 'mode', 'tone', ...VERBS.remove, ...VERBS.add, ...VERBS.rename, ...VERBS.replace, 'make', 'change', 'set', 'use', 'move', 'shift', 'align', 'right align', 'left align', 'center align', 'center', 'centre', 'increase', 'decrease', 'reduce', 'shrink', 'expand', 'shorten', 'widen', 'narrow', 'reset', 'restore', 'bring', 'put', 'send', 'badhao', 'ghatao', 'uski', 'iski', 'uska', 'iska', 'usko', 'isko', 'ise', 'उसे', 'इसे', 'उसकी', 'इसकी', 'height', 'width', 'phir', 'fir', 'then', 'switch', 'turn', 'update', 'edit', 'keep', 'give', 'let', 'also', 'treat', 'consider', 'this is', 'it is', 'the', 'pls', 'please', 'plz', 'more', 'less', 'thoda', 'zyada', 'kam', ...COLOR_NOUNS, ...Object.values(FIELD_TERMS).flat(), ...MOTION_TERMS.topic, 'phone', 'email', 'address']
const STRONG_RE = new RegExp(`^${wordRegex(longestFirst(STRONG)).source}`, 'iu')
const FIELD_ANY = /(?<![\p{L}\p{M}])(?:title|heading|headline|subtitle|button)(?![\p{L}\p{M}])/iu
const VALUE_TALK = /(?<![\p{L}\p{M}])(?:rename|call|called|name|naam|replace|headline|heading|title|subtitle|tagline|button|address|pata|likho|write|text|ko|to|as)(?![\p{L}\p{M}])|[:=]/iu
const CONNECTOR = /\s*(?:;|,\s*(?:and|aur|और)\b|,|\band\b|\baur\b|और|\bor\b|&|\bthen\b|\bphir\b|\bfir\b|\balso\b|\bplus\b|\bsaath\b)\s*|\s+\+\s+|\n+/giu

function splitCommands(text: string): string[] {
  const parts: string[] = []
  let last = 0
  let m: RegExpExecArray | null
  CONNECTOR.lastIndex = 0
  while ((m = CONNECTOR.exec(text))) {
    const rest = text.slice(m.index + m[0].length)
    const head = rest.split(/\s+/).slice(0, 2).join(' ')
    const prefix = text.slice(last, m.index).trim()
    const inAddress = /(?<![\p{L}])(?:address|pata|location)(?![\p{L}])/iu.test(prefix) && /^,/.test(m[0].trim())
    // while a value is being given ("... to Salt and Pepper") only a real command word starts a new command, not a section or colour word
    const startsHere = STRONG_RE.test(head) || /^§\d+§\s+(?:ki jagah|ke badle|की जगह)/i.test(rest.split(/\s+/).slice(0, 3).join(' ')) || /^(?:dark|light|डार्क|लाइट)\s+(?:mode|theme|मोड|थीम)/iu.test(head) || (!VALUE_TALK.test(prefix) && STARTER_RE.test(head)) || (VALUE_TALK.test(prefix) && (FIELD_ANY.test(head) || (CLOSER_RE.test(prefix) && STARTER_RE.test(head))))
    if (rest && wordCount(prefix) >= 1 && startsHere && !/^bhi/i.test(m[0].trim()) && !inAddress) {
      parts.push(prefix)
      last = m.index + m[0].length
    }
  }
  parts.push(text.slice(last).trim())
  return parts.filter(Boolean)
}

// Typos in the command words ("renmae", "galery"): lower case words one edit away from a known command word are corrected.
// Words with a capital letter (names) and the text after "to", "as" or ":" (the new value) are left alone.
const KNOWN_BASE = ['center', 'centre', 'align', 'taller', 'wider', 'narrower', 'rename', 'remove', 'delete', 'replace', 'section', 'headline', 'subtitle', 'button', 'colour', 'color', 'change', 'premium', 'simpler', 'darker', 'lighter', 'warmer', 'cooler', 'create', 'website', 'light', 'bright']
const vocabulary = new Set<string>(KNOWN_BASE)
for (const list of [...Object.values(SECTION_TERMS), Object.keys(COLOR_HEX), ...Object.values(TONE_TERMS), MOTION_TERMS.topic, ...Object.values(TIER_TERMS), VERBS.remove, VERBS.add, VERBS.undo, VERBS.redo, VERBS.reset])
  for (const term of list) if (/^[a-z]{5,12}$/.test(term) && !RISKY_COLORS.has(term)) vocabulary.add(term)
const KNOWN = [...vocabulary]
// everyday words that are one letter away from a command word
const COMMON = new Set(['glass', 'glasses', 'right', 'rights', 'left', 'write', 'writes', 'store', 'stores', 'stone', 'those', 'three', 'other', 'there', 'where', 'which', 'shine', 'phone', 'plain', 'place', 'point', 'paint', 'print', 'quote', 'order', 'orders', 'items', 'teams', 'trial', 'brand', 'rates', 'prices', 'lower', 'power', 'fresh', 'order', 'house', 'horse', 'table', 'cable', 'water', 'later', 'under', 'every', 'above', 'while', 'never', 'where', 'shops', 'style', 'tales', 'tasks', 'class', 'clean', 'close', 'clear', 'coach'])

/** words the typo fixer must leave alone: "pehla" is not "peela" */
const ORDINAL_WORDS = new Set(['pehla', 'pehli', 'pehle', 'pahla', 'pahli', 'dusra', 'dusri', 'doosra', 'doosri', 'teesra', 'teesri', 'chautha', 'chauthi', 'aakhri', 'akhri', 'sawal', 'sawaal', 'jawab', 'jawaab', 'wali', 'wala', 'waali'])
const SHORT_TYPOS: Record<string, string> = { drak: 'dark', dakr: 'dark', udno: 'undo', unod: 'undo', rdeo: 'redo', lihgt: 'light', ligth: 'light', whtie: 'white', mneu: 'menu', blakc: 'black' }
function fixTypos(input: string): string {
  // the first word of a message may start with a capital letter ("Renmae it to ..."): it is a command word, not a name
  const text = input.replace(/^[A-Z][a-z]{4,11}(?=\s)/, (w) => {
    const lower = w.toLowerCase()
    return vocabulary.has(lower) || COMMON.has(lower) ? w : KNOWN.some((k) => near(lower, k) && k + 's' !== lower && lower + 's' !== k) ? lower : w
  })
  const boundary = text.search(/\s(?:to|as|ko)\s|:/i)
  const head = boundary < 0 ? text : text.slice(0, boundary)
  const tail = boundary < 0 ? '' : text.slice(boundary)
  const fixed = head.replace(/(?<![\p{L}§@.])[a-z]{4,5}(?![\p{L}§@.])/gu, (w) => SHORT_TYPOS[w] ?? w).replace(/(?<![\p{L}§@.])[a-z]{5,12}(?![\p{L}§@.])/gu, (word) => (vocabulary.has(word) || COMMON.has(word) || ORDINAL_WORDS.has(word) ? word : KNOWN.find((k) => near(word, k) && k + 's' !== word && word + 's' !== k && k + 'er' !== word && k + 'ing' !== word) ?? word))
  return fixed + tail
}

const PRONOUN = /(?<![\p{L}])(?:it|this|that|isko|isse|ise|iska|iski|usko|isme|yeh|yah|ye|woh|wo)(?![\p{L}])/iu

/** Reads one message. `context` says whether the site has pages ("multi") or is one long page ("single"). */
export function parseEdit(input: string, context: EditContext = 'single', last?: { target?: string; /** the site on the screen has several pages (also a site made from the stored components, whose parts are on pages without being "multi" for the editor) */ pages?: boolean; /** the site is made from the stored components: its pages are made of its parts */ library?: boolean; /** the page on the screen: a named item ("the cookies service") is looked for in it */ page?: PageFacts }): Understood {
  const raw = input.replace(/\s+/g, ' ').trim()
  if (!raw) return { kind: 'none', reason: 'Nothing was typed.' }
  const hidden = hideQuotes(raw)
  hidden.text = fixTypos(hidden.text)
  const plain = showQuotes(hidden.text, hidden.quotes)

  const control = controlOf(plain)
  if (control) return { kind: 'control', control }
  if (isNewSite(plain)) return { kind: 'newSite' }

  // a page of the dashboard: "dashboard se Billing hatao", "dashboard me Reports page add karo", "dashboard me Patients ko Clients naam do", "Patients table me Age column jodo"
  if (/(?<![\p{L}])(?:dashboard|sidebar|admin\s+panel|user\s+panel|member\s+area)(?![\p{L}])/iu.test(plain) || /(?<![\p{L}])column(?![\p{L}])/iu.test(plain)) {
    const q = plain.match(/["“”'‘’]([^"“”'‘’]{2,40})["“”'‘’]/)?.[1]
    const word = '([A-Za-z][A-Za-z0-9 &-]{1,28}?)'
    const IN = '(?:me|mein|mai|in|ke\\s+andar)'
    const colA = plain.match(new RegExp(`${word}\\s+(?:(?:table|page|list)\\s+)?${IN}\\s+${word}\\s+(?:column|kolam)\\s*(?:jodo|jod|add|daalo|dalo|lagao|banao)?`, 'iu'))
    const colB = plain.match(new RegExp(`${word}\\s+(?:(?:table|page|list)\\s+)?${IN}\\s+(?:column|kolam)\\s+${word}\\s*(?:jodo|jod|add|daalo|dalo|lagao|banao)`, 'iu'))
    const colC = plain.match(new RegExp(`(?:add|jodo|jod|daalo)\\s+(?:a\\s+)?(?:column|kolam)\\s+${word}\\s+(?:to|in|into)\\s+(?:the\\s+)?${word}(?:\\s+(?:table|page))?\\s*$`, 'iu'))
    const col = colB ? [colB[1], colB[2]] : colA ? [colA[1], colA[2]] : colC ? [colC[2], colC[1]] : null
    const noun = '(?:dashboard|sidebar|panel|member\\s+area|app)'
    const rem = plain.match(new RegExp(`(?:${noun}\\s+(?:se|mein\\s+se|me\\s+se|from)\\s+(?:the\\s+)?${word}\\s+(?:page\\s+|tab\\s+|menu\\s+)?(?:ko\\s+)?(?:hatao|hata\\s+do|remove|delete|nikalo))|(?:remove|delete|hatao)\\s+(?:the\\s+)?${word}\\s+(?:page|tab|menu)?\\s*(?:from|se)\\s+(?:the\\s+)?${noun}`, 'iu'))
    const add = plain.match(new RegExp(`${noun}\\s+(?:me|mein|mai|mein|ke\\s+andar|mai)\\s+${word}\\s+(?:page|tab|section)\\s+(?:add|jodo|jod|daalo|banao|lagao)|(?:add|create|jodo)\\s+(?:a\\s+|an\\s+)?${word}\\s+(?:page|tab)\\s+(?:to|in|into)\\s+(?:the\\s+)?${noun}`, 'iu'))
    const ren = plain.match(new RegExp(`${noun}\\s+(?:me|mein|mai|mein|ke\\s+andar)\\s+${word}\\s+(?:ko|ka\\s+naam)\\s+${word}\\s+(?:naam\\s+do|karo|kar\\s+do|rakho|badlo)|rename\\s+(?:the\\s+)?${word}\\s+(?:page|tab)?\\s*(?:to|as)\\s+${word}\\s*(?:in|on)\\s+(?:the\\s+)?${noun}`, 'iu'))
    const first = (m: RegExpMatchArray | null) => (m ? m.slice(1).filter(Boolean).map((x) => x.trim()) : [])
    const clean = (x: string) => x.replace(/\s+(?:page|tab|menu)$/i, '').trim()
    if (col) {
      const page = clean(col[0])
      const to = clean(col[1])
      // "... column Age jodo, type number" / "Due column as date": the kind of the column, when it was said
      const said = plain.match(/(?<![\p{L}])(?:type|as|ka\s+type|wala)\s+(date|number|money|amount|status|text)(?![\p{L}])/iu)?.[1]?.toLowerCase()
      const type = said === 'amount' ? 'money' : said
      if (to && page) return { kind: 'ops', ops: [{ op: 'appPage', action: 'column', page, to: type ? `${to}::${type}` : to }], notes: [] }
    }
    if (rem) return { kind: 'ops', ops: [{ op: 'appPage', action: 'remove', page: clean(q ?? first(rem)[0]) }], notes: [] }
    if (add) return { kind: 'ops', ops: [{ op: 'appPage', action: 'add', page: clean(q ?? first(add)[0]) }], notes: [] }
    if (ren) {
      const names = first(ren)
      if (names.length >= 2) return { kind: 'ops', ops: [{ op: 'appPage', action: 'rename', page: clean(names[0]), to: clean(names[1]) }], notes: [] }
    }
  }

  // "login aur dashboard add karo", "add register page", "remove the dashboard": the demo app of the site (log in, register, a dashboard with example data)
  const appWord = /(?<![\p{L}])(?:log\s*-?\s*in|login|sign\s*-?\s*in|signin|register|sign\s*-?\s*up|signup|dashboard|member\s+area|user\s+panel|admin\s+panel|customer\s+portal|client\s+portal)(?![\p{L}])/iu.test(plain)
  if (appWord && !/(?<![\p{L}])(?:button|link|colou?r|font|size|heading|title|text|form\s+field|newsletter|subscribe|subscription|mailing|waitlist|updates)(?![\p{L}])/iu.test(plain)) {
    if (/(?<![\p{L}])(?:hatao|hata|remove|delete|nikalo|nikal|band\s+karo|without|mat|bina|no\s+need)(?![\p{L}])/iu.test(plain)) return { kind: 'ops', ops: [{ op: 'app', on: false }], notes: [] }
    if (/(?<![\p{L}])(?:add|lagao|laga|jodo|jod|chahiye|chahie|chaiye|banao|bana|daalo|dalo|include|want|need|with|ke\s+saath|saath|enable|on)(?![\p{L}])/iu.test(plain)) return { kind: 'ops', ops: [{ op: 'app', on: true }], notes: ['A demo login, a register page and a dashboard with example data are added (no backend: the accounts and the rows stay in the browser). Open the site and press "Log in" in the menu.'] }
  }

  // "website ko light mode me karo", "dark theme on": only this, nothing else is asked
  const modeOnly = /(?<![\p{L}])(light|dark)\s+(?:mode|theme)(?![\p{L}])/iu.exec(plain)
  if (modeOnly) {
    const left = plain.replace(modeOnly[0], ' ').toLowerCase().split(/[^\p{L}]+/u).filter((w) => w && !/^(?:website|site|page|ko|ka|ki|ke|me|mein|mai|on|off|karo|kar|do|de|lagao|laga|rakho|rakh|chalu|enable|set|use|switch|change|badlo|badal|the|a|my|please|ye|yeh|isko|it|to|into|in)$/.test(w))
    if (!left.length) return { kind: 'ops', ops: [{ op: 'mode', mode: /dark/i.test(modeOnly[1]) ? 'dark' : 'light' }], notes: [] }
  }

  // a text was given for a part ("title chhota aur catchy chahiye: Cakes Made Fresh", "hero me 'Celebrate With Us' likhna hai"): that is the change, not the words around it
  const given = splitCommands(hidden.text).length === 1 ? textOpsOf(raw) : undefined
  if (given && /["“”‘’`]|:/.test(raw)) return { kind: 'ops', ops: given.ops, notes: given.notes }

  // one page or several ("multiple page me convert karo", "add about page and contact page"): the whole message is about the pages
  const pages = pagesOps(plain, last?.pages ? 'multi' : context, !!last?.library)
  if (pages) {
    const more = pages.rest ? parseEdit(pages.rest, context, last) : undefined
    return { kind: 'ops', ops: [...pages.ops, ...(more?.kind === 'ops' ? more.ops : [])], notes: [...pages.notes, ...(more?.kind === 'ops' ? more.notes : [])] }
  }

  // the working parts (booking form, map, WhatsApp button, UPI button, countdown ...): what is about them is read here, the rest of the message goes on as usual
  const widgets = widgetOps(plain)
  if (widgets) {
    const more = widgets.rest ? parseEdit(widgets.rest, context, last) : undefined
    const moreOps = more?.kind === 'ops' ? more.ops : []
    const moreNotes = more?.kind === 'ops' ? more.notes : []
    return { kind: 'ops', ops: [...widgets.ops, ...moreOps], notes: [...widgets.notes, ...moreNotes] }
  }

  // one item inside a list of the page ("cookies wali service hata do", "2nd step ka title X", "FAQ me sawal jodo: ..."): before the section words are read, which would take the whole part
  const clausesOf = splitCommands(hidden.text)
  const payloadAdd = /[:"“”]/.test(raw) && /(?:faq|question|sawal|testimonial|review|step|stat)/i.test(raw)
  if (clausesOf.length === 1 || payloadAdd) {
    const itemChange = itemOps(raw, last?.page)
    if (itemChange) return { kind: 'ops', ops: itemChange.ops, notes: itemChange.notes }
  }

  // a list with commas ("services: haircut 300, facial 800") must not be cut into commands
  const listed = parseServices(plain) ?? parseServices(plain.replace(/^(?:add|jodo|rakho|put|daalo)\s+\d*\s*(?:new\s+)?(?=services?\b)/i, ''))
  if (listed) return { kind: 'ops', ops: [{ op: 'services', items: listed }], notes: [] }
  const hoursText = parseHoursText(plain)
  if (hoursText) return { kind: 'ops', ops: [{ op: 'contact', field: 'hours', value: hoursText }], notes: [] }

  // one style request (a size, corners, "cookie banner hatao"): read as typed, before the typo fixer turns "spacing" into "pricing"
  if (splitCommands(hidden.text).length === 1) {
    const early = styleOps(raw)
    if (early) return { kind: 'ops', ops: early.ops.flatMap((o) => (cleanOp(o) ? [cleanOp(o) as EditOp] : [])), notes: early.notes }
  }
  const ops: EditOp[] = []
  const notes: string[] = []
  const carry: { verb?: 'remove' | 'add'; last?: string; target?: string } = {}
  const commands = splitCommands(hidden.text)
  const results: ClauseResult[] = []
  for (const command of commands) {
    // one item inside a list ("cookies wali service hata do") in a message of several requests
    const inItem = commands.length > 1 ? itemOps(showQuotes(command, hidden.quotes), last?.page) : undefined
    const result = inItem ?? clauseOps(command, context, hidden.quotes, carry)
    carry.last = result.ops.at(-1)?.op
    for (const o of result.ops) {
      const t = 'section' in o ? o.section : 'page' in o ? (o.page === 'services' ? 'features' : o.page) : 'target' in o ? o.target : undefined
      if (typeof t === 'string' && t !== 'page') carry.target = t
    }
    results.push(result)
  }
  // "gallery aur faq hatao": the verb belongs to every section of the list, not only to the last one
  for (let i = results.length - 2; i >= 0; i -= 1) {
    const next = results[i + 1].ops[0]
    if (results[i].ops.length || results[i].notes.length || !next || (next.op !== 'remove' && next.op !== 'add')) continue
    const named = sectionsIn(commands[i])
    // only the names of sections stand there (no other words but "and")
    if (!named.length || commands[i].split(/[\s,&]+/).filter(Boolean).length > named.length * 3) continue
    const verb = next.op
    results[i] = { ops: named.flatMap((key) => sectionChange(key, verb, context)), notes: [] }
  }
  for (const result of results) {
    ops.push(...result.ops)
    notes.push(...result.notes)
  }
  if (!ops.length && !notes.length && splitCommands(hidden.text).length > 1) {
    // the pieces made no sense alone ("too much movement, calm it down"): read the text as one command
    const whole = clauseOps(hidden.text, context, hidden.quotes, {})
    ops.push(...whole.ops)
    notes.push(...whole.notes)
  }
  const seen = new Set<string>()
  const unique = ops.filter((op) => !seen.has(JSON.stringify(op)) && !!seen.add(JSON.stringify(op)))
  ops.length = 0
  ops.push(...unique)
  // "mujhe hero me 'Celebrate With Us' likhna hai", "about ka heading Our Story rakho": a single text of the page
  if (!ops.length && notes.every((n) => /did not change the text/.test(n))) {
    const said = textOpsOf(plain)
    if (said) { notes.length = 0; ops.push(...said.ops) }
  }
  // "bold aur modern lagna chahiye", "I want it to feel calm": a wish about the look, said without a command word
  if (!ops.length && !notes.length) {
    const wish = /(?<![\p{L}])(?:chahiye|chaiye|chahta|chahti|lagna|lage|lagni|dikhna|dikhe|dikhni|feel|look|looking|vibe|style)(?![\p{L}])/iu.test(plain)
    const adj = plain.toLowerCase().match(/(?<![\p{L}])(bold|modern|minimal|minimalist|elegant|classy|luxury|luxurious|playful|fun|calm|soft|clean|simple|professional|serious|colourful|colorful|vibrant|premium|fancy|dark|light|warm|cool|rich|sleek|rustic|vintage|retro|trendy|stylish)(?![\p{L}])/gu)
    if (wish && adj?.length) {
      // one word at a time: "make it bold and modern" is read as a whole by nobody, "make it bold" and "make it modern" are
      const got = [...new Set(adj)].map((a) => parseEdit(`make it ${a}`, context)).flatMap((r) => (r.kind === 'ops' ? r.ops : []))
      const seenLook = new Set<string>()
      const looks = got.filter((o) => !seenLook.has(o.op) && !!seenLook.add(o.op))
      if (looks.length) return { kind: 'ops', ops: looks, notes: [] }
    }
  }
  if (!ops.length && !notes.length) {
    const note = unsupportedNote(plain)
    if (note) notes.push(note)
  }
  // "make it bigger", "isko hata do": nothing was named, so it is the part the last change was about
  if (!ops.length && !notes.length && last?.target && PRONOUN.test(plain)) {
    const again = parseEdit(plain.replace(PRONOUN, `the ${last.target}`), context)
    if (again.kind === 'ops' && again.ops.length) return again
  }
  if (!ops.length) return notes.length ? { kind: 'ops', ops, notes } : { kind: 'none', reason: 'I could not find a change in that. Try, for example: "remove the FAQ", "rename it to Green Leaf" or "make the buttons blue".' }
  return { kind: 'ops', ops, notes }
}

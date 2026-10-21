// Everyday requests the other readers get wrong or miss: "subtitle badlo: ...", "swap about and services", "another colour", "make this site for a restaurant",
// and the things this editor cannot do (fonts, text size, logo ...), which are answered honestly instead of silently doing something else.
import { decideTheme, isBusinessWord } from '../themeClassifier'
import type { ThemeKey } from '../themes'
import { AMBIGUOUS_MOOD_WORDS, MOODS, moodFromText } from '../moods'
import type { EditOp } from './edits'
import { styleOps } from './styleParse'

export type ExtraResult = { ops: EditOp[]; notes: string[] } | undefined

const L = (re: string) => new RegExp(`(?<![\\p{L}\\p{M}])(?:${re})(?![\\p{L}\\p{M}])`, 'iu')
const SIZE_WORDS = 'bada|badi|bade|chhota|chhoti|chhote|bigger|larger|smaller|big|small|badha|badhao|ghatao|increase|decrease|zyada|kam'

const UNSUPPORTED: { when: RegExp; note: string }[] = [
  { when: /(?<![\p{L}\p{M}])(?:फॉन्ट|फ़ॉन्ट|अक्षर|टेक्स्ट)\s+(?:का\s+)?(?:साइज़|साइज|आकार)?\s*(?:बड़ा|बड़ी|बड़े|छोटा|छोटी|छोटे|कम|ज्यादा|ज़्यादा)/iu, note: 'I cannot change the size of the text yet. I can change its words, its colours and the height and width of a section.' },
  { when: new RegExp(`(?<![\\p{L}])(?:text|writing|likhai|akshar|letters|font)\\s*(?:size|ka size)?\\s*(?:ko\\s+)?(?:${SIZE_WORDS})`, 'iu'), note: 'I cannot change the size of the text yet. I can change its words, its colours and the height and width of a section.' },
  { when: L('logo|लोगो'), note: 'I cannot upload a logo yet. The name of the business is shown as the logo: say "rename it to ...".' },
  { when: L('sticky|fixed\\s+(?:header|navbar|menu)'), note: 'The menu bar of the page is already fixed at the top while scrolling where the layout allows it; I cannot switch that on or off.' },
  { when: L('translate|language|bhasha|hindi\\s+(?:me|mein)\\s+(?:karo|banao)|bhasha\\s+(?:badlo|change)'), note: 'I cannot translate the website yet. Describe the business in the language you want in the first box and generate again.' },
  { when: L('copyright|all rights reserved'), note: 'The copyright line follows the name of the business: say "rename it to ..." to change it.' },
  { when: L('rupees?|rupaye|dollars?|currency|\\$|₹'), note: 'The currency follows the place named in your description (for example "in Pune" gives rupees). Generate again with the place in the text.' },
  { when: L('background\\s+(?:image|photo|picture)|bg\\s+image'), note: 'Pictures are added in "Real photos" (draw scenes with the image AI, search photos or upload your own).' },
]

/** an honest answer for a request this editor cannot do (used when nothing else understood the message) */
export function unsupportedNote(text: string): string | undefined {
  const t = text.trim().normalize('NFC')
  return UNSUPPORTED.find(({ when }) => when.test(t))?.note
}

const randomHex = () => {
  const h = Math.random() * 360
  const a = 0.7 * Math.min(0.45, 1 - 0.45)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return Math.round((0.45 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

const STYLE_WORD = /(?<![\p{L}\p{M}])(?:style|look|theme|mood|vibe|design|feel|aesthetic|स्टाइल|लुक|थीम)(?![\p{L}\p{M}])/iu
const MAKE_WORD = /(?<![\p{L}\p{M}])(?:make|set|change|switch|use|give|apply|want|need|try|turn|go|banao|bana|karo|kar|rakho|chahiye|lagao|do|dikhao|चाहिए|करो|कर)(?![\p{L}\p{M}])/iu

/** "make it cyberpunk", "retro look do", "neumorphism style", "back to the normal look" */
function moodEdit(text: string): EditOp | undefined {
  if (/(?<![\p{L}])(?:default|original|normal|usual|pehle\s+jaisa|pehle\s+wala|business)\s+(?:style|look|design|mood|theme)\b|(?:style|look|mood)\s+(?:reset|hata|hatao|remove)/iu.test(text) && !/colou?r|rang/i.test(text)) return { op: 'mood', mood: 'none' }
  const mood = moodFromText(text)
  if (!mood) return undefined
  const styled = STYLE_WORD.test(text)
  const hit = mood.keywords.find((k) => new RegExp(`(?<![\\p{L}])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'iu').test(text)) ?? ''
  const ambiguous = AMBIGUOUS_MOOD_WORDS.has(hit.toLowerCase())
  // a distinctive word with a request is enough; a word that means other things needs "style" / "look" / "mood" with it
  // "luxury" alone is a request for the premium design level (the older rule); "luxe", "dark luxury" or "high-end" ask for the mood
  if (mood.id === 'luxe-dark' && hit.toLowerCase() === 'luxury' && !/dark|luxe/i.test(text)) return undefined
  const words = text.split(/\s+/).length
  // a part of the page is not a whole look ("make the buttons glass")
  if (/(?<![\p{L}])(?:buttons?|headings?|text|navbar|header|footer|logo|images?|cards?|section|colou?rs?)(?![\p{L}])/iu.test(text)) return undefined
  if (ambiguous ? styled && (MAKE_WORD.test(text) || words <= 4) : styled || MAKE_WORD.test(text) || words <= 3) {
    // a whole new site or a business description is not a change of look
    if (text.split(/\s+/).length > 9) return undefined
    return { op: 'mood', mood: mood.id }
  }
  return undefined
}

export function extraOps(clause: string): ExtraResult {
  const text = clause.trim().normalize('NFC')
  if (!text) return undefined

  // sizes, corners, menu place, pictures, things that do not exist: read first (the words of these requests look like new texts to the readers below)
  const style = styleOps(text)
  if (style) return style

  // "mood badlo", "kuch alag style try karo", "show me another look": a different mood
  if (/(?<![\p{L}])(?:mood|style|look|vibe|theme|design|स्टाइल|लुक)\s+(?:change|badlo|badal|alag|naya|nayi|different|another|new|dusra|doosra)|(?:alag|naya|nayi|different|another|new|dusra|doosra|kuch\s+aur)\s+(?:mood|style|look|vibe|design|स्टाइल|लुक)|change\s+(?:the\s+)?(?:mood|style|look|vibe)|मूड\s+बदलो|स्टाइल\s+बदलो|लुक\s+बदलो/iu.test(text) && !/colou?r|rang|रंग|font|corner|button/i.test(text) && text.split(/\s+/).length <= 7) {
    const ids = MOODS.map((m) => m.id)
    return { ops: [{ op: 'mood', mood: ids[Math.floor(Math.random() * ids.length)] }], notes: [] }
  }

  const moodOp = moodEdit(text)
  if (moodOp) return { ops: [moodOp], notes: [] }

  // "subtitle badlo: Fresh sweets daily"
  const sub = text.match(/^(?:hero\s+)?(?:sub\s*title|sub\s*heading|tagline)\s+(?:ko\s+|ka\s+)?(?:badlo|badal\s+do|change|set|likho|update)\s*[:=-]\s*(.+)$/i)
  if (sub && sub[1].trim().length >= 2) return { ops: [{ op: 'text', field: 'heroSubtitle', text: sub[1].trim() }], notes: [] }

  // "hero image bigger"
  if (new RegExp(`(?<![\\p{L}])(?:hero|first\\s+screen)\\s+(?:image|photo|picture)\\b.*(?:${SIZE_WORDS})`, 'iu').test(text)) {
    const less = /(?:chhot|small|ghata|decrease|kam)/i.test(text)
    return { ops: [{ op: 'size', target: 'hero', axis: 'height', factor: less ? 0.7 : 1.3 }], notes: [] }
  }

  // "services ke naam change karo" with no new name
  if (/(?<![\p{L}])(?:naam|name|heading|title)\s+(?:change|badlo|badal)\s*(?:karo|kar\s+do|do)?\s*$/iu.test(text) && !/(?:\bto\b|:|§)/.test(text) && !/(?:business|brand|website|site)/i.test(text))
    return { ops: [], notes: ['Tell me the new name too, for example: "services ka naam Our Menu rakho".'] }

  // swap
  if (/(?<![\p{L}])(?:swap|exchange|interchange)\s+(?:the\s+)?[\p{L}\s]+?\s+(?:and|with|aur)\s+/iu.test(text) && !/§|['"]/.test(text) && !/\bfor\b/i.test(text)) return { ops: [], notes: ['I cannot swap two parts in one go. Move one of them: "move about below services".'] }

  // "make this website for a restaurant"
  const biz = text.match(/^(?:is\s+|iss\s+|this\s+)?(?:website|site)\s+ko\s+(.+?)\s+ke\s+liye\s+(?:badlo|badal\s+do|karo|kar\s+do|bana\s+do)$/i) ?? text.match(/^(?:make|change|turn)\s+(?:this|the)\s+(?:website|site)\s+(?:for|into)\s+(?:a\s+|an\s+)?(.+)$/i) ?? text.match(/^(?:is\s+|iss\s+|this\s+)?(?:website|site)\s+ko\s+(?:ek\s+)?(.+?)\s+(?:bana\s+do|banao|bana\s+de|banado|karo|kar\s+do)$/i)
  if (biz) {
    const value = biz[1].trim()
    const decision = decideTheme(value)
    const known = value.split(/\s+/).some((w) => isBusinessWord(w))
    if (decision.source !== 'default' && (known || decision.confidence >= 0.4)) return { ops: [{ op: 'theme', theme: decision.theme as ThemeKey }], notes: [] }
  }

  // another colour: a fresh one
  if (/(?<![\p{L}])(?:kuch\s+)?(?:aur|dusra|doosra|alag|naya|nayi|different|another|new|other|some other)\s+(?:colou?rs?|rang)(?:\s+(?:try|lagao|karo|dikhao|do|please|kar\s+do|chahiye|chaiye|rakho|banao|dedo|de\s+do|laga\s+do|दो|चाहिए|करो))*\s*$/iu.test(text) || /^(?:colou?r|rang)\s+(?:change|badlo|badal)(?:\s+karo|\s+kar\s+do)?\s*$/iu.test(text))
    return { ops: [{ op: 'accent', hex: randomHex() }], notes: ['I picked a fresh colour for you. Say "another colour" for a different one, or "undo".'] }

  return undefined
}

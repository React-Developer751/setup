// Reads the layout commands: the name of a section ("rename pricing to Our Plans", "pricing ka naam Rates karo"), its place ("move FAQ above pricing",
// "gallery ko sabse neeche karo"), its size ("make the pricing section shorter", "width kam karo", "height 500px") and its alignment ("center the heading").
// understand.ts calls this for every command before the older readers.
import type { EditOp, FitTarget, Move, NavPage, SectionKey, TitleSection } from './edits'
import { TITLE_SECTIONS } from './edits'
import { PAGE_OF_SECTION, SECTION_TERMS, TARGET_TERMS, wordRegex } from './lexicon'

export type Mention = { value: string; at: number; end: number }

const w = (terms: string[]) => wordRegex([...terms.map((t) => t.normalize('NFC'))].sort((a, b) => b.length - a.length))
const has = (re: RegExp, text: string) => re.test(text)

const NAV_WORDS = w(['menu', 'navbar', 'nav bar', 'nav', 'navigation', 'tab', 'tabs', 'link', 'links', 'menubar', 'menu bar', 'top menu', 'मेन्यू', 'नेवबार'])
const PAGE_WORD = w(['page', 'pages', 'पेज'])
const HEADING_WORD = w(['title', 'heading', 'headline', 'name', 'naam', 'nam', 'label', 'caption', 'शीर्षक', 'नाम', 'हेडिंग', 'टाइटल'])

const SECTION_RE = Object.fromEntries(Object.entries(SECTION_TERMS).map(([k, terms]) => [k, w(terms)])) as Record<SectionKey, RegExp>
const TARGET_RE = Object.fromEntries(Object.entries(TARGET_TERMS).map(([k, terms]) => [k, w(terms)])) as Record<'header' | 'hero' | 'footer', RegExp>
const HOME_RE = w(['home', 'homepage', 'home page', 'main page', 'होम'])
const PAGE_ALL_RE = w(['whole page', 'whole site', 'whole website', 'entire page', 'entire site', 'entire website', 'every section', 'all sections', 'all the sections', 'everything', 'every page', 'poori website', 'puri website', 'pura page', 'poora page', 'pura site', 'poori site', 'sab sections', 'sare sections', 'saare sections', 'sabhi sections', 'sab kuch', 'whole thing', 'full page', 'full site', 'overall', 'पूरी वेबसाइट', 'सारे सेक्शन', 'सब कुछ'])

/** the parts and sections named in a text, in the order written (a longer name wins over a shorter one inside it) */
export function mentions(text: string, skipNav = false): Mention[] {
  const found: Mention[] = []
  const add = (value: string, m: RegExpExecArray | null) => {
    if (m && !found.some((f) => m.index < f.end && f.at < m.index + m[0].length)) found.push({ value, at: m.index, end: m.index + m[0].length })
  }
  for (const key of ['header', 'hero', 'footer'] as const) add(key, TARGET_RE[key].exec(text))
  for (const key of Object.keys(SECTION_RE) as SectionKey[]) {
    const re = SECTION_RE[key]
    const all = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
    let m: RegExpExecArray | null
    while ((m = all.exec(text))) {
      // "menu" as the navigation ("in the menu") is not the services section
      if (skipNav && key === 'features' && /^menu$/i.test(m[0])) continue
      add(key, m)
      break
    }
  }
  return found.sort((a, b) => a.at - b.at)
}

const pageOf = (section: string): NavPage | undefined => (section === 'contact' ? 'contact' : (PAGE_OF_SECTION as Record<string, NavPage | undefined>)[section])

// ───────────── the new name ─────────────
const TRAIL = /\s+(?:rakhna|rakho|rakh do|rakhiye|karo|kar do|kardo|kijiye|likho|likh do|do|de do|dedo|please|plz|pls|रखो|करो|कर दो|लिखो|दो)\s*$/
const LEAD = /^(?:the\s+)?(?:(?:to\s+)?(?:say|read|be|show|become)\s+|(?:name|title|heading)\s+)/i
const NAV_PHRASE = /(?:\b(?:in|on|at|from)\s+(?:the\s+)?(?:top\s+)?(?<nav>menu\s*bar|menu|navbar|nav\s*bar|nav|navigation)(?![\p{L}\p{M}])(?:\s+(?:link|links|tab|tabs|label|item|entry))?)|(?:^|\s)(?:menu\s*bar|menu|navbar|nav\s*bar|nav|navigation|मेन्यू|नेवबार)\s+(?:me|mein|mai|men|में|ke\s+andar)(?![\p{L}\p{M}])|(?:^|\s)(?:मेन्यू|नेवबार)(?![\p{L}\p{M}])|(?:^|\s)(?:menu|navbar|nav)\s*:/giu
/** the text after "to", "as", a colon or the Hindi markers; quotes win */
function newName(clause: string, quotes: string[], from = 0): string | undefined {
  const rest = clause.slice(from).replace(NAV_PHRASE, ' ').replace(/\s+/g, ' ')
  const q = rest.match(/§(\d+)§/)
  if (q) return quotes[Number(q[1])]
  const m =
    rest.match(/\bko\s+(.+?)\s+(?:naam|name)\s+(?:do|de do|dedo|rakho|rakh do)\s*$/i) ??
    rest.match(/\bko\s+(.+?)\s+(?:karo|kar do|kardo|rakho|likho|rakh do)\s*$/i) ??
    rest.match(/[:=]\s*(.+)$/) ??
    rest.match(/(?:^|\s)(?:should\s+(?:be|say|read)|will\s+be|must\s+be)\s+(.+)$/i) ??
    rest.match(/(?:^|\s)(?:to|as|into)\s+(?!action\b)(.+)$/) ??
    rest.match(/(?:naam|nam|title|heading|name|label|नाम|शीर्षक|टाइटल|हेडिंग)\s*(?:badal\s*(?:ke|kar|do)|badalkar|change\s*(?:karke|kar ke|to)|se|ko|ka|ki|ke|का|की|के|को|is|hai)?\s+(.+)$/iu) ??
    rest.match(/(?:^|\s)(?:ko|को)\s+(.+)$/iu)
  if (!m) return undefined
  const value = m[1].trim().replace(TRAIL, '').replace(LEAD, '').replace(TRAIL, '').replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, '').trim()
  return value.length >= 2 ? value : undefined
}

// ───────────── sizes ─────────────
const HEIGHT_WORDS = w(['height', 'tall', 'taller', 'short', 'shorter', 'lambai', 'lamba', 'lambi', 'ooncha', 'uncha', 'oonchai', 'padding', 'spacing', 'gap', 'gaps', 'space', 'vertical', 'ऊंचाई', 'ऊँचाई', 'लंबाई', 'tight', 'tighter', 'compact', 'पैडिंग', 'स्पेसिंग', 'roomy', 'roomier', 'breathing room', 'upar neeche ki jagah'])
const WIDTH_WORDS = w(['width', 'wide', 'wider', 'narrow', 'narrower', 'chaurai', 'chauda', 'chaudai', 'chaudi', 'patla', 'patli', 'patle', 'container', 'चौड़ाई', 'चौड़ा', 'चौड़ी', 'horizontal', 'side margins', 'पतला', 'पतली', 'पतले', 'patle', 'चौड़ा', 'चौड़ी'])
const LESS = w(['less', 'lesser', 'kam', 'km', 'smaller', 'small', 'shorter', 'short', 'narrower', 'narrow', 'reduce', 'reduced', 'decrease', 'shrink', 'tighten', 'tighter', 'compact', 'chhota', 'chhoti', 'chhote', 'chota', 'choti', 'ghatao', 'ghata', 'ghatana', 'patla', 'patli', 'patle', 'पतला', 'पतली', 'पतले', 'thin', 'slim', 'lower', 'cut', 'trim', 'squeeze', 'कम', 'छोटा', 'छोटी', 'घटाओ', 'पतला', 'minimal', 'tight'])
const MORE = w(['more', 'zyada', 'jyada', 'jada', 'bigger', 'big', 'larger', 'large', 'taller', 'tall', 'wider', 'wide', 'increase', 'increased', 'expand', 'extend', 'bada', 'badi', 'bade', 'badha', 'badhao', 'badhana', 'lamba', 'lambi', 'loose', 'roomier', 'roomy', 'chauda', 'chaudi', 'double', 'dugna', 'ज्यादा', 'ज़्यादा', 'बड़ा', 'बड़ी', 'बढ़ाओ', 'लंबा', 'लंबी', 'चौड़ा'])
const SLIGHT = w(['slightly', 'slight', 'a bit', 'a little', 'little', 'bit', 'thoda', 'thodi', 'thode', 'zara', 'zra', 'halka', 'halki', 'mildly', 'somewhat', 'marginally', 'ek do', 'थोड़ा', 'थोड़ी'])
const STRONG_W = w(['much', 'a lot', 'lot', 'very', 'way', 'drastically', 'bahut', 'bohot', 'bhot', 'kaafi', 'kafi', 'ekdum', 'ek dum', 'bilkul', 'half', 'aadha', 'aadhi', 'aadhe', 'बहुत', 'काफी', 'आधा', 'आधी', 'halved'])
const DOUBLE = w(['double', 'dugna', 'dugni', 'twice', 'दुगना'])
const PERCENT = /(\d{1,3})\s*(?:%|percent|per cent|pc|प्रतिशत)/i
const PIXELS = /(\d{3,4})\s*(?:px|pixels?|pixel)/i

/** how much, from the words and numbers of a command; the direction needs to be known */
function sizeAmount(clause: string): { factor?: number; px?: number } | undefined {
  const px = clause.match(PIXELS)
  if (px) return { px: Number(px[1]) }
  const less = has(LESS, clause)
  const more = has(MORE, clause)
  const pct = clause.match(PERCENT)
  if (pct) {
    const p = Number(pct[1]) / 100
    if (has(w(['by', 'se', 'zyada', 'kam', 'more', 'less', 'increase', 'decrease', 'reduce', 'badha', 'badhao', 'ghata', 'ghatao']), clause) && p < 1) return { factor: less && !more ? 1 - p : 1 + p }
    if (more && !less && p < 1 && /(?:increase|badha|badhao|bigger|zyada|more)/i.test(clause)) return { factor: 1 + p }
    if (less && !more && p < 1) return { factor: 1 - p }
    return { factor: p }
  }
  const strong = has(STRONG_W, clause) || has(DOUBLE, clause)
  const slight = has(SLIGHT, clause)
  if (has(w(['half', 'aadha', 'aadhi', 'aadhe', 'आधा', 'आधी']), clause)) return { factor: 0.5 }
  if (more && !less) return { factor: strong ? 1.6 : slight ? 1.15 : 1.3 }
  if (less) return { factor: strong ? 0.5 : slight ? 0.85 : 0.7 }
  return undefined
}

const ALIGN_RE: [RegExp, 'left' | 'center' | 'right'][] = [
  [w(['center', 'centre', 'centred', 'centered', 'middle', 'beech', 'beechon beech', 'madhya', 'सेंटर', 'बीच', 'मध्य']), 'center'],
  [w(['left', 'leftside', 'left side', 'baayein', 'bayein', 'baaye', 'baya', 'bayen', 'लेफ्ट', 'बाएं']), 'left'],
  [w(['right', 'rightside', 'right side', 'daayein', 'dayein', 'daaye', 'daya', 'dayen', 'राइट', 'दाएं']), 'right'],
]

const MOVE_VERB = w(['lagao', 'laga do', 'lagado', 'lagana', 'daalo', 'daal do', 'daldo', 'dalo', 'laga de', 'करो', 'कर दो', 'रखो', 'लगाओ', 'डालो', 'लाओ', 'move', 'moved', 'shift', 'put', 'place', 'bring', 'send', 'push', 'drag', 'take', 'rakho', 'rakh do', 'rakhdo', 'lao', 'le jao', 'lejao', 'le aao', 'karo', 'kar do', 'kardo', 'chahiye', 'hona chahiye', 'want', 'need', 'should', 'go', 'goes', 'sit', 'appear', 'dikhao', 'dikhe', 'aaye', 'ho', 'bhejo', 'shift karo', 'हटाओ', 'ले जाओ', 'रखो', 'लाओ'])
const REL_BEFORE_EN = /(?<![\p{L}\p{M}])(?:above|before|over|ahead of|in front of|prior to|on top of|higher than|earlier than)(?![\p{L}\p{M}])/iu
const REL_AFTER_EN = /(?<![\p{L}\p{M}])(?:below|after|under|beneath|behind|following|underneath|lower than|later than|beyond|past)(?![\p{L}\p{M}])/iu
const REL_BEFORE_HI = /(?:\bke\s+upar\b|\bke\s+oopar\b|\bse\s+upar\b|\bse\s+pehle\b|\bke\s+pehle\b|\bse\s+aage\b|\bke\s+aage\b|के\s+ऊपर|से\s+पहले|के\s+पहले|से\s+आगे)/iu
const REL_AFTER_HI = /(?:\bke\s+neeche\b|\bke\s+niche\b|\bse\s+neeche\b|\bke\s+baad\b|\bse\s+baad\b|\bke\s+piche\b|\bke\s+peeche\b|\bse\s+piche\b|के\s+नीचे|के\s+बाद|से\s+बाद|के\s+पीछे)/iu
const TOP_RE = /(?<![\p{L}\p{M}])(?:top|first|beginning|very top|sabse\s+upar|sabse\s+oopar|sabse\s+pehle|sabse\s+aage|sabse\s+shuru|shuru\s+me|shuru\s+mein|top\s+par|top\s+pe|top\s+me|pehle\s+number|upar\s+wala\s+sabse|सबसे\s+ऊपर|सबसे\s+पहले|शुरू)(?![\p{L}\p{M}])/iu
const BOTTOM_RE = /(?<![\p{L}\p{M}])(?:bottom|last|end|very bottom|at the end|sabse\s+neeche|sabse\s+niche|sabse\s+piche|sabse\s+peeche|sabse\s+last|aakhir|aakhri|akhir|ant\s+me|ant\s+mein|bottom\s+par|bottom\s+pe|सबसे\s+नीचे|सबसे\s+आखिर|आखिर|अंत)(?![\p{L}\p{M}])/iu
const UP_RE = /(?<![\p{L}\p{M}])(?:up|upar|oopar|ऊपर|aage|आगे|higher|upwards|one step up|ek\s+step\s+upar|raise)(?![\p{L}\p{M}])/iu
const DOWN_RE = /(?<![\p{L}\p{M}])(?:down|neeche|niche|नीचे|peeche|piche|pichhe|पीछे|lower|downwards|one step down|ek\s+step\s+neeche|drop)(?![\p{L}\p{M}])/iu

const MOVE_VERB_STRICT = w(['move', 'shift', 'swap', 'reorder', 'drag'])
const REMOVALS = w(['remove', 'delete', 'hide', 'hata', 'hatao', 'hata do', 'nikal', 'nikaal', 'mita', 'mitao', 'drop it', 'get rid of'])

export type LayoutResult = { ops: EditOp[]; notes: string[] } | undefined

/**
 * One command: the layout operations in it, or undefined when it is not a layout command.
 * `context` decides between a move of a section and a move of a page in the menu.
 */
export function layoutOps(clause: string, context: 'single' | 'multi', quotes: string[], _strip: (s: string) => string, lastTarget?: string): LayoutResult {
  const text = clause.trim().normalize('NFC')
  if (!text) return undefined
  const navContext = has(NAV_WORDS, text)
  let ments = mentions(text, true)
  // "center it", "make it taller": the part named before
  if (!ments.length && lastTarget && /(?<![\p{L}])(?:it|its|this|that|isko|ise|iski|iska|uski|uska|usko|use|isse|इसे|इसको|उसे)(?![\p{L}])/iu.test(text)) ments = [{ value: lastTarget, at: 0, end: 0 }]
  const bareSizeOrAlign = !ments.length && lastTarget && !has(PAGE_ALL_RE, text) && !has(NAV_WORDS, text)
  if (bareSizeOrAlign && lastTarget) ments = [{ value: lastTarget, at: 0, end: 0 }]
  const sections = ments.filter((m) => !['header', 'hero', 'footer'].includes(m.value))
  const hasHome = has(HOME_RE, text)

  // ── reset
  if (/(?<![\p{L}])(?:reset|resets|restore|normal|default|original|undo|clear|remove)(?![\p{L}])|\bpehle jaisa\b|\bwapas\b|\bnormal\s+kar|रीसेट|रिसेट/iu.test(text) && /(?<![\p{L}\p{M}])(?:साइज़|साइज|लेआउट|sizes?|layout|heights?|widths?|alignments?|aligned|spacing|padding|positions?|order|sizing|resizing|moves?|arrangement)(?![\p{L}])/iu.test(text)) {
    if (!/(?<![\p{L}])(?:remove|delete|hide)\s+(?:the\s+)?(?:section|sections)\b/iu.test(text)) {
      const target = ments[0]?.value as FitTarget | undefined
      return { ops: [{ op: 'resetLayout', ...(target && !has(PAGE_ALL_RE, text) ? { target } : {}) }], notes: [] }
    }
  }
  if (ments.length && /(?<![\p{L}])(?:size|height|width|alignment)(?![\p{L}])\s+(?:ko\s+)?(?:normal|default|original|reset)/iu.test(text)) return { ops: [{ op: 'resetLayout', target: ments[0].value as FitTarget }], notes: [] }

  // ── move: a place word with a section (or two sections and a relation)
  const relBeforeEn = REL_BEFORE_EN.exec(text)
  const relAfterEn = REL_AFTER_EN.exec(text)
  const relBeforeHi = REL_BEFORE_HI.exec(text)
  const relAfterHi = REL_AFTER_HI.exec(text)
  const hasPlaceVerb = has(MOVE_VERB, text) || /(?<![\p{L}])(?:order|position|sequence|arrangement|place)(?![\p{L}])/iu.test(text)
  const isRename = /(?<![\p{L}])(?:rename|retitle|relabel)(?![\p{L}])/iu.test(text) || (has(HEADING_WORD, text) && /(?:\bto\b|\bas\b|:|\bko\b|\bka\b|\bki\b|\bke\b|\bnaam\b|नाम|का |की |को |के )/iu.test(text) && !relBeforeEn && !relAfterEn && !relBeforeHi && !relAfterHi)
  const pronounIt = /(?<![\p{L}\p{M}])(?:it|isko|usko|ise|use|इसे|उसे|इसको|उसको)(?![\p{L}\p{M}])/iu.test(text)
  let moveSections = sections
  if (sections.length === 1 && pronounIt && lastTarget && (relBeforeEn || relAfterEn || relBeforeHi || relAfterHi) && lastTarget !== sections[0].value) moveSections = [{ value: lastTarget, at: -1, end: -1 }, ...sections]
  else if (!sections.length && pronounIt && lastTarget && !['header', 'hero', 'footer'].includes(lastTarget)) moveSections = [{ value: lastTarget, at: -1, end: -1 }]
  if (moveSections.length && !has(REMOVALS, text) && !isRename && (hasPlaceVerb || (moveSections.length >= 2 && (relBeforeEn || relAfterEn || relBeforeHi || relAfterHi)))) {
    let where: Move | undefined
    let subject: Mention | undefined
    let reference: Mention | undefined
    const two = moveSections.length >= 2
    const rel = relBeforeEn ?? relAfterEn ?? relBeforeHi ?? relAfterHi
    if (two && rel) {
      const before = !!(relBeforeEn ?? relBeforeHi)
      const hindi = !!(relBeforeHi ?? relAfterHi)
      if (hindi) {
        // "A ko B ke upar": the name just before the relation is the reference, the other one moves
        const refs = moveSections.filter((s) => s.end <= rel.index + 1)
        reference = refs[refs.length - 1] ?? moveSections[moveSections.length - 1]
        subject = moveSections.find((s) => s !== reference && /^\s*(?:ko|को)\b/i.test(text.slice(s.end))) ?? moveSections.find((s) => s !== reference)
      } else {
        // English: the name after the relation is the reference
        const after = moveSections.filter((s) => s.at >= rel.index)
        reference = after[0] ?? moveSections[moveSections.length - 1]
        subject = moveSections.filter((s) => s !== reference && s.at < rel.index)[0] ?? moveSections.find((s) => s !== reference)
      }
      where = before ? 'before' : 'after'
    } else if (moveSections.length === 1 && rel && ments.some((m) => ['header', 'hero', 'footer'].includes(m.value))) {
      // "pricing ko hero ke neeche": just below the first screen is the top of the sections; "before the footer" is the bottom
      subject = moveSections[0]
      const part = ments.find((m) => ['header', 'hero', 'footer'].includes(m.value))?.value
      const before = !!(relBeforeEn ?? relBeforeHi)
      where = part === 'footer' ? (before ? 'bottom' : undefined) : before ? undefined : 'top'
    } else if (moveSections.length >= 1) {
      subject = moveSections[0]
      const bottom = BOTTOM_RE.test(text)
      const top = TOP_RE.test(text)
      if (bottom && !top) where = 'bottom'
      else if (top && !bottom) where = 'top'
      else if (top && bottom) where = undefined
      else if (UP_RE.test(text) && !DOWN_RE.test(text)) where = 'up'
      else if (DOWN_RE.test(text) && !UP_RE.test(text)) where = 'down'
      // "pehle X" as a place word for one section: top
      else if (/(?<![\p{L}])(?:pehle|pahle|पहले)(?![\p{L}])/iu.test(text)) where = 'top'
    }
    if (subject && where) {
      const pageMove = context === 'multi' && (has(PAGE_WORD, text) || navContext)
      const keySubject = subject.value as SectionKey
      if (pageMove) {
        const page = pageOf(keySubject)
        const target = reference ? pageOf(reference.value) : undefined
        if (page && (where !== 'before' && where !== 'after' ? true : !!target)) return { ops: [{ op: 'movePage', page, where, ...(where === 'before' || where === 'after' ? { target } : {}) } as EditOp], notes: [] }
        return { ops: [], notes: ['That cannot be moved in the menu.'] }
      }
      if (where === 'before' || where === 'after') return { ops: [{ op: 'move', section: keySubject, where, target: reference?.value as SectionKey }], notes: [] }
      return { ops: [{ op: 'move', section: keySubject, where }], notes: [] }
    }
  }
  if (hasHome && (() => { const v = newName(text, quotes, 0); return !v || TOP_RE.test(v) || BOTTOM_RE.test(v) || UP_RE.test(v) || DOWN_RE.test(v) })() && (has(NAV_WORDS, text) || has(PAGE_WORD, text)) && (TOP_RE.test(text) || BOTTOM_RE.test(text) || relBeforeEn || relAfterEn || relBeforeHi || relAfterHi || UP_RE.test(text) || DOWN_RE.test(text))) return { ops: [], notes: ['The Home page always stays first.'] }

  // ── a new name: the heading of a section, or the label of a page in the menu
  // The words of the new name itself ("Our Menu", "Team Fitness") never decide what is renamed: they are cut out first.
  // the verb that ends the sentence ("... rename karo", "... likho") is not a part of the new name
  const value0 = newName(text, quotes, 0)?.replace(/(?:\s+(?:rename|renamed|karo|kar\s?do|kardo|likho|likh\s?do|rakho|rakh\s?do))+\s*$/iu, '').trim() || undefined
  const frame = value0 ? (text.includes(value0) ? text.slice(0, text.lastIndexOf(value0)) + ' ' + text.slice(text.lastIndexOf(value0) + value0.length) : text).replace(/§\d+§/g, ' ') : text.replace(/§\d+§/g, ' ')
  const realMents = mentions(frame, true)
  if (!realMents.length && lastTarget && (has(NAV_WORDS, frame) || has(HEADING_WORD, frame)) && /(?<![\p{L}\p{M}])(?:it|its|isko|usko|ise|use|इसे|उसे)(?![\p{L}\p{M}])/iu.test(frame) && !['header', 'hero', 'footer'].includes(lastTarget)) realMents.push({ value: lastTarget, at: 0, end: 0 })
  const nameSections = realMents.filter((m) => !['header', 'hero', 'footer'].includes(m.value))
  const frameHome = has(HOME_RE, frame)
  const frameNav = has(NAV_WORDS, frame)
  const naming = /(?<![\p{L}])(?:rename|retitle|relabel)(?![\p{L}])/iu.test(frame) || frameNav || has(HEADING_WORD, frame) || /(?<![\p{L}])(?:call|name)\s+(?:the\s+)?/iu.test(frame)
  if (value0 && (nameSections.length || frameHome) && naming && !has(REMOVALS, frame) && !/(?<![\p{L}])(?:business|brand|company|shop|store|website|site)\s+(?:name|naam)\b/iu.test(frame)) {
    const forNav = frameNav || (context === 'multi' && has(PAGE_WORD, frame) && !has(w(['title', 'heading', 'headline', 'शीर्षक', 'हेडिंग', 'टाइटल']), frame))
    const subject = nameSections[0] ?? ({ value: 'home', at: 0, end: 0 } as Mention)
    if (value0.toLowerCase() !== subject.value) {
      if (forNav || subject.value === 'home') {
        const page = subject.value === 'home' ? 'home' : pageOf(subject.value)
        if (page) return { ops: [{ op: 'navLabel', target: page, text: value0.slice(0, 24) }], notes: [] }
      }
      if ((TITLE_SECTIONS as readonly string[]).includes(subject.value)) return { ops: [{ op: 'title', target: subject.value as TitleSection, text: value0 }], notes: [] }
    }
  }

  // ── align
  const alignWord = has(w(['align', 'aligned', 'alignment', 'aligning', 'justify', 'sidha', 'सीधा']), text)
  // "center se left karo": the word that comes last is where it goes
  const aligns = ALIGN_RE.map(([re, value]) => ({ value, at: text.search(re) })).filter((h) => h.at >= 0).sort((a, b) => b.at - a.at).slice(0, 1).map((h) => [null, h.value] as const)
  const alignTextWord = /(?<![\p{L}\p{M}])(?:text|heading|headings|title|content|words|writing|line|lines|likha|likhai|टेक्स्ट|हेडिंग)(?![\p{L}\p{M}])/iu.test(text)
  const placeWord = /(?<![\p{L}\p{M}])(?:me|mein|mai|par|pe|side|taraf|karo|kar do|kardo|rakho|lao|lagao|please|में|पर|करो|कर दो|रखो|लाओ)(?![\p{L}\p{M}])/iu.test(text)
  const isCenter = aligns[0]?.[1] === 'center'
  // the buttons alone: "button ko left karo", "move the button to the right", "hero button center me"
  const buttonWord = /(?<![\p{L}\p{M}])(?:buttons?|btns?|cta\s+buttons?|बटन|बटन्स)(?![\p{L}\p{M}])/iu.test(text)
  if (buttonWord && aligns.length === 1 && !quotes.length && !/§/.test(text) && !has(REMOVALS, text) && !/(?<![\p{L}])(?:text|label|likho|write|naam|name|colou?r|rang|size|bada|chhota|round)(?![\p{L}])/iu.test(text)) {
    const parts = ments.filter((m) => m.value !== 'header')
    const targets: FitTarget[] = parts.length && !has(PAGE_ALL_RE, text) ? (parts.map((m) => m.value) as FitTarget[]) : lastTarget && !has(PAGE_ALL_RE, text) && ['hero', 'cta'].includes(lastTarget) ? [lastTarget as FitTarget] : ['hero']
    return { ops: targets.map((target) => ({ op: 'align', target, align: aligns[0][1], part: 'buttons' }) as EditOp), notes: [] }
  }
  if (aligns.length === 1 && (alignWord || alignTextWord || (isCenter && (ments.length > 0 || has(PAGE_ALL_RE, text))) || ((ments.length > 0 || has(PAGE_ALL_RE, text)) && placeWord)) && !has(REMOVALS, text) && !sizeAmount(text) && !relBeforeEn && !relAfterEn && !(ments.length && has(MOVE_VERB_STRICT, text))) {
    const parts = ments.filter((m) => !(m.value === 'hero' && false))
    const targets: FitTarget[] = parts.length && !has(PAGE_ALL_RE, text) ? (parts.map((m) => m.value) as FitTarget[]) : ['page']
    return { ops: targets.map((target) => ({ op: 'align', target, align: aligns[0][1] }) as EditOp), notes: [] }
  }

  // ── size
  const heightWord = has(HEIGHT_WORDS, text)
  const widthWord = has(WIDTH_WORDS, text)
  const amount = sizeAmount(text)
  // "pricing kam karo", "faq zyada karo": a part and a bare more / less is its height
  const bareMoreLess = ments.length > 0 && text.split(/\s+/).length <= 4 && has(w(['kam', 'zyada', 'jyada', 'ghatao', 'badhao', 'कम', 'ज्यादा', 'घटाओ', 'बढ़ाओ']), text)
  const sizeVerbless = bareMoreLess || has(w(['smaller', 'bigger', 'larger', 'chhota', 'chhoti', 'chhote', 'chota', 'choti', 'bada', 'badi', 'bade', 'shrink', 'enlarge', 'छोटा', 'छोटी', 'बड़ा', 'बड़ी']), text)
  if (amount && (heightWord || widthWord || ((sizeVerbless || PERCENT.test(text)) && ments.length)) && !has(REMOVALS, text) && !/(?<![\p{L}])(?:animation|animations|motion|colou?r|font|text size|button|buttons|logo|image|images|photo|photos|picture)(?![\p{L}])/iu.test(text.replace(/section|hero|gallery/gi, ''))) {
    const axes: ('height' | 'width')[] = []
    if (widthWord && !(heightWord && !/(?<![\p{L}])(?:narrow|narrower|wide|wider|patla|patli|chauda|chaudi)(?![\p{L}])/iu.test(text))) axes.push('width')
    if (heightWord && !(widthWord && axes.length && !/(?<![\p{L}])(?:height|tall|short|padding|spacing|gap|lambai|lamba|lambi)(?![\p{L}])/iu.test(text))) axes.push('height')
    if (!axes.length) axes.push(widthWord ? 'width' : 'height')
    if (widthWord && heightWord && /(?<![\p{L}])(?:height|tall|padding|spacing)(?![\p{L}])/iu.test(text) && /(?<![\p{L}])(?:width|wide)(?![\p{L}])/iu.test(text) && axes.length < 2) axes.splice(0, axes.length, 'height', 'width')
    const parts = ments.map((m) => m.value as FitTarget)
    const targets: FitTarget[] = parts.length && !has(PAGE_ALL_RE, text) ? parts : ['page']
    const ops: EditOp[] = []
    for (const target of targets) for (const axis of axes) ops.push({ op: 'size', target, axis, ...(amount.px ? { px: amount.px } : { factor: amount.factor }) })
    return { ops, notes: [] }
  }
  return undefined
}

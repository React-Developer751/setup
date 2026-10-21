// Everyday style requests that the other readers turn into a wrong edit: "heading ka size chhota karo" (the heading became "size chhota"),
// "buttons square karo" (the button text became "square"), "instagram link add karo" (the main colour became pink), "cookie banner hatao"
// (the call-to-action section was removed). Read first, they get the right edit or an honest answer.
import { MOODS } from '../moods'
import type { EditOp, FitTarget } from './edits'

export type StyleResult = { ops: EditOp[]; notes: string[] } | undefined

const W = (re: string) => new RegExp(`(?<![\\p{L}\\p{M}])(?:${re})(?![\\p{L}\\p{M}])`, 'iu')
const UP = W('bada|badi|bade|bigger|larger|big|large|badha|badhao|badhana|increase|enlarge|zyada|jyada|more|बड़ा|बड़ी|बड़े|बढ़ाओ|ज्यादा|ज़्यादा')
const DOWN = W('chhota|chhoti|chhote|chota|choti|smaller|small|ghatao|ghata|decrease|reduce|shrink|kam|less|छोटा|छोटी|छोटे|घटाओ|कम')
const HEADING = W('headings?|headlines?|(?<!sub-?)titles?|h1|h2|shirshak|हेडिंग|शीर्षक')
const BODY = W('text|writing|paragraphs?|body|akshar|likhai|letters?|content|sub-?titles?|sub-?headings?|taglines?|description|टेक्स्ट|अक्षर')
const FONT = W('fonts?|typeface|फॉन्ट|फ़ॉन्ट')
const SIZE_WORD = W('size|saiz|साइज़|साइज|आकार')
const sizeLike = (t: string) => UP.test(t) || DOWN.test(t)
const QUOTE = /["“”'‘’§]/

const PARTS: [FitTarget, RegExp][] = [
  ['hero', W('hero|first screen|top section|pehla section')], ['header', W('header|navbar|nav bar|navigation|menu bar')], ['footer', W('footer')],
  ['about', W('about(?: us)?|hamare baare mein')], ['features', W('services?|features?')], ['pricing', W('pricing|plans?|prices?')], ['gallery', W('gallery')],
  ['testimonials', W('testimonials?|reviews?')], ['team', W('team')], ['faq', W('faq|questions')], ['contact', W('contact')], ['blog', W('blog')], ['steps', W('steps|how it works')], ['stats', W('stats|numbers')], ['cta', W('cta|call to action')],
]
const partsOf = (text: string): FitTarget[] => PARTS.filter(([, re]) => re.test(text)).map(([t]) => t)

/** what this editor cannot do, answered instead of doing something else */
const CANNOT: { when: RegExp; note: string }[] = [
  { when: W('cookies?|cookie banner|pop-?ups?|chat\\s*widget|chat\\s*bot|chatbot|live chat'), note: 'I cannot add pop-ups, cookie banners or chat widgets. The page is a clean landing page; contact details (phone, email, WhatsApp number) can be set: "whatsapp number 98765 43210".' },
  { when: W('(?:google\\s+)?maps?|embed(?:ded)?\\s+map|video|youtube|vimeo|reel'), note: 'I cannot add a map or a video yet. The address and the contact details can be changed: "address 12 MG Road, Pune".' },
  { when: W('newsletter|subscribe|subscription\\s+form|sign\\s*up|signup|log\\s*in|login|search\\s+bar|shopping\\s+cart|cart|checkout|payment\\s+(?:button|gateway)'), note: 'I cannot add forms for newsletters, logins, carts or payments. The contact section has the form of the page.' },
  { when: W('instagram|facebook|twitter|linkedin|youtube|social(?:\\s+media)?|insta|whatsapp\\s+(?:button|icon|chat|link)'), note: 'I cannot add social media links or buttons yet. The WhatsApp number can be set (say "whatsapp number 98765 43210"); other links can be added in the exported code.' },
  { when: W('bold|italic|underline|uppercase|lowercase|capital(?:s|ise|ize)?|letter\\s*spacing|line\\s*height|text\\s*shadow'), note: 'I cannot change the weight or style of the letters (bold, italic, underline) yet. I can change the typeface ("serif font"), the size of headings and text, and their colours.' },
  { when: W('shadows?|gradients?|borders?|outlines?|dividers?|separators?|blur|glow|overlay'), note: 'I cannot add shadows, gradients, borders or dividers one by one. A whole look does it: try "make it glass", "neumorphism style", "flat look" or "gradient look".' },
]

export function styleOps(raw: string): StyleResult {
  const text = raw.trim().normalize('NFC')
  if (!text) return undefined
  const quoted = QUOTE.test(text)
  const removing = W('hata|hatao|hata do|remove|delete|nikalo|nikal do|band|off').test(text)

  // things that do not exist: said honestly, never turned into another change
  if (!quoted) {
    // a whole look ("bold look", "gradient style", "make it glass") is a mood, not a single shadow or letter weight
    const lookTalk = W('look|style|vibe|mood|theme|aesthetic|feel|design').test(text)
    // "bold" for letters needs letters in the sentence ("heading bold karo", "italic karo"); "make it bold and colourful" is a look
    const letters = W('headings?|titles?|headlines?|text|font|letters?|words?|writing|paragraphs?|button|label|likhai|akshar').test(text) || text.split(/\s+/).length <= 3
    const cannot = CANNOT.find(({ when, note }) => when.test(text) && !(lookTalk && /weight or style|shadows, gradients/.test(note)) && !(/weight or style/.test(note) && !letters))
    // the colour of cards: they take the colour of their section
    if (!cannot && W('cards?|boxes').test(text) && W('colou?r|rang|रंग').test(text) && !partsOf(text.replace(W('cards?'), ' ')).length) return { ops: [], notes: ['Cards take the colours of their section: colour the section ("make the features section white") or change the main colour ("main colour blue").'] }
    // a colour of a brand ("make it Spotify green") is a colour request, and a social word in a business description is not a command
    if (cannot && !/(?:colou?r|rang|jaisa|jaisi|like|wala|wali)/iu.test(text) && /(?:add|lagao|daalo|jodo|hata|remove|karo|kar do|do|chahiye|make|show|dikhao|banao|on|off|band|badhao|badha|zyada|kam|increase|decrease)/iu.test(text)) return { ops: [], notes: [cannot.note] }
  }

  // the typeface: "font ko elegant karo", "font badlo"
  if (FONT.test(text) && !quoted && !sizeLike(text) && !W('colou?r|rang').test(text)) {
    const kinds: [RegExp, string][] = [
      [W('elegant|fancy|luxury|luxurious|wedding|calligraph\\w*'), 'elegant'], [W('serif|classic|classical|traditional|newspaper|book'), 'serif'], [W('mono|monospace|typewriter|code|coding|retro'), 'mono'],
      [W('rounded|friendly|playful|cute|soft|kids|bubbly'), 'rounded'], [W('futuristic|tech|techy|display|sci-?fi|cyber|robotic'), 'display'], [W('sans|sans-serif|modern|clean|simple|plain|minimal'), 'sans'],
    ]
    const kind = kinds.find(([re]) => re.test(text))
    if (kind) return { ops: [{ op: 'style', target: 'page', prop: 'font', value: kind[1] }], notes: [] }
    if (W('badlo|badal|change|different|naya|nayi|another|dusra').test(text)) return { ops: [], notes: ['Which typeface? Say one of: serif, sans, mono, elegant, rounded or display, for example "serif font karo".'] }
  }

  // the page background: black / dark is the dark mode, white / light the light mode ("background black" is not a black main colour)
  const bg = text.match(/^(?:(?:page|site|website|poori|puri)\s+)?(?:background|bg)\s+(?:ko\s+)?(black|dark|kala|white|light|safed)(?:\s+(?:karo|kar do|rakho|do|chahiye))?$/i) ?? text.match(/^(black|dark|white|light)\s+(?:page\s+|site\s+)?(?:background|bg)(?:\s+(?:karo|kar do|rakho|do|chahiye))?$/i)
  if (bg) return { ops: [{ op: 'mode', mode: /black|dark|kala/i.test(bg[1]) ? 'dark' : 'light' }], notes: [] }

  // the menu bar: its links go with their sections ("menu se about hatao" removes the section, not only its link)
  if (W('menu|navbar|nav bar|navigation').test(text) && removing && !quoted && W('upar wala|top|navigation|navbar|nav bar|menu bar|menu se|menu me se|menu mein se|se').test(text)) {
    const named = partsOf(text.replace(W('menu|navbar|nav bar|navigation|upar wala|top'), ' '))
    if (named.length) return { ops: named.filter((t) => t !== 'hero' && t !== 'header' && t !== 'footer').map((section) => ({ op: 'remove', section }) as EditOp), notes: [] }
    return { ops: [], notes: ['The menu bar cannot be removed. Its links follow the sections: remove a section ("about hatao") and its link goes with it.'] }
  }

  // a bigger or smaller type
  const sizeWords = UP.test(text) ? '+1' : DOWN.test(text) ? '-1' : ''
  const heading = HEADING.test(text)
  const body = BODY.test(text) || FONT.test(text)
  const buttonOnly = W('buttons?|btns?|बटन').test(text) && !heading
  if (sizeWords && (heading || body) && !buttonOnly && !quoted && !W('corners?|round(?:ed)?|gol').test(text)) {
    const targets = partsOf(text.replace(HEADING, ' '))
    // the subtitle is on the first screen
    const list: FitTarget[] = targets.length ? targets : W('sub-?titles?|sub-?headings?|taglines?|description').test(text) ? ['hero'] : ['page']
    // "font bada" and "size" without a noun: everything; "heading" alone: headings; "text" alone: text
    const both = (FONT.test(text) || (!heading && !BODY.test(text))) || (heading && BODY.test(text) && !W('heading text|title text').test(text))
    const props: ('headingSize' | 'textSize')[] = both ? ['headingSize', 'textSize'] : heading ? ['headingSize'] : ['textSize']
    return { ops: list.flatMap((target) => props.map((prop) => ({ op: 'style', target, prop, value: sizeWords }) as EditOp)), notes: [] }
  }
  if (W('size').test(text) && (heading || body) && !sizeWords && !quoted && SIZE_WORD.test(text)) {
    return { ops: [], notes: ['Say whether the text should be bigger or smaller, for example: "heading bigger" or "text size chhota karo".'] }
  }
  // "button bada karo": the size of a button is not something this editor changes
  if (buttonOnly && sizeWords && !quoted && !W('corners?|round(?:ed)?|gol').test(text)) return { ops: [], notes: ['I cannot change the size of buttons yet. I can change the button text, colour, corners and place.'] }

  // corners: "buttons square karo", "rounded corners kam karo", "cards rounded"
  const cornerNoun = W('corners?|edges?|buttons?|btns?|cards?|boxes|kone|कोने|बटन')
  const sharp = W('sharp|square|squared|boxy|flat|edgy|chaukor|चौकोर|nukeel\\w*|नुकीले')
  const round = W('round(?:ed)?|pill|circular|curved|gol|golai|गोल')
  if (cornerNoun.test(text) && (sharp.test(text) || round.test(text)) && !quoted && !removing) {
    const colours = /#[0-9a-f]{3,6}|\b(?:red|blue|green|yellow|orange|purple|pink|black|white|gray|grey|lal|neela|hara|peela)\b/i.test(text)
    if (!colours) {
      const less = DOWN.test(text) && round.test(text) && !sharp.test(text)
      const more = UP.test(text) && round.test(text) && !sharp.test(text)
      const value = sharp.test(text) && !less ? 'square' : less ? 'square' : more || W('pill|circular').test(text) || (W('buttons?|btns?|बटन').test(text) && round.test(text)) ? 'pill' : 'rounded'
      const targets = partsOf(text)
      return { ops: (targets.length ? targets : (['page'] as FitTarget[])).map((target) => ({ op: 'style', target, prop: 'radius', value }) as EditOp), notes: [] }
    }
  }

  // "menu ko right side karo": the navigation bar
  const menuAlign = text.match(/(?:^|\s)(?:menu|navigation|nav\s*links?)\s+(?:ko\s+|bar\s+)?(?:(?:ko|ka|ki|me|mein)\s+)?(?:(?:ko)\s+)?(?:(left|right|center|centre|middle)\b)/i) ?? text.match(/(?:^|\s)(?:menu|navigation)\b.*\b(left|right|center|centre)\b/i)
  if (menuAlign && !quoted && !W('naam|name|rename|add|hata|remove|label|item').test(text)) {
    const where = /left/i.test(menuAlign[1]) ? 'left' : /right/i.test(menuAlign[1]) ? 'right' : 'center'
    return { ops: [{ op: 'align', target: 'header', align: where }], notes: [] }
  }

  // pictures: a picture is not a gallery section
  const picture = W('images?|photos?|pictures?|pics?|tasveer|tasvir|फोटो|तस्वीर')
  if (picture.test(text) && !quoted && !W('gallery|size|height|bigger|smaller|bada|chhota|corners?|round(?:ed)?|heading|text').test(text)) {
    if (removing) return { ops: [{ op: 'clearPhotos' }], notes: ['The photos you added or the image AI drew are removed (all of them); the page shows its normal pictures.'] }
    if (W('lagao|lagana|add|daalo|dalo|jodo|change|badlo|badal|replace|naya|nayi|new|another|dusra|upload|set').test(text)) return { ops: [], notes: ['Pictures are added in "Real photos": draw scenes with the image AI (and thumb the ones you like), search photos or upload your own.'] }
  }

  // "isko aur modern bana do": a better look is a new design mood
  if (/^(?:isko\s+|ise\s+|iss?\s+website\s+ko\s+|website\s+ko\s+|make\s+it\s+|make\s+this\s+(?:website\s+)?)?(?:aur\s+|thoda\s+|more\s+|bit\s+more\s+)?(?:modern|stylish|trendy|attractive|beautiful|sundar|fancy|cool|premium look|better looking|achha looking)(?:\s+(?:bana\s+do|banao|karo|kar\s+do|dikhao|look))?\s*$/iu.test(text)) {
    const ids = MOODS.map((m) => m.id)
    return { ops: [{ op: 'mood', mood: ids[Math.floor(Math.random() * ids.length)] }], notes: ['I changed the design mood to a different look. Say "another look" for one more, or "undo".'] }
  }

  // "price 999 karo": plan prices are not edited one by one
  if (W('price|prices|pricing|rate|rates|fees?|kimat|daam').test(text) && /\d/.test(text) && !quoted && !W('services?|:').test(text) && /(?:karo|kar do|set|change|badlo|rakho|do)/iu.test(text)) {
    return { ops: [], notes: ['I do not change one plan price at a time. Give me the list with prices: "services: haircut 300, facial 800, spa 1200" and the price list follows it.'] }
  }

  // "testimonial ka text change karo": a change of words without the new words
  const noValue = text.match(/^(?:the\s+)?([\p{L}\s]{3,30}?)\s+(?:ka\s+|ki\s+|ke\s+)?(?:text|naam|name|title|heading|likhai)\s+(?:change|badlo|badal|update|edit)\s*(?:karo|kar do|kar de|do|please)?\s*$/iu)
  if (noValue && !/(?:business|brand|website|site|services?|features?|about|cta|contact|hero|button|subtitle|menu)/i.test(noValue[1])) return { ops: [], notes: ['Tell me the new words too, in quotes: for example heading "Your new heading". The reviews on the page are sample texts; to change them tell me "replace \\"old words\\" with \\"new words\\"".'] }

  return undefined
}

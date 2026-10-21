// What does a sentence of the person say about the site: good, bad, or nothing about quality?
// A keyword engine without any model (English, Hinglish and Hindi), with what a plain keyword list gets wrong:
//   - negation: "badhiya nahi hai", "not good", "achha nahi" are bad; "kharab nahi" / "not bad" are good
//   - "change" is not a complaint by itself ("change the colour to blue" is a command), only a sign that something should be replaced
//   - which part is meant: heading, subheading, button, call to action, colour, picture, layout, or the whole site
export type Polarity = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
export type FeedbackTarget = 'heroTitle' | 'heroSubtitle' | 'heroButton' | 'ctaTitle' | 'featuresTitle' | 'aboutTitle' | 'colour' | 'image' | 'layout' | 'overall'
export type Feedback = {
  label: Polarity
  /** below 0: bad, above 0: good (about -3..3) */
  score: number
  target: FeedbackTarget
  /** the person wants this part replaced ("heading badlo", "dusra do") */
  wantsChange: boolean
  /** words that decided it */
  hits: string[]
  /** the person gave the new text or value themselves ("rename it to X", "heading 'Y' karo"): then it is a command, not an opinion */
  hasPayload: boolean
}

const NEG = new Set([
  'bad', 'worst', 'terrible', 'ugly', 'boring', 'dull', 'poor', 'weak', 'hate', 'awful', 'wrong', 'cheap', 'confusing', 'messy', 'cluttered', 'generic', 'bland', 'lame',
  'bekar', 'bekaar', 'kharab', 'kharaab', 'ganda', 'gandi', 'bakwas', 'bakvas', 'faltu', 'ghatiya', 'galat', 'jhol', 'fika', 'feeka', 'buri', 'bura', 'nikamma',
  'बेकार', 'खराब', 'गलत', 'बकवास', 'घटिया', 'गंदा', 'फालतू', 'बुरा', 'बुरी',
])
const POS = new Set([
  'good', 'great', 'nice', 'love', 'awesome', 'perfect', 'beautiful', 'excellent', 'amazing', 'superb', 'cool', 'best', 'wow', 'fantastic', 'like', 'liked', 'clean', 'sleek',
  'achha', 'accha', 'acha', 'achchha', 'achhi', 'achi', 'accha', 'badhiya', 'badiya', 'mast', 'shandar', 'zabardast', 'sahi', 'sundar', 'pasand', 'maza', 'mazedaar', 'ekdum', 'jhakkas', 'lajawab',
  'अच्छा', 'अच्छी', 'बढ़िया', 'बढ़ियां', 'शानदार', 'मस्त', 'सही', 'सुंदर', 'पसंद', 'ज़बरदस्त', 'जबरदस्त', 'लाजवाब',
])
const NEGATORS = new Set(["not", "no", "never", "dont", "don't", "isnt", "isn't", "doesnt", "doesn't", "didnt", "didn't", "cant", "can't", 'nahi', 'nahin', 'nhi', 'nai', 'na', 'mat', 'nope', 'नहीं', 'नही', 'न', 'मत'])
const BOOST = new Set(['very', 'too', 'really', 'so', 'bahut', 'bohot', 'bohat', 'bilkul', 'ekdum', 'itna', 'kaafi', 'बहुत', 'बिल्कुल'])
/** "more", "better", "improve": the person wants something else, which says a little about what is there now */
const CHANGE = new Set(['change', 'badlo', 'badal', 'badalna', 'badalo', 'replace', 'another', 'other', 'different', 'dusra', 'doosra', 'dusri', 'naya', 'nayi', 'naye', 'redo', 'rewrite', 'improve', 'better', 'fix', 'sudharo', 'सुधारो', 'बदलो', 'बदल', 'दूसरा', 'नया'])

const TARGETS: { target: FeedbackTarget; words: RegExp }[] = [
  { target: 'heroSubtitle', words: /(?<![\p{L}\p{N}])(sub-?heading|sub-?title|sub-?headline|tagline|description|subtext)(?![\p{L}\p{N}])/iu },
  { target: 'heroTitle', words: /(?<![\p{L}\p{N}])(heading|headline|title|h1|header|hero text|shirshak|शीर्षक|हेडिंग)(?![\p{L}\p{N}])/iu },
  { target: 'heroButton', words: /(?<![\p{L}\p{N}])(button|btn|बटन)(?![\p{L}\p{N}])/iu },
  { target: 'ctaTitle', words: /(?<![\p{L}\p{N}])(cta|call to action)(?![\p{L}\p{N}])/iu },
  { target: 'aboutTitle', words: /(?<![\p{L}\p{N}])(about( us)?)(?![\p{L}\p{N}])/iu },
  { target: 'featuresTitle', words: /(?<![\p{L}\p{N}])(features?|services?)(?![\p{L}\p{N}])/iu },
  { target: 'colour', words: /(?<![\p{L}\p{N}])(colou?rs?|theme|rang|रंग|shade)(?![\p{L}\p{N}])/iu },
  { target: 'image', words: /(?<![\p{L}\p{N}])(images?|photos?|pictures?|pics?|tasveer|tasvir|फोटो|तस्वीर)(?![\p{L}\p{N}])/iu },
  { target: 'layout', words: /(?<![\p{L}\p{N}])(layout|design|look|style|sections?|font|spacing)(?![\p{L}\p{N}])/iu },
]

/** words that carry the new value: then the sentence is a command, whatever else it says */
const PAYLOAD = /["“”'‘’][^"“”'‘’]{2,}["“”'‘’]|(?<![\p{L}\p{N}])(rename|rakho|rakh do|likho|likh do|set it to|set to|make it|bana do|banao)(?![\p{L}\p{N}])|(?<![\p{L}\p{N}])to\s+\p{L}{2,}/iu

const tokens = (text: string): string[] => text.toLowerCase().replace(/[’`]/g, "'").split(/[^\p{L}\p{M}\p{N}']+/u).filter(Boolean)

export function analyseFeedback(input: string): Feedback {
  const text = input.trim()
  const words = tokens(text)
  let score = 0
  const hits: string[] = []
  words.forEach((w, i) => {
    const sign = POS.has(w) ? 1 : NEG.has(w) ? -1 : 0
    if (!sign) return
    // "sahi karo" / "sahi kar do" asks for a fix, it does not praise
    if (w === 'sahi' && /^(kar|karo|karna|krdo|kr)$/.test(words[i + 1] ?? '')) return
    // "like" in "like this" / "looks like" is no opinion
    if (w === 'like' && !/^(it|the|this|that|how|its|everything)$/.test(words[i + 1] ?? '') && !/^(i|we|really|do|dont|don't)$/.test(words[i - 1] ?? '')) return
    const around = words.slice(Math.max(0, i - 3), i).concat(words.slice(i + 1, i + 4))
    const negated = around.some((a) => NEGATORS.has(a))
    const boosted = around.some((a) => BOOST.has(a))
    const weight = boosted ? 1.5 : 1
    // a bad word that is negated is a mild good ("not bad"); a good word that is negated is a clear bad ("not good")
    const value = negated ? (sign > 0 ? -1 : 0.5) * weight : sign * weight
    score += value
    hits.push(`${negated ? 'not ' : ''}${w}`)
  })
  const wantsChange = words.some((w) => CHANGE.has(w))
  const found = TARGETS.find((t) => t.words.test(text))
  // "change" with no opinion: a weak sign that what is there is not wanted
  if (score === 0 && wantsChange && found) score = -0.5
  const clamped = Math.max(-3, Math.min(3, score))
  return {
    label: clamped <= -0.5 ? 'NEGATIVE' : clamped >= 0.5 ? 'POSITIVE' : 'NEUTRAL',
    score: clamped,
    target: found?.target ?? 'overall',
    wantsChange,
    hits,
    hasPayload: PAYLOAD.test(text),
  }
}

/** a sentence that is an opinion and no command: it is answered and learned from, not turned into an edit */
export const isOpinion = (f: Feedback): boolean => f.label !== 'NEUTRAL' && !f.hasPayload

// The words of a Hinglish request that are not part of the business ("mujhe ek bakery ki website chahiye", "meri dukaan ke liye website banao"):
// they must never end up in a headline, a service card or a question.

/** words that only Hinglish uses (English words such as "me" or "do" are not in it) */
export const FILLER = new Set([
  'mujhe', 'mere', 'meri', 'mera', 'hamari', 'hamara', 'humari', 'humara', 'apni', 'apna', 'apne', 'ek', 'koi', 'ke', 'ki', 'ka', 'ko', 'liye', 'banao', 'bana', 'banado', 'banani', 'bnao', 'banwana',
  'chahiye', 'chahie', 'hai', 'hain', 'tha', 'thi', 'jo', 'wali', 'wala', 'karti', 'karta', 'uski', 'uska', 'uske', 'unki', 'unka', 'iski', 'iska', 'mein', 'naam', 'dijiye', 'kijiye', 'kripya', 'banakar', 'karke', 'dena', 'jisme', 'jismein', 'dikhne', 'dikhe', 'sabse', 'kuch', 'kuchh', 'esi', 'aisi', 'ese', 'aise',
])
const REQUEST = new Set(['website', 'site', 'webpage', 'page', 'web'])

/** a phrase that holds a Hinglish scaffolding word ("mera restaurant hai Jaipur me", "uski website banao") */
export const hasFiller = (text: string) => text.toLowerCase().split(/[^a-z]+/).some((w) => FILLER.has(w) || (REQUEST.has(w) && /\b(?:banao|bana|chahiye|ki)\b/i.test(text)))

/** the phrase without the scaffolding: "bakery" from "ek bakery ki" */
export const stripFiller = (text: string) =>
  text
    .split(/\s+/)
    .filter((w) => !FILLER.has(w.toLowerCase().replace(/[^a-z]/g, '')))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

// words that ask for a look or a request, not a business: "unique stunning website with animation" says nothing about what the business is
const VIBE = new Set(['unique', 'attractive', 'stunning', 'amazing', 'awesome', 'cool', 'beautiful', 'gorgeous', 'wow', 'different', 'alag', 'hatke', 'animation', 'animations', 'animated', 'type', 'best', 'modern', 'premium', 'luxury', 'creative', 'professional', 'good', 'great', 'nice', 'new', 'normal', 'sundar', 'achhi', 'achchi', 'badiya', 'zabardast', 'website', 'site', 'web', 'page', 'business', 'with', 'and', 'a', 'an', 'the', 'my', 'me', 'for', 'ho', 'hoga', 'se', 'ya', 'or', 'aur', 'do', 'ho', 'dena'])
/** true when a phrase holds only looks and request words ("unique banakar do", "sabse alag hatke") */
export const isVague = (text: string) => {
  const w = text.toLowerCase().split(/[^a-z]+/).filter(Boolean)
  return w.length > 0 && w.every((x) => VIBE.has(x) || FILLER.has(x))
}

// praise and request words only: unlike VIBE they never double as a kind of business ("creative studio", "luxury hotel", "animation studio")
const LOOKS = new Set(['unique', 'attractive', 'stunning', 'amazing', 'awesome', 'cool', 'beautiful', 'gorgeous', 'wow', 'different', 'alag', 'hatke', 'type', 'sundar', 'achhi', 'achchi', 'badiya', 'zabardast', 'ho', 'do', 'hoga', 'se', 'ya', 'or', 'aur'])
/** the prompt without the looks and request words, with clothes named the way the classifier knows them: what is left says what the business is */
export const withoutVibe = (text: string) =>
  text
    .replace(/\b(?:cloths?|clothes|kapde|kapda)\b/gi, 'clothing store')
    .split(/(\s+)/)
    .filter((w) => !w.trim() || !(LOOKS.has(w.toLowerCase().replace(/[^a-z]/g, '')) || FILLER.has(w.toLowerCase().replace(/[^a-z]/g, ''))))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()

/** true when a line holds a request or a look word ("alag type", "animation ho", "unique", "banao"): no line of a business page says that */
export const hasLookWord = (text: string) => text.toLowerCase().split(/[^a-z]+/).some((w) => w.length > 1 && (FILLER.has(w) || LOOKS.has(w) || ['banakar', 'jisme', 'alag', 'hatke'].includes(w)))

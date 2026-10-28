// The words of a Hinglish request that are not part of the business ("mujhe ek bakery ki website chahiye", "meri dukaan ke liye website banao"):
// they must never end up in a headline, a service card or a question.

/** words that only Hinglish uses (English words such as "me" or "do" are not in it) */
export const FILLER = new Set([
  'mujhe', 'mere', 'meri', 'mera', 'hamari', 'hamara', 'humari', 'humara', 'apni', 'apna', 'apne', 'ek', 'koi', 'ke', 'ki', 'ka', 'ko', 'liye', 'banao', 'bana', 'banado', 'banani', 'bnao', 'banwana',
  'chahiye', 'chahie', 'hai', 'hain', 'tha', 'thi', 'jo', 'wali', 'wala', 'karti', 'karta', 'uski', 'uska', 'uske', 'unki', 'unka', 'iski', 'iska', 'mein', 'naam', 'dijiye', 'kijiye', 'kripya',
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

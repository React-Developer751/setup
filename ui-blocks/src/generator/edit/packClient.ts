// Asks Core-Craft AI which niche a request is, and decides whether to trust the answer. The Content AI reads typos ("dentsit"), Hinglish and short words ("cctv") that the keywords of the
// niche packs miss (80 of 594 test requests), but it also guesses when a request names no trade ("a website that nobody has seen before" -> catering): a guess is never used.
import { nicheHint, setNicheHint } from '../niche/hints'
import { detectNiche } from '../niche/applyNiche'
import { NICHES } from '../niche/niches'
import { promptWords } from '../memory/promptMemory'
import { asksForBold } from '../creativity'

export type PackAnswer = { id: string; label: string; theme: string; niche: string | null; keywords: string[]; confidence: number; source: string; notes: string[]; problems: number }
export type Recognised = { id: string; label: string; why: string }

// words that fit many niches ("yoga class", "high class animation"): they never decide a niche alone
const GENERIC_WORDS = ['class', 'classes', 'high', 'low', 'premium', 'luxury', 'best', 'good', 'great', 'animation', 'animated', 'modern', 'new', 'online', 'local', 'shop', 'store', 'service', 'services', 'centre', 'center', 'studio', 'house', 'home', 'company', 'firm', 'agency', 'business', 'website', 'site', 'page', 'landing', 'gallery', 'pricing', 'colours', 'colors', 'short', 'faq', 'contact', 'blog', 'team', 'form', 'simple', 'beautiful', 'create', 'make', 'build', 'need', 'want', 'jaipur', 'delhi', 'mumbai', 'pune', 'with', 'and', 'for']

const fold = (w: string) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)

const GENERIC = new Set(GENERIC_WORDS.map(fold))

/**
 * Whether the Content AI's niche may be used for this prompt. It is, when it is not a guess among equals and one of these holds: a typing mistake was corrected into the niche, the Content AI
 * is nearly certain, or every word of the request that says something (no "website", no place, no "premium") is a word of the niche's own keywords. "car repair garage" shares two words with
 * "bike repair garage" but "car" is not one of them: it is not used (the page keeps its own text for a garage). A request that names no trade is never used.
 */
export function trustPack(prompt: string, answer: PackAnswer): boolean {
  if (!answer.niche || answer.id.startsWith('type_') || answer.problems > 0) return false
  if (!NICHES.some((n) => n.id === answer.id)) return false
  if (answer.notes.some((n) => /equally well/i.test(n))) return false
  const meaningful = promptWords(prompt).filter((w) => !GENERIC.has(w) && !/^\d+$/.test(w))
  if (!meaningful.length) return false
  const keywordWords = new Set(answer.keywords.join(' ').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean).map(fold))
  const anyShared = meaningful.some((w) => keywordWords.has(w))
  if (answer.notes.some((n) => /corrected typing/i.test(n))) return answer.confidence >= 0.5
  if (asksForBold(prompt) && !anyShared) return false
  if (answer.confidence >= 0.9) return anyShared
  return answer.confidence >= 0.5 && meaningful.every((w) => keywordWords.has(w))
}

const asked = new Map<string, Promise<Recognised | undefined>>()

/** the niche Core-Craft AI recognised for a prompt that the niche keywords did not know; undefined when the Content AI is off, unsure, or the page already knows the niche */
export function recogniseBusiness(prompt: string): Promise<Recognised | undefined> {
  if (detectNiche(prompt, NICHES)) return Promise.resolve(undefined)
  const known = nicheHint(prompt)
  if (known) return Promise.resolve({ id: known, label: NICHES.find((n) => n.id === known)?.label ?? known, why: 'from the last time' })
  let run = asked.get(prompt)
  if (!run) {
    run = (async () => {
      try {
        const res = await fetch(`/api/corecraft/pack?prompt=${encodeURIComponent(prompt)}`, { signal: AbortSignal.timeout(12_000) })
        if (!res.ok) return undefined
        const answer = (await res.json()) as PackAnswer
        if (!trustPack(prompt, answer)) return undefined
        setNicheHint(prompt, answer.id)
        return { id: answer.id, label: answer.label, why: answer.notes.find((n) => /corrected typing/i.test(n)) ?? `Core-Craft AI is ${Math.round(answer.confidence * 100)}% sure` }
      } catch {
        return undefined
      }
    })()
    asked.set(prompt, run)
  }
  return run
}

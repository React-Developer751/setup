// The content AI learns which phrases people keep and which they send back. Every phrase (a headline, a subheading, a button text ...)
// has a score per business type and place on the page: it starts at 10, every person who is unhappy with it takes a little off, every person who
// keeps it (exports the site, rates the design well, says it is good) adds a little. Phrases with a low score are dropped when there is a better
// one to choose, phrases with a high score are chosen more often. Plain data in, plain data out; the stores are in phraseStore.ts.
export const PHRASE_SLOTS = ['heroTitle', 'heroSubtitle', 'heroButton', 'ctaTitle', 'featuresTitle', 'aboutTitle'] as const
export type PhraseSlot = (typeof PHRASE_SLOTS)[number]
export type PhraseReason = 'opinion' | 'replaced' | 'regenerate' | 'rating' | 'export' | 'abandoned'

/** one thing a person did or said about one phrase (the "storage schema": the phrase the AI wrote, the words of the person, the action) */
export type PhraseEvent = {
  at: string
  /** a browser session: one person counts once for a phrase, however often they repeat themselves */
  session: string
  /** business type: the niche if there is one, else the theme (a gym and a bakery do not share scores) */
  group: string
  slot: PhraseSlot
  /** the phrase as the AI wrote it, with the brand name replaced by {brand} (see normalisePhrase) */
  phrase: string
  /** +1 liked, -1 not liked, 0 only logged */
  delta: 1 | -1 | 0
  reason: PhraseReason
  /** the person's own words, when they wrote something */
  text?: string
  /** what the sentiment engine made of the words */
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
}

export const BASE_SCORE = 10
export const MIN_SCORE = 0
export const MAX_SCORE = 20
/** a phrase below this is not chosen while a better one exists */
export const DROP_BELOW = 7

/** how much one signal weighs: plain words and ratings are clear, a regenerate or an export says less */
const WEIGHT: Record<PhraseReason, number> = { opinion: 1, replaced: 1, rating: 1, regenerate: 0.5, export: 0.5, abandoned: 0 }

export const normalisePhrase = (phrase: string, brand = ''): string => {
  let text = phrase.toLowerCase().replace(/\s+/g, ' ').trim()
  const b = brand.toLowerCase().trim()
  if (b.length >= 2) text = text.split(b).join('{brand}')
  return text.slice(0, 140)
}

export const phraseKey = (group: string, slot: PhraseSlot, phrase: string) => `${group}|${slot}|${phrase}`

export type PhraseStats = { score: number; up: number; down: number }
export type PhraseScores = Map<string, PhraseStats>

const DAY = 86_400_000
/** old opinions count less: what worked in spring is not what works in winter */
const ageFactor = (at: string, now: number) => {
  const age = (now - Date.parse(at)) / DAY
  return !Number.isFinite(age) || age < 90 ? 1 : age < 180 ? 0.5 : 0.25
}

/** all events -> a score per phrase. One session counts once per phrase and direction (the strongest signal of it counts). */
export function foldPhraseScores(events: PhraseEvent[], now = Date.now()): PhraseScores {
  const best = new Map<string, { key: string; delta: number; weight: number }>()
  for (const e of events) {
    if (!e.delta || !e.phrase || !(PHRASE_SLOTS as readonly string[]).includes(e.slot)) continue
    const key = phraseKey(e.group, e.slot, e.phrase)
    const id = `${e.session}|${key}|${e.delta}`
    const weight = WEIGHT[e.reason] * ageFactor(e.at, now)
    const seen = best.get(id)
    if (!seen || weight > seen.weight) best.set(id, { key, delta: e.delta, weight })
  }
  const scores: PhraseScores = new Map()
  for (const { key, delta, weight } of best.values()) {
    const s = scores.get(key) ?? { score: BASE_SCORE, up: 0, down: 0 }
    s.score = Math.max(MIN_SCORE, Math.min(MAX_SCORE, s.score + delta * weight))
    if (delta > 0) s.up += 1
    else s.down += 1
    scores.set(key, s)
  }
  return scores
}

export const scoreOf = (scores: PhraseScores, group: string, slot: PhraseSlot, phrase: string): number => scores.get(phraseKey(group, slot, phrase))?.score ?? BASE_SCORE

/** a phrase that was never rated is neutral (so new phrases are tried); the weight of a score for a random choice */
export const weightOf = (score: number): number => Math.max(0.15, Math.min(2, score / BASE_SCORE)) ** 2

/** which of the candidates to use: low scores are dropped (when something better exists), high scores are chosen more often */
export function choosePhrase<T>(candidates: { item: T; phrase: string }[], scores: PhraseScores, group: string, slot: PhraseSlot, rand: () => number): T | undefined {
  if (!candidates.length) return undefined
  const rated = candidates.map((c) => ({ ...c, score: scoreOf(scores, group, slot, c.phrase) }))
  const good = rated.filter((c) => c.score >= DROP_BELOW)
  const pool = good.length ? good : [rated.reduce((a, b) => (b.score > a.score ? b : a))]
  const total = pool.reduce((sum, c) => sum + weightOf(c.score), 0)
  let at = rand() * total
  for (const c of pool) {
    at -= weightOf(c.score)
    if (at <= 0) return c.item
  }
  return pool[pool.length - 1].item
}

/** the texts of a site by slot (the brand name replaced, so that the same line of two businesses is one phrase) */
export function copyOf(content: { brandName: string; hero: { title: string; subtitle: string; button: string }; features: { title: string }; about: { title: string }; cta: { title: string } }): Record<PhraseSlot, string> {
  const b = content.brandName
  return {
    heroTitle: normalisePhrase(content.hero.title, b),
    heroSubtitle: normalisePhrase(content.hero.subtitle, b),
    heroButton: normalisePhrase(content.hero.button, b),
    ctaTitle: normalisePhrase(content.cta.title, b),
    featuresTitle: normalisePhrase(content.features.title, b),
    aboutTitle: normalisePhrase(content.about.title, b),
  }
}

/** how much a design's texts are liked: 1 = nothing known, below 1 = some of its texts were sent back, above 1 = people kept them. And the texts that are dropped. */
export function copyFactor(scores: PhraseScores, group: string, copy: Partial<Record<PhraseSlot, string>> | undefined): { factor: number; dropped: string[] } {
  if (!copy) return { factor: 1, dropped: [] }
  let product = 1
  let n = 0
  const dropped: string[] = []
  for (const slot of PHRASE_SLOTS) {
    const phrase = copy[slot]
    if (!phrase) continue
    const s = scoreOf(scores, group, slot, phrase)
    product *= Math.max(0.15, Math.min(1.8, s / BASE_SCORE))
    n += 1
    if (s < DROP_BELOW) dropped.push(phrase)
  }
  return { factor: n ? product ** (1 / n) : 1, dropped }
}

export type TrendReport = {
  /** phrases that failed with several different people: they are demoted */
  failing: { group: string; slot: PhraseSlot; phrase: string; down: number; up: number; score: number }[]
  /** phrases people keep */
  winners: { group: string; slot: PhraseSlot; phrase: string; down: number; up: number; score: number }[]
  /** how many events, sessions and phrases the numbers are made of */
  events: number
  sessions: number
  phrases: number
}

/** the 24-hour look at the data: which phrases fail, which win (npm run phrases:trends prints it) */
export function analyseTrends(events: PhraseEvent[], now = Date.now(), minPeople = 3): TrendReport {
  const scores = foldPhraseScores(events, now)
  const rows = [...scores.entries()].map(([key, s]) => {
    const [group, slot, ...rest] = key.split('|')
    return { group, slot: slot as PhraseSlot, phrase: rest.join('|'), down: s.down, up: s.up, score: Math.round(s.score * 10) / 10 }
  })
  return {
    failing: rows.filter((r) => r.down >= minPeople && r.down > r.up * 2).sort((a, b) => a.score - b.score),
    winners: rows.filter((r) => r.up >= minPeople && r.up > r.down * 2).sort((a, b) => b.score - a.score),
    events: events.length,
    sessions: new Set(events.map((e) => e.session)).size,
    phrases: rows.length,
  }
}

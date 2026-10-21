// The content AI's learning loop: what a person says or does about the texts of a site becomes phrase events (phraseScores.ts), and the events
// decide which texts are written next: a new design prefers texts people keep, and "another heading" takes the best of the other ones.
import type { EditOp } from '../edit/edits'
import { generateWebsite } from '../generateWebsite'
import type { Feedback } from './sentiment'
import { choosePhrase, copyOf, fitsBusiness, normalisePhrase, PHRASE_SLOTS, type PhraseEvent, type PhraseReason, type PhraseScores, type PhraseSlot } from './phraseScores'

type Content = Parameters<typeof copyOf>[0]

/** the texts of a site as the person reads them */
export function slotTexts(content: Content): Record<PhraseSlot, string> {
  return { heroTitle: content.hero.title, heroSubtitle: content.hero.subtitle, heroButton: content.hero.button, ctaTitle: content.cta.title, featuresTitle: content.features.title, aboutTitle: content.about.title }
}

/** the business type a phrase belongs to */
export const groupOf = (site: { niche?: string; themeKey: string }): string => site.niche || site.themeKey

export type EventContext = { session: string; group: string; content: Content }

/** events for some slots of the site on screen */
export function eventsFor(ctx: EventContext, slots: readonly PhraseSlot[], delta: 1 | -1 | 0, reason: PhraseReason, extra: { text?: string; sentiment?: PhraseEvent['sentiment']; /** the first of the slots counts fully, the others less (a bad design is not proof that every text is bad) */ soft?: boolean } = {}): PhraseEvent[] {
  const copy = copyOf(ctx.content)
  const at = new Date().toISOString()
  return slots.map((slot) => ({ at, session: ctx.session, group: ctx.group, slot, phrase: copy[slot], delta, reason, ...(extra.text ? { text: extra.text.slice(0, 200) } : {}), ...(extra.sentiment ? { sentiment: extra.sentiment } : {}) }))
}

export const ALL_SLOTS: readonly PhraseSlot[] = PHRASE_SLOTS

/** the slots a feedback sentence is about; nothing named: the headline (the first thing people see) */
export function slotsOfFeedback(f: Feedback): PhraseSlot[] {
  if (f.target === 'colour' || f.target === 'image' || f.target === 'layout') return []
  if (f.target === 'overall') return ['heroTitle']
  return [f.target]
}

/** other texts for a slot: made by the generator with other variations, scored by the phrase scores, the current one and the turned-down ones left out */
export function alternativeFor(prompt: string, slot: PhraseSlot, ctx: { current: string; brand: string; group: string; scores: PhraseScores; avoid?: string[]; rand?: () => number; tries?: number }): { text: string; op: EditOp } | undefined {
  const rand = ctx.rand ?? Math.random
  const skip = new Set([normalisePhrase(ctx.current, ctx.brand), ...(ctx.avoid ?? []).map((a) => normalisePhrase(a, ctx.brand))])
  const found = new Map<string, string>()
  const fitting = new Set<string>()
  for (let i = 0; i < (ctx.tries ?? 24); i += 1) {
    const site = generateWebsite(prompt, 1 + Math.floor(rand() * 9000))
    const text = slotTexts(site.content)[slot]
    const key = normalisePhrase(text, site.content.brandName)
    if (!text || skip.has(key) || found.has(key)) continue
    // the generator wrote the brand of the prompt; the site on screen may have been renamed
    if (fitsBusiness(text, site.content.subject, site.content.brandName)) fitting.add(key)
    found.set(key, site.content.brandName && ctx.brand ? text.split(site.content.brandName).join(ctx.brand) : text)
  }
  // texts that name the business come first (a tea cafe gets no "Pure Wellness For Curious Tasters"); when they are used up, the others
  const entries = [...found.entries()]
  const named = entries.filter(([key]) => fitting.has(key))
  const pick = choosePhrase((slot === 'heroTitle' && named.length ? named : entries).map(([phrase, text]) => ({ item: text, phrase })), ctx.scores, ctx.group, slot, rand)
  return pick ? { text: pick, op: { op: 'text', field: slot, text: pick } } : undefined
}

export const SLOT_NAME: Record<PhraseSlot, string> = { heroTitle: 'heading', heroSubtitle: 'subheading', heroButton: 'button text', ctaTitle: 'call-to-action line', featuresTitle: 'services heading', aboutTitle: 'about heading' }

/**
 * Is this sentence an opinion about the site, not a command? The edit parser reads "heading boring hai" as "set the heading to bring", so the
 * opinion check comes first. A bad word always makes an opinion (unless the new text was given in quotes or with "rename / rakho / to ..."), a good
 * word only when no new text was parsed from it or the sentence says "... hai / is / looks" ("heading perfect hai", "Best Coffee in Town" is a new text).
 */
export function treatAsOpinion(f: Feedback, text: string, parsedOps: EditOp[] | undefined): boolean {
  if (f.label === 'NEUTRAL' || f.hasPayload) return false
  const structural = parsedOps?.some((o) => o.op !== 'text' && o.op !== 'replace')
  if (structural) return false
  if (f.label === 'NEGATIVE') return true
  const parsedText = parsedOps?.some((o) => o.op === 'text' || o.op === 'replace')
  return !parsedText || /(?<![\p{L}])(hai|hain|nahi|is|looks|seems|feels|lag|laga|lagta|aaya|tha)(?![\p{L}])/iu.test(text)
}

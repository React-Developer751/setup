// What the page says that the person did not say. The text packs write about a kind of business (a clinic is "sterilised", a hotel has "hot water all day", a law firm does "criminal defence"): useful
// when the person said nothing, but a claim nobody made once they named their own services. This lists them in the chat so the person can keep or remove them before publishing.
import type { WebsiteContent } from '../finalPrompt'
import type { EditOp } from './edits'

export type Claims = { text: string; services: string[]; strip: string[]; named: string[] }

const COMMON = new Set(['law', 'legal', 'matter', 'matters', 'care', 'treatment', 'treatments', 'service', 'services', 'clinic', 'consultation', 'document', 'documents', 'case', 'cases', 'and', 'the', 'for', 'with', 'your', 'our', 'work', 'support', 'plan', 'plans', 'free', 'easy', 'clear'])
const words = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3 && !COMMON.has(w)).map((w) => w.replace(/(?:ing|es|s)$/, ''))

/** the cards and numbers of the page that the prompt does not name (undefined when nothing needs a second look) */
export function claimsToCheck(prompt: string, content: WebsiteContent): Claims | undefined {
  const said = new Set(words(prompt))
  const cards = content.features.items
  const named = cards.filter((card) => words(card.title).some((w) => said.has(w)))
  const added = cards.filter((card) => !named.includes(card)).map((card) => card.title)
  // the strip of numbers: "24/7 front desk", "Sterilised instruments": statements of the pack, not facts of the person
  const strip = content.stats.filter((s) => !s.fact).map((s) => `${s.value} ${s.label}`.replace(/\s+/g, ' ').trim()).slice(0, 4)
  if (!added.length && !strip.length) return undefined
  const parts: string[] = []
  if (added.length) parts.push(named.length ? `services I added that you did not name: ${added.slice(0, 5).join(', ')}` : `services written from the kind of business (you did not name any): ${added.slice(0, 5).join(', ')}`)
  if (strip.length) parts.push(`the highlights strip: ${strip.join(' · ')}`)
  return { text: `Check before you publish. The texts come from the kind of business, so some lines are not from you: ${parts.join('; ')}. If one is not true for you, remove it.`, services: added, strip, named: named.map((c) => c.title) }
}

/** the buttons of the chat message: what can be removed in one tap */
export function claimChoices(claims: Claims, content: WebsiteContent): { label: string; ops?: EditOp[]; action?: 'dismiss' }[] {
  const out: { label: string; ops?: EditOp[]; action?: 'dismiss' }[] = []
  if (claims.named.length >= 1 && claims.services.length) {
    out.push({ label: 'Keep only my services', ops: [{ op: 'core', data: { features: { items: content.features.items.filter((c) => claims.named.includes(c.title)).map((c) => ({ title: c.title, text: c.text })) } } }] })
  }
  if (claims.strip.length) out.push({ label: 'Remove the highlights strip', ops: [{ op: 'remove', section: 'stats' }] })
  out.push({ label: 'Keep everything', action: 'dismiss' })
  return out
}

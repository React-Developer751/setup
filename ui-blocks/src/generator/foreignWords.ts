// A business without a text pack gets the texts of the business type that sits next to it (a pottery studio under a car kit: "Same-Day Car Care Plans",
// "Well-Maintained Vehicles"; a robotics lab under a SaaS kit: "One-Click Rollbacks"). Words that belong to another kind of business are found here
// and the cards that carry them are replaced by plain ones that claim nothing. Only used when no text pack was written for the business.
import type { WebsiteContent } from './finalPrompt'

/** words that mark a kind of business; a page that does not talk about that business must not carry them */
export const DOMAINS: Record<string, RegExp> = {
  auto: /\b(?:cars?|vehicles?|rides?|drivers?|detailing|test drives?|pick-?up and drop|rentals?|fleet)\b/i,
  saas: /\b(?:rollbacks?|deployments?|startups?|dashboards?|workflows?|pipelines?|integrations?|uptime|infrastructure|releases?)\b/i,
  food: /\b(?:brews?|menus?|chefs?|dish(?:es)?|kitchen|recipes?|meals?|coffee|harvests?|ingredients?|eaters?|tasters?)\b/i,
  health: /\b(?:patients?|treatments?|clinics?|therapy|doctors?|check-?ups?|wellbeing|preventive|care plans?)\b/i,
  beauty: /\b(?:facials?|skin|makeup|haircuts?|glow)\b/i,
  fitness: /\b(?:workouts?|reps|trainers?|crossfit|athletes?)\b/i,
  edu: /\b(?:students?|exams?|lessons?|curriculum|learners?|courses?)\b/i,
  legal: /\b(?:lawyers?|court|legal|advocates?)\b/i,
  property: /\b(?:tenants?|listings?|flats?)\b/i,
}

/** the kinds of business a prompt is about (their words may stay on the page) */
export const domainsOf = (prompt: string): Set<string> => new Set(Object.entries(DOMAINS).filter(([, re]) => re.test(prompt)).map(([k]) => k))

/** the foreign kinds of business in a text */
export const foreignIn = (text: string, allowed: Set<string>): string[] => Object.entries(DOMAINS).filter(([k, re]) => !allowed.has(k) && re.test(text)).map(([k]) => k)

const NEUTRAL_CARDS = [
  { title: 'Clear advice', text: 'Straight answers about what you need, before you decide.' },
  { title: 'Easy to reach', text: 'Call, message or visit: we reply as soon as we can.' },
  { title: 'Fair prices', text: 'You hear the price before the work starts.' },
  { title: 'Careful work', text: 'Every job is checked before it leaves our hands.' },
  { title: 'Friendly team', text: 'People who explain things in plain words.' },
  { title: 'Local and reliable', text: 'A team you can visit and ask directly.' },
]
const NEUTRAL_STEPS = [
  { title: 'Tell us what you need', text: 'Call or send a message with a few details.' },
  { title: 'We explain the options', text: 'You hear what is possible and what it costs.' },
  { title: 'We do the work', text: 'You get what was agreed, and we stay in touch.' },
]

export function scrubForeign(content: WebsiteContent, prompt: string): WebsiteContent {
  const allowed = domainsOf(prompt)
  const bad = (text: string) => foreignIn(text, allowed).length > 0
  let next = content
  const cards = content.features.items
  if (cards.some((c) => bad(`${c.title} ${c.text}`))) {
    const kept = cards.filter((c) => !bad(`${c.title} ${c.text}`))
    const spare = NEUTRAL_CARDS.filter((n) => !kept.some((k) => k.title.toLowerCase() === n.title.toLowerCase()))
    next = { ...next, features: { ...next.features, items: [...kept, ...spare].slice(0, cards.length) } }
  }
  if (next.marquee.some(bad)) next = { ...next, marquee: next.marquee.filter((m) => !bad(m)) }
  if (next.about.points.some(bad)) next = { ...next, about: { ...next.about, points: [...next.about.points.filter((p) => !bad(p)), ...NEUTRAL_CARDS.map((n) => n.title)].slice(0, next.about.points.length) } }
  if (next.steps.items.some((s) => bad(`${s.title} ${s.text}`))) next = { ...next, steps: { ...next.steps, items: NEUTRAL_STEPS } }
  return next
}
